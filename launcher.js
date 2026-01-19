document.addEventListener('DOMContentLoaded', () => {
    // --- Clock & Countdown Logic ---
    const clockContainer = document.getElementById('clock-container');
    const clockTime = document.getElementById('clock-time');
    const clockLabel = document.getElementById('clock-label');

    let isCountdownMode = false;
    let exitHour = parseInt(localStorage.getItem('vicoExitHour')) || 14;
    let exitMinute = parseInt(localStorage.getItem('vicoExitMinute')) || 0;

    // --- Calendar & Vacation Countdown Logic ---
    const calWidget = document.getElementById('calendar-widget');
    const calMonth = document.getElementById('cal-month');
    const calDay = document.getElementById('cal-day');
    const calLabel = document.getElementById('cal-label');

    let isVacationMode = false;
    const VACATION_DATE = new Date(new Date().getFullYear(), 0, 23); // Jan 23 (Month is 0-indexed)

    function updateCalendar() {
        const now = new Date();

        if (!isVacationMode) {
            // Mode: Standard Calendar
            const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
            calMonth.textContent = months[now.getMonth()];
            calMonth.style.background = "#e01e5a"; // Standard Red header
            calDay.textContent = now.getDate();
            calLabel.textContent = "HOY";
        } else {
            // Mode: Vacation Countdown
            // Reset hours to start of day for accurate day diff
            const todayReset = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffTime = VACATION_DATE - todayReset;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                calMonth.textContent = "FALTAN";
                calMonth.style.background = "#2bac76"; // Green for hope
                calDay.textContent = diffDays;
                calLabel.textContent = "DÍAS PARA VACACIONES";
            } else if (diffDays === 0) {
                calMonth.textContent = "¡HOY!";
                calDay.textContent = "🎉";
                calLabel.textContent = "¡FELICES VACACIONES!";
            } else {
                calMonth.textContent = "PASÓ";
                calDay.textContent = Math.abs(diffDays);
                calLabel.textContent = "DÍAS DE VACACIONES";
            }
        }
    }

    calWidget.addEventListener('click', () => {
        isVacationMode = !isVacationMode;
        updateCalendar();
    });

    // Initial call
    updateCalendar();

    function updateClock() {
        const now = new Date();

        if (!isCountdownMode) {
            // Mode: Standard Clock
            clockTime.textContent = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            clockLabel.textContent = "Hora Actual";
            clockTime.style.color = "white";
        } else {
            // Mode: Countdown to custom Exit Time
            const exitTime = new Date();
            exitTime.setHours(exitHour, exitMinute, 0, 0);

            // If it's already past exit time, set target to tomorrow
            if (now > exitTime) {
                exitTime.setDate(exitTime.getDate() + 1);
            }

            const diff = exitTime - now;

            // Format H:MM:SS
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            clockTime.textContent = `-${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            // Show target time in label for clarity
            const formattedTarget = `${exitHour.toString().padStart(2, '0')}:${exitMinute.toString().padStart(2, '0')}`;
            clockLabel.textContent = `Salida a las ${formattedTarget}`;
            clockTime.style.color = "#ffeb3b"; // Warning/Excitement color
        }
    }

    let clickTimeout = null;

    // Toggle Mode on Click (Debounced)
    clockContainer.addEventListener('click', () => {
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            isCountdownMode = !isCountdownMode;
            updateClock();
            clickTimeout = null;
        }, 250); // Wait for potential double click
    });

    // Configure Time on Double Click
    clockContainer.addEventListener('dblclick', (e) => {
        // Cancel single click toggle
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        }
        e.stopPropagation();

        const input = prompt("Configurar hora de salida (formato HH:MM):", `${exitHour}:${exitMinute.toString().padStart(2, '0')}`);

        if (input && input.includes(':')) {
            const parts = input.split(':');
            const h = parseInt(parts[0]);
            const m = parseInt(parts[1]);

            if (!isNaN(h) && !isNaN(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
                exitHour = h;
                exitMinute = m;
                // Save to localStorage
                localStorage.setItem('vicoExitHour', exitHour);
                localStorage.setItem('vicoExitMinute', exitMinute);

                // Switch to countdown mode to show result
                isCountdownMode = true;
                updateClock();
                alert(`Hora de salida actualizada a las ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            } else {
                alert("Formato inválido. Use HH:MM (ej: 14:30)");
            }
        }
    });

    // Tick every second
    setInterval(updateClock, 1000);
    updateClock();

    // --- Dynamic Weather (Configurable) ---
    const weatherWidget = document.querySelector('.weather-widget');
    const weatherDesc = document.querySelector('.weather-widget .desc');
    const weatherTemp = document.querySelector('.weather-widget .temp');

    // Load saved weather or default
    const savedTemp = localStorage.getItem('vicoWeatherTemp');
    const savedDesc = localStorage.getItem('vicoWeatherDesc');

    if (savedTemp) weatherTemp.textContent = savedTemp;
    if (savedDesc) weatherDesc.textContent = savedDesc;

    weatherWidget.addEventListener('dblclick', () => {
        const newTemp = prompt("Ingrese la temperatura actual (ej: 24°C):", weatherTemp.textContent);
        if (newTemp) {
            const newDesc = prompt("Ingrese el estado del clima (ej: Soleado):", weatherDesc.textContent);
            if (newDesc) {
                weatherTemp.textContent = newTemp;
                weatherDesc.textContent = newDesc;

                localStorage.setItem('vicoWeatherTemp', newTemp);
                localStorage.setItem('vicoWeatherDesc', newDesc);
            }
        }
    });

    // --- META-GAME: Carrera Administrativa ---
    const userRankEl = document.getElementById('user-rank');
    const xpBarEl = document.getElementById('xp-bar');
    const xpValEl = document.getElementById('xp-val');
    const xpNextEl = document.getElementById('xp-next');

    const RANKS = [
        { name: "Pasante", cap: 500 },
        { name: "Monotributista", cap: 1500 },
        { name: "Contratado", cap: 3500 },
        { name: "Planta Permanente", cap: 7000 },
        { name: "Jefe de Área", cap: 12000 },
        { name: "Director", cap: 20000 },
        { name: "Ministro", cap: 999999 }
    ];

    function updateProfile() {
        // Get global XP (shared across games)
        let totalXP = parseInt(localStorage.getItem('vicoTotalXP')) || 0;

        // Determine Rank and Level
        // Level logic: level 1 is 0-100, level 2 100-300, etc? 
        // Let's mimic a simple linear-ish scaling for Levels: 100 * level
        // But Ranks are milestone based.

        let currentRank = RANKS[0];
        let nextRankXP = RANKS[0].cap;

        for (let r of RANKS) {
            if (totalXP >= r.cap) {
                // Continue searching for highest qualified rank
                // Actually need logic: if XP < r.cap, then THIS is the *next* rank, so previous was current.
            } else {
                // We found the ceiling. So current rank is the previous one.
                // Wait simpler:
            }
        }
        // Easy way: Filter ranks where cap <= XP is false.
        // Actually, let's keep it simple: 
        // Rank based purely on thresholds logic

        let rankIndex = 0;
        while (rankIndex < RANKS.length - 1 && totalXP >= RANKS[rankIndex].cap) {
            rankIndex++;
        }
        // Now RANKS[rankIndex] is the target/current rank?? No.
        // If XP is 600. Pasante cap 500. 
        // Loop 0: 600 >= 500? Yes. rankIndex -> 1 (Monotributista).
        // Loop 1: 600 >= 1500? No. Stop.
        // So User is "Monotributista". Correct.

        const rankObj = RANKS[rankIndex];

        // Calculate Level (just infinite scaling)
        // Level = floor(DOOM_XP_CURVE) ... simpler: Level = 1 + floor(XP / 200)
        const level = 1 + Math.floor(totalXP / 250);

        userRankEl.textContent = `${rankObj.name} - Nvl ${level}`;

        // Update XP Bar (Progress to next Rank or just next Level?)
        // Let's do Progress to Next Level for the bar, easier to visualize short term rewards
        const xpPerLevel = 250;
        const currentLevelXP = totalXP % xpPerLevel;
        const percentage = (currentLevelXP / xpPerLevel) * 100;

        xpBarEl.style.width = `${percentage}%`;
        xpValEl.textContent = currentLevelXP;
        xpNextEl.textContent = xpPerLevel;

        // Initial setup check
        if (!localStorage.getItem('vicoTotalXP')) localStorage.setItem('vicoTotalXP', 0);
    }

    // --- LAUNCHER 2.0 LOGIC ---
    function updateGameStats() {
        // CAMPAIGN GAMES (Progress Bars)
        const campaigns = [
            { id: 'spreadsheet', max: 5 },
            { id: 'systemcrash', max: 5 },
            { id: 'angryinterns', max: 3 }, // Currently 3 levels implemented
            { id: 'rrhh', max: 3 }, // Currently 3 rounds
            { id: 'doom', max: 5 },
            { id: 'tetris', max: 5 }, // Days
            { id: 'salary', max: 5 }, // Rivals
            { id: 'terminal', max: 5 },
            { id: 'java', max: 5 }, // Modules
            { id: 'math', max: 10 }, // Math Exams
            { id: 'english', max: 5 }, // QA Batches
            { id: 'git', max: 5 }, // Merges
            { id: 'sql', max: 5 }, // Reports
            { id: 'web', max: 5 }, // DOM Fixes
            { id: 'sudoku', max: 10 } // Batches
        ];

        campaigns.forEach(game => {
            const card = document.querySelector(`.system-card[data-game="${game.id}"]`);
            if (card) {
                // Read from LocalStorage (key: vico_level_[id])
                // Default to 1 (Level 1) if not found
                const currentLevel = parseInt(localStorage.getItem(`vico_level_${game.id}`)) || 1;

                // Calculate percentage (Level 1 should be 0% or start at 0? 
                // Let's say: (Current - 1) / (Max) * 100. 
                // If Level is 1, 0%. If Level 2, 25% (of 5).
                // If Completed (Level > Max), 100%.
                const progressVal = Math.min(Math.max(currentLevel - 1, 0), game.max); // 0 to Max
                const pct = Math.round((progressVal / game.max) * 100);

                const bar = card.querySelector('.card-progress-bar');
                const textLeft = card.querySelector('.card-progress-text span:first-child');
                const textRight = card.querySelector('.card-progress-text span:last-child');

                if (bar) bar.style.width = `${pct}%`;
                if (textRight) textRight.textContent = `${pct}%`;
                if (textLeft) {
                    if (currentLevel > game.max) textLeft.textContent = "COMPLETADO";
                    else textLeft.textContent = `Fase ${currentLevel}`;
                }
            }
        });

        // ARCADE GAMES (High Scores)
        const arcades = [
            'inbox', 'slack', 'shredder', 'printer', 'update',
            'expediente', 'tabs', 'mute', 'voodoo', 'vpn'
        ];

        arcades.forEach(id => {
            const card = document.querySelector(`.system-card[data-arcade="${id}"]`);
            if (card) {
                const scoreVal = parseInt(localStorage.getItem(`vico_score_${id}`)) || 0;
                const scoreEl = card.querySelector('.score-val');
                if (scoreEl) scoreEl.textContent = scoreVal.toLocaleString();
            }
        });
    }

    // Call update on load
    updateGameStats();
    // And listen for storage changes (in case they play in another tab)
    window.addEventListener('storage', updateGameStats);
});
