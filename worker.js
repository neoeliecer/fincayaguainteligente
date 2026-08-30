export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === 'GET' && url.pathname === '/api/logs') {
            const entries = await env.BITACORA.get('entries', { type: 'json' }) || [];
            return new Response(JSON.stringify(entries), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        if (request.method === 'GET') {
            return new Response('Rancho Amelia Bot - OK', { status: 200 });
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        if (request.method === 'POST') {
            try {
                const body = await request.json();
                const { message } = body;

                if (!message || !message.text) {
                    return new Response('ok');
                }

                const chatId = message.chat.id.toString();
                const text = message.text.trim();
                const textLower = text.toLowerCase();
                const firstName = message.from.first_name || 'Usuario';

                if (chatId !== env.CHAT_ID) {
                    return new Response('ok');
                }

                let r = '';

                if (textLower === '/start' || textLower === '/help') {
                    r = 'Hola ' + firstName + '! Bot de Rancho Amelia\n\n/status - Estado general\n/paca - Paca digestora\n/clima - Clima en Yagua\n/bitacora - Ver ultimas entradas\n/log [cat] [nota] - Guardar en bitacora\n\nCategorias: Compost, Siembra, Limpieza, Poda, Riego, Mantenimiento';

                } else if (textLower === '/status') {
                    var now = new Date();
                    var s0 = new Date('2026-07-28');
                    var s1 = new Date('2027-01-28');
                    var pct = Math.min(100, Math.max(0, ((now - s0) / (s1 - s0)) * 100));
                    var rem = Math.ceil((s1 - now) / 86400000);
                    r = 'Estado de Rancho Amelia\n\nPaca 1: ' + pct.toFixed(1) + '% (' + rem + ' dias)\nFase: Llenado\nSemillero: 5 plantulas\nBlog: Activo';

                } else if (textLower === '/paca') {
                    var now = new Date();
                    var p0 = new Date('2026-07-28');
                    var p1 = new Date('2027-01-28');
                    var pp = Math.min(100, Math.max(0, ((now - p0) / (p1 - p0)) * 100));
                    var pr = Math.ceil((p1 - now) / 86400000);
                    var ph = 'Compactacion y Llenado';
                    if (pp >= 30 && pp < 50) ph = 'Fase Termica Activa';
                    else if (pp >= 50 && pp < 75) ph = 'Enfriamiento';
                    else if (pp >= 75) ph = 'Maduracion Final';
                    r = 'Paca Digestora Silva #1\n\nProgreso: ' + pp.toFixed(1) + '%\nFase: ' + ph + '\nDias: ~' + pr + '\nCosecha: 28 Enero 2027';

                } else if (textLower === '/clima') {
                    try {
                        var wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=8.5&longitude=-67.0&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Caracas&forecast_days=3');
                        var w = await wRes.json();
                        var c = w.current;
                        var d = w.daily;
                        r = 'Clima Yagua\n\nAhora: ' + c.temperature_2m + 'C, ' + c.relative_humidity_2m + '%, ' + c.wind_speed_10m + 'km/h';
                        for (var i = 0; i < 3; i++) {
                            r += '\n' + d.time[i] + ': ' + d.temperature_2m_min[i] + '-' + d.temperature_2m_max[i] + 'C (' + d.precipitation_probability_max[i] + '%)';
                        }
                    } catch (e) {
                        r = 'Error al consultar clima.';
                    }

                } else if (textLower === '/bitacora') {
                    var entries = await env.BITACORA.get('entries', { type: 'json' }) || [];
                    if (entries.length === 0) {
                        r = 'Bitacora vacia. Usa /log [categoria] [nota] para agregar.';
                    } else {
                        r = 'Ultimas entradas de Bitacora:\n\n';
                        var recent = entries.slice(-5).reverse();
                        for (var i = 0; i < recent.length; i++) {
                            var e = recent[i];
                            r += e.date + ' [' + e.category + ']\n' + e.note + '\n\n';
                        }
                        r += 'Total: ' + entries.length + ' entradas';
                    }

                } else if (textLower.startsWith('/log ')) {
                    var raw = text.substring(5).trim();
                    var categories = ['compost', 'siembra', 'limpieza', 'poda', 'riego', 'mantenimiento'];
                    var category = 'General';
                    var note = raw;

                    for (var i = 0; i < categories.length; i++) {
                        if (raw.toLowerCase().startsWith(categories[i] + ' ')) {
                            category = categories[i].charAt(0).toUpperCase() + categories[i].slice(1);
                            note = raw.substring(categories[i].length + 1).trim();
                            break;
                        }
                    }

                    if (!note) {
                        r = 'Escribe una nota. Ejemplo:\n/log Compost Revise la paca y estaba a 45 grados';
                    } else {
                        var now = new Date();
                        var dateStr = now.getDate().toString().padStart(2, '0') + '/' +
                                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' +
                                      now.getFullYear();
                        var timeStr = now.getHours().toString().padStart(2, '0') + ':' +
                                      now.getMinutes().toString().padStart(2, '0');

                        var entry = {
                            date: dateStr,
                            time: timeStr,
                            category: category,
                            note: note,
                            user: firstName
                        };

                        var entries = await env.BITACORA.get('entries', { type: 'json' }) || [];
                        entries.push(entry);
                        await env.BITACORA.put('entries', JSON.stringify(entries));

                        r = 'Entrada guardada!\n\n' + dateStr + ' ' + timeStr + '\nCategoria: ' + category + '\nNota: ' + note;
                    }

                } else if (textLower === '/borrar_bitacora') {
                    await env.BITACORA.put('entries', JSON.stringify([]));
                    r = 'Bitacora limpiada.';

                } else {
                    r = 'No entendi. Usa /help para ver comandos.';
                }

                await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: r })
                });

                return new Response('ok');
            } catch (e) {
                return new Response('ok');
            }
        }

        return new Response('no', { status: 405 });
    }
};
