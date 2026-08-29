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
        const { text, type } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Build message based on type
        let messageText = '';

        switch (type) {
            case 'nuevo_post':
                messageText = `Nuevo post en el Blog de Rancho Amelia\n\n${text}`;
                break;
            case 'paca_alert':
                messageText = `Alerta de Paca Digestora\n\n${text}`;
                break;
            case 'clima_alert':
                messageText = `Alerta de Clima\n\n${text}`;
                break;
            case 'bitacora':
                messageText = `Nueva entrada en Bitacora\n\n${text}`;
                break;
            case 'general':
            default:
                messageText = text;
                break;
        }

        // Send message via Telegram API
        const telegramApi = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(telegramApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: messageText,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.description || 'Failed to send message');
        }

        return res.status(200).json({ ok: true, message: 'Notification sent' });

    } catch (error) {
        console.error('Send error:', error);
        return res.status(500).json({ error: error.message });
    }
};
