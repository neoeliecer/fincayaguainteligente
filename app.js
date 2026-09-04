/* ==========================================================================
   Finca Virtual de Yagua - Application Logic (SPA & Simulation)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    let rainTotalGlobal = 0; // Stores live weather rain volume

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ---------------------------------------------------------
    // 1. Tab Navigation (Main Menu)
    // ---------------------------------------------------------
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Toggle buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Toggle panels
            tabPanels.forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById(tabId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Actualizar fecha al abrir Bitacora
            if (tabId === 'bitacora') {
                setTodayDates();
            }
        });
    });

    // ---------------------------------------------------------
    // 2. Sub-tab Navigation (Generic handler for any sub-navigation)
    // ---------------------------------------------------------
    const subNavButtons = document.querySelectorAll('.sub-nav-btn');
    const subtabPanels = document.querySelectorAll('.subtab-panel');

    subNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const subtabId = btn.getAttribute('data-subtab');
            const parentSection = btn.closest('.tab-panel');

            // Toggle subtabs buttons ONLY within the same parent tab-panel
            parentSection.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle subtab panels ONLY within the same parent tab-panel
            parentSection.querySelectorAll('.subtab-panel').forEach(p => p.classList.remove('active'));
            const targetSubPanel = document.getElementById(subtabId);
            if (targetSubPanel) {
                targetSubPanel.classList.remove('hidden');
                targetSubPanel.classList.add('active');
            }

            // Actualizar fecha al cambiar de sub-pestana en Bitacora
            if (subtabId === 'bitacora-publica-tab' || subtabId === 'diario-privado-tab') {
                setTodayDates();
            }
        });
    });

    // ---------------------------------------------------------
    // 3. Real-Time Active Paca Venezuela Monitor & Countdown
    // ---------------------------------------------------------
    const pacaStartDate = new Date('2026-09-02T00:00:00');
    const pacaHarvestDate = new Date(pacaStartDate);
    pacaHarvestDate.setMonth(pacaHarvestDate.getMonth() + 6);

    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMin = document.getElementById('cd-minutes');
    const cdSec = document.getElementById('cd-seconds');
    const realProgress = document.getElementById('real-paca-progress');
    const realPercent = document.getElementById('real-paca-percent');
    const realDaysElapsed = document.getElementById('real-paca-days-elapsed');
    const realStageTitle = document.getElementById('real-paca-stage-title');
    const realTemp = document.getElementById('real-paca-temp');
    const realMicrobeText = document.getElementById('real-paca-microbe-text');

    function updateRealPacaTimer() {
        const now = new Date();
        const elapsed = now - pacaStartDate;
        const total = pacaHarvestDate - pacaStartDate;
        const pacaProgress = Math.min(100, Math.max(0, (elapsed / total) * 100));
        
        if (realPercent) realPercent.textContent = `${pacaProgress.toFixed(1)}%`;
        if (realProgress) realProgress.style.width = `${pacaProgress}%`;
        
        const daysElapsed = Math.floor(elapsed / 86400000);
        if (realDaysElapsed) realDaysElapsed.textContent = `Dia ${daysElapsed} transcurrido`;
        
        let phase = 'Fase de Llenado';
        if (pacaProgress >= 15 && pacaProgress < 30) phase = 'Fase Termica Temprana (~48C)';
        else if (pacaProgress >= 30 && pacaProgress < 50) phase = 'Fase Termica Activa (~70C)';
        else if (pacaProgress >= 50 && pacaProgress < 75) phase = 'Enfriamiento y Maduracion';
        else if (pacaProgress >= 75 && pacaProgress < 100) phase = 'Maduracion Final';
        else if (pacaProgress >= 100) phase = '¡COSECHA LISTA!';
        
        if (realStageTitle) realStageTitle.textContent = 'Fase Actual: ' + phase;
        if (realTemp) realTemp.textContent = 'Temperatura ambiente (~28°C)';
        if (realMicrobeText) realMicrobeText.textContent = 'Primera capa de hojas secas colocada. La paca esta en proceso de construccion. Se continuan agregando capas de material verde y marron.';
        
        // Countdown para la paca 1
        const remainingMs = pacaHarvestDate - new Date();
        if (remainingMs <= 0) {
            if (cdDays) cdDays.textContent = '0';
            if (cdHours) cdHours.textContent = '0';
            if (cdMin) cdMin.textContent = '0';
            if (cdSec) cdSec.textContent = '0';
        } else {
            const d = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
            const h = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((remainingMs % (1000 * 60)) / 1000);
            if (cdDays) cdDays.textContent = d;
            if (cdHours) cdHours.textContent = h;
            if (cdMin) cdMin.textContent = m;
            if (cdSec) cdSec.textContent = s;
        }
    }

    setInterval(updateRealPacaTimer, 1000);
    updateRealPacaTimer();

    // ---------------------------------------------------------
    // 4. Interactive SVG Map & Details Metadata
    // ---------------------------------------------------------
    const svgElements = document.querySelectorAll('.clickable');
    const panelPlaceholder = document.getElementById('panel-placeholder-msg');
    const panelContent = document.getElementById('panel-detail-content');
    const detailTitle = document.getElementById('detail-title');
    const detailDesc = document.getElementById('detail-desc');
    const detailStats = document.getElementById('detail-stats');

    const elementMetadata = {
        'elem-house': [
            { label: 'Uso de Vivienda', value: 'Habitación Familiar' },
            { label: 'Nevera y Cocina', value: 'Excelente estado / Aseo estricto' },
            { label: 'Servicios Básicos', value: 'Luz y Agua pagados y al día' },
            { label: 'Obligación', value: 'Mantenimiento del patio libre de maleza' }
        ],
        'elem-mango1': [
            { label: 'Especie', value: 'Mangifera indica (Mango)' },
            { label: 'Estrato', value: 'Dosel Alto (Sombra densa)' },
            { label: 'Rol Ecológico', value: 'Gran aporte de Carbono (Hojas secas)' },
            { label: 'Estado', value: 'Saludable, cargado de frutos' }
        ],
        'elem-mango2': [
            { label: 'Especie', value: 'Mangifera indica (Mango)' },
            { label: 'Estrato', value: 'Dosel Alto' },
            { label: 'Aporte de Materia Seca', value: 'Alto en hojarasca foliar' },
            { label: 'Estado', value: 'Saludable, sin plagas' }
        ],
        'elem-mango3': [
            { label: 'Especie', value: 'Mangifera indica (Mango)' },
            { label: 'Estrato', value: 'Dosel Alto' },
            { label: 'Cobertura', value: 'Protección contra erosión por lluvia' },
            { label: 'Estado', value: 'Estable' }
        ],
        'elem-mango4': [
            { label: 'Especie', value: 'Mangifera indica (Mango)' },
            { label: 'Estrato', value: 'Dosel Alto' },
            { label: 'Amortiguación', value: 'Barrera natural contra vientos del sur' },
            { label: 'Estado', value: 'Saludable' }
        ],
        'elem-mamon': [
            { label: 'Especie', value: 'Melicoccus bijugatus (Mamón)' },
            { label: 'Estrato', value: 'Dosel Medio-Alto' },
            { label: 'Hojas', value: 'Pequeñas (Descomposición rápida para compost)' },
            { label: 'Estado', value: 'Operativo, follaje verde' }
        ],
        'elem-moringa': [
            { label: 'Especie', value: 'Moringa oleifera (Moringa)' },
            { label: 'Estrato', value: 'Dosel Medio (Crecimiento rápido)' },
            { label: 'Rol Ecológico', value: 'Concentrado de Nitrógeno y Potasio' },
            { label: 'Uso en Compost', value: 'Acelerador verde de fermentación' }
        ],
        'elem-platanos-grandes': [
            { label: 'Especie', value: 'Musa paradisiaca (Plátano)' },
            { label: 'Cantidad', value: '5 Matas Grandes (Adultas)' },
            { label: 'Fase de Cultivo', value: 'Fase productiva (Desarrollo de racimos)' },
            { label: 'Humedad Suelo', value: 'Monitoreando por Clima...' }
        ],
        'elem-platanos-bebes': [
            { label: 'Especie', value: 'Musa paradisiaca (Plátano)' },
            { label: 'Cantidad', value: '5 Matas Chicas (Bebés/Colinos)' },
            { label: 'Fase de Cultivo', value: 'Crecimiento inicial y enraizamiento' },
            { label: 'Humedad Suelo', value: 'Monitoreando por Clima...' }
        ],
        'elem-paca1': [
            { label: 'Nombre', value: 'Paca Venezuela' },
            { label: 'Método', value: 'Paca Digestora Silva (Fermentación Prensada)' },
            { label: 'Dimensiones', value: '1 m x 1 m x 1 m (1,000 Litros)' },
            { label: 'Ubicación', value: 'Finca Yagua' },
            { label: 'Día de Inicio', value: '2 de Septiembre 2026' },
            { label: 'Cosecha Estimada', value: '3 de Marzo 2027 (6 meses)' },
            { label: 'Estado actual', value: 'Compactación y Llenado' }
        ],
        'elem-aromaticas': [
            { label: 'Cultivos instalados', value: 'Albahaca y Orégano' },
            { label: 'Sistema de Riego', value: 'Autoriego por goteo localizado' },
            { label: 'Control Biológico', value: 'Atrae mariquitas, avispas y polinizadores' },
            { label: 'Humedad Suelo Promedio', value: '65% - Óptimo' }
        ]
    };

    svgElements.forEach(elem => {
        elem.addEventListener('click', () => {
            const id = elem.getAttribute('id');
            const title = elem.getAttribute('data-title');
            const desc = elem.getAttribute('data-desc');
            const stats = elementMetadata[id] || [];

            panelPlaceholder.classList.add('hidden');
            panelContent.classList.remove('hidden');

            detailTitle.textContent = title;
            detailDesc.textContent = desc;

            detailStats.innerHTML = '';
            stats.forEach(s => {
                const statItem = document.createElement('div');
                statItem.className = 'detail-stat-item';
                
                if (id === 'elem-aromaticas') {
                    statItem.classList.add('water-status');
                } else if (id === 'elem-paca1') {
                    statItem.classList.add('paca-status');
                } else if (id.includes('platanos')) {
                    statItem.classList.add('water-status');
                }
                
                statItem.innerHTML = `
                    <div class="stat-label">${s.label}</div>
                    <div class="stat-val">${s.value}</div>
                `;
                detailStats.appendChild(statItem);
            });
        });
    });

    // ---------------------------------------------------------
    // 5. Open-Meteo Weather API Integration (Yagua, Venezuela)
    // ---------------------------------------------------------
    async function fetchLocalWeather() {
        const weatherHeader = document.getElementById('header-weather');
        const pacaWeatherFactor = document.getElementById('real-paca-weather-factor');
        const pacaHumidity = document.getElementById('real-paca-humidity');

        try {
            // Latitude and Longitude for El Toco, Yagua, Guacara, Carabobo: 10.2576, -67.8867
            const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=10.2576&longitude=-67.8867&current=temperature_2m,relative_humidity_2m,rain,showers,weather_code&daily=rain_sum&timezone=auto');
            if (!response.ok) throw new Error('Weather API request failed');
            const data = await response.json();

            const temp = data.current.temperature_2m;
            const humidity = data.current.relative_humidity_2m;
            const rainCurrent = data.current.rain + data.current.showers;
            const rainDailySum = data.daily && data.daily.rain_sum ? data.daily.rain_sum[0] : 0;
            const weatherCode = data.current.weather_code;

            let weatherText = 'Despejado';
            let weatherIcon = 'sun';
            if (weatherCode >= 1 && weatherCode <= 3) {
                weatherText = 'Poco nublado';
                weatherIcon = 'cloud-sun';
            } else if (weatherCode >= 45 && weatherCode <= 48) {
                weatherText = 'Niebla';
                weatherIcon = 'cloud-fog';
            } else if (weatherCode >= 51 && weatherCode <= 67) {
                weatherText = 'Lluvia débil';
                weatherIcon = 'cloud-rain';
            } else if (weatherCode >= 80 && weatherCode <= 82) {
                weatherText = 'Chubascos';
                weatherIcon = 'cloud-rain';
            } else if (weatherCode >= 95) {
                weatherText = 'Tormenta';
                weatherIcon = 'cloud-lightning';
            }

            if (weatherHeader) {
                weatherHeader.innerHTML = `<i data-lucide="${weatherIcon}"></i> Clima: ${temp}°C • ${weatherText}`;
            }

            const rainTotal = Math.max(rainCurrent, rainDailySum);
            rainTotalGlobal = rainTotal;
            updatePlatanoSimulation();

            if (rainTotal > 0) {
                // Update Paca factor
                if (pacaWeatherFactor) {
                    pacaWeatherFactor.textContent = `Lluvia registrada: +${rainTotal.toFixed(1)} mm. Humedad alta.`;
                    pacaWeatherFactor.style.color = '#3a86c8';
                }
                const rainHydrationBonus = Math.round(rainTotal * 1.5);
                const finalMoisture = Math.min(85, 60 + rainHydrationBonus);
                if (pacaHumidity) {
                    pacaHumidity.textContent = `~${finalMoisture}% (Aumentado por lluvia y humedad)`;
                    pacaHumidity.style.color = '#3a86c8';
                }

                // Update Plantains soil status dynamically inside metadata!
                elementMetadata['elem-platanos-grandes'][3].value = `~80% (Suelo húmedo por lluvia de +${rainTotal.toFixed(1)} mm)`;
                elementMetadata['elem-platanos-bebes'][3].value = `~85% (Óptimo, colinos hidratados por lluvia)`;
            } else {
                // Dry weather paca update
                if (pacaWeatherFactor) {
                    pacaWeatherFactor.textContent = `Seco (Humedad del aire: ${humidity}%). Riego normal.`;
                    pacaWeatherFactor.style.color = 'var(--text-muted)';
                }
                if (pacaHumidity) {
                    pacaHumidity.textContent = `~60% (Estable / Óptimo)`;
                    pacaHumidity.style.color = 'var(--accent-green)';
                }

                // Dry weather plantains update
                elementMetadata['elem-platanos-grandes'][3].value = 'Seco (Suelo requiere goteo / abono paca)';
                elementMetadata['elem-platanos-bebes'][3].value = 'Seco (Vulnerable a sequía. Aplicar riego manual)';
            }

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

        } catch (error) {
            console.warn('Could not fetch real-time weather, fallback to defaults:', error);
            if (weatherHeader) {
                weatherHeader.innerHTML = `<i data-lucide="cloud-sun"></i> Clima: 28°C • Despejado`;
            }
            if (pacaWeatherFactor) {
                pacaWeatherFactor.textContent = `Simulado (Sin lluvia registrada).`;
            }
            elementMetadata['elem-platanos-grandes'][3].value = 'Seco (Suelo requiere goteo auxiliar)';
            elementMetadata['elem-platanos-bebes'][3].value = 'Seco (Vulnerable, regar colinos)';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    fetchLocalWeather();

    // ---------------------------------------------------------
    // 6. Paca Digestora Silva Simulator
    // ---------------------------------------------------------
    const inputBrown = document.getElementById('input-brown');
    const inputGreen = document.getElementById('input-green');
    const valBrown = document.getElementById('val-brown');
    const valGreen = document.getElementById('val-green');
    const metricCN = document.getElementById('metric-cn');
    const metricCNStatus = document.getElementById('metric-cn-status');
    const cnPointer = document.getElementById('cn-pointer');
    const metricHumus = document.getElementById('metric-humus');
    
    const timelineSlider = document.getElementById('timeline-slider');
    const timelineMarkers = document.querySelectorAll('.timeline-markers .marker');
    const pacaCube = document.getElementById('paca-cube');
    const pacaText = document.getElementById('paca-text');
    const stageTitle = document.getElementById('stage-title');
    const stageDesc = document.getElementById('stage-desc');
    const stageAlertText = document.getElementById('stage-alert-text');
    
    const stagesData = {
        0: {
            title: 'Fase 1: Compactación y Llenado (Día 1)',
            desc: 'Se colocan capas alternas de hojarasca foliar y residuos orgánicos, apisonando intensamente con un molde de 1 m³ para expulsar el exceso de aire.',
            alert: 'La alta compresión anaeróbica impide la putrefacción y malos olores.',
            cubeClass: 'cube-day1',
            text: 'Día 1 (1 m³)',
            myceliumOpacity: 0
        },
        30: {
            title: 'Fase 2: Inicio de Fermentación (Mes 1)',
            desc: 'Las bacterias anaeróbicas inician el desglose de los materiales húmedos. El bloque se asienta y compacta por gravedad. No hay presencia de moscas ni lixiviados.',
            alert: 'La temperatura interna aumenta ligeramente debido a la actividad microbiana.',
            cubeClass: 'cube-month1',
            text: 'Mes 1 (~90cm)',
            myceliumOpacity: 0.1
        },
        60: {
            title: 'Fase 2: Fermentación Estable (Mes 2)',
            desc: 'La fermentación anaeróbica ácida descompone la materia blanda. Los olores son ácidos y controlados dentro de la estructura densa.',
            alert: 'La acidez inhibe la germinación de semillas de malezas invasoras.',
            cubeClass: 'cube-month1',
            text: 'Mes 2 (~80cm)',
            myceliumOpacity: 0.2
        },
        90: {
            title: 'Fase 3: Colonización Fúngica (Mes 3)',
            desc: 'Los hongos benéficos del suelo penetran el bloque. Aparece el micelio blanco degradando el material leñoso y la celulosa de las hojas de mango y mamón.',
            alert: 'Los hongos del suelo (actinomicedas) transforman los polímeros complejos en humus.',
            cubeClass: 'cube-month3',
            text: 'Mes 3 (~75cm)',
            myceliumOpacity: 0.7
        },
        120: {
            title: 'Fase 4: Enfriamiento y Maduración (Mes 4)',
            desc: 'La fermentación disminuye. La fauna del suelo (lombrices e insectos detrívoros) coloniza el compost desde la base del suelo.',
            alert: 'Se estabilizan los nutrientes móviles como el amonio convirtiéndose en nitratos.',
            cubeClass: 'cube-month5',
            text: 'Mes 4 (~70cm)',
            myceliumOpacity: 0.9
        },
        150: {
            title: 'Fase 4: Estabilización Humificadora (Mes 5)',
            desc: 'La biomasa original es irreconocible. Se forma una estructura granulada negra y rica. La paca ha reducido su volumen a casi la mitad.',
            alert: 'Los hongos micorrícicos y benéficos alcanzan su pico biológico.',
            cubeClass: 'cube-month5',
            text: 'Mes 5 (~65cm)',
            myceliumOpacity: 0.6
        },
        180: {
            title: 'Fase 5: Cosecha de Humus Maduro (Mes 6)',
            desc: 'Compost maduro listo con un olor característico a tierra de bosque húmedo. Relación C:N final balanceada (10:1 - 12:1). Listo para aplicar.',
            alert: 'Este abono regenera el suelo de tus mangos y potencia tus aromáticas.',
            cubeClass: 'cube-month6',
            text: 'Cosecha (~60cm)',
            myceliumOpacity: 0.2
        }
    };

    function updateSimulation() {
        const brownKg = parseInt(inputBrown.value);
        const greenKg = parseInt(inputGreen.value);
        
        valBrown.textContent = `${brownKg} kg`;
        valGreen.textContent = `${greenKg} kg`;
        
        const totalC = (brownKg * 0.26) + (greenKg * 0.08);
        const totalN = (brownKg * 0.002) + (greenKg * 0.015);
        const cnRatio = Math.round(totalC / totalN);
        metricCN.textContent = `${cnRatio}:1`;
        
        let statusText = 'Óptimo';
        if (cnRatio < 20) {
            statusText = 'Bajo (Riesgo de mal olor)';
            metricCNStatus.className = 'metric-status status-danger';
        } else if (cnRatio > 35) {
            statusText = 'Alto (Descomposición muy lenta)';
            metricCNStatus.className = 'metric-status status-warning';
        } else {
            statusText = 'Óptimo (Fermentación limpia)';
            metricCNStatus.className = 'metric-status status-good';
        }
        metricCNStatus.textContent = statusText;
        
        const pointerPos = Math.max(0, Math.min(100, ((cnRatio - 10) / 50) * 100));
        cnPointer.style.left = `${pointerPos}%`;
        
        const dryMatter = (brownKg * 0.85) + (greenKg * 0.20);
        const humusKg = Math.round(dryMatter * 0.70);
        metricHumus.textContent = `${humusKg} kg`;
    }

    function updateTimelineStage() {
        const days = parseInt(timelineSlider.value);
        
        timelineMarkers.forEach(marker => {
            const markerDay = parseInt(marker.getAttribute('data-day'));
            if (markerDay === days) {
                marker.classList.add('active');
            } else {
                marker.classList.remove('active');
            }
        });
        
        const stage = stagesData[days];
        if (stage) {
            stageTitle.textContent = stage.title;
            stageDesc.textContent = stage.desc;
            stageAlertText.textContent = stage.alert;
            pacaText.textContent = stage.text;
            pacaCube.className.baseVal = stage.cubeClass;
            
            const myceliumDots = document.querySelectorAll('.mycelium');
            myceliumDots.forEach(dot => {
                dot.style.opacity = stage.myceliumOpacity;
                if (stage.myceliumOpacity > 0.5) {
                    dot.style.animation = 'pulseWater 3s infinite ease-in-out';
                } else {
                    dot.style.animation = 'none';
                }
            });
        }
    }

    if (inputBrown) inputBrown.addEventListener('input', updateSimulation);
    if (inputGreen) inputGreen.addEventListener('input', updateSimulation);
    if (timelineSlider) timelineSlider.addEventListener('input', updateTimelineStage);
    
    timelineMarkers.forEach(marker => {
        marker.addEventListener('click', () => {
            const day = marker.getAttribute('data-day');
            timelineSlider.value = day;
            updateTimelineStage();
        });
    });

    updateSimulation();
    updateTimelineStage();

    // ---------------------------------------------------------
    // 7. Digital Inventory search filtering
    // ---------------------------------------------------------
    const searchInput = document.getElementById('inventory-search');
    const tableRows = document.querySelectorAll('#inventory-tbody tr');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            
            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.classList.remove('hidden');
                } else {
                    row.classList.add('hidden');
                }
            });
        });
    }

    // ---------------------------------------------------------
    // 8. Bitácora (Public Activity Logs) with LocalStorage
    // ---------------------------------------------------------
    const bitacoraForm = document.getElementById('bitacora-form');
    const logTimeline = document.getElementById('log-timeline');
    const btnClearLogs = document.getElementById('btn-clear-logs');
    
    const seedLogs = [
        {
            date: '2026-08-01',
            category: 'poda',
            title: 'Limpieza e Inspección del Patio',
            details: 'Se realiza desmalezamiento de las áreas cercanas a la casa de habitación. Se contabiliza el dosel forestal: 4 mangos, 1 mamón, 1 moringa y 10 matas de plátano.'
        },
        {
            date: '2026-09-02',
            category: 'compost',
            title: 'Inicio de la Paca Venezuela',
            details: 'Se inicia la Paca Venezuela de 1 m³ Silva en la finca Yagua. Inicio: 2 de Septiembre 2026. Cosecha estimada: 2 de Marzo 2027.'
        },
        {
            date: '2026-08-10',
            category: 'riego',
            title: 'Establecimiento de Aromáticas y Autoriego',
            details: 'Siembra de albahaca y orégano en bancales sur. Conexión de manguera de autoriego con aspersores e inicio de monitoreo de humedad a profundidad de 10-15 cm.'
        },
        {
            date: '2026-08-22',
            category: 'siembra',
            title: 'Siembra de 3 Pan de Palo en Sistema Hidroponico',
            details: 'Se sembraron 3 semillas de Pan de Palo (Artocarpus camansi) en sistema hidroponico. Sustrato preparado con tierra agricola, arena y humus de lombriz en proporcion 2:1:1. Semillas colocadas en posicion horizontal a 5 cm de profundidad. Ubicacion: entrada de la casa con malla de sombra al 45%.'
        },
        {
            date: '2026-08-22',
            category: 'servicio',
            title: 'Mantenimiento Baños - Reparaciones en curso',
            details: 'Se continuo con los arreglos del baño de Amelia y el baño propio. En el baño de Amelia se cambio la llave de la ducha. Actualmente presenta fuga en las uniones de la llave nueva, requiere sellado o ajuste de conexiones.'
        }
    ];

    const categoryLabels = {
        'compost': 'Compost',
        'riego': 'Autoriego',
        'limpieza': 'Limpieza',
        'poda': 'Mantenimiento Patio',
        'servicio': 'Servicios Públicos',
        'siembra': 'Siembra'
    };

    const TELEGRAM_BOT_WORKER = 'https://lucky-smoke-0314.matrixpaginas.workers.dev';

    async function syncToWorker(type, data) {
        try {
            await fetch(TELEGRAM_BOT_WORKER + '/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data })
            });
        } catch (e) {
            console.log('Sync to worker failed:', e);
        }
    }

    function getLogs() {
        const stored = localStorage.getItem('yagua_logs_v6');
        if (stored) {
            return JSON.parse(stored);
        }
        localStorage.setItem('yagua_logs_v6', JSON.stringify(seedLogs));
        return seedLogs;
    }

    async function syncTelegramLogs() {
        try {
            const res = await fetch(TELEGRAM_BOT_WORKER + '/api/logs');
            if (!res.ok) return;
            const telegramEntries = await res.json();
            if (!telegramEntries || telegramEntries.length === 0) return;

            const logs = getLogs();
            const existingKeys = new Set(logs.map(l => l.date + l.title));

            telegramEntries.forEach(entry => {
                const catMap = {
                    'Compost': 'compost', 'Siembra': 'siembra',
                    'Limpieza': 'limpieza', 'Poda': 'poda',
                    'Riego': 'riego', 'Mantenimiento': 'mantenimiento',
                    'General': 'general'
                };
                const category = catMap[entry.category] || 'general';
                const dateStr = entry.date.split('/').reverse().join('-');
                const key = dateStr + entry.note;

                if (!existingKeys.has(key)) {
                    logs.push({
                        date: dateStr,
                        category: category,
                        title: entry.note,
                        details: 'Registrado desde Telegram por ' + (entry.user || 'Bot') + ' a las ' + entry.time
                    });
                    existingKeys.add(key);
                }
            });

            localStorage.setItem('yagua_logs_v6', JSON.stringify(logs));
        } catch (e) {
            console.log('Sync Telegram logs failed:', e);
        }
    }

    async function renderLogs() {
        if (!logTimeline) return;
        await syncTelegramLogs();
        const logs = getLogs();
        
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        logTimeline.innerHTML = '';
        
        if (logs.length === 0) {
            logTimeline.innerHTML = '<p class="panel-placeholder">No hay actividades registradas en el historial.</p>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            const dateParts = log.date.split('-');
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : log.date;
            
            item.innerHTML = `
                <div class="timeline-dot ${log.category}"></div>
                <div class="timeline-time">${formattedDate} • ${categoryLabels[log.category] || log.category}</div>
                <div class="timeline-content">
                    <h4>${log.title}</h4>
                    <p>${log.details}</p>
                </div>
            `;
            logTimeline.appendChild(item);
        });
    }

    if (bitacoraForm) {
        bitacoraForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const date = document.getElementById('log-date').value;
            const category = document.getElementById('log-category').value;
            const title = document.getElementById('log-title').value;
            const details = document.getElementById('log-details').value;
            
            const newLog = { date, category, title, details };
            
            const logs = getLogs();
            logs.push(newLog);
            
            localStorage.setItem('yagua_logs_v6', JSON.stringify(logs));
            syncToWorker('logs', [{ date, category, title, details }]);
            bitacoraForm.reset();
            setTodayDates();
            renderLogs();
        });
    }

    if (btnClearLogs) {
        btnClearLogs.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas limpiar la bitácora pública? Esto borrará tus registros públicos locales.')) {
                localStorage.removeItem('yagua_logs_v6');
    renderLogs();
    syncToWorker('semillero', getSeedlings());
    syncToWorker('logs', getLogs());
            }
        });
    }

    // ---------------------------------------------------------
    // 9. Diario Privado (Encrypted Personal Logbook)
    // ---------------------------------------------------------
    function xorCipher(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    function stringToHex(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            hex += str.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return hex;
    }

    function hexToString(hex) {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    }

    function encryptData(text, password) {
        return stringToHex(xorCipher(text, password));
    }

    function decryptData(hex, password) {
        try {
            return xorCipher(hexToString(hex), password);
        } catch (e) {
            return null;
        }
    }

    let decryptedPassword = null;

    const lockView = document.getElementById('private-lock-view');
    const unlockedView = document.getElementById('private-unlocked-view');
    const passwordInput = document.getElementById('private-password-input');
    const authTitle = document.getElementById('auth-title');
    const authDesc = document.getElementById('auth-desc');
    const authErrorMsg = document.getElementById('auth-error-msg');
    const btnUnlockPrivate = document.getElementById('btn-unlock-private');
    const btnLockPrivate = document.getElementById('btn-lock-private');
    const privateForm = document.getElementById('private-diary-form');
    const privateTimeline = document.getElementById('private-timeline');
    const btnClearPrivateLogs = document.getElementById('btn-clear-private-logs');

    const privateCategoryLabels = {
        'priv-nota': 'Nota de Campo',
        'priv-gasto': 'Gasto / Compra',
        'priv-riego': 'Observación Riego',
        'priv-personal': 'Mantenimiento Crítico'
    };

    function checkHasPassword() {
        return localStorage.getItem('yagua_priv_pass_check') !== null;
    }

    function updateAuthScreenLabels() {
        if (!checkHasPassword()) {
            if (authTitle) authTitle.textContent = 'Configurar Diario Privado';
            if (authDesc) authDesc.textContent = 'Crea una contraseña de seguridad para activar tu diario. Esta contraseña cifrará localmente todas tus anotaciones privadas.';
            if (btnUnlockPrivate) btnUnlockPrivate.innerHTML = '<i data-lucide="shield-check"></i> Activar Diario Privado';
        } else {
            if (authTitle) authTitle.textContent = 'Acceso al Diario Privado';
            if (authDesc) authDesc.textContent = 'Introduce tu contraseña de seguridad para desencriptar y ver tus notas personales.';
            if (btnUnlockPrivate) btnUnlockPrivate.innerHTML = '<i data-lucide="key-round"></i> Desbloquear Diario';
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function lockSession() {
        decryptedPassword = null;
        if (passwordInput) passwordInput.value = '';
        if (lockView) lockView.classList.remove('hidden');
        if (unlockedView) unlockedView.classList.add('hidden');
        if (authErrorMsg) authErrorMsg.classList.add('hidden');
        if (privateTimeline) privateTimeline.innerHTML = '';
        updateAuthScreenLabels();
    }

    function unlockSession(password) {
        if (!checkHasPassword()) {
            const token = encryptData('VERIFIED', password);
            localStorage.setItem('yagua_priv_pass_check', token);
            decryptedPassword = password;
            authErrorMsg.classList.add('hidden');
            lockView.classList.add('hidden');
            unlockedView.classList.remove('hidden');
            renderPrivateLogs();
        } else {
            const storedToken = localStorage.getItem('yagua_priv_pass_check');
            const decryptedToken = decryptData(storedToken, password);

            if (decryptedToken === 'VERIFIED') {
                decryptedPassword = password;
                authErrorMsg.classList.add('hidden');
                lockView.classList.add('hidden');
                unlockedView.classList.remove('hidden');
                renderPrivateLogs();
            } else {
                authErrorMsg.classList.remove('hidden');
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    function getPrivateLogsCipher() {
        return localStorage.getItem('yagua_priv_logs_cipher');
    }

    function getDecryptedPrivateLogs() {
        const cipher = getPrivateLogsCipher();
        if (!cipher) return [];
        try {
            const rawJSON = decryptData(cipher, decryptedPassword);
            return JSON.parse(rawJSON) || [];
        } catch (e) {
            console.error('Error decrypting private logs:', e);
            return [];
        }
    }

    function savePrivateLogsEncrypted(logsArray) {
        const rawJSON = JSON.stringify(logsArray);
        const cipher = encryptData(rawJSON, decryptedPassword);
        localStorage.setItem('yagua_priv_logs_cipher', cipher);
    }

    function renderPrivateLogs() {
        if (!privateTimeline || !decryptedPassword) return;
        const logs = getDecryptedPrivateLogs();
        
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        privateTimeline.innerHTML = '';

        if (logs.length === 0) {
            privateTimeline.innerHTML = '<p class="panel-placeholder">Tu Diario está vacío. ¡Registra tu primera entrada privada arriba!</p>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            const dateParts = log.date.split('-');
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : log.date;
            
            item.innerHTML = `
                <div class="timeline-dot ${log.category}"></div>
                <div class="timeline-time">${formattedDate} • ${privateCategoryLabels[log.category] || log.category}</div>
                <div class="timeline-content" style="border-color: rgba(255, 183, 3, 0.15);">
                    <h4 style="color: var(--accent-gold);"><i data-lucide="lock" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i>${log.title}</h4>
                    <p style="color: var(--text-primary);">${log.details}</p>
                </div>
            `;
            privateTimeline.appendChild(item);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    if (btnUnlockPrivate) {
        btnUnlockPrivate.addEventListener('click', () => {
            const pass = passwordInput.value.trim();
            if (pass.length < 4) {
                alert('La contraseña debe tener al menos 4 caracteres.');
                return;
            }
            unlockSession(pass);
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const pass = passwordInput.value.trim();
                if (pass.length < 4) {
                    alert('La contraseña debe tener al menos 4 caracteres.');
                    return;
                }
                unlockSession(pass);
            }
        });
    }

    if (btnLockPrivate) {
        btnLockPrivate.addEventListener('click', lockSession);
    }

    if (privateForm) {
        privateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!decryptedPassword) return;

            const date = document.getElementById('priv-date').value;
            const category = document.getElementById('priv-category').value;
            const title = document.getElementById('priv-title').value;
            const details = document.getElementById('priv-details').value;

            const newEntry = { date, category, title, details };
            const logs = getDecryptedPrivateLogs();
            logs.push(newEntry);

            savePrivateLogsEncrypted(logs);
            privateForm.reset();
            setTodayDates();
            renderPrivateLogs();
        });
    }

    if (btnClearPrivateLogs) {
        btnClearPrivateLogs.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas borrar permanentemente todo tu diario privado encriptado? Esta acción es irreversible.')) {
                localStorage.removeItem('yagua_priv_logs_cipher');
                renderPrivateLogs();
            }
        });
    }

    // ---------------------------------------------------------
    // 10. Plantain Simulator (Musa paradisiaca)
    // ---------------------------------------------------------
    const inputCompostPlatano = document.getElementById('input-compost-platano');
    const inputRiegoPlatano = document.getElementById('input-riego-platano');
    const timelinePlatanoSlider = document.getElementById('timeline-platano-slider');
    const timelinePlatanoMarkers = document.querySelectorAll('.timeline-markers .marker[data-month]');

    const valCompostPlatano = document.getElementById('val-compost-platano');
    const valRiegoPlatano = document.getElementById('val-riego-platano');

    const metricPlatanoSoilHumidity = document.getElementById('metric-platano-soil-humidity');
    const platanoStressLevel = document.getElementById('platano-stress-level');
    const metricPlatanoWeight = document.getElementById('metric-platano-weight');
    const metricPlatanoYieldDesc = document.getElementById('metric-platano-yield-desc');

    const platanoTimelineTitle = document.getElementById('platano-timeline-title');
    const platanoTimelineDesc = document.getElementById('platano-timeline-desc');
    const platanoStageAlertText = document.getElementById('platano-stage-alert-text');
    const platanoStageAlert = document.getElementById('platano-stage-alert');

    function updatePlatanoSimulation() {
        if (!inputCompostPlatano || !inputRiegoPlatano || !timelinePlatanoSlider) return;

        const compostKg = parseFloat(inputCompostPlatano.value);
        const riegoManual = parseInt(inputRiegoPlatano.value);
        const months = parseInt(timelinePlatanoSlider.value);

        // Update labels
        if (valCompostPlatano) valCompostPlatano.textContent = `${compostKg.toFixed(1)} kg/mata`;
        if (valRiegoPlatano) valRiegoPlatano.textContent = `${riegoManual} veces/semana`;

        // Humidity calculations (Rain impact + manual irrigation)
        let baseHumidity = 20; // Dry base
        if (typeof rainTotalGlobal !== 'undefined' && rainTotalGlobal > 0) {
            baseHumidity = Math.min(75, 45 + Math.round(rainTotalGlobal * 2.5));
        }
        const finalHumidity = Math.min(100, baseHumidity + (riegoManual * 8));
        if (metricPlatanoSoilHumidity) metricPlatanoSoilHumidity.textContent = `${finalHumidity}%`;

        // Water Stress Evaluation
        let stress = 'Óptimo';
        let stressClass = 'metric-status status-good';
        let waterMultiplier = 1.15;

        if (finalHumidity < 35) {
            stress = 'Crítico (Sequía)';
            stressClass = 'metric-status status-danger';
            waterMultiplier = 0.55;
        } else if (finalHumidity < 55) {
            stress = 'Moderado (Bajo riego)';
            stressClass = 'metric-status status-warning';
            waterMultiplier = 0.85;
        } else if (finalHumidity > 90) {
            stress = 'Saturado (Exceso)';
            stressClass = 'metric-status status-warning';
            waterMultiplier = 0.75;
        } else {
            stress = 'Óptimo (Excelente)';
            stressClass = 'metric-status status-good';
            waterMultiplier = 1.15;
        }

        if (platanoStressLevel) {
            platanoStressLevel.textContent = stress;
            platanoStressLevel.className = stressClass;
        }

        // Bunch weight projection (base 12kg + up to 10kg compost bonus, modulated by stress)
        const baseWeight = 12.0;
        const compostBonus = compostKg * 1.0;
        const projectedWeight = (baseWeight + compostBonus) * waterMultiplier;
        
        if (metricPlatanoWeight) metricPlatanoWeight.textContent = `${projectedWeight.toFixed(1)} kg`;

        // Yield descriptor
        let yieldDesc = 'Cosecha base';
        if (projectedWeight < 10) {
            yieldDesc = 'Mala (Fruto pequeño por estrés hídrico)';
        } else if (projectedWeight >= 10 && projectedWeight < 16) {
            yieldDesc = 'Normal (Racimo estándar)';
        } else if (projectedWeight >= 16 && projectedWeight < 21) {
            yieldDesc = 'Buena (Cosecha mejorada por abono)';
        } else {
            yieldDesc = 'Excelente (Gran racimo, alta nutrición)';
        }
        if (metricPlatanoYieldDesc) metricPlatanoYieldDesc.textContent = yieldDesc;

        // Timeline stage info
        let title = '';
        let desc = '';
        let alertText = '';
        let alertClass = 'alert alert-info';
        let activeSvgStage = 'sprout';

        if (months <= 2) {
            title = `Fase 1: Enraizamiento y Brotación (Mes ${months})`;
            desc = 'Los colinos recién trasplantados se adaptan al suelo. Echan raíces finas y despliegan sus primeras hojas verdes pequeñas. Exigen humedad estable.';
            alertText = 'Fase sumamente crítica. Sin riego ni lluvia, la tasa de mortalidad de los colinos recién sembrados es del 50%.';
            alertClass = 'alert alert-danger';
            activeSvgStage = 'sprout';
        } else if (months <= 6) {
            title = `Fase 2: Crecimiento Vegetativo Rápido (Mes ${months})`;
            desc = 'La mata desarrolla un pseudotallo grueso y produce hojas gigantes de hasta 2 metros. Demanda gran aporte de Nitrógeno (aplica compost de paca Silva) para ganar altura y robustez.';
            alertText = 'Aplica 2-3 kg de compost de paca alrededor del tallo este mes para acelerar el engrosamiento del pseudotallo.';
            alertClass = 'alert alert-info';
            activeSvgStage = 'growth';
        } else if (months <= 9) {
            title = `Fase 3: Floración y Emergencia de la Bellota (Mes ${months})`;
            desc = 'La bellota (inflorescencia púrpura) brota del centro de la planta. Al abrirse sus brácteas, deja al descubierto las flores femeninas que se convertirán en plátanos.';
            alertText = 'En esta fase, la mata necesita gran cantidad de Potasio. El humus maduro de tu paca aporta potasio orgánico asimilable.';
            activeSvgStage = 'flower';
        } else {
            title = `Fase 4: Llenado de Fruto y Cosecha (Mes ${months})`;
            desc = 'Los plátanos absorben nutrientes para ganar tamaño y adquirir su curvatura. Al cumplir el mes 12, el racimo está lleno y listo para la cosecha. Se corta la mata madre para ceder espacio al hijo.';
            alertText = '¡Listo para cosechar! Cada mata produce un solo racimo. Recuerda picar el tallo viejo e incorporarlo al suelo para reciclar agua y fibra.';
            activeSvgStage = 'harvest';
        }

        if (platanoTimelineTitle) platanoTimelineTitle.textContent = title;
        if (platanoTimelineDesc) platanoTimelineDesc.textContent = desc;
        if (platanoStageAlertText) platanoStageAlertText.textContent = alertText;
        if (platanoStageAlert) platanoStageAlert.className = alertClass;

        // Toggle SVG growth stages visibility
        const svgStages = ['sprout', 'growth', 'flower', 'harvest'];
        svgStages.forEach(st => {
            const g = document.getElementById(`platano-stage-${st}`);
            if (g) {
                if (st === activeSvgStage) {
                    g.classList.remove('hidden');
                } else {
                    g.classList.add('hidden');
                }
            }
        });
    }

    if (inputCompostPlatano) inputCompostPlatano.addEventListener('input', updatePlatanoSimulation);
    if (inputRiegoPlatano) inputRiegoPlatano.addEventListener('input', updatePlatanoSimulation);
    if (timelinePlatanoSlider) timelinePlatanoSlider.addEventListener('input', updatePlatanoSimulation);

    timelinePlatanoMarkers.forEach(marker => {
        marker.addEventListener('click', () => {
            const m = marker.getAttribute('data-month');
            if (timelinePlatanoSlider) {
                timelinePlatanoSlider.value = m;
                updatePlatanoSimulation();
            }
        });
    });

    // Update active marker indicators for Platanal timeline
    if (timelinePlatanoSlider) {
        timelinePlatanoSlider.addEventListener('input', () => {
            const currentVal = parseInt(timelinePlatanoSlider.value);
            timelinePlatanoMarkers.forEach(marker => {
                const markerMonth = parseInt(marker.getAttribute('data-month'));
                if (markerMonth === currentVal) {
                    marker.classList.add('active');
                } else {
                    marker.classList.remove('active');
                }
            });
        });
    }

    // ---------------------------------------------------------
    // 10b. Simulador de Aji
    // ---------------------------------------------------------
    const ajiFechaSiembra = document.getElementById('aji-fecha-siembra');
    const ajiVariedad = document.getElementById('aji-variedad');
    const ajiTimelineSlider = document.getElementById('aji-timeline-slider');
    const ajiTimelineMarkers = document.querySelectorAll('#aji-timeline-markers .marker');

    const ajiVariedades = {
        'dulce': { name: 'Aji Dulce', min: 90, max: 120, maxHeight: 60 },
        'picante': { name: 'Aji Picante', min: 100, max: 130, maxHeight: 80 },
        'jalapeno': { name: 'Jalapeno', min: 80, max: 100, maxHeight: 70 },
        'habanero': { name: 'Habanero', min: 100, max: 120, maxHeight: 50 }
    };

    const ajiFases = [
        { maxDay: 7, title: 'Germinacion', desc: 'La semilla absorbe agua y rompe la testa. El embrion consume las reservas del cotiledon.', alert: 'Mantener suelo humedo. Temperatura ideal: 25-30C.', height: 0 },
        { maxDay: 21, title: 'Brote y Primeras Hojas', desc: 'El brote emerge del suelo y abre sus primeras hojas verdaderas. Fotosintesis activa.', alert: 'Luz indirecta. No exponer al sol directo aun.', height: 5 },
        { maxDay: 45, title: 'Crecimiento Vegetativo', desc: 'La planta crece vigorosamente. Se desarrollan ramas y hojas. Forma la estructura base.', alert: 'Fertilizar con compost. Riego regular 2-3 veces/semana.', height: 25 },
        { maxDay: 80, title: 'Floracion', desc: 'Aparecen las primeras flores blancas. Polinizacion por viento o insectos.', alert: 'No mover la planta. Proteger de vientos fuertes.', height: 45 },
        { maxDay: 110, title: 'Frutacion', desc: 'Los frutos se forman y crecen. Cambian de verde a su color final.', alert: 'Riego constante. Los frutos necesitan agua para crecer.', height: 55 },
        { maxDay: 999, title: 'Cosecha', desc: 'Frutos maduros listos para recoleccion. Color uniforme y textura firme.', alert: 'Cosechar con cuidado. Cada planta produce 1-3 kg.', height: 60 }
    ];

    function updateAjiSimulator() {
        if (!ajiFechaSiembra || !ajiTimelineSlider) return;

        const siembra = new Date(ajiFechaSiembra.value);
        const hoy = new Date();
        const diasTranscurridos = Math.max(0, Math.floor((hoy - siembra) / 86400000));
        const variedad = ajiVariedades[ajiVariedad.value] || ajiVariedades['dulce'];
        const diasSlider = parseInt(ajiTimelineSlider.value);

        const diasDisplay = Math.max(diasTranscurridos, diasSlider);
        const cosechaMin = new Date(siembra);
        cosechaMin.setDate(cosechaMin.getDate() + variedad.min);
        const cosechaMax = new Date(siembra);
        cosechaMax.setDate(cosechaMax.getDate() + variedad.max);
        const diasRestantes = Math.max(0, variedad.max - diasDisplay);

        let faseIdx = 0;
        for (let i = 0; i < ajiFases.length; i++) {
            if (diasDisplay >= ajiFases[i].maxDay && i < ajiFases.length - 1) {
                faseIdx = i + 1;
            } else if (diasDisplay < ajiFases[i].maxDay) {
                faseIdx = i;
                break;
            }
        }

        const fase = ajiFases[faseIdx];
        const altura = Math.min(variedad.maxHeight, Math.floor((diasDisplay / 120) * variedad.maxHeight));
        const progreso = Math.min(100, (diasDisplay / variedad.max) * 100);

        document.getElementById('aji-dias').textContent = diasDisplay;
        document.getElementById('aji-dias-status').textContent = fase.title;
        document.getElementById('aji-dias-status').className = 'metric-status ' + (progreso >= 100 ? 'status-good' : 'status-warn');
        document.getElementById('aji-cosecha').textContent = cosechaMax.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
        document.getElementById('aji-cosecha-dias').textContent = diasRestantes > 0 ? diasRestantes + ' dias restantes' : '¡Lista para cosecha!';
        document.getElementById('aji-fase').textContent = fase.title;
        document.getElementById('aji-altura').textContent = altura + ' cm';
        document.getElementById('aji-stage-title').textContent = 'Fase ' + (faseIdx + 1) + ': ' + fase.title;
        document.getElementById('aji-stage-desc').textContent = fase.desc;
        document.getElementById('aji-stage-alert-text').textContent = fase.alert;

        ajiTimelineMarkers.forEach(marker => {
            const markerDay = parseInt(marker.getAttribute('data-day'));
            marker.classList.toggle('active', markerDay <= diasDisplay);
        });
    }

    if (ajiFechaSiembra) ajiFechaSiembra.addEventListener('change', updateAjiSimulator);
    if (ajiVariedad) ajiVariedad.addEventListener('change', updateAjiSimulator);
    if (ajiTimelineSlider) ajiTimelineSlider.addEventListener('input', updateAjiSimulator);
    updateAjiSimulator();

    // ---------------------------------------------------------
    // 10c. Simulador de Pan de Palo
    // ---------------------------------------------------------
    const panFechaSiembra = document.getElementById('pan-fecha-siembra');
    const panTemp = document.getElementById('input-pan-temp');
    const panRiego = document.getElementById('input-pan-riego');
    const panTimelineSlider = document.getElementById('pan-timeline-slider');
    const panTimelineMarkers = document.querySelectorAll('#sim-pan-tab .timeline-markers .marker');

    const panFases = [
        { maxMonth: 0.5, title: 'Germinacion', desc: 'La semilla recien plantada absorbe agua. El embrion se activa y la radicula emerge.', alert: 'Semillas recalcitrantes: sembrar inmediatamente. No dejar secar.', height: 0 },
        { maxMonth: 2, title: 'Plantula', desc: 'El brote emerge con los cotiledones subterraneos. Primeras hojas verdaderas.', alert: 'Sombra 45%. Riego suave por neblina. No trasplantar.', height: 10 },
        { maxMonth: 4, title: 'Crecimiento Inicial', desc: 'La planta crece hojas grandes y fortalece el tallo. Sistema radicular se expande.', alert: 'No exponer al sol directo. Mantener humedad alta.', height: 25 },
        { maxMonth: 7, title: 'Trasplante (6 meses)', desc: 'Listo para trasplantar al suelo definitivo. Altura minima recomendada: 40cm.', alert: 'Cavar hoyo 40x40x40cm. Mantener cepellon intacto.', height: 45 },
        { maxMonth: 12, title: 'Crecimiento Activo', desc: 'El arbol crece rapidamente. Copa se expande. Raices penetran el suelo.', alert: 'Abonar con compost de paca. Riego sistematizado.', height: 120 },
        { maxMonth: 18, title: 'Madurez Vegetativa', desc: 'El arbol alcanza su forma adulta. Comienza a producir flores.', alert: 'Poda de conduccion. Proteger de vientos.', height: 200 },
        { maxMonth: 24, title: 'Primera Cosecha', desc: 'Frutos maduros con semillas viables. Cada arbol produce 50-100 frutos.', alert: 'Recolectar frutos sobremaduros para semillas.', height: 300 }
    ];

    function updatePanSimulator() {
        if (!panFechaSiembra || !panTimelineSlider) return;

        const siembra = new Date(panFechaSiembra.value);
        const hoy = new Date();
        const mesesTranscurridos = (hoy - siembra) / (86400000 * 30);
        const mesesSlider = parseInt(panTimelineSlider.value);
        const mesesDisplay = Math.max(mesesTranscurridos, mesesSlider);

        const temp = parseInt(panTemp?.value || 27);
        const riego = parseInt(panRiego?.value || 3);
        const tempBonus = temp >= 25 && temp <= 30 ? 1.1 : temp >= 20 && temp <= 35 ? 1.0 : 0.85;
        const riegoBonus = riego >= 3 ? 1.1 : riego >= 2 ? 1.0 : 0.9;
        const factorCrecimiento = tempBonus * riegoBonus;

        const cosechaDate = new Date(siembra);
        cosechaDate.setMonth(cosechaDate.getMonth() + 24);
        const mesesRestantes = Math.max(0, 24 - mesesDisplay);

        let faseIdx = 0;
        for (let i = 0; i < panFases.length; i++) {
            if (mesesDisplay >= panFases[i].maxMonth && i < panFases.length - 1) {
                faseIdx = i + 1;
            } else if (mesesDisplay < panFases[i].maxMonth) {
                faseIdx = i;
                break;
            }
        }

        const fase = panFases[faseIdx];
        const altura = Math.min(300, Math.floor(fase.height * factorCrecimiento));
        const progreso = Math.min(100, (mesesDisplay / 24) * 100);

        if (document.getElementById('val-pan-temp')) document.getElementById('val-pan-temp').textContent = temp + ' C';
        if (document.getElementById('val-pan-riego')) document.getElementById('val-pan-riego').textContent = riego;

        document.getElementById('pan-meses').textContent = Math.floor(mesesDisplay);
        document.getElementById('pan-meses-status').textContent = fase.title;
        document.getElementById('pan-meses-status').className = 'metric-status ' + (progreso >= 100 ? 'status-good' : 'status-warn');
        document.getElementById('pan-cosecha').textContent = cosechaDate.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' });
        document.getElementById('pan-cosecha-dias').textContent = mesesRestantes > 0 ? mesesRestantes + ' meses restantes' : '¡Listo para cosecha!';
        document.getElementById('pan-fase').textContent = fase.title;
        document.getElementById('pan-altura').textContent = altura + ' cm';
        document.getElementById('pan-stage-title').textContent = 'Fase ' + (faseIdx + 1) + ': ' + fase.title;
        document.getElementById('pan-stage-desc').textContent = fase.desc;
        document.getElementById('pan-stage-alert-text').textContent = fase.alert;

        if (panTimelineMarkers) {
            panTimelineMarkers.forEach(marker => {
                const markerMonth = parseInt(marker.getAttribute('data-month'));
                marker.classList.toggle('active', markerMonth <= mesesDisplay);
            });
        }
    }

    if (panFechaSiembra) panFechaSiembra.addEventListener('change', updatePanSimulator);
    if (panTemp) panTemp.addEventListener('input', updatePanSimulator);
    if (panRiego) panRiego.addEventListener('input', updatePanSimulator);
    if (panTimelineSlider) panTimelineSlider.addEventListener('input', updatePanSimulator);
    updatePanSimulator();

    // ---------------------------------------------------------
    // 10d. Simulador de Mangos Ingertos
    // ---------------------------------------------------------
    const mangoData = {
        haden: { name: 'Haden', months: [6, 7, 8], baseYield: { small: 80, medium: 150, large: 250 } },
        tommy: { name: 'Tommy Atkins', months: [7, 8, 9], baseYield: { small: 70, medium: 130, large: 220 } },
        keitt: { name: 'Keitt', months: [8, 9, 10], baseYield: { small: 90, medium: 160, large: 280 } },
        kent: { name: 'Kent', months: [7, 8, 9], baseYield: { small: 85, medium: 155, large: 260 } },
        hilacha: { name: 'Mango Hilacha', months: [7, 8, 9], baseYield: { small: 60, medium: 110, large: 180 } },
        mamon: { name: 'Mamon (Memiso)', months: [6, 7, 8, 9], baseYield: { small: 80, medium: 140, large: 200 } }
    };

    const mangoFases = [
        { name: 'Reposo', desc: 'El arbol en reposo. Acumula energia para la proxima floracion.', color: '#74c69d' },
        { name: 'Floracion', desc: 'Aparecen las panojas de flores. Polinizacion por abejas y viento.', color: '#f9c74f' },
        { name: 'Cuajado', desc: 'Los frutos jovenes se forman. Necesita agua y nutrientes.', color: '#f8961e' },
        { name: 'Crecimiento', desc: 'Los mangos crecen y engordan. Ellaboracion de azucares activa.', color: '#f3722c' },
        { name: 'Maduracion', desc: 'El fruto cambia de color. Acumula azucares y aroma. Casi listo.', color: '#e63946' },
        { name: 'Cosecha', desc: 'Momento ideal de recoleccion. Color uniforme, textura firme.', color: '#22c55e' }
    ];

    function updateMangoTree(treeNum) {
        const variedad = document.getElementById('mango' + treeNum + '-variedad');
        const ultimaCosecha = document.getElementById('mango' + treeNum + '-ultima-cosecha');
        const tamanoSlider = document.getElementById('mango' + treeNum + '-tamano');
        const countdown = document.getElementById('mango' + treeNum + '-countdown');
        const countdownLabel = document.getElementById('mango' + treeNum + '-countdown-label');
        const kgEl = document.getElementById('mango' + treeNum + '-kg');
        const faseEl = document.getElementById('mango' + treeNum + '-fase');
        const progressEl = document.getElementById('mango' + treeNum + '-progress');
        const tamanoLabel = document.getElementById('val-mango' + treeNum + '-tamano');

        if (!variedad || !ultimaCosecha) return;

        const varKey = variedad.value;
        const varData = mangoData[varKey];
        const hoy = new Date();
        const ultimaDate = new Date(ultimaCosecha.value);

        const tamanoNames = { 1: 'Pequeno', 2: 'Mediano', 3: 'Grande' };
        const tamanoKeys = { 1: 'small', 2: 'medium', 3: 'large' };
        const tamano = parseInt(tamanoSlider.value);
        if (tamanoLabel) tamanoLabel.textContent = tamanoNames[tamano];

        // Calculate next harvest date (always this year or next)
        let harvestMonth = varData.months[1]; // Middle of season
        let harvestYear = hoy.getFullYear();
        const nextHarvest = new Date(harvestYear, harvestMonth, 15);
        if (nextHarvest < hoy) {
            harvestYear++;
            nextHarvest.setFullYear(harvestYear);
        }

        // Calculate days remaining
        const diasRestantes = Math.max(0, Math.ceil((nextHarvest - hoy) / 86400000));
        const diasDesdeCosecha = Math.floor((hoy - ultimaDate) / 86400000);

        // Determine phase based on month
        const currentMonth = hoy.getMonth() + 1;
        let faseIdx = 0;
        if (varData.months.includes(currentMonth)) {
            faseIdx = 5; // Harvest
        } else if (varData.months[0] - 1 === currentMonth || varData.months[0] - 2 === currentMonth) {
            faseIdx = 4; // Maduracion
        } else if (varData.months[0] - 3 === currentMonth) {
            faseIdx = 3; // Crecimiento
        } else if (varData.months[0] - 4 === currentMonth) {
            faseIdx = 2; // Cuajado
        } else if (varData.months[0] - 5 === currentMonth || varData.months[0] - 6 === currentMonth) {
            faseIdx = 1; // Floracion
        } else {
            faseIdx = 0; // Reposo
        }

        const fase = mangoFases[faseIdx];
        const yieldKey = tamanoKeys[tamano];
        const kg = varData.baseYield[yieldKey];

        // Progress: how far along in the annual cycle
        const cycleStart = varData.months[0] - 6;
        const monthsInCycle = ((currentMonth - cycleStart + 12) % 12);
        const progress = Math.min(100, (monthsInCycle / 12) * 100);

        // Update UI
        if (diasRestantes > 0) {
            countdown.textContent = diasRestantes;
            countdownLabel.textContent = 'dias restantes';
        } else if (faseIdx === 5) {
            countdown.textContent = '!';
            countdownLabel.textContent = 'Cosecha lista!';
        } else {
            countdown.textContent = '~365';
            countdownLabel.textContent = 'dias para prox. cosecha';
        }

        kgEl.textContent = kg + ' kg';
        faseEl.textContent = fase.name;
        faseEl.style.color = fase.color;
        if (progressEl) progressEl.style.width = progress + '%';

        // Update total summary
        updateMangoTotal();
    }

    function updateMangoTotal() {
        let totalKg = 0;
        let nextTree = '';
        let nextDias = 999;

        // Original 3 mango trees
        for (let i = 1; i <= 3; i++) {
            const kgEl = document.getElementById('mango' + i + '-kg');
            const countdownEl = document.getElementById('mango' + i + '-countdown');
            if (kgEl) {
                const kg = parseInt(kgEl.textContent) || 0;
                totalKg += kg;
            }
            if (countdownEl) {
                const dias = parseInt(countdownEl.textContent) || 999;
                if (dias < nextDias) {
                    nextDias = dias;
                    nextTree = 'Mango ' + i;
                }
            }
        }

        // Mamon
        const mamonKg = document.getElementById('mamon-kg');
        const mamonCountdown = document.getElementById('mamon-countdown');
        if (mamonKg) totalKg += parseInt(mamonKg.textContent) || 0;
        if (mamonCountdown) {
            const dias = parseInt(mamonCountdown.textContent) || 999;
            if (dias < nextDias) {
                nextDias = dias;
                nextTree = 'Mamón';
            }
        }

        // Hilacha (5 trees)
        const hilachaTotal = document.getElementById('hilacha-total-kg');
        const hilachaCountdown = document.getElementById('hilacha-countdown');
        if (hilachaTotal) totalKg += parseInt(hilachaTotal.textContent) || 0;
        if (hilachaCountdown) {
            const dias = parseInt(hilachaCountdown.textContent) || 999;
            if (dias < nextDias) {
                nextDias = dias;
                nextTree = 'Hilacha x5';
            }
        }

        const totalEl = document.getElementById('mango-total-kg');
        const nextTreeEl = document.getElementById('mango-next-tree');
        const nextDiasEl = document.getElementById('mango-next-dias');
        const temporadaEl = document.getElementById('mango-temporada');

        if (totalEl) totalEl.textContent = totalKg + ' kg';
        if (nextTreeEl) nextTreeEl.textContent = nextTree;
        if (nextDiasEl) nextDiasEl.textContent = nextDias + ' dias';
        if (temporadaEl) {
            const mes = new Date().getMonth() + 1;
            if (mes >= 6 && mes <= 10) temporadaEl.textContent = 'En curso';
            else if (mes >= 11 || mes <= 2) temporadaEl.textContent = 'Reposo';
            else temporadaEl.textContent = 'Preparacion';
        }
    }

    // Init all 3 trees
    for (let i = 1; i <= 3; i++) {
        updateMangoTree(i);
    }

    // Auto-update countdown every hour
    setInterval(() => {
        for (let i = 1; i <= 3; i++) updateMangoTree(i);
        updateMamonTree();
        updateHilachaTree();
    }, 3600000);

    // ---------------------------------------------------------
    // 10e. Simulador de Mamón
    // ---------------------------------------------------------
    function updateMamonTree() {
        const ultimaCosecha = document.getElementById('mamon-ultima-cosecha');
        const countdown = document.getElementById('mamon-countdown');
        const countdownLabel = document.getElementById('mamon-countdown-label');
        const kgEl = document.getElementById('mamon-kg');
        const faseEl = document.getElementById('mamon-fase');
        const progressEl = document.getElementById('mamon-progress');

        if (!ultimaCosecha) return;

        const varData = mangoData.mamon;
        const hoy = new Date();
        const ultimaDate = new Date(ultimaCosecha.value);

        let harvestMonth = 7;
        let harvestYear = hoy.getFullYear();
        const nextHarvest = new Date(harvestYear, harvestMonth, 15);
        if (nextHarvest < hoy) {
            harvestYear++;
            nextHarvest.setFullYear(harvestYear);
        }

        const diasRestantes = Math.max(0, Math.ceil((nextHarvest - hoy) / 86400000));
        const currentMonth = hoy.getMonth() + 1;

        let faseIdx = 0;
        if (varData.months.includes(currentMonth)) {
            faseIdx = 5;
        } else if (currentMonth >= varData.months[0] - 2 && currentMonth < varData.months[0]) {
            faseIdx = 4;
        } else if (currentMonth >= varData.months[0] - 4 && currentMonth < varData.months[0] - 2) {
            faseIdx = 3;
        } else if (currentMonth >= varData.months[0] - 5 && currentMonth < varData.months[0] - 4) {
            faseIdx = 2;
        } else if (currentMonth >= varData.months[0] - 6 && currentMonth < varData.months[0] - 5) {
            faseIdx = 1;
        } else {
            faseIdx = 0;
        }

        const fase = mangoFases[faseIdx];
        const kg = varData.baseYield.large;

        if (diasRestantes > 0) {
            countdown.textContent = diasRestantes;
            countdownLabel.textContent = 'dias restantes';
        } else if (faseIdx === 5) {
            countdown.textContent = '!';
            countdownLabel.textContent = 'Cosecha lista!';
        } else {
            countdown.textContent = '~365';
            countdownLabel.textContent = 'dias para prox. cosecha';
        }

        kgEl.textContent = kg + ' kg';
        faseEl.textContent = fase.name;
        faseEl.style.color = fase.color;

        const cycleStart = varData.months[0] - 6;
        const monthsInCycle = ((currentMonth - cycleStart + 12) % 12);
        const progress = Math.min(100, (monthsInCycle / 12) * 100);
        if (progressEl) progressEl.style.width = progress + '%';

        updateMangoTotal();
    }

    // ---------------------------------------------------------
    // 10f. Simulador de Mango Hilacha (5 árboles)
    // ---------------------------------------------------------
    function updateHilachaTree() {
        const ultimaCosecha = document.getElementById('hilacha-ultima-cosecha');
        const tamanoSlider = document.getElementById('hilacha-tamano');
        const countdown = document.getElementById('hilacha-countdown');
        const countdownLabel = document.getElementById('hilacha-countdown-label');
        const kgEl = document.getElementById('hilacha-kg');
        const totalKgEl = document.getElementById('hilacha-total-kg');
        const faseEl = document.getElementById('hilacha-fase');
        const progressEl = document.getElementById('hilacha-progress');
        const tamanoLabel = document.getElementById('val-hilacha-tamano');

        if (!ultimaCosecha) return;

        const varData = mangoData.hilacha;
        const hoy = new Date();
        const ultimaDate = new Date(ultimaCosecha.value);

        const tamanoNames = { 1: 'Pequeño', 2: 'Mediano', 3: 'Grande' };
        const tamanoKeys = { 1: 'small', 2: 'medium', 3: 'large' };
        const tamano = parseInt(tamanoSlider.value);
        if (tamanoLabel) tamanoLabel.textContent = tamanoNames[tamano];

        let harvestMonth = varData.months[1];
        let harvestYear = hoy.getFullYear();
        const nextHarvest = new Date(harvestYear, harvestMonth, 15);
        if (nextHarvest < hoy) {
            harvestYear++;
            nextHarvest.setFullYear(harvestYear);
        }

        const diasRestantes = Math.max(0, Math.ceil((nextHarvest - hoy) / 86400000));
        const currentMonth = hoy.getMonth() + 1;

        let faseIdx = 0;
        if (varData.months.includes(currentMonth)) {
            faseIdx = 5;
        } else if (currentMonth >= varData.months[0] - 2 && currentMonth < varData.months[0]) {
            faseIdx = 4;
        } else if (currentMonth >= varData.months[0] - 4 && currentMonth < varData.months[0] - 2) {
            faseIdx = 3;
        } else if (currentMonth >= varData.months[0] - 5 && currentMonth < varData.months[0] - 4) {
            faseIdx = 2;
        } else if (currentMonth >= varData.months[0] - 6 && currentMonth < varData.months[0] - 5) {
            faseIdx = 1;
        } else {
            faseIdx = 0;
        }

        const fase = mangoFases[faseIdx];
        const kg = varData.baseYield[tamanoKeys[tamano]];
        const totalKg = kg * 5;

        if (diasRestantes > 0) {
            countdown.textContent = diasRestantes;
            countdownLabel.textContent = 'dias restantes';
        } else if (faseIdx === 5) {
            countdown.textContent = '!';
            countdownLabel.textContent = 'Cosecha lista!';
        } else {
            countdown.textContent = '~365';
            countdownLabel.textContent = 'dias para prox. cosecha';
        }

        kgEl.textContent = kg + ' kg';
        totalKgEl.textContent = totalKg + ' kg';
        faseEl.textContent = fase.name;
        faseEl.style.color = fase.color;

        const cycleStart = varData.months[0] - 6;
        const monthsInCycle = ((currentMonth - cycleStart + 12) % 12);
        const progress = Math.min(100, (monthsInCycle / 12) * 100);
        if (progressEl) progressEl.style.width = progress + '%';

        updateMangoTotal();
    }

    updateMamonTree();
    updateHilachaTree();

    function setTodayDates() {
        const publicDateInput = document.getElementById('log-date');
        const privateDateInput = document.getElementById('priv-date');
        
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        if (publicDateInput) publicDateInput.value = todayStr;
        if (privateDateInput) privateDateInput.value = todayStr;
    }

    // ---------------------------------------------------------
    // 11. Semillero (Seedbed / Nursery) - Plantule Management
    // ---------------------------------------------------------
    const SEMILLERO_KEY = 'yagua_semillero';
    const semilleroForm = document.getElementById('semillero-form');
    const semilleroGrid = document.getElementById('semillero-grid');
    const semilleroTimeline = document.getElementById('semillero-timeline');

    const seedStatusIcons = {
        'Semilla': 'circle-dot',
        'Brote': 'sprout',
        'Enraizado': 'root',
        'En crecimiento': 'leaf',
        'Maduro': 'flower'
    };

    const seedStatusColors = {
        'Semilla': 'var(--accent-brown)',
        'Brote': 'var(--accent-gold)',
        'Enraizado': 'var(--accent-blue)',
        'En crecimiento': 'var(--accent-green)',
        'Maduro': '#22c55e'
    };

    const defaultSeedlings = [
        {
            id: 'seed-1',
            name: 'Limoncillo',
            scientific: 'Cymbopogon citratus',
            location: 'Entrada de la casa',
            date: '2026-08-15',
            status: 'En crecimiento',
            notes: 'Planta aromatica utilizada para preparaciones culinarias y medicinales. Requiere riego regular y sol directo.'
        },
        {
            id: 'seed-2',
            name: 'Oregano orejon',
            scientific: 'Plectranthus amboinicus',
            location: 'Entrada de la casa',
            date: '2026-08-15',
            status: 'Brote',
            notes: 'Hierba aromatica de hoja grande, ideal para sazones y remedios naturales. Sensible a exceso de humedad.'
        },
        {
            id: 'seed-3',
            name: 'Oregano frances',
            scientific: 'Origanum vulgare',
            location: 'Entrada de la casa',
            date: '2026-08-22',
            status: 'Brote',
            notes: 'Hierba aromatica de sabor intenso, ideal para cocinar. Necesita buena luz y drenaje.'
        },
        {
            id: 'seed-4',
            name: 'Limoncillo',
            scientific: 'Cymbopogon citratus',
            location: 'Entrada de la casa',
            date: '2026-08-22',
            status: 'Brote',
            notes: 'Segunda mata de limoncillo. Aroma citrico, ideal para te y repelente natural de insectos.'
        },
        {
            id: 'seed-5',
            name: 'Malojillo',
            scientific: 'Cymbopogon citratus',
            location: 'Entrada de la casa',
            date: '2026-08-22',
            status: 'Brote',
            notes: 'Hierba aromatica similar al limoncillo, uso culinario y medicinal.'
        }
    ];

    function getSeedlings() {
        const stored = localStorage.getItem(SEMILLERO_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        localStorage.setItem(SEMILLERO_KEY, JSON.stringify(defaultSeedlings));
        return [...defaultSeedlings];
    }

    function generateSeedId() {
        return 'seed-' + Date.now();
    }

    function renderSeedlingCards() {
        if (!semilleroGrid) return;
        const seedlings = getSeedlings();
        semilleroGrid.innerHTML = '';

        if (seedlings.length === 0) {
            semilleroGrid.innerHTML = '<p class="panel-placeholder">No hay plantulas registradas. ¡Registra tu primera siembra!</p>';
            return;
        }

        seedlings.forEach(seed => {
            const card = document.createElement('div');
            card.className = 'semillero-card card';

            const dateParts = seed.date.split('-');
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : seed.date;

            const statusColor = seedStatusColors[seed.status] || 'var(--accent-green)';
            const statusIcon = seedStatusIcons[seed.status] || 'sprout';

            card.innerHTML = `
                <div class="semillero-card-header">
                    <div class="semillero-card-icon" style="color: ${statusColor};">
                        <i data-lucide="${statusIcon}"></i>
                    </div>
                    <span class="seed-status-badge" style="background: ${statusColor}20; color: ${statusColor}; border-color: ${statusColor}40;">${seed.status}</span>
                </div>
                <h4>${seed.name}</h4>
                <p class="seed-scientific-name">${seed.scientific || 'Sin nombre cientifico'}</p>
                <div class="seed-card-meta">
                    <span><i data-lucide="map-pin"></i> ${seed.location}</span>
                    <span><i data-lucide="calendar"></i> ${formattedDate}</span>
                </div>
                ${seed.notes ? `<p class="seed-notes-text">${seed.notes}</p>` : ''}
                <button class="btn btn-secondary btn-sm seed-delete-btn" data-id="${seed.id}" title="Eliminar plantula">
                    <i data-lucide="trash-2"></i>
                </button>
            `;
            semilleroGrid.appendChild(card);
        });

        semilleroGrid.querySelectorAll('.seed-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm('¿Eliminar esta plantula del semillero?')) {
                    const seeds = getSeedlings().filter(s => s.id !== id);
                    localStorage.setItem(SEMILLERO_KEY, JSON.stringify(seeds));
                    syncToWorker('semillero', seeds);
                    renderSeedlingCards();
                    renderSemilleroTimeline();
                }
            });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderSemilleroTimeline() {
        if (!semilleroTimeline) return;
        const seedlings = getSeedlings();

        seedlings.sort((a, b) => new Date(b.date) - new Date(a.date));
        semilleroTimeline.innerHTML = '';

        if (seedlings.length === 0) {
            semilleroTimeline.innerHTML = '<p class="panel-placeholder">No hay registros de siembra.</p>';
            return;
        }

        seedlings.forEach(seed => {
            const item = document.createElement('div');
            item.className = 'timeline-item';

            const dateParts = seed.date.split('-');
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : seed.date;

            item.innerHTML = `
                <div class="timeline-dot semillero-dot"></div>
                <div class="timeline-time">${formattedDate} • Siembra</div>
                <div class="timeline-content">
                    <h4>${seed.name} (${seed.scientific || 'N/A'})</h4>
                    <p>${seed.location} — Estado: ${seed.status}</p>
                </div>
            `;
            semilleroTimeline.appendChild(item);
        });
    }

    const seedNameInput = document.getElementById('seed-name');
    const seedScientificInput = document.getElementById('seed-scientific');
    const seedLocationInput = document.getElementById('seed-location');
    const seedDateInput = document.getElementById('seed-date');
    const seedStatusInput = document.getElementById('seed-status');
    const seedNotesInput = document.getElementById('seed-notes');

    function updateSeedPreview() {
        const name = document.getElementById('preview-name');
        const scientific = document.getElementById('preview-scientific');
        const location = document.getElementById('preview-location');
        const date = document.getElementById('preview-date');
        const status = document.getElementById('preview-status');
        const notes = document.getElementById('preview-notes');

        if (name) name.textContent = seedNameInput?.value || 'Nombre de la plantula';
        if (scientific) scientific.textContent = seedScientificInput?.value || 'Nombre cientifico';
        if (location) location.textContent = seedLocationInput?.value || 'Ubicacion';
        if (date && seedDateInput?.value) {
            const parts = seedDateInput.value.split('-');
            date.textContent = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : seedDateInput.value;
        }
        if (status && seedStatusInput?.value) {
            status.textContent = seedStatusInput.value;
            const color = seedStatusColors[seedStatusInput.value] || 'var(--accent-green)';
            status.style.background = `${color}20`;
            status.style.color = color;
            status.style.borderColor = `${color}40`;
        }
        if (notes) notes.textContent = seedNotesInput?.value || '';
    }

    if (seedNameInput) seedNameInput.addEventListener('input', updateSeedPreview);
    if (seedScientificInput) seedScientificInput.addEventListener('input', updateSeedPreview);
    if (seedLocationInput) seedLocationInput.addEventListener('input', updateSeedPreview);
    if (seedDateInput) seedDateInput.addEventListener('input', updateSeedPreview);
    if (seedStatusInput) seedStatusInput.addEventListener('change', updateSeedPreview);
    if (seedNotesInput) seedNotesInput.addEventListener('input', updateSeedPreview);

    if (semilleroForm) {
        semilleroForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newSeedling = {
                id: generateSeedId(),
                name: seedNameInput.value.trim(),
                scientific: seedScientificInput?.value.trim() || '',
                location: seedLocationInput.value.trim(),
                date: seedDateInput.value,
                status: seedStatusInput.value,
                notes: seedNotesInput?.value.trim() || ''
            };

            const seedlings = getSeedlings();
            seedlings.push(newSeedling);
            localStorage.setItem(SEMILLERO_KEY, JSON.stringify(seedlings));
            syncToWorker('semillero', seedlings);

            semilleroForm.reset();
            updateSeedDates();
            updateSeedPreview();
            renderSeedlingCards();
            renderSemilleroTimeline();
        });
    }

    function updateSeedDates() {
        const seedDate = document.getElementById('seed-date');
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;
        if (seedDate) seedDate.value = `${yyyy}-${mm}-${dd}`;
    }

    setTodayDates();
    renderLogs();
    updateAuthScreenLabels();
    updatePlatanoSimulation();
    renderSeedlingCards();
    renderSemilleroTimeline();
    updateSeedDates();
    initBlog();

    // ---------------------------------------------------------
    // 15. Venta Temprana - Pre-order Form
    // ---------------------------------------------------------
    const preorderForm = document.getElementById('preorder-form');
    if (preorderForm) {
        preorderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('preorder-name').value.trim();
            const phone = document.getElementById('preorder-phone').value.trim();
            const qty = document.getElementById('preorder-qty').value;
            const location = document.getElementById('preorder-location').value.trim();
            const source = document.getElementById('preorder-source').value;

            if (!name || !phone || !qty) {
                alert('Por favor completa nombre, teléfono y cantidad.');
                return;
            }

            const order = {
                name, phone, qty, location, source,
                date: new Date().toLocaleDateString('es-VE'),
                status: 'pendiente'
            };

            let orders = JSON.parse(localStorage.getItem('yagua_preorders') || '[]');
            orders.push(order);
            localStorage.setItem('yagua_preorders', JSON.stringify(orders));

            preorderForm.style.display = 'none';
            document.getElementById('preorder-success').style.display = 'block';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }
});

// ---------------------------------------------------------
// 14. Blog - Public Posts with Cloudinary Image Upload
// ---------------------------------------------------------
const BLOG_KEY = 'yagua_blog';
const CLOUDINARY_CLOUD = 'decqj4zhj';
const CLOUDINARY_UPLOAD_PRESET = 'blog_upload';

function initBlog() {
    const blogGrid = document.getElementById('blog-grid');
    const blogEmpty = document.getElementById('blog-empty');
    const blogForm = document.getElementById('blog-post-form');
    const blogDashboard = document.getElementById('blog-dashboard');
    const blogPublicView = document.getElementById('blog-public-view');
    const btnToggle = document.getElementById('btn-toggle-dashboard');
    const btnCloseDash = document.getElementById('btn-close-dashboard');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const imageInput = document.getElementById('blog-post-image');
    const imagePreview = document.getElementById('blog-image-preview');
    const blogModal = document.getElementById('blog-modal');
    const blogModalClose = document.getElementById('blog-modal-close');
    const blogModalBody = document.getElementById('blog-modal-body');
    const blogPostsAdmin = document.getElementById('blog-posts-admin');
    const filterBtns = document.querySelectorAll('.blog-filter-btn');

    let currentFilter = 'all';
    let editingId = null;
    let uploadedImageUrl = null;

    // Toggle Dashboard
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            blogPublicView.style.display = 'none';
            blogDashboard.style.display = 'block';
            btnToggle.style.display = 'none';
            renderAdminPosts();
        });
    }

    if (btnCloseDash) {
        btnCloseDash.addEventListener('click', () => {
            blogDashboard.style.display = 'none';
            blogPublicView.style.display = 'block';
            btnToggle.style.display = 'inline-flex';
            resetForm();
            renderPublicPosts();
        });
    }

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderPublicPosts();
        });
    });

    // Image preview & upload
    if (imageInput) {
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            imagePreview.innerHTML = '<span>Subiendo imagen...</span>';

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.secure_url) {
                    uploadedImageUrl = data.secure_url;
                    imagePreview.innerHTML = `<img src="${data.secure_url}" alt="Preview">`;
                } else {
                    throw new Error('Error en la subida');
                }
            } catch (err) {
                imagePreview.innerHTML = '<i data-lucide="image"></i><span>Error al subir. Intenta de nuevo.</span>';
                lucide.createIcons();
            }
        });
    }

    // Form submit
    if (blogForm) {
        blogForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('blog-post-title').value;
            const category = document.getElementById('blog-post-category').value;
            const content = document.getElementById('blog-post-content').value;

            const posts = getBlogPosts();

            if (editingId) {
                const idx = posts.findIndex(p => p.id === editingId);
                if (idx !== -1) {
                    posts[idx].title = title;
                    posts[idx].category = category;
                    posts[idx].content = content;
                    if (uploadedImageUrl) posts[idx].image = uploadedImageUrl;
                }
            } else {
                const newPost = {
                    id: Date.now().toString(),
                    title,
                    category,
                    content,
                    image: uploadedImageUrl || null,
                    date: new Date().toISOString(),
                    author: 'Finca Yagua'
                };
                posts.unshift(newPost);
            }

            localStorage.setItem(BLOG_KEY, JSON.stringify(posts));
            resetForm();
            renderAdminPosts();
        });
    }

    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', resetForm);
    }

    // Modal close
    if (blogModalClose) {
        blogModalClose.addEventListener('click', () => {
            blogModal.style.display = 'none';
        });
    }

    if (blogModal) {
        blogModal.addEventListener('click', (e) => {
            if (e.target === blogModal) blogModal.style.display = 'none';
        });
    }

    function getBlogPosts() {
        const stored = localStorage.getItem(BLOG_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function resetForm() {
        editingId = null;
        uploadedImageUrl = null;
        blogForm.reset();
        document.getElementById('blog-edit-id').value = '';
        document.getElementById('blog-form-title').innerHTML = '<i data-lucide="plus-circle"></i> Nuevo Post';
        document.getElementById('blog-submit-btn').innerHTML = '<i data-lucide="send"></i> Publicar';
        btnCancelEdit.style.display = 'none';
        imagePreview.innerHTML = '<i data-lucide="image"></i><span>Selecciona una imagen</span>';
        lucide.createIcons();
    }

    function renderPublicPosts() {
        if (!blogGrid) return;
        const posts = getBlogPosts();
        const filtered = currentFilter === 'all' ? posts : posts.filter(p => p.category === currentFilter);

        if (filtered.length === 0) {
            blogGrid.style.display = 'none';
            blogEmpty.style.display = 'block';
            return;
        }

        blogGrid.style.display = 'grid';
        blogEmpty.style.display = 'none';

        blogGrid.innerHTML = filtered.map(post => {
            const date = new Date(post.date);
            const dateStr = date.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
            const categoryClass = `cat-${post.category}`;
            const categoryLabel = post.category === 'siembra' ? 'Siembra' : post.category === 'cosecha' ? 'Cosecha' : 'Paca Digestora';
            const categoryIcon = post.category === 'siembra' ? 'sprout' : post.category === 'cosecha' ? 'apple' : 'recycle';
            const excerpt = post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');

            const imageHtml = post.image
                ? `<img src="${post.image}" alt="${post.title}" class="blog-card-image">`
                : `<div class="blog-card-image-placeholder"><i data-lucide="image"></i></div>`;

            return `
                <div class="blog-card" data-id="${post.id}">
                    ${imageHtml}
                    <div class="blog-card-body">
                        <span class="blog-card-category ${categoryClass}"><i data-lucide="${categoryIcon}"></i> ${categoryLabel}</span>
                        <h3 class="blog-card-title">${post.title}</h3>
                        <p class="blog-card-excerpt">${excerpt}</p>
                        <div class="blog-card-meta">
                            <span><i data-lucide="calendar"></i> ${dateStr}</span>
                            <span><i data-lucide="user"></i> ${post.author}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();

        // Click to open modal
        blogGrid.querySelectorAll('.blog-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const post = posts.find(p => p.id === id);
                if (post) openPostModal(post);
            });
        });
    }

    function openPostModal(post) {
        const date = new Date(post.date);
        const dateStr = date.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
        const categoryClass = `cat-${post.category}`;
        const categoryLabel = post.category === 'siembra' ? 'Siembra' : post.category === 'cosecha' ? 'Cosecha' : 'Paca Digestora';

        const imageHtml = post.image
            ? `<img src="${post.image}" alt="${post.title}" class="blog-modal-image">`
            : '';

        blogModalBody.innerHTML = `
            ${imageHtml}
            <div class="blog-modal-body">
                <span class="blog-modal-category blog-card-category ${categoryClass}">${categoryLabel}</span>
                <h2 class="blog-modal-title">${post.title}</h2>
                <div class="blog-modal-meta">
                    <span><i data-lucide="calendar"></i> ${dateStr}</span>
                    <span><i data-lucide="user"></i> ${post.author}</span>
                </div>
                <div class="blog-modal-content-text">${post.content}</div>
            </div>
        `;

        blogModal.style.display = 'flex';
        lucide.createIcons();
    }

    function renderAdminPosts() {
        if (!blogPostsAdmin) return;
        const posts = getBlogPosts();

        if (posts.length === 0) {
            blogPostsAdmin.innerHTML = '<p style="color: var(--text-muted);">No hay posts creados aun.</p>';
            return;
        }

        blogPostsAdmin.innerHTML = posts.map(post => {
            const date = new Date(post.date);
            const dateStr = date.toLocaleDateString('es-VE');
            const categoryLabel = post.category === 'siembra' ? 'Siembra' : post.category === 'cosecha' ? 'Cosecha' : 'Paca Digestora';

            const thumbHtml = post.image
                ? `<div class="blog-post-admin-thumb"><img src="${post.image}" alt=""></div>`
                : `<div class="blog-post-admin-thumb"><i data-lucide="image"></i></div>`;

            return `
                <div class="blog-post-admin-item">
                    ${thumbHtml}
                    <div class="blog-post-admin-info">
                        <h5>${post.title}</h5>
                        <span>${categoryLabel} - ${dateStr}</span>
                    </div>
                    <div class="blog-post-admin-actions">
                        <button class="btn btn-sm btn-secondary blog-edit-btn" data-id="${post.id}">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary blog-delete-btn" data-id="${post.id}" style="color: #ef4444;">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();

        // Edit buttons
        blogPostsAdmin.querySelectorAll('.blog-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const post = posts.find(p => p.id === id);
                if (post) {
                    editingId = id;
                    document.getElementById('blog-post-title').value = post.title;
                    document.getElementById('blog-post-category').value = post.category;
                    document.getElementById('blog-post-content').value = post.content;
                    document.getElementById('blog-form-title').innerHTML = '<i data-lucide="pencil"></i> Editar Post';
                    document.getElementById('blog-submit-btn').innerHTML = '<i data-lucide="save"></i> Actualizar';
                    btnCancelEdit.style.display = 'inline-flex';
                    if (post.image) {
                        uploadedImageUrl = post.image;
                        imagePreview.innerHTML = `<img src="${post.image}" alt="Preview">`;
                    }
                    lucide.createIcons();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        // Delete buttons
        blogPostsAdmin.querySelectorAll('.blog-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('¿Eliminar este post?')) {
                    const updated = posts.filter(p => p.id !== id);
                    localStorage.setItem(BLOG_KEY, JSON.stringify(updated));
                    renderAdminPosts();
                }
            });
        });
    }

    // Initial render
    renderPublicPosts();
}

// ---------------------------------------------------------
// 15. Bitacora Authentication (Master User + Authorization)
// ---------------------------------------------------------
const AUTH_MASTER_USER = 'neoeliecer';
const AUTH_MASTER_PIN = '1981';
const AUTH_USERS_KEY = 'yagua_authorized_users';
const AUTH_CURRENT_KEY = 'yagua_current_user';
const SESSION_KEY = 'yagua_session';
const SESSION_TIMEOUT = 30 * 60 * 1000;

function getAuthorizedUsers() {
    const stored = localStorage.getItem(AUTH_USERS_KEY);
    if (stored) return JSON.parse(stored);
    const defaults = [{ user: AUTH_MASTER_USER, pin: AUTH_MASTER_PIN, role: 'master', created: '2026-08-30' }];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaults));
    return defaults;
}

function isMaster(user) {
    return user === AUTH_MASTER_USER;
}

function isAuthorized(user, pin) {
    const users = getAuthorizedUsers();
    return users.find(u => u.user === user && u.pin === pin);
}

function initBitacoraAuth() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerSection = document.getElementById('register-section');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const bitacoraLogin = document.getElementById('bitacora-login');
    const bitacoraContent = document.getElementById('bitacora-content');
    const btnLogout = document.getElementById('btn-logout');
    const adminSection = document.getElementById('admin-users-section');

    getAuthorizedUsers();

    if (checkSession()) {
        showBitacora();
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('login-user').value.trim();
            const pin = document.getElementById('login-pin').value;
            const found = isAuthorized(user, pin);
            if (found) {
                localStorage.setItem(AUTH_CURRENT_KEY, user);
                createSession();
                showBitacora();
                loginError.style.display = 'none';
            } else {
                loginError.textContent = 'Usuario o PIN incorrectos, o usuario no autorizado';
                loginError.style.display = 'block';
                loginError.style.color = '#ef4444';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentUser = localStorage.getItem(AUTH_CURRENT_KEY);
            if (!isMaster(currentUser)) {
                registerError.textContent = 'Solo el administrador puede crear usuarios';
                registerError.style.display = 'block';
                return;
            }
            const newUser = document.getElementById('reg-user').value.trim();
            const newPin = document.getElementById('reg-pin').value;
            const pinConfirm = document.getElementById('reg-pin-confirm').value;
            if (newPin !== pinConfirm) {
                registerError.textContent = 'Los PINs no coinciden';
                registerError.style.display = 'block';
                return;
            }
            if (newPin.length < 4 || newPin.length > 6) {
                registerError.textContent = 'El PIN debe tener 4-6 digitos';
                registerError.style.display = 'block';
                return;
            }
            const users = getAuthorizedUsers();
            if (users.find(u => u.user === newUser)) {
                registerError.textContent = 'Este usuario ya existe';
                registerError.style.display = 'block';
                return;
            }
            users.push({ user: newUser, pin: newPin, role: 'user', created: new Date().toISOString().split('T')[0] });
            localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
            registerSection.style.display = 'none';
            registerError.style.display = 'none';
            loginError.textContent = 'Usuario ' + newUser + ' creado exitosamente.';
            loginError.style.display = 'block';
            loginError.style.color = '#22c55e';
            if (adminSection) renderAdminUsers();
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY + '_time');
            localStorage.removeItem(AUTH_CURRENT_KEY);
            showLogin();
        });
    }

    function checkSession() {
        const session = sessionStorage.getItem(SESSION_KEY);
        const sessionTime = sessionStorage.getItem(SESSION_KEY + '_time');
        if (!session || !sessionTime) return false;
        const elapsed = Date.now() - parseInt(sessionTime);
        if (elapsed > SESSION_TIMEOUT) {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY + '_time');
            return false;
        }
        sessionStorage.setItem(SESSION_KEY + '_time', Date.now().toString());
        return true;
    }

    function createSession() {
        sessionStorage.setItem(SESSION_KEY, 'active');
        sessionStorage.setItem(SESSION_KEY + '_time', Date.now().toString());
    }

    function showBitacora() {
        bitacoraLogin.style.display = 'none';
        bitacoraContent.style.display = 'block';
        const currentUser = localStorage.getItem(AUTH_CURRENT_KEY);
        if (adminSection) {
            adminSection.style.display = isMaster(currentUser) ? 'block' : 'none';
            if (isMaster(currentUser)) renderAdminUsers();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function showLogin() {
        bitacoraLogin.style.display = 'flex';
        bitacoraContent.style.display = 'none';
        document.getElementById('login-user').value = '';
        document.getElementById('login-pin').value = '';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    let inactivityTimer;
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (checkSession()) {
                sessionStorage.removeItem(SESSION_KEY);
                sessionStorage.removeItem(SESSION_KEY + '_time');
                showLogin();
            }
        }, SESSION_TIMEOUT);
    }

    ['mousemove', 'keypress', 'click', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            if (checkSession()) resetInactivityTimer();
        });
    });
}

function renderAdminUsers() {
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    const users = getAuthorizedUsers();
    container.innerHTML = '';
    users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'admin-user-item';
        div.style.cssText = 'display:flex;align-items:center;gap:1rem;padding:0.75rem;border-bottom:1px solid rgba(255,255,255,0.1);';
        div.innerHTML = '<span style="flex:1;font-weight:600;">' + u.user + '</span>' +
            '<span style="color:' + (u.role === 'master' ? 'var(--accent-gold)' : 'var(--accent-green)') + ';font-size:0.8rem;">' + (u.role === 'master' ? 'Admin' : 'Usuario') + '</span>' +
            '<span style="color:rgba(255,255,255,0.4);font-size:0.75rem;">' + u.created + '</span>' +
            (u.role !== 'master' ? '<button class="btn btn-sm" style="color:#ef4444;background:none;border:1px solid #ef4444;" onclick="removeUser(\'' + u.user + '\')">X</button>' : '<span style="width:40px;"></span>');
        container.appendChild(div);
    });
}

function removeUser(user) {
    if (user === AUTH_MASTER_USER) return;
    if (!confirm('Eliminar usuario ' + user + '?')) return;
    const users = getAuthorizedUsers().filter(u => u.user !== user);
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
    renderAdminUsers();
}

document.addEventListener('DOMContentLoaded', initBitacoraAuth);
