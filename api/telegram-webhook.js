module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    try {
        const { message } = req.body;

        if (!message || !message.text) {
            return res.status(200).json({ ok: true });
        }

        const chatId = message.chat.id.toString();
        const text = message.text.toLowerCase().trim();
        const firstName = message.from.first_name || 'Usuario';

        // Verify it's from the authorized user
        if (chatId !== CHAT_ID) {
            return res.status(200).json({ ok: true });
        }

        let responseText = '';

        // Bot commands
        switch (text) {
            case '/start':
                responseText = `Hola ${firstName}! Bienvenido al Bot de Rancho Amelia.\n\nComandos disponibles:\n/status - Estado general\n/paca - Estado de la paca digestora\n/clima - Pronostico del tiempo\n/bitacora - Ultimas entradas\n/blog - Ultimos posts\n/help - Ayuda`;
                break;

            case '/help':
                responseText = `Comandos del Bot de Rancho Amelia:\n\n/status - Estado general de la finca\n/paca - Estado de la paca digestora\n/clima - Pronostico del tiempo en Yagua\n/bitacora - Ultimas entradas de la bitacora\n/blog - Ultimos posts del blog\n/notificar - Enviar notificacion de prueba`;
                break;

            case '/status':
                responseText = `Estado de Rancho Amelia\n\nPaca 1: En proceso (10%)\nPaca 2: Pendiente\nSemillero: 5 plantulas activas\nBlog: Activo\nBitacora: Privada`;
                break;

            case '/paca':
                const startDate = new Date('2026-07-28');
                const harvestDate = new Date('2027-01-28');
                const now = new Date();
                const totalMs = harvestDate - startDate;
                const elapsedMs = now - startDate;
                const percent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
                const remainingMs = harvestDate - now;
                const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

                responseText = `Paca Digestora Silva #1\n\nProgreso: ${percent.toFixed(1)}%\nFase: Llenado\nDias restantes: ~${daysRemaining}\nCosecha estimada: 28 de Enero 2027\n\nUbicacion: Extremo de la cerca norte`;
                break;

            case '/clima':
                try {
                    const lat = 8.5; // Yagua approximate
                    const lon = -67.0;
                    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=America/Caracas&forecast_days=3`;

                    const weatherRes = await fetch(weatherUrl);
                    const weather = await weatherRes.json();

                    if (weather.current) {
                        const current = weather.current;
                        const daily = weather.daily;

                        responseText = `Clima en Yagua\n\nAhora:\nTemperatura: ${current.temperature_2m}°C\nHumedad: ${current.relative_humidity_2m}%\nViento: ${current.wind_speed_10m} km/h\nPrecipitacion: ${current.precipitation} mm\n\nProximos 3 dias:\n`;

                        for (let i = 0; i < 3; i++) {
                            const date = daily.time[i];
                            const max = daily.temperature_2m_max[i];
                            const min = daily.temperature_2m_min[i];
                            const rain = daily.precipitation_probability_max[i];
                            responseText += `\n${date}: ${min}°C - ${max}°C (Lluvia: ${rain}%)`;
                        }
                    } else {
                        responseText = 'No se pudieron obtener los datos del clima.';
                    }
                } catch (e) {
                    responseText = 'Error al consultar el clima.';
                }
                break;

            case '/notificar':
                responseText = 'Notificacion de prueba enviada correctamente.';
                break;

            default:
                responseText = `No entendi el comando "${message.text}".\n\nEscribe /help para ver los comandos disponibles.`;
        }

        // Send response via Telegram API
        const telegramApi = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await fetch(telegramApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: responseText,
                parse_mode: 'HTML'
            })
        });

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(200).json({ ok: true }); // Always return 200 to Telegram
    }
};
