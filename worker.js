export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS for website sync
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // GET - API endpoints for website
        if (request.method === 'GET') {
            if (url.pathname === '/api/check-status') {
                const now = new Date();
                const day = now.getDate();
                const month = now.getMonth() + 1;
                const alerts = [];

                // Monthly paca alert (1st of each month)
                if (day === 1) {
                    const p0 = new Date('2026-09-02');
                    const p1 = new Date('2027-03-02');
                    const pp = Math.min(100, Math.max(0, ((now - p0) / (p1 - p0)) * 100));
                    const pr = Math.ceil((p1 - now) / 86400000);
                    const monthsLeft = Math.ceil(pr / 30);
                    alerts.push('Paca Venezuela: ' + pp.toFixed(1) + '% completado. Quedan ~' + monthsLeft + ' meses (' + pr + ' dias) para cosecha.');
                }

                // Mango harvest alerts (June 1 - August 31)
                if (month >= 6 && month <= 8) {
                    var mangoStatus = '';
                    if (month === 6) mangoStatus = 'Mangos Haden y Mamon: empieza la cosecha. Vigilar frutos.';
                    else if (month === 7) mangoStatus = 'Temporada alta de mangos. Haden, Tommy, Kent, Hilacha: cosecha activa.';
                    else if (month === 8) mangoStatus = 'Cosecha de mangos Keitt y fin de temporada Haden. Ultimos frutos.';
                    if (mangoStatus) alerts.push(mangoStatus);
                }

                // Pre-mango alert (May 15)
                if (month === 5 && day >= 15) {
                    alerts.push('Preparacion para temporada de mangos. Los arboles empiezan a florar en junio.');
                }

                // Weather alert
                try {
                    const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=8.5&longitude=-67.0&current=weather_code,precipitation&daily=precipitation_probability_max&timezone=America/Caracas&forecast_days=1');
                    const w = await wRes.json();
                    if (w.current && w.current.weather_code >= 95) {
                        alerts.push('Tormenta electrica detectada en Yagua.');
                    }
                    if (w.daily && w.daily.precipitation_probability_max && w.daily.precipitation_probability_max[0] >= 80) {
                        alerts.push('Alta probabilidad de lluvia hoy: ' + w.daily.precipitation_probability_max[0] + '%.');
                    }
                } catch (e) {}

                // Send alerts if any
                if (alerts.length > 0) {
                    const message = 'Notificaciones de Rancho Amelia\n\n' + alerts.map(a => '- ' + a).join('\n\n');
                    await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: env.CHAT_ID, text: message })
                    });
                }

                return new Response(JSON.stringify({ ok: true, alerts: alerts.length }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }

            if (url.pathname === '/api/logs') {
                const entries = await env.BITACORA.get('entries', { type: 'json' }) || [];
                return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
            if (url.pathname === '/api/semillero') {
                const data = await env.BITACORA.get('semillero', { type: 'json' }) || [];
                return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
            if (url.pathname === '/api/inventario') {
                const data = await env.BITACORA.get('inventario', { type: 'json' }) || [];
                return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
            if (url.pathname === '/api/all') {
                const logs = await env.BITACORA.get('entries', { type: 'json' }) || [];
                const semillero = await env.BITACORA.get('semillero', { type: 'json' }) || [];
                const inventario = await env.BITACORA.get('inventario', { type: 'json' }) || [];
                return new Response(JSON.stringify({ logs, semillero, inventario }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
            if (url.pathname === '/api/paca') {
                const now = new Date();
                const p0 = new Date('2026-09-02');
                const p1 = new Date('2027-03-02');
                const pct = Math.min(100, Math.max(0, ((now - p0) / (p1 - p0)) * 100));
                const rem = Math.ceil((p1 - now) / 86400000);
                return new Response(JSON.stringify({ name: 'Paca Venezuela', percent: pct.toFixed(1), days_remaining: rem, harvest: '2027-03-03' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
            return new Response('Rancho Amelia Bot - OK', { status: 200 });
        }

        // POST
        if (request.method === 'POST') {
            const body = await request.json();

            // Sync from website
            if (url.pathname === '/api/sync') {
                const { type, data } = body;
                if (type === 'semillero') {
                    await env.BITACORA.put('semillero', JSON.stringify(data));
                    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
                }
                if (type === 'inventario') {
                    await env.BITACORA.put('inventario', JSON.stringify(data));
                    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
                }
                if (type === 'logs') {
                    const existing = await env.BITACORA.get('entries', { type: 'json' }) || [];
                    const merged = [...existing];
                    const existingKeys = new Set(existing.map(e => e.date + e.note));
                    data.forEach(entry => {
                        const key = entry.date + (entry.note || entry.title || '');
                        if (!existingKeys.has(key)) {
                            merged.push(entry);
                            existingKeys.add(key);
                        }
                    });
                    await env.BITACORA.put('entries', JSON.stringify(merged));
                    return new Response(JSON.stringify({ ok: true, total: merged.length }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
                }
            }

            // Telegram webhook
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
                r = 'Hola ' + firstName + '! Bot de Rancho Amelia\n\n/status - Estado general\n/paca - Paca Venezuela\n/mangos - Estado cosecha mangos\n/clima - Clima en Yagua\n/semillero - Ver plantulas\n/inventario - Ver bienes\n/bitacora - Ver ultimas entradas\n/log [cat] [nota] - Guardar en bitacora\n\nCategorias: Compost, Siembra, Limpieza, Poda, Riego, Mantenimiento';

            } else if (textLower === '/status') {
                var now = new Date();
                var s0 = new Date('2026-09-02');
                var s1 = new Date('2027-03-02');
                var pct = Math.min(100, Math.max(0, ((now - s0) / (s1 - s0)) * 100));
                var rem = Math.ceil((s1 - now) / 86400000);
                var semillero = await env.BITACORA.get('semillero', { type: 'json' }) || [];
                r = 'Estado de Rancho Amelia\n\nPaca Venezuela: ' + pct.toFixed(1) + '% (' + rem + ' dias)\nSemillero: ' + semillero.length + ' plantulas\nBlog: Activo';

            } else if (textLower === '/paca') {
                var now = new Date();
                var p0 = new Date('2026-09-02');
                var p1 = new Date('2027-03-02');
                var pp = Math.min(100, Math.max(0, ((now - p0) / (p1 - p0)) * 100));
                var pr = Math.ceil((p1 - now) / 86400000);
                var ph = 'Compactacion y Llenado';
                if (pp >= 15 && pp < 30) ph = 'Fase Termica Temprana';
                else if (pp >= 30 && pp < 50) ph = 'Fase Termica Activa (~70C)';
                else if (pp >= 50 && pp < 75) ph = 'Enfriamiento y Maduracion';
                else if (pp >= 75 && pp < 100) ph = 'Maduracion Final';
                else if (pp >= 100) ph = 'LISTA PARA COSECHA';
                r = 'Paca Venezuela\n\nProgreso: ' + pp.toFixed(1) + '%\nFase: ' + ph + '\nDias restantes: ~' + pr + '\nCosecha: 3 Marzo 2027\n\nUbicacion: Finca Yagua';

            } else if (textLower === '/mangos') {
                var now = new Date();
                var month = now.getMonth() + 1;
                var mangoInfo = '';

                // Haden: Jun-Ago, Tommy: Jul-Sep, Keitt: Ago-Oct, Kent: Jul-Sep, Hilacha: Jul-Sep, Mamon: Jun-Sep
                var trees = [
                    { name: 'Mango 1 (Haden)', seasonStart: 6, seasonPeak: 7, seasonEnd: 8, kg: 250 },
                    { name: 'Mango 2 (Haden)', seasonStart: 6, seasonPeak: 7, seasonEnd: 8, kg: 250 },
                    { name: 'Mango 3 (Haden)', seasonStart: 6, seasonPeak: 7, seasonEnd: 8, kg: 250 },
                    { name: 'Mamon (Memiso)', seasonStart: 6, seasonPeak: 7, seasonEnd: 9, kg: 200 },
                    { name: 'Hilacha x5', seasonStart: 7, seasonPeak: 8, seasonEnd: 9, kg: 900 }
                ];

                var totalKg = 0;
                var proximoCosecha = '';
                var diasProximo = 999;

                trees.forEach(function(tree) {
                    var harvestDate = new Date(now.getFullYear(), tree.seasonPeak, 15);
                    if (harvestDate < now) harvestDate.setFullYear(harvestDate.getFullYear() + 1);
                    var dias = Math.ceil((harvestDate - now) / 86400000);

                    var estado = 'Reposo';
                    if (month >= tree.seasonStart && month <= tree.seasonEnd) {
                        estado = 'En temporada';
                        if (month === tree.seasonPeak) estado = 'Punto maximo';
                    } else if (month === tree.seasonStart - 1) {
                        estado = 'Preparacion';
                    }

                    totalKg += tree.kg;
                    mangoInfo += '- ' + tree.name + ': ' + estado + ' (' + tree.kg + ' kg)\n';

                    if (dias < diasProximo) {
                        diasProximo = dias;
                        proximoCosecha = tree.name;
                    }
                });

                r = 'Mangos Ingertos - Rancho Amelia\n\n' + mangoInfo + '\nTotal estimado: ~' + totalKg + ' kg\nProximo a cosechar: ' + proximoCosecha + ' (~' + diasProximo + ' dias)';

            } else if (textLower === '/clima') {
                try {
                    var wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=8.5&longitude=-67.0&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Caracas&forecast_days=3');
                    var w = await wRes.json();
                    var c = w.current;
                    var d = w.daily;
                    r = 'Clima en Yagua\n\nAhora:\nTemp: ' + c.temperature_2m + 'C\nHumedad: ' + c.relative_humidity_2m + '%\nViento: ' + c.wind_speed_10m + ' km/h\nPrecipitacion: ' + c.precipitation + ' mm\n\nProximos 3 dias:';
                    for (var i = 0; i < 3; i++) {
                        r += '\n' + d.time[i] + ': ' + d.temperature_2m_min[i] + '-' + d.temperature_2m_max[i] + 'C (' + d.precipitation_probability_max[i] + '%)';
                    }
                } catch (e) {
                    r = 'Error al consultar clima.';
                }

            } else if (textLower === '/semillero') {
                var plants = await env.BITACORA.get('semillero', { type: 'json' }) || [];
                if (plants.length === 0) {
                    r = 'Semillero vacio desde la pagina web. Registra plantulas en la pestana Semillero.';
                } else {
                    r = 'Semillero de Plantulas (' + plants.length + ')\n\n';
                    plants.forEach(function(p) {
                        var icon = '🌱';
                        if (p.status === 'Brote') icon = '🌿';
                        else if (p.status === 'En crecimiento') icon = '🪴';
                        else if (p.status === ' Maduro') icon = '🌳';
                        r += icon + ' ' + p.name;
                        if (p.scientific) r += ' (' + p.scientific + ')';
                        r += '\nUbicacion: ' + (p.location || 'N/A');
                        r += '\nEstado: ' + (p.status || 'Semilla');
                        r += '\n\n';
                    });
                }

            } else if (textLower === '/inventario') {
                var items = await env.BITACORA.get('inventario', { type: 'json' }) || [];
                if (items.length === 0) {
                    r = 'Inventario vacio desde la pagina web.';
                } else {
                    r = 'Inventario de Bienes (' + items.length + ')\n\n';
                    items.forEach(function(item) {
                        r += '- ' + item.area + ': ' + item.description + '\n  Estado: ' + item.status + '\n\n';
                    });
                }

            } else if (textLower === '/bitacora') {
                var entries = await env.BITACORA.get('entries', { type: 'json' }) || [];
                if (entries.length === 0) {
                    r = 'Bitacora vacia. Usa /log [categoria] [nota]';
                } else {
                    r = 'Bitacora (ultimas 5 de ' + entries.length + ')\n\n';
                    var recent = entries.slice(-5).reverse();
                    for (var i = 0; i < recent.length; i++) {
                        var e = recent[i];
                        r += e.date + ' ' + (e.time || '') + ' [' + e.category + ']\n' + (e.note || e.title || '') + '\n\n';
                    }
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
                    var dateStr = now.getDate().toString().padStart(2, '0') + '/' + (now.getMonth() + 1).toString().padStart(2, '0') + '/' + now.getFullYear();
                    var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                    var entry = { date: dateStr, time: timeStr, category: category, note: note, user: firstName };
                    var entries = await env.BITACORA.get('entries', { type: 'json' }) || [];
                    entries.push(entry);
                    await env.BITACORA.put('entries', JSON.stringify(entries));
                    r = 'Entrada guardada!\n\n' + dateStr + ' ' + timeStr + '\nCategoria: ' + category + '\nNota: ' + note;
                }

            } else if (textLower === '/borrar_bitacora') {
                await env.BITACORA.put('entries', JSON.stringify([]));
                r = 'Bitacora limpiada.';

            } else {
                r = 'No entendi. Usa /help';
            }

            await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: r })
            });

            return new Response('ok');
        }

        return new Response('no', { status: 405 });
    }
};
