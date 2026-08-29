module.exports = async (req, res) => {
    // This endpoint is called by Vercel Cron to check status and send alerts
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const CRON_SECRET = process.env.CRON_SECRET;

    // Verify cron request (Vercel sends this header)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const alerts = [];

        // 1. Check Paca Digestora Status
        const startDate = new Date('2026-07-28');
        const harvestDate = new Date('2027-01-28');
        const now = new Date();
        const totalMs = harvestDate - startDate;
        const elapsedMs = now - startDate;
        const percent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
        const remainingMs = harvestDate - now;
        const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

        // Alert when paca reaches 100%
        if (percent >= 100) {
            alerts.push(`La Paca Digestora Silva #1 esta lista para cosecha! Humus maduro.`);
        }

        // 2. Check Weather
        try {
            const lat = 8.5;
            const lon = -67.0;
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,precipitation&daily=weather_code,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&timezone=America/Caracas&forecast_days=1`;

            const weatherRes = await fetch(weatherUrl);
            const weather = await weatherRes.json();

            if (weather.current) {
                // Weather codes: 95=thunderstorm, 96=thunderstorm with hail, 99=heavy thunderstorm
                const weatherCode = weather.current.weather_code;
                if (weatherCode >= 95) {
                    alerts.push(`Tormenta electrica detectada en Yagua. Precipitacion actual: ${weather.current.precipitation}mm`);
                }

                // Check daily forecast for heavy rain
                if (weather.daily && weather.daily.precipitation_probability_max) {
                    const rainProb = weather.daily.precipitation_probability_max[0];
                    if (rainProb >= 80) {
                        alerts.push(`Alta probabilidad de lluvia hoy: ${rainProb}%. Prepara cultivos sensibles.`);
                    }
                }
            }
        } catch (e) {
            // Weather check failed, skip
        }

        // 3. Send alerts if any
        if (alerts.length > 0) {
            const message = `Notificaciones de Rancho Amelia\n\n${alerts.map(a => `- ${a}`).join('\n\n')}\n\nEstado de la Paca: ${percent.toFixed(1)}% (${daysRemaining} dias restantes)`;

            const telegramApi = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            await fetch(telegramApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
        }

        return res.status(200).json({
            ok: true,
            alerts: alerts.length,
            paca_percent: percent.toFixed(1),
            paca_days_remaining: daysRemaining
        });

    } catch (error) {
        console.error('Check status error:', error);
        return res.status(500).json({ error: error.message });
    }
};
