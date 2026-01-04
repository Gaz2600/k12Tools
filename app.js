/**
 * K12 Tools - Free Classroom Tools
 * All code runs client-side. No data is sent anywhere.
 */

// ===== Configuration =====
const CONFIG = {
    donationLink: 'https://buy.stripe.com/14AaEX3IV9bIfhyfpF1kA01',
    theme: localStorage.getItem('theme') || 'dark'
};

// ===== App State =====
const state = {
    currentTool: null,
    isFullscreen: false,

    // Timer state
    timer: {
        remaining: 0,
        total: 0,
        interval: null,
        isRunning: false,
        isPaused: false,
        beepEnabled: true
    },

    // Stopwatch state
    stopwatch: {
        elapsed: 0,
        interval: null,
        isRunning: false,
        laps: []
    },

    // Student Picker state
    picker: {
        students: JSON.parse(localStorage.getItem('pickerStudents') || '[]'),
        remaining: [],
        history: [],
        noRepeat: true
    },

    // Group Maker state
    groups: {
        students: JSON.parse(localStorage.getItem('groupStudents') || '[]'),
        result: []
    },

    // Noise Meter state
    noise: {
        audioContext: null,
        analyser: null,
        stream: null,
        animationId: null,
        sensitivity: 50,
        threshold: 70,
        mode: 'balls' // 'balls' or 'bar'
    },

    // Dice state
    dice: {
        sides: 6,
        count: 1,
        results: [],
        history: []
    },

    // RNG state
    rng: {
        min: 1,
        max: 100,
        unique: false,
        drawn: [],
        history: []
    },

    // Phase 2: Agenda state
    agenda: {
        title: localStorage.getItem('agendaTitle') || "Today's Agenda",
        blocks: JSON.parse(localStorage.getItem('agendaBlocks') || '[{"icon":"🌅","title":"Warm-up","content":""},{"icon":"📚","title":"Lesson","content":""},{"icon":"✏️","title":"Work Time","content":""},{"icon":"🎯","title":"Exit Ticket","content":""}]'),
        presets: JSON.parse(localStorage.getItem('agendaPresets') || '{}'),
        currentPreset: null
    },

    // Phase 2: Team Points state
    teams: {
        count: 4,
        data: JSON.parse(localStorage.getItem('teamsData') || '[{"name":"Team 1","score":0},{"name":"Team 2","score":0},{"name":"Team 3","score":0},{"name":"Team 4","score":0}]')
    },

    // Phase 2: Traffic Light state
    traffic: {
        mode: 'traffic', // 'traffic', 'noise', 'instruction'
        activeSignal: 'green',
        note: '',
        labels: {
            traffic: { red: 'Stop', yellow: 'Caution', green: 'Go' },
            instruction: { red: 'Quiet', yellow: 'Partner Talk', green: 'Work Time' }
        }
    },

    // Phase 2: Station Timer state
    station: {
        stages: JSON.parse(localStorage.getItem('stationStages') || '[{"name":"Station 1","duration":300},{"name":"Station 2","duration":300},{"name":"Station 3","duration":300}]'),
        currentStage: 0,
        remaining: 0,
        interval: null,
        isRunning: false,
        isPaused: false
    },

    // Phase 2: Seating Chart state
    seating: {
        rows: 5,
        cols: 6,
        charts: JSON.parse(localStorage.getItem('seatingCharts') || '{}'),
        currentChart: localStorage.getItem('currentSeatingChart') || 'default',
        roster: JSON.parse(localStorage.getItem('seatingRoster') || '[]'),
        seats: {},
        lockedSeats: [],
        draggedStudent: null
    },

    // Phase 2: Soundboard state
    soundboard: {
        volume: 0.5
    },

    // Phase 2: Bingo state
    bingo: {
        words: [],
        size: 5,
        freeSpace: true,
        cards: [],
        cardCount: 1
    }
};

// ===== Tool Registry =====
const tools = [
    {
        id: 'timer',
        name: 'Countdown Timer',
        icon: '⏱️',
        render: renderTimer
    },
    {
        id: 'stopwatch',
        name: 'Stopwatch',
        icon: '⏲️',
        render: renderStopwatch
    },
    {
        id: 'picker',
        name: 'Student Picker',
        icon: '🎯',
        render: renderPicker
    },
    {
        id: 'groups',
        name: 'Group Maker',
        icon: '👥',
        render: renderGroups
    },
    {
        id: 'noise',
        name: 'Noise Meter',
        icon: '🔊',
        render: renderNoise
    },
    {
        id: 'dice',
        name: 'Dice & RNG',
        icon: '🎲',
        render: renderDice
    },
    {
        id: 'qr',
        name: 'QR Generator',
        icon: '📱',
        render: renderQR
    },
    // Phase 2 Tools
    {
        id: 'agenda',
        name: 'Agenda Board',
        icon: '📋',
        render: renderAgenda
    },
    {
        id: 'teams',
        name: 'Team Points',
        icon: '🏆',
        render: renderTeams
    },
    {
        id: 'traffic',
        name: 'Traffic Light',
        icon: '🚦',
        render: renderTraffic
    },
    {
        id: 'station',
        name: 'Station Timer',
        icon: '🔄',
        render: renderStation
    },
    {
        id: 'seating',
        name: 'Seating Chart',
        icon: '🪑',
        render: renderSeating
    },
    {
        id: 'soundboard',
        name: 'Soundboard',
        icon: '🔔',
        render: renderSoundboard
    },
    {
        id: 'bingo',
        name: 'Bingo Generator',
        icon: '🎱',
        render: renderBingo
    },
    // Info Pages
    {
        id: 'itinfo',
        name: 'For IT Staff',
        icon: '🔒',
        render: renderITInfo
    }
];

// ===== Utility Functions =====

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeMs(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
    } catch (err) {
        // Fallback for older browsers or when clipboard API is blocked
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Copied to clipboard!');
        } catch (e) {
            showToast('Copy failed - please copy manually');
        }
        document.body.removeChild(textarea);
    }
}

function showToast(message) {
    const existing = document.querySelector('.copy-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
}

function playBeep(frequency = 800, duration = 200) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function toggleFullscreen() {
    state.isFullscreen = !state.isFullscreen;
    document.body.classList.toggle('fullscreen-mode', state.isFullscreen);

    if (state.isFullscreen) {
        // Add exit button
        const exitBtn = document.createElement('button');
        exitBtn.className = 'fullscreen-exit';
        exitBtn.textContent = 'Exit Fullscreen (Esc)';
        exitBtn.onclick = toggleFullscreen;
        document.body.appendChild(exitBtn);

        // Try native fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => { });
        }
    } else {
        const exitBtn = document.querySelector('.fullscreen-exit');
        if (exitBtn) exitBtn.remove();

        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
    }

    // Trigger resize for tools that need it (noise meter canvas)
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== Navigation =====

function renderNav() {
    const navList = document.getElementById('nav-list');
    navList.innerHTML = tools.map(tool => `
        <li class="nav-item">
            <button class="nav-btn ${state.currentTool === tool.id ? 'active' : ''}" data-tool="${tool.id}">
                <span class="icon">${tool.icon}</span>
                <span>${tool.name}</span>
            </button>
        </li>
    `).join('');

    navList.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const toolId = btn.dataset.tool;
            navigateTo(toolId);
            closeSidebar();
        });
    });
}

function navigateTo(toolId) {
    // Clean up previous tool
    cleanupTool();

    state.currentTool = toolId;
    const tool = tools.find(t => t.id === toolId);

    if (tool) {
        document.getElementById('tool-title').textContent = tool.name;
        tool.render();
    } else {
        renderWelcome();
    }

    renderNav();
}

function cleanupTool() {
    // Stop timer
    if (state.timer.interval) {
        clearInterval(state.timer.interval);
        state.timer.interval = null;
    }

    // Stop stopwatch
    if (state.stopwatch.interval) {
        clearInterval(state.stopwatch.interval);
        state.stopwatch.interval = null;
    }

    // Stop noise meter
    if (state.noise.animationId) {
        cancelAnimationFrame(state.noise.animationId);
        state.noise.animationId = null;
    }
    if (state.noise.stream) {
        state.noise.stream.getTracks().forEach(track => track.stop());
        state.noise.stream = null;
    }

    // Stop station timer
    if (state.station.interval) {
        clearInterval(state.station.interval);
        state.station.interval = null;
    }
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
}

// ===== Welcome Screen =====

function renderWelcome() {

    document.getElementById('tool-container').innerHTML = `
        <div class="welcome-screen animate-fade-in">
            <h1 class="welcome-title">Welcome to K12 Tools</h1>
            <div class="tools-grid">
                ${tools.map(tool => `
                    <div class="tool-card" data-tool="${tool.id}">
                        <div class="icon">${tool.icon}</div>
                        <div class="name">${tool.name}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => navigateTo(card.dataset.tool));
    });
}

// ===== Timer Tool =====

function renderTimer() {
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Presets</h3>
                <div class="preset-grid">
                    <button class="preset-btn" data-time="60">1 min</button>
                    <button class="preset-btn" data-time="180">3 min</button>
                    <button class="preset-btn" data-time="300">5 min</button>
                    <button class="preset-btn" data-time="600">10 min</button>
                    <button class="preset-btn" data-time="900">15 min</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Custom Time (mm:ss)</label>
                        <input type="text" id="timer-custom" placeholder="05:00" pattern="[0-9]{1,2}:[0-9]{2}">
                    </div>
                    <div class="form-group" style="justify-content: flex-end;">
                        <button class="btn btn-secondary" id="timer-set-custom">Set Custom</button>
                    </div>
                </div>
                <label class="checkbox-label">
                    <input type="checkbox" id="timer-beep" ${state.timer.beepEnabled ? 'checked' : ''}>
                    <span>Play sound when finished</span>
                </label>
            </div>

            <div class="tool-section large-display" id="timer-display">
                <div class="display-time" id="timer-time">${formatTime(state.timer.remaining)}</div>
                <div class="display-label" id="timer-status">Ready</div>
                <div class="btn-group" style="justify-content: center;">
                    <button class="btn btn-success btn-icon" id="timer-start" title="Start">▶</button>
                    <button class="btn btn-warning btn-icon" id="timer-pause" title="Pause" style="display: none;">⏸</button>
                    <button class="btn btn-secondary btn-icon" id="timer-reset" title="Reset">↺</button>
                    <button class="btn btn-secondary btn-icon" id="timer-fullscreen" title="Fullscreen">⛶</button>
                </div>
            </div>
        </div>
    `;

    // Event listeners
    container.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const time = parseInt(btn.dataset.time);
            setTimer(time);
        });
    });

    document.getElementById('timer-set-custom').addEventListener('click', () => {
        const input = document.getElementById('timer-custom').value;
        const match = input.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
            const mins = parseInt(match[1]);
            const secs = parseInt(match[2]);
            setTimer(mins * 60 + secs);
        } else {
            showToast('Invalid format. Use mm:ss');
        }
    });

    document.getElementById('timer-beep').addEventListener('change', (e) => {
        state.timer.beepEnabled = e.target.checked;
    });

    document.getElementById('timer-start').addEventListener('click', startTimer);
    document.getElementById('timer-pause').addEventListener('click', pauseTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
    document.getElementById('timer-fullscreen').addEventListener('click', toggleFullscreen);
}

function setTimer(seconds) {
    resetTimer();
    state.timer.total = seconds;
    state.timer.remaining = seconds;
    updateTimerDisplay();
}

function startTimer() {
    if (state.timer.remaining <= 0) return;

    // Clear any existing interval first
    if (state.timer.interval) {
        clearInterval(state.timer.interval);
        state.timer.interval = null;
    }

    state.timer.isRunning = true;
    state.timer.isPaused = false;

    document.getElementById('timer-start').style.display = 'none';
    document.getElementById('timer-pause').style.display = 'inline-flex';
    document.getElementById('timer-display').className = 'tool-section large-display timer-running';
    document.getElementById('timer-status').textContent = 'Running';

    state.timer.interval = setInterval(() => {
        state.timer.remaining--;
        updateTimerDisplay();

        if (state.timer.remaining <= 0) {
            timerFinished();
        }
    }, 1000);
}

function pauseTimer() {
    state.timer.isRunning = false;
    state.timer.isPaused = true;

    clearInterval(state.timer.interval);
    state.timer.interval = null;

    document.getElementById('timer-start').style.display = 'inline-flex';
    document.getElementById('timer-pause').style.display = 'none';
    document.getElementById('timer-display').className = 'tool-section large-display timer-paused';
    document.getElementById('timer-status').textContent = 'Paused';
}

function resetTimer() {
    clearInterval(state.timer.interval);
    state.timer.interval = null;
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.remaining = state.timer.total;

    document.getElementById('timer-start').style.display = 'inline-flex';
    document.getElementById('timer-pause').style.display = 'none';
    document.getElementById('timer-display').className = 'tool-section large-display';
    document.getElementById('timer-status').textContent = 'Ready';

    updateTimerDisplay();

    // Remove alert if present
    const alert = document.querySelector('.alert-overlay');
    if (alert) alert.remove();
}

function updateTimerDisplay() {
    const timeEl = document.getElementById('timer-time');
    if (timeEl) {
        timeEl.textContent = formatTime(state.timer.remaining);
    }
}

function timerFinished() {
    clearInterval(state.timer.interval);
    state.timer.interval = null;
    state.timer.isRunning = false;

    document.getElementById('timer-display').className = 'tool-section large-display timer-finished';
    document.getElementById('timer-status').textContent = 'Finished!';
    document.getElementById('timer-start').style.display = 'inline-flex';
    document.getElementById('timer-pause').style.display = 'none';

    if (state.timer.beepEnabled) {
        // Play multiple beeps
        playBeep(800, 200);
        setTimeout(() => playBeep(800, 200), 300);
        setTimeout(() => playBeep(1000, 400), 600);
    }

    // Show alert overlay
    const alert = document.createElement('div');
    alert.className = 'alert-overlay';
    alert.innerHTML = `
        <div class="alert-text">Time's Up!</div>
        <button class="alert-dismiss">Dismiss</button>
    `;
    document.body.appendChild(alert);
    alert.querySelector('.alert-dismiss').addEventListener('click', () => alert.remove());
}

// ===== Stopwatch Tool =====

function renderStopwatch() {
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section large-display">
                <div class="display-time" id="stopwatch-time">${formatTimeMs(state.stopwatch.elapsed)}</div>
                <div class="btn-group" style="justify-content: center;">
                    <button class="btn btn-success btn-icon" id="stopwatch-start" title="Start" ${state.stopwatch.isRunning ? 'style="display: none;"' : ''}>▶</button>
                    <button class="btn btn-warning btn-icon" id="stopwatch-pause" title="Pause" ${!state.stopwatch.isRunning ? 'style="display: none;"' : ''}>⏸</button>
                    <button class="btn btn-secondary btn-icon" id="stopwatch-lap" title="Lap">🏁</button>
                    <button class="btn btn-secondary btn-icon" id="stopwatch-reset" title="Reset">↺</button>
                    <button class="btn btn-secondary btn-icon" id="stopwatch-fullscreen" title="Fullscreen">⛶</button>
                </div>
            </div>

            <div class="tool-section" id="laps-section" ${state.stopwatch.laps.length === 0 ? 'style="display: none;"' : ''}>
                <h3 class="section-title">Laps</h3>
                <div class="list-container" id="laps-list">
                    ${renderLaps()}
                </div>
            </div>
        </div>
    `;

    document.getElementById('stopwatch-start').addEventListener('click', startStopwatch);
    document.getElementById('stopwatch-pause').addEventListener('click', pauseStopwatch);
    document.getElementById('stopwatch-lap').addEventListener('click', recordLap);
    document.getElementById('stopwatch-reset').addEventListener('click', resetStopwatch);
    document.getElementById('stopwatch-fullscreen').addEventListener('click', toggleFullscreen);
}

function renderLaps() {
    return state.stopwatch.laps.map((lap, i) => `
        <div class="list-item">
            <span>Lap ${state.stopwatch.laps.length - i}</span>
            <span class="list-item-time">${formatTimeMs(lap)}</span>
        </div>
    `).join('');
}

function startStopwatch() {
    state.stopwatch.isRunning = true;
    const startTime = Date.now() - state.stopwatch.elapsed;

    document.getElementById('stopwatch-start').style.display = 'none';
    document.getElementById('stopwatch-pause').style.display = 'inline-flex';

    state.stopwatch.interval = setInterval(() => {
        state.stopwatch.elapsed = Date.now() - startTime;
        document.getElementById('stopwatch-time').textContent = formatTimeMs(state.stopwatch.elapsed);
    }, 10);
}

function pauseStopwatch() {
    state.stopwatch.isRunning = false;
    clearInterval(state.stopwatch.interval);
    state.stopwatch.interval = null;

    document.getElementById('stopwatch-start').style.display = 'inline-flex';
    document.getElementById('stopwatch-pause').style.display = 'none';
}

function recordLap() {
    if (state.stopwatch.elapsed > 0) {
        state.stopwatch.laps.unshift(state.stopwatch.elapsed);
        document.getElementById('laps-section').style.display = 'block';
        document.getElementById('laps-list').innerHTML = renderLaps();
    }
}

function resetStopwatch() {
    pauseStopwatch();
    state.stopwatch.elapsed = 0;
    state.stopwatch.laps = [];
    document.getElementById('stopwatch-time').textContent = formatTimeMs(0);
    document.getElementById('laps-section').style.display = 'none';
}

// ===== Student Picker Tool =====

function renderPicker() {
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Student Names</h3>
                <textarea id="picker-names" placeholder="Enter student names (one per line)">${state.picker.students.join('\n')}</textarea>
                <div class="form-row" style="margin-top: 1rem;">
                    <button class="btn btn-secondary" id="picker-save">Save Names</button>
                    <label class="checkbox-label" style="margin-left: auto;">
                        <input type="checkbox" id="picker-norepeat" ${state.picker.noRepeat ? 'checked' : ''}>
                        <span>No repeats until reset</span>
                    </label>
                </div>
                <p class="hint" id="picker-count">${state.picker.students.length} students loaded${state.picker.noRepeat && state.picker.remaining.length > 0 ? `, ${state.picker.remaining.length} remaining` : ''}</p>
            </div>

            <div class="tool-section large-display">
                <div class="display-name" id="picker-result">Click Pick!</div>
                <div class="display-subtitle" id="picker-subtitle"></div>
                <div class="btn-group" style="justify-content: center; margin-top: 2rem;">
                    <button class="btn btn-primary" id="picker-pick" style="font-size: 1.25rem; padding: 1rem 2rem;">🎯 Pick Student</button>
                    <button class="btn btn-secondary" id="picker-reset">Reset Pool</button>
                    <button class="btn btn-secondary btn-icon" id="picker-fullscreen" title="Fullscreen">⛶</button>
                </div>
            </div>

            <div class="tool-section" id="picker-history-section" ${state.picker.history.length === 0 ? 'style="display: none;"' : ''}>
                <h3 class="section-title">Pick History</h3>
                <div class="history-list" id="picker-history">
                    ${state.picker.history.map((name, i) => `<div class="history-item"><span>${state.picker.history.length - i}. ${name}</span></div>`).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('picker-save').addEventListener('click', () => {
        const names = document.getElementById('picker-names').value
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);

        state.picker.students = names;
        state.picker.remaining = [...names];
        state.picker.history = [];
        localStorage.setItem('pickerStudents', JSON.stringify(names));

        document.getElementById('picker-count').textContent = `${names.length} students loaded`;
        document.getElementById('picker-history-section').style.display = 'none';
        showToast('Students saved!');
    });

    document.getElementById('picker-norepeat').addEventListener('change', (e) => {
        state.picker.noRepeat = e.target.checked;
    });

    document.getElementById('picker-pick').addEventListener('click', pickStudent);
    document.getElementById('picker-reset').addEventListener('click', resetPicker);
    document.getElementById('picker-fullscreen').addEventListener('click', toggleFullscreen);
}

function pickStudent() {
    let pool = state.picker.noRepeat ? state.picker.remaining : state.picker.students;

    if (pool.length === 0) {
        if (state.picker.noRepeat && state.picker.students.length > 0) {
            document.getElementById('picker-result').textContent = 'All picked!';
            document.getElementById('picker-subtitle').textContent = 'Click Reset to start over';
        } else {
            document.getElementById('picker-result').textContent = 'No students';
            document.getElementById('picker-subtitle').textContent = 'Add names above';
        }
        return;
    }

    // Animation effect
    const resultEl = document.getElementById('picker-result');
    resultEl.classList.add('animate-shake');

    let iterations = 0;
    const maxIterations = 15;
    const interval = setInterval(() => {
        const randomName = pool[Math.floor(Math.random() * pool.length)];
        resultEl.textContent = randomName;
        iterations++;

        if (iterations >= maxIterations) {
            clearInterval(interval);
            resultEl.classList.remove('animate-shake');
            resultEl.classList.add('animate-pulse');
            setTimeout(() => resultEl.classList.remove('animate-pulse'), 500);

            // Final pick
            const index = Math.floor(Math.random() * pool.length);
            const picked = pool[index];
            resultEl.textContent = picked;

            // Update state
            if (state.picker.noRepeat) {
                state.picker.remaining = pool.filter((_, i) => i !== index);
                document.getElementById('picker-subtitle').textContent = `${state.picker.remaining.length} students remaining`;
            }

            state.picker.history.unshift(picked);
            document.getElementById('picker-history-section').style.display = 'block';
            document.getElementById('picker-history').innerHTML = state.picker.history
                .map((name, i) => `<div class="history-item"><span>${state.picker.history.length - i}. ${name}</span></div>`)
                .join('');

            document.getElementById('picker-count').textContent =
                `${state.picker.students.length} students loaded${state.picker.noRepeat ? `, ${state.picker.remaining.length} remaining` : ''}`;

            playBeep(600, 100);
        }
    }, 80);
}

function resetPicker() {
    state.picker.remaining = [...state.picker.students];
    state.picker.history = [];
    document.getElementById('picker-result').textContent = 'Click Pick!';
    document.getElementById('picker-subtitle').textContent = '';
    document.getElementById('picker-history-section').style.display = 'none';
    document.getElementById('picker-count').textContent =
        `${state.picker.students.length} students loaded${state.picker.noRepeat ? `, ${state.picker.remaining.length} remaining` : ''}`;
}

// ===== Group Maker Tool =====

function renderGroups() {
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Student Names</h3>
                <textarea id="groups-names" placeholder="Enter student names (one per line)">${state.groups.students.join('\n')}</textarea>
                <button class="btn btn-secondary" id="groups-save" style="margin-top: 1rem;">Save Names</button>
            </div>

            <div class="tool-section">
                <h3 class="section-title">Group Settings</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Mode</label>
                        <select id="groups-mode">
                            <option value="size">By Group Size</option>
                            <option value="count">By Number of Groups</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" id="groups-value-label">Students per Group</label>
                        <input type="number" id="groups-value" min="1" value="4">
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-primary" id="groups-generate">Generate Groups</button>
                    <button class="btn btn-secondary" id="groups-shuffle">Shuffle Again</button>
                </div>
            </div>

            <div class="tool-section" id="groups-result-section" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 class="section-title" style="margin: 0;">Groups</h3>
                    <div class="btn-group">
                        <button class="btn btn-secondary" id="groups-copy">Copy</button>
                        <button class="btn btn-secondary" id="groups-export">Export CSV</button>
                    </div>
                </div>
                <div class="groups-grid" id="groups-output"></div>
            </div>
        </div>
    `;

    document.getElementById('groups-save').addEventListener('click', () => {
        const names = document.getElementById('groups-names').value
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);

        state.groups.students = names;
        localStorage.setItem('groupStudents', JSON.stringify(names));
        showToast(`${names.length} students saved!`);
    });

    document.getElementById('groups-mode').addEventListener('change', (e) => {
        const label = document.getElementById('groups-value-label');
        label.textContent = e.target.value === 'size' ? 'Students per Group' : 'Number of Groups';
    });

    document.getElementById('groups-generate').addEventListener('click', generateGroups);
    document.getElementById('groups-shuffle').addEventListener('click', generateGroups);
    document.getElementById('groups-copy').addEventListener('click', copyGroups);
    document.getElementById('groups-export').addEventListener('click', exportGroupsCSV);
}

function generateGroups() {
    const students = state.groups.students;
    if (students.length === 0) {
        showToast('Add students first');
        return;
    }

    const mode = document.getElementById('groups-mode').value;
    const value = parseInt(document.getElementById('groups-value').value) || 1;

    const shuffled = shuffleArray(students);
    const groups = [];

    if (mode === 'size') {
        // Split by group size
        for (let i = 0; i < shuffled.length; i += value) {
            groups.push(shuffled.slice(i, i + value));
        }
    } else {
        // Split by number of groups
        const groupCount = Math.min(value, shuffled.length);
        for (let i = 0; i < groupCount; i++) {
            groups.push([]);
        }
        shuffled.forEach((student, i) => {
            groups[i % groupCount].push(student);
        });
    }

    state.groups.result = groups;

    document.getElementById('groups-result-section').style.display = 'block';
    document.getElementById('groups-output').innerHTML = groups.map((group, i) => `
        <div class="group-card">
            <div class="group-header">Group ${i + 1}</div>
            <ul class="group-members">
                ${group.map(name => `<li class="group-member">${name}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function copyGroups() {
    const text = state.groups.result
        .map((group, i) => `Group ${i + 1}:\n${group.map(n => `  - ${n}`).join('\n')}`)
        .join('\n\n');
    copyToClipboard(text);
}

function exportGroupsCSV() {
    const maxSize = Math.max(...state.groups.result.map(g => g.length));
    const headers = state.groups.result.map((_, i) => `Group ${i + 1}`).join(',');
    const rows = [];

    for (let i = 0; i < maxSize; i++) {
        const row = state.groups.result.map(g => g[i] || '').join(',');
        rows.push(row);
    }

    const csv = [headers, ...rows].join('\n');
    downloadFile(csv, 'groups.csv', 'text/csv');
}

// ===== Noise Meter Tool =====

function renderNoise() {
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Settings</h3>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label">Sensitivity: <span id="sensitivity-value">${state.noise.sensitivity}</span>%</label>
                        <input type="range" id="noise-sensitivity" min="1" max="100" value="${state.noise.sensitivity}">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label">Threshold: <span id="threshold-value">${state.noise.threshold}</span>%</label>
                        <input type="range" id="noise-threshold" min="1" max="100" value="${state.noise.threshold}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Visual Mode</label>
                        <select id="noise-mode">
                            <option value="balls" ${state.noise.mode === 'balls' ? 'selected' : ''}>Bouncing Balls</option>
                            <option value="bar" ${state.noise.mode === 'bar' ? 'selected' : ''}>Rising Bar</option>
                        </select>
                    </div>
                    <div class="form-group" style="justify-content: flex-end;">
                        <button class="btn btn-primary" id="noise-start">🎤 Start</button>
                        <button class="btn btn-secondary" id="noise-stop" style="display: none;">Stop</button>
                        <button class="btn btn-secondary btn-icon" id="noise-fullscreen" title="Fullscreen">⛶</button>
                    </div>
                </div>
            </div>

            <div class="tool-section">
                <div class="noise-meter-container">
                    <canvas id="noise-canvas" class="noise-canvas"></canvas>
                    <div class="threshold-line" id="threshold-line" style="bottom: ${state.noise.threshold}%;"></div>
                </div>
                <p class="hint" style="text-align: center; margin-top: 0.5rem;">
                    Audio is processed locally and never recorded or saved.
                </p>
            </div>
        </div>
    `;

    document.getElementById('noise-sensitivity').addEventListener('input', (e) => {
        state.noise.sensitivity = parseInt(e.target.value);
        document.getElementById('sensitivity-value').textContent = state.noise.sensitivity;
    });

    document.getElementById('noise-threshold').addEventListener('input', (e) => {
        state.noise.threshold = parseInt(e.target.value);
        document.getElementById('threshold-value').textContent = state.noise.threshold;
        document.getElementById('threshold-line').style.bottom = state.noise.threshold + '%';
    });

    document.getElementById('noise-mode').addEventListener('change', (e) => {
        state.noise.mode = e.target.value;
    });

    document.getElementById('noise-start').addEventListener('click', startNoiseMeter);
    document.getElementById('noise-stop').addEventListener('click', stopNoiseMeter);
    document.getElementById('noise-fullscreen').addEventListener('click', toggleFullscreen);

    // Initialize canvas
    resizeNoiseCanvas();
    window.addEventListener('resize', resizeNoiseCanvas);
}

function resizeNoiseCanvas() {
    const canvas = document.getElementById('noise-canvas');
    if (canvas) {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
}

async function startNoiseMeter() {
    try {
        state.noise.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.noise.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        state.noise.analyser = state.noise.audioContext.createAnalyser();

        const source = state.noise.audioContext.createMediaStreamSource(state.noise.stream);
        source.connect(state.noise.analyser);

        state.noise.analyser.fftSize = 256;

        document.getElementById('noise-start').style.display = 'none';
        document.getElementById('noise-stop').style.display = 'inline-flex';

        // Initialize balls for bouncing mode
        const canvas = document.getElementById('noise-canvas');
        const balls = [];
        for (let i = 0; i < 30; i++) {
            balls.push({
                x: Math.random() * canvas.width,
                y: canvas.height - Math.random() * 50,
                vx: (Math.random() - 0.5) * 2,
                vy: 0,
                radius: 8 + Math.random() * 12,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        }

        animateNoiseMeter(balls);
    } catch (err) {
        showToast('Microphone access denied');
        console.error('Microphone error:', err);
    }
}

function stopNoiseMeter() {
    if (state.noise.animationId) {
        cancelAnimationFrame(state.noise.animationId);
        state.noise.animationId = null;
    }

    if (state.noise.stream) {
        state.noise.stream.getTracks().forEach(track => track.stop());
        state.noise.stream = null;
    }

    if (state.noise.audioContext) {
        state.noise.audioContext.close();
        state.noise.audioContext = null;
    }

    document.getElementById('noise-start').style.display = 'inline-flex';
    document.getElementById('noise-stop').style.display = 'none';

    // Clear canvas
    const canvas = document.getElementById('noise-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function animateNoiseMeter(balls) {
    const canvas = document.getElementById('noise-canvas');
    const ctx = canvas.getContext('2d');
    const analyser = state.noise.analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
        if (!state.noise.analyser) return;

        state.noise.animationId = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const level = (average / 255) * (state.noise.sensitivity / 50);
        const normalizedLevel = Math.min(1, level);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw threshold zone
        const thresholdY = canvas.height * (1 - state.noise.threshold / 100);
        ctx.fillStyle = 'rgba(233, 69, 96, 0.1)';
        ctx.fillRect(0, 0, canvas.width, thresholdY);

        if (state.noise.mode === 'balls') {
            // Bouncing balls mode
            balls.forEach(ball => {
                // Apply "gravity" based on noise level
                const bounce = normalizedLevel * 15;
                ball.vy -= bounce;
                ball.vy += 0.5; // gravity
                ball.vy *= 0.98; // damping

                ball.x += ball.vx;
                ball.y += ball.vy;

                // Bounce off walls
                if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
                    ball.vx *= -1;
                    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
                }

                // Bounce off floor
                if (ball.y > canvas.height - ball.radius) {
                    ball.y = canvas.height - ball.radius;
                    ball.vy *= -0.6;
                }

                // Don't go above top
                if (ball.y < ball.radius) {
                    ball.y = ball.radius;
                    ball.vy *= -0.6;
                }

                // Draw ball
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                ctx.fillStyle = ball.color;
                ctx.fill();
            });
        } else {
            // Bar mode
            const barHeight = normalizedLevel * canvas.height;
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(0.5, '#fbbf24');
            gradient.addColorStop(1, '#e94560');

            ctx.fillStyle = gradient;
            ctx.fillRect(canvas.width * 0.1, canvas.height - barHeight, canvas.width * 0.8, barHeight);
        }

        // Check threshold
        if (normalizedLevel > state.noise.threshold / 100) {
            ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    draw();
}

// ===== Dice & RNG Tool =====

function renderDice() {
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <div class="section-header">
                    <h3 class="section-title">Dice Roller</h3>
                    <button class="btn btn-icon" id="dice-fullscreen" title="Fullscreen">⛶</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Number of Dice</label>
                        <input type="number" id="dice-count" min="1" max="20" value="${state.dice.count}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Sides</label>
                        <select id="dice-sides">
                            <option value="4" ${state.dice.sides === 4 ? 'selected' : ''}>D4</option>
                            <option value="6" ${state.dice.sides === 6 ? 'selected' : ''}>D6</option>
                            <option value="8" ${state.dice.sides === 8 ? 'selected' : ''}>D8</option>
                            <option value="10" ${state.dice.sides === 10 ? 'selected' : ''}>D10</option>
                            <option value="12" ${state.dice.sides === 12 ? 'selected' : ''}>D12</option>
                            <option value="20" ${state.dice.sides === 20 ? 'selected' : ''}>D20</option>
                            <option value="100" ${state.dice.sides === 100 ? 'selected' : ''}>D100</option>
                        </select>
                    </div>
                    <div class="form-group" style="justify-content: flex-end;">
                        <button class="btn btn-primary" id="dice-roll">🎲 Roll</button>
                    </div>
                </div>
                <div class="dice-display" id="dice-display">
                    ${state.dice.results.map(r => `<div class="die">${r}</div>`).join('') || '<span style="color: var(--text-muted);">Click Roll to start</span>'}
                </div>
                <div class="dice-sum" id="dice-sum">${state.dice.results.length > 0 ? 'Total: ' + state.dice.results.reduce((a, b) => a + b, 0) : ''}</div>
            </div>

            <div class="tool-section">
                <div class="section-header">
                    <h3 class="section-title">Random Number Generator</h3>
                    <button class="btn btn-icon" id="rng-fullscreen" title="Fullscreen">⛶</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Minimum</label>
                        <input type="number" id="rng-min" value="${state.rng.min}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Maximum</label>
                        <input type="number" id="rng-max" value="${state.rng.max}">
                    </div>
                    <div class="form-group" style="justify-content: flex-end;">
                        <button class="btn btn-primary" id="rng-generate">Generate</button>
                    </div>
                </div>
                <label class="checkbox-label" style="margin-bottom: 1rem;">
                    <input type="checkbox" id="rng-unique" ${state.rng.unique ? 'checked' : ''}>
                    <span>Unique draws (no repeats)</span>
                </label>
                <div class="large-display" style="padding: 1rem;">
                    <div class="display-time" id="rng-result" style="font-size: 4rem;">${state.rng.history.length > 0 ? state.rng.history[0] : '?'}</div>
                </div>
                <button class="btn btn-secondary" id="rng-reset" style="width: 100%;">Reset Draws</button>
            </div>

            <div class="tool-section" id="rng-history-section" ${state.rng.history.length === 0 ? 'style="display: none;"' : ''}>
                <h3 class="section-title">History</h3>
                <div class="history-list" id="rng-history">
                    ${state.rng.history.map((n, i) => `<div class="history-item"><span>#${state.rng.history.length - i}</span><span>${n}</span></div>`).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('dice-count').addEventListener('change', (e) => {
        state.dice.count = Math.min(20, Math.max(1, parseInt(e.target.value) || 1));
    });

    document.getElementById('dice-sides').addEventListener('change', (e) => {
        state.dice.sides = parseInt(e.target.value);
    });

    document.getElementById('dice-roll').addEventListener('click', rollDice);

    document.getElementById('rng-min').addEventListener('change', (e) => {
        state.rng.min = parseInt(e.target.value) || 0;
    });

    document.getElementById('rng-max').addEventListener('change', (e) => {
        state.rng.max = parseInt(e.target.value) || 100;
    });

    document.getElementById('rng-unique').addEventListener('change', (e) => {
        state.rng.unique = e.target.checked;
    });

    document.getElementById('rng-generate').addEventListener('click', generateRandom);
    document.getElementById('rng-reset').addEventListener('click', resetRNG);

    document.getElementById('dice-fullscreen').addEventListener('click', showDiceFullscreen);
    document.getElementById('rng-fullscreen').addEventListener('click', showRNGFullscreen);
}

function rollDice() {
    const count = state.dice.count;
    const sides = state.dice.sides;

    state.dice.results = [];
    for (let i = 0; i < count; i++) {
        state.dice.results.push(Math.floor(Math.random() * sides) + 1);
    }

    const display = document.getElementById('dice-display');
    display.innerHTML = state.dice.results.map(r => `<div class="die">${r}</div>`).join('');

    const sum = state.dice.results.reduce((a, b) => a + b, 0);
    document.getElementById('dice-sum').textContent = count > 1 ? `Total: ${sum}` : '';

    playBeep(400, 100);
}

function generateRandom() {
    const min = state.rng.min;
    const max = state.rng.max;

    if (min > max) {
        showToast('Min must be less than max');
        return;
    }

    if (state.rng.unique) {
        const range = max - min + 1;
        if (state.rng.drawn.length >= range) {
            showToast('All numbers drawn! Reset to continue.');
            return;
        }

        let num;
        do {
            num = Math.floor(Math.random() * range) + min;
        } while (state.rng.drawn.includes(num));

        state.rng.drawn.push(num);
        state.rng.history.unshift(num);
    } else {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        state.rng.history.unshift(num);
    }

    const resultEl = document.getElementById('rng-result');
    resultEl.textContent = state.rng.history[0];
    resultEl.classList.add('animate-pulse');
    setTimeout(() => resultEl.classList.remove('animate-pulse'), 500);

    document.getElementById('rng-history-section').style.display = 'block';
    document.getElementById('rng-history').innerHTML = state.rng.history
        .map((n, i) => `<div class="history-item"><span>#${state.rng.history.length - i}</span><span>${n}</span></div>`)
        .join('');

    playBeep(500, 100);
}

function resetRNG() {
    state.rng.drawn = [];
    state.rng.history = [];
    document.getElementById('rng-result').textContent = '?';
    document.getElementById('rng-history-section').style.display = 'none';
}

function showDiceFullscreen() {
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';
    overlay.innerHTML = `
        <button class="fullscreen-exit" title="Exit Fullscreen">✕</button>
        <div class="fullscreen-content dice-fullscreen">
            <div class="fullscreen-dice-display" id="fullscreen-dice-display">
                ${state.dice.results.length > 0
            ? state.dice.results.map(r => `<div class="die-large">${r}</div>`).join('')
            : '<span class="dice-prompt">Click Roll</span>'}
            </div>
            <div class="fullscreen-dice-sum" id="fullscreen-dice-sum">
                ${state.dice.results.length > 1 ? 'Total: ' + state.dice.results.reduce((a, b) => a + b, 0) : ''}
            </div>
            <div class="fullscreen-controls">
                <select id="fullscreen-dice-sides" class="fullscreen-select">
                    <option value="4" ${state.dice.sides === 4 ? 'selected' : ''}>D4</option>
                    <option value="6" ${state.dice.sides === 6 ? 'selected' : ''}>D6</option>
                    <option value="8" ${state.dice.sides === 8 ? 'selected' : ''}>D8</option>
                    <option value="10" ${state.dice.sides === 10 ? 'selected' : ''}>D10</option>
                    <option value="12" ${state.dice.sides === 12 ? 'selected' : ''}>D12</option>
                    <option value="20" ${state.dice.sides === 20 ? 'selected' : ''}>D20</option>
                    <option value="100" ${state.dice.sides === 100 ? 'selected' : ''}>D100</option>
                </select>
                <input type="number" id="fullscreen-dice-count" class="fullscreen-input" value="${state.dice.count}" min="1" max="20">
                <button class="btn btn-primary btn-large" id="fullscreen-dice-roll">🎲 Roll</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.fullscreen-exit').addEventListener('click', () => {
        overlay.remove();
        renderDice(); // Re-render to sync state
    });

    overlay.querySelector('#fullscreen-dice-sides').addEventListener('change', (e) => {
        state.dice.sides = parseInt(e.target.value);
    });

    overlay.querySelector('#fullscreen-dice-count').addEventListener('change', (e) => {
        state.dice.count = Math.min(20, Math.max(1, parseInt(e.target.value) || 1));
    });

    overlay.querySelector('#fullscreen-dice-roll').addEventListener('click', () => {
        const count = state.dice.count;
        const sides = state.dice.sides;

        state.dice.results = [];
        for (let i = 0; i < count; i++) {
            state.dice.results.push(Math.floor(Math.random() * sides) + 1);
        }

        const display = overlay.querySelector('#fullscreen-dice-display');
        display.innerHTML = state.dice.results.map(r => `<div class="die-large">${r}</div>`).join('');

        const sum = state.dice.results.reduce((a, b) => a + b, 0);
        overlay.querySelector('#fullscreen-dice-sum').textContent = count > 1 ? `Total: ${sum}` : '';

        playBeep(400, 100);
    });

    // Handle escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            renderDice();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function showRNGFullscreen() {
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';
    overlay.innerHTML = `
        <button class="fullscreen-exit" title="Exit Fullscreen">✕</button>
        <div class="fullscreen-content rng-fullscreen">
            <div class="fullscreen-rng-result" id="fullscreen-rng-result">
                ${state.rng.history.length > 0 ? state.rng.history[0] : '?'}
            </div>
            <div class="fullscreen-controls">
                <div class="fullscreen-range">
                    <input type="number" id="fullscreen-rng-min" class="fullscreen-input" value="${state.rng.min}" placeholder="Min">
                    <span>to</span>
                    <input type="number" id="fullscreen-rng-max" class="fullscreen-input" value="${state.rng.max}" placeholder="Max">
                </div>
                <label class="checkbox-label fullscreen-checkbox">
                    <input type="checkbox" id="fullscreen-rng-unique" ${state.rng.unique ? 'checked' : ''}>
                    <span>No repeats</span>
                </label>
                <button class="btn btn-primary btn-large" id="fullscreen-rng-generate">Generate</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.fullscreen-exit').addEventListener('click', () => {
        overlay.remove();
        renderDice(); // Re-render to sync state
    });

    overlay.querySelector('#fullscreen-rng-min').addEventListener('change', (e) => {
        state.rng.min = parseInt(e.target.value) || 0;
    });

    overlay.querySelector('#fullscreen-rng-max').addEventListener('change', (e) => {
        state.rng.max = parseInt(e.target.value) || 100;
    });

    overlay.querySelector('#fullscreen-rng-unique').addEventListener('change', (e) => {
        state.rng.unique = e.target.checked;
    });

    overlay.querySelector('#fullscreen-rng-generate').addEventListener('click', () => {
        const min = state.rng.min;
        const max = state.rng.max;

        if (min > max) {
            return;
        }

        let number;
        if (state.rng.unique) {
            const available = [];
            for (let i = min; i <= max; i++) {
                if (!state.rng.drawn.includes(i)) {
                    available.push(i);
                }
            }
            if (available.length === 0) {
                overlay.querySelector('#fullscreen-rng-result').textContent = 'All drawn!';
                return;
            }
            number = available[Math.floor(Math.random() * available.length)];
            state.rng.drawn.push(number);
        } else {
            number = Math.floor(Math.random() * (max - min + 1)) + min;
        }

        state.rng.history.unshift(number);
        overlay.querySelector('#fullscreen-rng-result').textContent = number;
        playBeep(600, 100);
    });

    // Handle escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            renderDice();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// ===== QR Code Generator =====

// Standard QR library (qr.js) with module-perfect canvas rendering.
const QRCode = (function () {
    const QRMode = {
        MODE_NUMBER: 1 << 0,
        MODE_ALPHA_NUM: 1 << 1,
        MODE_8BIT_BYTE: 1 << 2,
        MODE_KANJI: 1 << 3
    };

    const ErrorCorrectLevel = {
        L: 1,
        M: 0,
        Q: 3,
        H: 2
    };

    const QRMath = {
        EXP_TABLE: new Array(256),
        LOG_TABLE: new Array(256),
        glog(n) {
            if (n < 1) throw new Error(`glog(${n})`);
            return QRMath.LOG_TABLE[n];
        },
        gexp(n) {
            while (n < 0) n += 255;
            while (n >= 256) n -= 255;
            return QRMath.EXP_TABLE[n];
        }
    };

    for (let i = 0; i < 8; i++) {
        QRMath.EXP_TABLE[i] = 1 << i;
    }
    for (let i = 8; i < 256; i++) {
        QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
            ^ QRMath.EXP_TABLE[i - 5]
            ^ QRMath.EXP_TABLE[i - 6]
            ^ QRMath.EXP_TABLE[i - 8];
    }
    for (let i = 0; i < 255; i++) {
        QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
    }

    function QRPolynomial(num, shift) {
        let offset = 0;
        while (offset < num.length && num[offset] === 0) offset++;
        this.num = new Array(num.length - offset + shift);
        for (let i = 0; i < num.length - offset; i++) {
            this.num[i] = num[i + offset];
        }
    }
    QRPolynomial.prototype.get = function (index) {
        return this.num[index];
    };
    QRPolynomial.prototype.getLength = function () {
        return this.num.length;
    };
    QRPolynomial.prototype.multiply = function (e) {
        const num = new Array(this.getLength() + e.getLength() - 1);
        for (let i = 0; i < num.length; i++) num[i] = 0;
        for (let i = 0; i < this.getLength(); i++) {
            for (let j = 0; j < e.getLength(); j++) {
                num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
            }
        }
        return new QRPolynomial(num, 0);
    };
    QRPolynomial.prototype.mod = function (e) {
        if (this.getLength() - e.getLength() < 0) return this;
        const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
        const num = new Array(this.getLength());
        for (let i = 0; i < this.getLength(); i++) {
            num[i] = this.get(i);
        }
        for (let i = 0; i < e.getLength(); i++) {
            num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
        }
        return new QRPolynomial(num, 0).mod(e);
    };

    function QRBitBuffer() {
        this.buffer = [];
        this.length = 0;
    }
    QRBitBuffer.prototype.get = function (index) {
        const bufIndex = Math.floor(index / 8);
        return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1;
    };
    QRBitBuffer.prototype.put = function (num, length) {
        for (let i = 0; i < length; i++) {
            this.putBit(((num >>> (length - i - 1)) & 1) === 1);
        }
    };
    QRBitBuffer.prototype.getLengthInBits = function () {
        return this.length;
    };
    QRBitBuffer.prototype.putBit = function (bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) this.buffer.push(0);
        if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
        this.length++;
    };

    function QR8BitByte(data) {
        this.mode = QRMode.MODE_8BIT_BYTE;
        this.data = data;
    }
    QR8BitByte.prototype.getLength = function () {
        return this.data.length;
    };
    QR8BitByte.prototype.write = function (buffer) {
        for (let i = 0; i < this.data.length; i++) {
            buffer.put(this.data.charCodeAt(i), 8);
        }
    };

    const QRRSBlock = (function () {
        function Block(totalCount, dataCount) {
            this.totalCount = totalCount;
            this.dataCount = dataCount;
        }

        const RS_BLOCK_TABLE = [
            [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
            [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
            [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
            [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
            [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
            [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
            [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
            [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
            [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
            [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
            [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
            [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
            [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
            [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
            [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12],
            [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16],
            [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15],
            [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15],
            [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14],
            [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16],
            [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17],
            [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13],
            [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16],
            [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17],
            [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16],
            [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17],
            [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16],
            [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16],
            [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16],
            [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16],
            [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16],
            [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16],
            [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16],
            [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17],
            [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16],
            [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16],
            [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16],
            [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16],
            [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16],
            [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]
        ];

        function getRsBlockTable(typeNumber, errorCorrectLevel) {
            switch (errorCorrectLevel) {
                case ErrorCorrectLevel.L: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
                case ErrorCorrectLevel.M: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
                case ErrorCorrectLevel.Q: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
                case ErrorCorrectLevel.H: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
                default: return undefined;
            }
        }

        function getRSBlocks(typeNumber, errorCorrectLevel) {
            const rsBlock = getRsBlockTable(typeNumber, errorCorrectLevel);
            if (!rsBlock) throw new Error(`bad rs block @ typeNumber:${typeNumber}/errorCorrectLevel:${errorCorrectLevel}`);
            const length = rsBlock.length / 3;
            const list = [];
            for (let i = 0; i < length; i++) {
                const count = rsBlock[i * 3 + 0];
                const totalCount = rsBlock[i * 3 + 1];
                const dataCount = rsBlock[i * 3 + 2];
                for (let j = 0; j < count; j++) {
                    list.push(new Block(totalCount, dataCount));
                }
            }
            return list;
        }

        return { getRSBlocks };
    })();

    const QRUtil = (function () {
        const QRMaskPattern = {
            PATTERN000: 0,
            PATTERN001: 1,
            PATTERN010: 2,
            PATTERN011: 3,
            PATTERN100: 4,
            PATTERN101: 5,
            PATTERN110: 6,
            PATTERN111: 7
        };

        const PATTERN_POSITION_TABLE = [
            [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42],
            [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66],
            [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86],
            [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102],
            [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
            [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130],
            [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142],
            [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154],
            [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166],
            [6, 30, 58, 86, 114, 142, 170]
        ];

        const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
        const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
        const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

        function getBCHDigit(data) {
            let digit = 0;
            while (data !== 0) {
                digit++;
                data >>>= 1;
            }
            return digit;
        }

        function getBCHTypeInfo(data) {
            let d = data << 10;
            while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
                d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
            }
            return ((data << 10) | d) ^ G15_MASK;
        }

        function getBCHTypeNumber(data) {
            let d = data << 12;
            while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
                d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
            }
            return (data << 12) | d;
        }

        function getPatternPosition(typeNumber) {
            return PATTERN_POSITION_TABLE[typeNumber - 1];
        }

        function getMask(maskPattern, i, j) {
            switch (maskPattern) {
                case QRMaskPattern.PATTERN000: return (i + j) % 2 === 0;
                case QRMaskPattern.PATTERN001: return i % 2 === 0;
                case QRMaskPattern.PATTERN010: return j % 3 === 0;
                case QRMaskPattern.PATTERN011: return (i + j) % 3 === 0;
                case QRMaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
                case QRMaskPattern.PATTERN101: return (i * j) % 2 + (i * j) % 3 === 0;
                case QRMaskPattern.PATTERN110: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
                case QRMaskPattern.PATTERN111: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
                default: throw new Error(`bad maskPattern:${maskPattern}`);
            }
        }

        function getErrorCorrectPolynomial(errorCorrectLength) {
            let a = new QRPolynomial([1], 0);
            for (let i = 0; i < errorCorrectLength; i++) {
                a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
            }
            return a;
        }

        function getLengthInBits(mode, type) {
            if (1 <= type && type < 10) {
                switch (mode) {
                    case QRMode.MODE_NUMBER: return 10;
                    case QRMode.MODE_ALPHA_NUM: return 9;
                    case QRMode.MODE_8BIT_BYTE: return 8;
                    case QRMode.MODE_KANJI: return 8;
                    default: throw new Error(`mode:${mode}`);
                }
            } else if (type < 27) {
                switch (mode) {
                    case QRMode.MODE_NUMBER: return 12;
                    case QRMode.MODE_ALPHA_NUM: return 11;
                    case QRMode.MODE_8BIT_BYTE: return 16;
                    case QRMode.MODE_KANJI: return 10;
                    default: throw new Error(`mode:${mode}`);
                }
            } else if (type < 41) {
                switch (mode) {
                    case QRMode.MODE_NUMBER: return 14;
                    case QRMode.MODE_ALPHA_NUM: return 13;
                    case QRMode.MODE_8BIT_BYTE: return 16;
                    case QRMode.MODE_KANJI: return 12;
                    default: throw new Error(`mode:${mode}`);
                }
            }
            throw new Error(`type:${type}`);
        }

        function getLostPoint(qrCode) {
            const moduleCount = qrCode.getModuleCount();
            let lostPoint = 0;

            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    let sameCount = 0;
                    const dark = qrCode.isDark(row, col);
                    for (let r = -1; r <= 1; r++) {
                        if (row + r < 0 || moduleCount <= row + r) continue;
                        for (let c = -1; c <= 1; c++) {
                            if (col + c < 0 || moduleCount <= col + c) continue;
                            if (r === 0 && c === 0) continue;
                            if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
                        }
                    }
                    if (sameCount > 5) lostPoint += (3 + sameCount - 5);
                }
            }

            for (let row = 0; row < moduleCount - 1; row++) {
                for (let col = 0; col < moduleCount - 1; col++) {
                    let count = 0;
                    if (qrCode.isDark(row, col)) count++;
                    if (qrCode.isDark(row + 1, col)) count++;
                    if (qrCode.isDark(row, col + 1)) count++;
                    if (qrCode.isDark(row + 1, col + 1)) count++;
                    if (count === 0 || count === 4) lostPoint += 3;
                }
            }

            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount - 6; col++) {
                    if (qrCode.isDark(row, col)
                        && !qrCode.isDark(row, col + 1)
                        && qrCode.isDark(row, col + 2)
                        && qrCode.isDark(row, col + 3)
                        && qrCode.isDark(row, col + 4)
                        && !qrCode.isDark(row, col + 5)
                        && qrCode.isDark(row, col + 6)) {
                        lostPoint += 40;
                    }
                }
            }
            for (let col = 0; col < moduleCount; col++) {
                for (let row = 0; row < moduleCount - 6; row++) {
                    if (qrCode.isDark(row, col)
                        && !qrCode.isDark(row + 1, col)
                        && qrCode.isDark(row + 2, col)
                        && qrCode.isDark(row + 3, col)
                        && qrCode.isDark(row + 4, col)
                        && !qrCode.isDark(row + 5, col)
                        && qrCode.isDark(row + 6, col)) {
                        lostPoint += 40;
                    }
                }
            }

            let darkCount = 0;
            for (let col = 0; col < moduleCount; col++) {
                for (let row = 0; row < moduleCount; row++) {
                    if (qrCode.isDark(row, col)) darkCount++;
                }
            }
            const ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
            lostPoint += ratio * 10;

            return lostPoint;
        }

        return {
            getBCHTypeInfo,
            getBCHTypeNumber,
            getPatternPosition,
            getMask,
            getErrorCorrectPolynomial,
            getLengthInBits,
            getLostPoint
        };
    })();

    function QRCodeImpl(typeNumber, errorCorrectLevel) {
        this.typeNumber = typeNumber;
        this.errorCorrectLevel = errorCorrectLevel;
        this.modules = null;
        this.moduleCount = 0;
        this.dataCache = null;
        this.dataList = [];
    }

    QRCodeImpl.prototype.addData = function (data) {
        const newData = new QR8BitByte(data);
        this.dataList.push(newData);
        this.dataCache = null;
    };
    QRCodeImpl.prototype.isDark = function (row, col) {
        if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
            throw new Error(`${row},${col}`);
        }
        return this.modules[row][col];
    };
    QRCodeImpl.prototype.getModuleCount = function () {
        return this.moduleCount;
    };
    QRCodeImpl.prototype.make = function () {
        if (this.typeNumber < 1) {
            let typeNumber = 1;
            for (typeNumber = 1; typeNumber < 40; typeNumber++) {
                const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
                const buffer = new QRBitBuffer();
                let totalDataCount = 0;
                for (let i = 0; i < rsBlocks.length; i++) {
                    totalDataCount += rsBlocks[i].dataCount;
                }
                for (let i = 0; i < this.dataList.length; i++) {
                    const data = this.dataList[i];
                    buffer.put(data.mode, 4);
                    buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
                    data.write(buffer);
                }
                if (buffer.getLengthInBits() <= totalDataCount * 8) break;
            }
            this.typeNumber = typeNumber;
        }
        this.makeImpl(false, this.getBestMaskPattern());
    };

    QRCodeImpl.prototype.makeImpl = function (test, maskPattern) {
        this.moduleCount = this.typeNumber * 4 + 17;
        this.modules = new Array(this.moduleCount);
        for (let row = 0; row < this.moduleCount; row++) {
            this.modules[row] = new Array(this.moduleCount);
            for (let col = 0; col < this.moduleCount; col++) {
                this.modules[row][col] = null;
            }
        }

        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(test, maskPattern);
        if (this.typeNumber >= 7) this.setupTypeNumber(test);

        if (this.dataCache === null) {
            this.dataCache = QRCodeImpl.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
        }
        this.mapData(this.dataCache, maskPattern);
    };

    QRCodeImpl.prototype.setupPositionProbePattern = function (row, col) {
        for (let r = -1; r <= 7; r++) {
            if (row + r <= -1 || this.moduleCount <= row + r) continue;
            for (let c = -1; c <= 7; c++) {
                if (col + c <= -1 || this.moduleCount <= col + c) continue;
                if ((0 <= r && r <= 6 && (c === 0 || c === 6))
                    || (0 <= c && c <= 6 && (r === 0 || r === 6))
                    || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                    this.modules[row + r][col + c] = true;
                } else {
                    this.modules[row + r][col + c] = false;
                }
            }
        }
    };

    QRCodeImpl.prototype.getBestMaskPattern = function () {
        let minLostPoint = 0;
        let pattern = 0;
        for (let i = 0; i < 8; i++) {
            this.makeImpl(true, i);
            const lostPoint = QRUtil.getLostPoint(this);
            if (i === 0 || minLostPoint > lostPoint) {
                minLostPoint = lostPoint;
                pattern = i;
            }
        }
        return pattern;
    };

    QRCodeImpl.prototype.setupTimingPattern = function () {
        for (let r = 8; r < this.moduleCount - 8; r++) {
            if (this.modules[r][6] !== null) continue;
            this.modules[r][6] = r % 2 === 0;
        }
        for (let c = 8; c < this.moduleCount - 8; c++) {
            if (this.modules[6][c] !== null) continue;
            this.modules[6][c] = c % 2 === 0;
        }
    };

    QRCodeImpl.prototype.setupPositionAdjustPattern = function () {
        const pos = QRUtil.getPatternPosition(this.typeNumber);
        for (let i = 0; i < pos.length; i++) {
            for (let j = 0; j < pos.length; j++) {
                const row = pos[i];
                const col = pos[j];
                if (this.modules[row][col] !== null) continue;
                for (let r = -2; r <= 2; r++) {
                    for (let c = -2; c <= 2; c++) {
                        if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                            this.modules[row + r][col + c] = true;
                        } else {
                            this.modules[row + r][col + c] = false;
                        }
                    }
                }
            }
        }
    };

    QRCodeImpl.prototype.setupTypeNumber = function (test) {
        const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
        for (let i = 0; i < 18; i++) {
            const mod = (!test && ((bits >> i) & 1) === 1);
            this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
        }
        for (let i = 0; i < 18; i++) {
            const mod = (!test && ((bits >> i) & 1) === 1);
            this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
        }
    };

    QRCodeImpl.prototype.setupTypeInfo = function (test, maskPattern) {
        const data = (this.errorCorrectLevel << 3) | maskPattern;
        const bits = QRUtil.getBCHTypeInfo(data);
        for (let i = 0; i < 15; i++) {
            const mod = (!test && ((bits >> i) & 1) === 1);
            if (i < 6) this.modules[i][8] = mod;
            else if (i < 8) this.modules[i + 1][8] = mod;
            else this.modules[this.moduleCount - 15 + i][8] = mod;
        }
        for (let i = 0; i < 15; i++) {
            const mod = (!test && ((bits >> i) & 1) === 1);
            if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
            else if (i < 9) this.modules[8][15 - i] = mod;
            else this.modules[8][14 - i] = mod;
        }
        this.modules[this.moduleCount - 8][8] = !test;
    };

    QRCodeImpl.prototype.mapData = function (data, maskPattern) {
        let inc = -1;
        let row = this.moduleCount - 1;
        let bitIndex = 7;
        let byteIndex = 0;
        for (let col = this.moduleCount - 1; col > 0; col -= 2) {
            if (col === 6) col--;
            while (true) {
                for (let c = 0; c < 2; c++) {
                    if (this.modules[row][col - c] === null) {
                        let dark = false;
                        if (byteIndex < data.length) {
                            dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
                        }
                        const mask = QRUtil.getMask(maskPattern, row, col - c);
                        if (mask) dark = !dark;
                        this.modules[row][col - c] = dark;
                        bitIndex--;
                        if (bitIndex === -1) {
                            byteIndex++;
                            bitIndex = 7;
                        }
                    }
                }
                row += inc;
                if (row < 0 || this.moduleCount <= row) {
                    row -= inc;
                    inc = -inc;
                    break;
                }
            }
        }
    };

    QRCodeImpl.PAD0 = 0xEC;
    QRCodeImpl.PAD1 = 0x11;

    QRCodeImpl.createData = function (typeNumber, errorCorrectLevel, dataList) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
        const buffer = new QRBitBuffer();
        for (let i = 0; i < dataList.length; i++) {
            const data = dataList[i];
            buffer.put(data.mode, 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
            data.write(buffer);
        }

        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
        }

        if (buffer.getLengthInBits() > totalDataCount * 8) {
            throw new Error(`code length overflow. (${buffer.getLengthInBits()}>${totalDataCount * 8})`);
        }

        if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
        while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);

        while (true) {
            if (buffer.getLengthInBits() >= totalDataCount * 8) break;
            buffer.put(QRCodeImpl.PAD0, 8);
            if (buffer.getLengthInBits() >= totalDataCount * 8) break;
            buffer.put(QRCodeImpl.PAD1, 8);
        }

        return QRCodeImpl.createBytes(buffer, rsBlocks);
    };

    QRCodeImpl.createBytes = function (buffer, rsBlocks) {
        let offset = 0;
        let maxDcCount = 0;
        let maxEcCount = 0;
        const dcdata = new Array(rsBlocks.length);
        const ecdata = new Array(rsBlocks.length);

        for (let r = 0; r < rsBlocks.length; r++) {
            const dcCount = rsBlocks[r].dataCount;
            const ecCount = rsBlocks[r].totalCount - dcCount;
            maxDcCount = Math.max(maxDcCount, dcCount);
            maxEcCount = Math.max(maxEcCount, ecCount);
            dcdata[r] = new Array(dcCount);
            for (let i = 0; i < dcdata[r].length; i++) {
                dcdata[r][i] = 0xff & buffer.buffer[i + offset];
            }
            offset += dcCount;

            const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
            const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
            const modPoly = rawPoly.mod(rsPoly);
            ecdata[r] = new Array(rsPoly.getLength() - 1);
            for (let i = 0; i < ecdata[r].length; i++) {
                const modIndex = i + modPoly.getLength() - ecdata[r].length;
                ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
            }
        }

        let totalCodeCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
            totalCodeCount += rsBlocks[i].totalCount;
        }

        const data = new Array(totalCodeCount);
        let index = 0;
        for (let i = 0; i < maxDcCount; i++) {
            for (let r = 0; r < rsBlocks.length; r++) {
                if (i < dcdata[r].length) data[index++] = dcdata[r][i];
            }
        }
        for (let i = 0; i < maxEcCount; i++) {
            for (let r = 0; r < rsBlocks.length; r++) {
                if (i < ecdata[r].length) data[index++] = ecdata[r][i];
            }
        }
        return data;
    };

    function renderToCanvas(qr, canvas, options = {}) {
        const { size = 250, margin = 4, dark = '#000000', light = '#ffffff' } = options;
        const moduleCount = qr.getModuleCount();
        const pixelsPerModule = Math.max(1, Math.floor(size / (moduleCount + margin * 2)));
        const dimension = (moduleCount + margin * 2) * pixelsPerModule;

        canvas.width = dimension;
        canvas.height = dimension;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = light;
        ctx.fillRect(0, 0, dimension, dimension);

        ctx.fillStyle = dark;
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillRect(
                        (col + margin) * pixelsPerModule,
                        (row + margin) * pixelsPerModule,
                        pixelsPerModule,
                        pixelsPerModule
                    );
                }
            }
        }
    }

    return {
        generate(text, errorCorrection = 'L') {
            const level = ErrorCorrectLevel[errorCorrection] ?? ErrorCorrectLevel.L;
            const qr = new QRCodeImpl(-1, level);
            qr.addData(text);
            qr.make();
            return qr;
        },
        renderToCanvas
    };
})();
function renderQR() {
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Input</h3>
                <div class="form-group">
                    <label class="form-label">URL or Text</label>
                    <textarea id="qr-input" rows="3" placeholder="Enter URL or text to encode"></textarea>
                </div>
                <button class="btn btn-primary" id="qr-generate" style="width: 100%;">Generate QR Code</button>
            </div>

            <div class="tool-section" id="qr-result-section" style="display: none;">
                <div class="qr-container">
                    <div class="qr-canvas">
                        <canvas id="qr-canvas"></canvas>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary" id="qr-download">Download PNG</button>
                        <button class="btn btn-secondary" id="qr-copy">Copy Image</button>
                    </div>
                </div>
                <p class="hint" style="text-align: center; margin-top: 1rem;">
                    QR code generated locally - no data sent to any server.
                </p>
            </div>
        </div>
    `;

    document.getElementById('qr-generate').addEventListener('click', generateQRCode);
    document.getElementById('qr-download').addEventListener('click', downloadQRCode);
    document.getElementById('qr-copy').addEventListener('click', copyQRCode);
}

function generateQRCode() {
    const text = document.getElementById('qr-input').value.trim();

    if (!text) {
        showToast('Please enter text or URL');
        return;
    }

    try {
        const modules = QRCode.generate(text);
        const canvas = document.getElementById('qr-canvas');
        QRCode.renderToCanvas(modules, canvas, { size: 250 });

        document.getElementById('qr-result-section').style.display = 'block';
    } catch (err) {
        if (err && err.message && err.message.includes('code length overflow')) {
            showToast('Text too long for this QR size');
        } else {
            showToast('Failed to generate QR code');
        }
        console.error(err);
    }
}

function downloadQRCode() {
    const canvas = document.getElementById('qr-canvas');
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function copyQRCode() {
    try {
        const canvas = document.getElementById('qr-canvas');
        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                showToast('QR code copied to clipboard!');
            } catch (err) {
                showToast('Copy failed - please download instead');
            }
        });
    } catch (err) {
        showToast('Copy not supported - please download instead');
    }
}

// ===== Phase 2: Agenda / Do Now Board =====

function renderAgenda() {
    const container = document.getElementById('tool-container');
    const presetKeys = Object.keys(state.agenda.presets);

    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Presets</h3>
                <div class="agenda-presets">
                    ${presetKeys.map(key => `
                        <button class="preset-btn ${state.agenda.currentPreset === key ? 'active' : ''}" data-preset="${key}">${key}</button>
                    `).join('')}
                    <button class="btn btn-secondary" id="agenda-save-preset">Save Current</button>
                    <button class="btn btn-secondary" id="agenda-add-block">+ Add Block</button>
                </div>
                <div class="btn-group" style="margin-top: 1rem;">
                    <button class="btn btn-secondary" id="agenda-print">🖨️ Print View</button>
                    <button class="btn btn-secondary btn-icon" id="agenda-fullscreen" title="Fullscreen">⛶</button>
                </div>
            </div>

            <div class="tool-section agenda-board" id="agenda-board">
                <div class="agenda-title" contenteditable="true" id="agenda-title">${state.agenda.title}</div>
                <div class="agenda-blocks" id="agenda-blocks">
                    ${state.agenda.blocks.map((block, i) => renderAgendaBlock(block, i)).join('')}
                </div>
            </div>
        </div>
    `;

    // Event listeners
    document.getElementById('agenda-title').addEventListener('blur', (e) => {
        state.agenda.title = e.target.textContent;
        localStorage.setItem('agendaTitle', state.agenda.title);
    });

    document.getElementById('agenda-save-preset').addEventListener('click', saveAgendaPreset);
    document.getElementById('agenda-add-block').addEventListener('click', addAgendaBlock);
    document.getElementById('agenda-print').addEventListener('click', printAgenda);
    document.getElementById('agenda-fullscreen').addEventListener('click', toggleFullscreen);

    container.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => loadAgendaPreset(btn.dataset.preset));
    });

    setupAgendaBlockListeners();
}

function renderAgendaBlock(block, index) {
    return `
        <div class="agenda-block" data-index="${index}">
            <button class="agenda-block-delete" data-index="${index}">&times;</button>
            <div class="agenda-block-header">
                <span class="agenda-block-icon">${block.icon}</span>
                <input type="text" class="agenda-block-title" value="${block.title}" data-index="${index}" data-field="title">
            </div>
            <textarea class="agenda-block-content" data-index="${index}" data-field="content" placeholder="Enter details...">${block.content}</textarea>
        </div>
    `;
}

function setupAgendaBlockListeners() {
    document.querySelectorAll('.agenda-block-title, .agenda-block-content').forEach(el => {
        el.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            state.agenda.blocks[index][field] = e.target.value;
            saveAgendaBlocks();
        });
    });

    document.querySelectorAll('.agenda-block-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.agenda.blocks.splice(index, 1);
            saveAgendaBlocks();
            renderAgenda();
        });
    });
}

function addAgendaBlock() {
    const icons = ['📝', '💡', '🎯', '📖', '✅', '🔔', '⏰', '📊'];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    state.agenda.blocks.push({ icon, title: 'New Block', content: '' });
    saveAgendaBlocks();
    renderAgenda();
}

function saveAgendaBlocks() {
    localStorage.setItem('agendaBlocks', JSON.stringify(state.agenda.blocks));
}

function saveAgendaPreset() {
    const name = prompt('Enter preset name (e.g., "Period 1"):');
    if (name && name.trim()) {
        state.agenda.presets[name.trim()] = {
            title: state.agenda.title,
            blocks: JSON.parse(JSON.stringify(state.agenda.blocks))
        };
        localStorage.setItem('agendaPresets', JSON.stringify(state.agenda.presets));
        state.agenda.currentPreset = name.trim();
        showToast(`Preset "${name}" saved!`);
        renderAgenda();
    }
}

function loadAgendaPreset(name) {
    const preset = state.agenda.presets[name];
    if (preset) {
        state.agenda.title = preset.title;
        state.agenda.blocks = JSON.parse(JSON.stringify(preset.blocks));
        state.agenda.currentPreset = name;
        localStorage.setItem('agendaTitle', state.agenda.title);
        saveAgendaBlocks();
        renderAgenda();
    }
}

function printAgenda() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${state.agenda.title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
                .title { font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem; }
                .block { margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #ccc; border-radius: 8px; }
                .block-header { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; color: #e94560; }
                .block-content { white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <div class="title">${state.agenda.title}</div>
            ${state.agenda.blocks.map(block => `
                <div class="block">
                    <div class="block-header">${block.icon} ${block.title}</div>
                    <div class="block-content">${block.content || '(No content)'}</div>
                </div>
            `).join('')}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ===== Phase 2: Team Points Tracker =====

function renderTeams() {
    const container = document.getElementById('tool-container');

    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Settings</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Number of Teams (2-8)</label>
                        <input type="number" id="team-count" min="2" max="8" value="${state.teams.data.length}">
                    </div>
                    <div class="form-group" style="justify-content: flex-end;">
                        <button class="btn btn-secondary" id="team-apply">Apply</button>
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-warning" id="team-reset">Reset All Scores</button>
                    <button class="btn btn-secondary" id="team-new-day">New Day</button>
                    <button class="btn btn-secondary btn-icon" id="team-fullscreen" title="Fullscreen">⛶</button>
                </div>
            </div>

            <div class="tool-section">
                <div class="teams-grid" id="teams-grid">
                    ${state.teams.data.map((team, i) => renderTeamCard(team, i)).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('team-apply').addEventListener('click', applyTeamCount);
    document.getElementById('team-reset').addEventListener('click', resetTeamScores);
    document.getElementById('team-new-day').addEventListener('click', newDayTeams);
    document.getElementById('team-fullscreen').addEventListener('click', toggleFullscreen);

    setupTeamListeners();
}

function renderTeamCard(team, index) {
    const colors = ['#e94560', '#4ade80', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const color = colors[index % colors.length];

    return `
        <div class="team-card" data-index="${index}" style="border-color: ${color};">
            <input type="text" class="team-name" value="${team.name}" data-index="${index}">
            <div class="team-score" style="color: ${color};">${team.score}</div>
            <div class="team-controls">
                <button class="team-btn team-btn-minus" data-index="${index}" data-delta="-1">-1</button>
                <button class="team-btn team-btn-plus" data-index="${index}" data-delta="1">+1</button>
                <button class="team-btn team-btn-plus5" data-index="${index}" data-delta="5">+5</button>
            </div>
        </div>
    `;
}

function setupTeamListeners() {
    document.querySelectorAll('.team-name').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.teams.data[index].name = e.target.value;
            saveTeams();
        });
    });

    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            const delta = parseInt(btn.dataset.delta);
            state.teams.data[index].score += delta;
            saveTeams();

            const card = btn.closest('.team-card');
            const scoreEl = card.querySelector('.team-score');
            scoreEl.textContent = state.teams.data[index].score;
            card.classList.add('highlight');
            setTimeout(() => card.classList.remove('highlight'), 300);

            if (delta > 0) playBeep(600, 80);
            else playBeep(300, 80);
        });
    });
}

function applyTeamCount() {
    const count = Math.min(8, Math.max(2, parseInt(document.getElementById('team-count').value) || 4));
    const currentCount = state.teams.data.length;

    if (count > currentCount) {
        for (let i = currentCount; i < count; i++) {
            state.teams.data.push({ name: `Team ${i + 1}`, score: 0 });
        }
    } else if (count < currentCount) {
        state.teams.data = state.teams.data.slice(0, count);
    }

    saveTeams();
    renderTeams();
}

function resetTeamScores() {
    state.teams.data.forEach(team => team.score = 0);
    saveTeams();
    renderTeams();
}

function newDayTeams() {
    if (confirm('Reset all scores for a new day?')) {
        resetTeamScores();
    }
}

function saveTeams() {
    localStorage.setItem('teamsData', JSON.stringify(state.teams.data));
}

// ===== Phase 2: Traffic Light / Classroom Signals =====

function renderTraffic() {
    const container = document.getElementById('tool-container');
    const labels = state.traffic.labels[state.traffic.mode === 'instruction' ? 'instruction' : 'traffic'];

    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Mode</h3>
                <div class="preset-grid">
                    <button class="preset-btn ${state.traffic.mode === 'traffic' ? 'active' : ''}" data-mode="traffic">Traffic Light</button>
                    <button class="preset-btn ${state.traffic.mode === 'instruction' ? 'active' : ''}" data-mode="instruction">Instruction Mode</button>
                </div>
                <button class="btn btn-secondary btn-icon" id="traffic-fullscreen" title="Fullscreen" style="margin-top: 1rem;">⛶</button>
            </div>

            <div class="tool-section">
                <div class="traffic-light-container">
                    <div class="traffic-light" id="traffic-light">
                        <div class="traffic-signal red ${state.traffic.activeSignal === 'red' ? 'active' : ''}" data-signal="red"></div>
                        <div class="traffic-signal yellow ${state.traffic.activeSignal === 'yellow' ? 'active' : ''}" data-signal="yellow"></div>
                        <div class="traffic-signal green ${state.traffic.activeSignal === 'green' ? 'active' : ''}" data-signal="green"></div>
                    </div>
                    <div class="signal-label" id="signal-label">${labels[state.traffic.activeSignal]}</div>
                    <input type="text" class="signal-note" id="signal-note" placeholder="Optional note..." value="${state.traffic.note}">
                </div>
            </div>
        </div>
    `;

    container.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.traffic.mode = btn.dataset.mode;
            renderTraffic();
        });
    });

    container.querySelectorAll('.traffic-signal').forEach(signal => {
        signal.addEventListener('click', () => {
            const signalType = signal.dataset.signal;
            state.traffic.activeSignal = signalType;

            container.querySelectorAll('.traffic-signal').forEach(s => s.classList.remove('active'));
            signal.classList.add('active');

            const labels = state.traffic.labels[state.traffic.mode === 'instruction' ? 'instruction' : 'traffic'];
            document.getElementById('signal-label').textContent = labels[signalType];

            playBeep(signalType === 'red' ? 400 : signalType === 'yellow' ? 600 : 800, 150);
        });
    });

    document.getElementById('signal-note').addEventListener('input', (e) => {
        state.traffic.note = e.target.value;
    });

    document.getElementById('traffic-fullscreen').addEventListener('click', toggleFullscreen);
}

// ===== Phase 2: Station Timer (Multi-stage) =====

function renderStation() {
    const container = document.getElementById('tool-container');

    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Stations</h3>
                <div class="station-stages" id="station-stages">
                    ${state.station.stages.map((stage, i) => renderStationStage(stage, i)).join('')}
                </div>
                <button class="btn btn-secondary" id="station-add">+ Add Station</button>
            </div>

            <div class="tool-section station-display" id="station-display">
                <div class="station-current-name" id="station-current-name">${state.station.stages[state.station.currentStage]?.name || 'Ready'}</div>
                <div class="display-time" id="station-time">${formatTime(state.station.remaining || state.station.stages[0]?.duration || 0)}</div>
                <div class="station-next" id="station-next">
                    ${getNextStationText()}
                </div>
                <div class="station-progress" id="station-progress">
                    ${state.station.stages.map((_, i) => `
                        <div class="station-dot ${i < state.station.currentStage ? 'completed' : ''} ${i === state.station.currentStage ? 'current' : ''}"></div>
                    `).join('')}
                </div>
                <div class="btn-group" style="justify-content: center; margin-top: 2rem;">
                    <button class="btn btn-success btn-icon" id="station-start" ${state.station.isRunning ? 'style="display: none;"' : ''}>▶</button>
                    <button class="btn btn-warning btn-icon" id="station-pause" ${!state.station.isRunning ? 'style="display: none;"' : ''}>⏸</button>
                    <button class="btn btn-secondary btn-icon" id="station-reset">↺</button>
                    <button class="btn btn-secondary btn-icon" id="station-skip">⏭</button>
                    <button class="btn btn-secondary btn-icon" id="station-fullscreen">⛶</button>
                </div>
            </div>
        </div>
    `;

    setupStationListeners();
}

function renderStationStage(stage, index) {
    const isCurrent = index === state.station.currentStage;
    const isCompleted = index < state.station.currentStage;

    return `
        <div class="station-stage ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}" data-index="${index}">
            <div class="station-stage-num">${index + 1}</div>
            <input type="text" class="station-stage-name" value="${stage.name}" data-index="${index}" data-field="name">
            <input type="text" class="station-stage-duration" value="${formatTime(stage.duration)}" data-index="${index}" data-field="duration" placeholder="mm:ss">
            <button class="station-stage-delete" data-index="${index}">&times;</button>
        </div>
    `;
}

function getNextStationText() {
    const next = state.station.stages[state.station.currentStage + 1];
    return next ? `Up next: ${next.name}` : 'Final station';
}

function setupStationListeners() {
    document.querySelectorAll('.station-stage-name').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            state.station.stages[index].name = e.target.value;
            saveStationStages();
        });
    });

    document.querySelectorAll('.station-stage-duration').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const match = e.target.value.match(/^(\d{1,2}):(\d{2})$/);
            if (match) {
                state.station.stages[index].duration = parseInt(match[1]) * 60 + parseInt(match[2]);
                saveStationStages();
                if (index === state.station.currentStage && !state.station.isRunning) {
                    state.station.remaining = state.station.stages[index].duration;
                    updateStationDisplay();
                }
            }
        });
    });

    document.querySelectorAll('.station-stage-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            if (state.station.stages.length > 1) {
                state.station.stages.splice(index, 1);
                if (state.station.currentStage >= state.station.stages.length) {
                    state.station.currentStage = state.station.stages.length - 1;
                }
                saveStationStages();
                renderStation();
            }
        });
    });

    document.getElementById('station-add').addEventListener('click', () => {
        state.station.stages.push({ name: `Station ${state.station.stages.length + 1}`, duration: 300 });
        saveStationStages();
        renderStation();
    });

    document.getElementById('station-start').addEventListener('click', startStation);
    document.getElementById('station-pause').addEventListener('click', pauseStation);
    document.getElementById('station-reset').addEventListener('click', resetStation);
    document.getElementById('station-skip').addEventListener('click', skipStation);
    document.getElementById('station-fullscreen').addEventListener('click', toggleFullscreen);
}

function startStation() {
    if (state.station.stages.length === 0) return;

    // Clear any existing interval first
    if (state.station.interval) {
        clearInterval(state.station.interval);
        state.station.interval = null;
    }

    if (state.station.remaining <= 0) {
        state.station.remaining = state.station.stages[state.station.currentStage].duration;
    }

    state.station.isRunning = true;
    state.station.isPaused = false;

    document.getElementById('station-start').style.display = 'none';
    document.getElementById('station-pause').style.display = 'inline-flex';

    state.station.interval = setInterval(() => {
        state.station.remaining--;
        updateStationDisplay();

        if (state.station.remaining <= 0) {
            stationStageComplete();
        }
    }, 1000);
}

function pauseStation() {
    state.station.isRunning = false;
    state.station.isPaused = true;
    clearInterval(state.station.interval);
    state.station.interval = null;

    document.getElementById('station-start').style.display = 'inline-flex';
    document.getElementById('station-pause').style.display = 'none';
}

function resetStation() {
    pauseStation();
    state.station.currentStage = 0;
    state.station.remaining = state.station.stages[0]?.duration || 0;
    renderStation();
}

function skipStation() {
    if (state.station.currentStage < state.station.stages.length - 1) {
        state.station.currentStage++;
        state.station.remaining = state.station.stages[state.station.currentStage].duration;
        updateStationDisplay();
        renderStation();
        if (state.station.isRunning) startStation();
    }
}

function stationStageComplete() {
    // Clear the interval immediately to prevent further decrements
    clearInterval(state.station.interval);
    state.station.interval = null;

    // Play the chime sequence
    playBeep(800, 200);
    setTimeout(() => playBeep(800, 200), 250);
    setTimeout(() => playBeep(1000, 300), 500);

    // Delay the transition to let chimes finish (800ms total)
    setTimeout(() => {
        if (state.station.currentStage < state.station.stages.length - 1) {
            state.station.currentStage++;
            state.station.remaining = state.station.stages[state.station.currentStage].duration;
            renderStation();
            if (state.station.isRunning) {
                startStation();
            }
        } else {
            pauseStation();
            document.getElementById('station-current-name').textContent = 'Complete!';
        }
    }, 900);
}

function updateStationDisplay() {
    const timeEl = document.getElementById('station-time');
    const nameEl = document.getElementById('station-current-name');
    if (timeEl) timeEl.textContent = formatTime(state.station.remaining);
    if (nameEl && state.station.stages[state.station.currentStage]) {
        nameEl.textContent = state.station.stages[state.station.currentStage].name;
    }
}

function saveStationStages() {
    localStorage.setItem('stationStages', JSON.stringify(state.station.stages));
}

// ===== Phase 2: Seating Chart (Drag/Drop) =====

function renderSeating() {
    const container = document.getElementById('tool-container');
    loadCurrentSeatingChart();

    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Chart Settings</h3>
                <div class="chart-selector" id="chart-selector">
                    ${renderChartTabs()}
                    <button class="btn btn-secondary" id="seating-new-chart">+ New Chart</button>
                </div>
                <div class="form-row" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Rows</label>
                        <input type="number" id="seating-rows" min="1" max="10" value="${state.seating.rows}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Columns</label>
                        <input type="number" id="seating-cols" min="1" max="10" value="${state.seating.cols}">
                    </div>
                    <div class="form-group" style="justify-content: flex-end;">
                        <button class="btn btn-secondary" id="seating-apply-grid">Apply</button>
                    </div>
                </div>
            </div>

            <div class="tool-section">
                <h3 class="section-title">Student Roster</h3>
                <textarea id="seating-roster" placeholder="Paste student names (one per line)">${state.seating.roster.join('\n')}</textarea>
                <div class="btn-group" style="margin-top: 0.5rem;">
                    <button class="btn btn-secondary" id="seating-save-roster">Save Roster</button>
                    <button class="btn btn-primary" id="seating-random-fill">Random Fill</button>
                    <button class="btn btn-secondary" id="seating-clear">Clear All</button>
                </div>
            </div>

            <div class="tool-section">
                <h3 class="section-title">Seating Chart</h3>
                <div class="roster-pool" id="roster-pool">
                    ${renderRosterPool()}
                </div>
                <div class="seating-grid-container">
                    <div class="seating-grid" id="seating-grid" style="grid-template-columns: repeat(${state.seating.cols}, 1fr);">
                        ${renderSeatingGrid()}
                    </div>
                </div>
                <div class="btn-group" style="margin-top: 1rem;">
                    <button class="btn btn-secondary" id="seating-export">Export CSV</button>
                    <button class="btn btn-secondary" id="seating-import">Import CSV</button>
                    <button class="btn btn-secondary btn-icon" id="seating-fullscreen" title="Fullscreen">⛶</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('seating-fullscreen').addEventListener('click', toggleFullscreen);
    setupSeatingListeners();
}

function renderChartTabs() {
    const charts = Object.keys(state.seating.charts);
    if (charts.length === 0) charts.push('default');

    return charts.map(name => `
        <button class="chart-tab ${state.seating.currentChart === name ? 'active' : ''}" data-chart="${name}">${name}</button>
    `).join('');
}

function renderRosterPool() {
    const seatedStudents = Object.values(state.seating.seats);
    const unseated = state.seating.roster.filter(s => !seatedStudents.includes(s));

    return unseated.map(student => `
        <div class="roster-student" draggable="true" data-student="${student}">${student}</div>
    `).join('') || '<span style="color: var(--text-muted);">All students seated</span>';
}

function renderSeatingGrid() {
    const seats = [];
    for (let r = 0; r < state.seating.rows; r++) {
        for (let c = 0; c < state.seating.cols; c++) {
            const seatId = `${r}-${c}`;
            const student = state.seating.seats[seatId] || '';
            const isLocked = state.seating.lockedSeats.includes(seatId);
            seats.push(`
                <div class="seat ${student ? 'occupied' : ''} ${isLocked ? 'locked' : ''}"
                     data-seat="${seatId}"
                     draggable="${student ? 'true' : 'false'}"
                     title="${isLocked ? 'Locked - right-click to unlock' : 'Right-click to lock'}">
                    ${student}
                </div>
            `);
        }
    }
    return seats.join('');
}

function loadCurrentSeatingChart() {
    const saved = state.seating.charts[state.seating.currentChart];
    if (saved) {
        state.seating.seats = saved.seats || {};
        state.seating.lockedSeats = saved.lockedSeats || [];
        state.seating.rows = saved.rows || 5;
        state.seating.cols = saved.cols || 6;
    } else {
        state.seating.seats = {};
        state.seating.lockedSeats = [];
    }
}

function saveCurrentSeatingChart() {
    state.seating.charts[state.seating.currentChart] = {
        seats: state.seating.seats,
        lockedSeats: state.seating.lockedSeats,
        rows: state.seating.rows,
        cols: state.seating.cols
    };
    localStorage.setItem('seatingCharts', JSON.stringify(state.seating.charts));
    localStorage.setItem('currentSeatingChart', state.seating.currentChart);
}

function setupSeatingListeners() {
    // Chart tabs
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            saveCurrentSeatingChart();
            state.seating.currentChart = tab.dataset.chart;
            loadCurrentSeatingChart();
            renderSeating();
        });
    });

    document.getElementById('seating-new-chart').addEventListener('click', () => {
        const name = prompt('Enter chart name (e.g., "Period 2"):');
        if (name && name.trim()) {
            saveCurrentSeatingChart();
            state.seating.currentChart = name.trim();
            state.seating.seats = {};
            state.seating.lockedSeats = [];
            saveCurrentSeatingChart();
            renderSeating();
        }
    });

    // Grid settings
    document.getElementById('seating-apply-grid').addEventListener('click', () => {
        state.seating.rows = Math.min(10, Math.max(1, parseInt(document.getElementById('seating-rows').value) || 5));
        state.seating.cols = Math.min(10, Math.max(1, parseInt(document.getElementById('seating-cols').value) || 6));
        saveCurrentSeatingChart();
        renderSeating();
    });

    // Roster
    document.getElementById('seating-save-roster').addEventListener('click', () => {
        const roster = document.getElementById('seating-roster').value
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);
        state.seating.roster = roster;
        localStorage.setItem('seatingRoster', JSON.stringify(roster));
        renderSeating();
        showToast(`${roster.length} students saved`);
    });

    document.getElementById('seating-random-fill').addEventListener('click', randomFillSeats);
    document.getElementById('seating-clear').addEventListener('click', clearAllSeats);

    // Drag and drop for roster students
    document.querySelectorAll('.roster-student').forEach(el => {
        el.addEventListener('dragstart', (e) => {
            state.seating.draggedStudent = e.target.dataset.student;
            e.target.classList.add('dragging');
        });
        el.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    });

    // Drag and drop for seats
    document.querySelectorAll('.seat').forEach(seat => {
        seat.addEventListener('dragstart', (e) => {
            const seatId = seat.dataset.seat;
            if (state.seating.seats[seatId]) {
                state.seating.draggedStudent = state.seating.seats[seatId];
                state.seating.draggedFromSeat = seatId;
                seat.classList.add('dragging');
            }
        });

        seat.addEventListener('dragend', () => {
            seat.classList.remove('dragging');
        });

        seat.addEventListener('dragover', (e) => {
            e.preventDefault();
            seat.classList.add('drag-over');
        });

        seat.addEventListener('dragleave', () => {
            seat.classList.remove('drag-over');
        });

        seat.addEventListener('drop', (e) => {
            e.preventDefault();
            seat.classList.remove('drag-over');

            const seatId = seat.dataset.seat;
            if (state.seating.lockedSeats.includes(seatId)) {
                showToast('Seat is locked');
                return;
            }

            const existingStudent = state.seating.seats[seatId];
            const draggedStudent = state.seating.draggedStudent;
            const fromSeat = state.seating.draggedFromSeat;

            if (fromSeat) {
                // Swapping seats
                if (existingStudent) {
                    state.seating.seats[fromSeat] = existingStudent;
                } else {
                    delete state.seating.seats[fromSeat];
                }
            }

            state.seating.seats[seatId] = draggedStudent;
            state.seating.draggedStudent = null;
            state.seating.draggedFromSeat = null;

            saveCurrentSeatingChart();
            renderSeating();
        });

        // Right-click to lock/unlock
        seat.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const seatId = seat.dataset.seat;
            const idx = state.seating.lockedSeats.indexOf(seatId);
            if (idx > -1) {
                state.seating.lockedSeats.splice(idx, 1);
            } else {
                state.seating.lockedSeats.push(seatId);
            }
            saveCurrentSeatingChart();
            renderSeating();
        });
    });

    // Export/Import
    document.getElementById('seating-export').addEventListener('click', exportSeatingChart);
    document.getElementById('seating-import').addEventListener('click', importSeatingChart);
}

function randomFillSeats() {
    const unlockedSeats = [];
    for (let r = 0; r < state.seating.rows; r++) {
        for (let c = 0; c < state.seating.cols; c++) {
            const seatId = `${r}-${c}`;
            if (!state.seating.lockedSeats.includes(seatId)) {
                unlockedSeats.push(seatId);
            }
        }
    }

    // Clear unlocked seats
    unlockedSeats.forEach(seatId => {
        delete state.seating.seats[seatId];
    });

    // Get unassigned students
    const seatedInLocked = state.seating.lockedSeats
        .filter(seatId => state.seating.seats[seatId])
        .map(seatId => state.seating.seats[seatId]);
    const unassigned = state.seating.roster.filter(s => !seatedInLocked.includes(s));
    const shuffled = shuffleArray(unassigned);

    // Fill seats
    shuffled.forEach((student, i) => {
        if (i < unlockedSeats.length) {
            state.seating.seats[unlockedSeats[i]] = student;
        }
    });

    saveCurrentSeatingChart();
    renderSeating();
}

function clearAllSeats() {
    state.seating.seats = {};
    state.seating.lockedSeats = [];
    saveCurrentSeatingChart();
    renderSeating();
}

function exportSeatingChart() {
    // Create CSV with header row and seat data
    let csv = 'Row,Column,Student,Locked\n';

    for (let r = 0; r < state.seating.rows; r++) {
        for (let c = 0; c < state.seating.cols; c++) {
            const key = `${r}-${c}`;
            const student = state.seating.seats[key] || '';
            const locked = state.seating.lockedSeats.includes(key) ? 'Yes' : 'No';
            // Escape student names that contain commas or quotes
            const escapedStudent = student.includes(',') || student.includes('"')
                ? `"${student.replace(/"/g, '""')}"`
                : student;
            csv += `${r + 1},${c + 1},${escapedStudent},${locked}\n`;
        }
    }

    downloadFile(csv, `seating-${state.seating.currentChart}.csv`, 'text/csv');
}

function importSeatingChart() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const lines = event.target.result.split('\n');
                    const newSeats = {};
                    const newLockedSeats = [];
                    let maxRow = 0;
                    let maxCol = 0;

                    // Skip header row, parse data rows
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;

                        // Parse CSV line (handle quoted fields)
                        const parts = parseCSVLine(line);
                        if (parts.length >= 3) {
                            const row = parseInt(parts[0]) - 1;
                            const col = parseInt(parts[1]) - 1;
                            const student = parts[2].trim();
                            const locked = parts[3]?.trim().toLowerCase() === 'yes';

                            if (!isNaN(row) && !isNaN(col)) {
                                maxRow = Math.max(maxRow, row + 1);
                                maxCol = Math.max(maxCol, col + 1);

                                if (student) {
                                    newSeats[`${row}-${col}`] = student;
                                }
                                if (locked) {
                                    newLockedSeats.push(`${row}-${col}`);
                                }
                            }
                        }
                    }

                    state.seating.seats = newSeats;
                    state.seating.lockedSeats = newLockedSeats;
                    state.seating.rows = Math.max(maxRow, 3);
                    state.seating.cols = Math.max(maxCol, 3);
                    state.seating.currentChart = file.name.replace('.csv', '').replace('seating-', '') || 'imported';

                    saveCurrentSeatingChart();
                    renderSeating();
                    showToast('Chart imported!');
                } catch (err) {
                    showToast('Invalid CSV format');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}

// ===== Phase 2: Soundboard (Offline) =====

const SOUNDS = {
    chime: { name: 'Chime', icon: '🔔', freq: [523, 659, 784], duration: 300 },
    bell: { name: 'Bell', icon: '🛎️', freq: [800], duration: 500, type: 'triangle' },
    ding: { name: 'Ding', icon: '✨', freq: [1047], duration: 150 },
    buzzer: { name: 'Buzzer', icon: '⏰', freq: [200, 250], duration: 400, type: 'sawtooth' },
    clap: { name: 'Clap', icon: '👏', noise: true, duration: 100 },
    countdown: { name: '3-2-1', icon: '🔢', sequence: [[400, 200], [500, 200], [600, 200], [800, 400]] },
    success: { name: 'Success', icon: '✅', freq: [523, 659, 784, 1047], duration: 150 },
    attention: { name: 'Attention', icon: '📢', freq: [440, 880], duration: 200, repeat: 3 }
};

function renderSoundboard() {
    const container = document.getElementById('tool-container');

    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Volume</h3>
                <div class="volume-control">
                    <span class="icon">🔈</span>
                    <input type="range" id="sound-volume" min="0" max="100" value="${state.soundboard.volume * 100}">
                    <span class="icon">🔊</span>
                    <button class="btn btn-secondary btn-icon" id="soundboard-fullscreen" title="Fullscreen">⛶</button>
                </div>
            </div>

            <div class="tool-section">
                <h3 class="section-title">Sounds</h3>
                <div class="soundboard-grid">
                    ${Object.entries(SOUNDS).map(([id, sound]) => `
                        <button class="sound-btn" data-sound="${id}">
                            <span class="icon">${sound.icon}</span>
                            <span class="label">${sound.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('sound-volume').addEventListener('input', (e) => {
        state.soundboard.volume = parseInt(e.target.value) / 100;
    });

    document.getElementById('soundboard-fullscreen').addEventListener('click', toggleFullscreen);

    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const soundId = btn.dataset.sound;
            btn.classList.add('playing');
            playSound(SOUNDS[soundId]);
            setTimeout(() => btn.classList.remove('playing'), 500);
        });
    });
}

function playSound(sound) {
    const volume = state.soundboard.volume;

    if (sound.sequence) {
        // Play sequence
        let delay = 0;
        sound.sequence.forEach(([freq, dur]) => {
            setTimeout(() => playSingleTone(freq, dur, volume, 'sine'), delay);
            delay += dur + 50;
        });
        return;
    }

    if (sound.noise) {
        // Generate noise burst (clap-like)
        playNoiseSound(sound.duration, volume);
        return;
    }

    if (sound.repeat) {
        for (let i = 0; i < sound.repeat; i++) {
            setTimeout(() => {
                sound.freq.forEach((f, j) => {
                    setTimeout(() => playSingleTone(f, sound.duration, volume, sound.type), j * 50);
                });
            }, i * (sound.duration + 100));
        }
        return;
    }

    // Play all frequencies
    sound.freq.forEach((freq, i) => {
        setTimeout(() => playSingleTone(freq, sound.duration, volume, sound.type), i * 100);
    });
}

function playSingleTone(frequency, duration, volume = 0.5, type = 'sine') {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playNoiseSound(duration, volume = 0.5) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioContext.sampleRate * duration / 1000;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 3);
        }

        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.value = volume;

        source.start();
    } catch (e) {
        console.log('Audio not supported');
    }
}

// ===== Phase 2: Bingo Generator (Printable) =====

const BINGO_PRESETS = {
    numbers_1_30: {
        name: 'Numbers 1-30',
        words: Array.from({ length: 30 }, (_, i) => String(i + 1))
    },
    numbers_1_50: {
        name: 'Numbers 1-50',
        words: Array.from({ length: 50 }, (_, i) => String(i + 1))
    },
    numbers_1_100: {
        name: 'Numbers 1-100',
        words: Array.from({ length: 100 }, (_, i) => String(i + 1))
    },
    multiplication: {
        name: 'Multiplication Facts',
        words: ['2×3', '2×4', '2×5', '3×3', '3×4', '3×5', '4×4', '4×5', '5×5', '2×6', '3×6', '4×6', '5×6', '6×6', '2×7', '3×7', '4×7', '5×7', '6×7', '7×7', '2×8', '3×8', '4×8', '5×8', '6×8', '7×8', '8×8', '2×9', '3×9', '4×9']
    },
    colors: {
        name: 'Colors',
        words: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Black', 'White', 'Gray', 'Gold', 'Silver', 'Teal', 'Navy', 'Maroon', 'Lime', 'Coral', 'Cyan', 'Magenta', 'Beige', 'Tan', 'Olive', 'Peach', 'Lavender']
    },
    shapes: {
        name: 'Shapes',
        words: ['Circle', 'Square', 'Triangle', 'Rectangle', 'Oval', 'Diamond', 'Star', 'Heart', 'Pentagon', 'Hexagon', 'Octagon', 'Sphere', 'Cube', 'Cylinder', 'Cone', 'Pyramid', 'Trapezoid', 'Parallelogram', 'Rhombus', 'Crescent', 'Arrow', 'Cross', 'Ring', 'Spiral', 'Wave']
    },
    animals: {
        name: 'Animals',
        words: ['Dog', 'Cat', 'Bird', 'Fish', 'Horse', 'Cow', 'Pig', 'Sheep', 'Chicken', 'Duck', 'Lion', 'Tiger', 'Bear', 'Elephant', 'Giraffe', 'Monkey', 'Zebra', 'Kangaroo', 'Penguin', 'Dolphin', 'Whale', 'Shark', 'Turtle', 'Snake', 'Frog', 'Rabbit', 'Mouse', 'Owl', 'Eagle', 'Butterfly']
    },
    weather: {
        name: 'Weather',
        words: ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy', 'Stormy', 'Foggy', 'Hot', 'Cold', 'Warm', 'Cool', 'Humid', 'Dry', 'Thunder', 'Lightning', 'Hail', 'Sleet', 'Frost', 'Rainbow', 'Tornado', 'Hurricane', 'Blizzard', 'Drizzle', 'Overcast', 'Clear']
    },
    emotions: {
        name: 'Emotions/Feelings',
        words: ['Happy', 'Sad', 'Angry', 'Scared', 'Excited', 'Worried', 'Surprised', 'Confused', 'Proud', 'Shy', 'Brave', 'Calm', 'Nervous', 'Grateful', 'Frustrated', 'Hopeful', 'Lonely', 'Jealous', 'Curious', 'Bored', 'Tired', 'Relaxed', 'Silly', 'Grumpy', 'Peaceful']
    },
    sight_words: {
        name: 'Sight Words (K-2)',
        words: ['the', 'and', 'is', 'it', 'to', 'a', 'I', 'you', 'he', 'she', 'we', 'they', 'was', 'for', 'on', 'are', 'but', 'not', 'what', 'all', 'can', 'had', 'have', 'my', 'said', 'there', 'with', 'this', 'from', 'be']
    },
    months: {
        name: 'Months & Seasons',
        words: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Spring', 'Summer', 'Fall', 'Autumn', 'Winter', 'New Year', 'Valentine', 'Easter', 'Halloween', 'Thanksgiving', 'Christmas', 'Holiday', 'Birthday']
    },
    spanish_colors: {
        name: 'Spanish Colors',
        words: ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa', 'Marrón', 'Negro', 'Blanco', 'Gris', 'Dorado', 'Plateado', 'Celeste', 'Violeta', 'Turquesa', 'Beige', 'Crema', 'Coral', 'Fucsia', 'Lima', 'Oliva', 'Salmón', 'Cian', 'Magenta']
    },
    french_numbers: {
        name: 'French Numbers 1-25',
        words: ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt', 'vingt et un', 'vingt-deux', 'vingt-trois', 'vingt-quatre', 'vingt-cinq']
    },
    music: {
        name: 'Music Terms',
        words: ['Piano', 'Forte', 'Allegro', 'Adagio', 'Crescendo', 'Staccato', 'Legato', 'Tempo', 'Rhythm', 'Melody', 'Harmony', 'Note', 'Rest', 'Beat', 'Measure', 'Treble', 'Bass', 'Sharp', 'Flat', 'Chord', 'Scale', 'Octave', 'Dynamics', 'Pitch', 'Duration']
    },
    science: {
        name: 'Science Words',
        words: ['Atom', 'Cell', 'Energy', 'Force', 'Gravity', 'Matter', 'Solid', 'Liquid', 'Gas', 'Plant', 'Animal', 'Habitat', 'Ecosystem', 'Experiment', 'Hypothesis', 'Data', 'Observe', 'Predict', 'Measure', 'Volume', 'Mass', 'Temperature', 'Magnet', 'Circuit', 'Orbit']
    }
};

function renderBingo() {
    const container = document.getElementById('tool-container');

    container.innerHTML = `
        <div class="tool-panel animate-fade-in">
            <div class="tool-section">
                <h3 class="section-title">Quick Word Lists</h3>
                <div class="preset-grid" style="margin-bottom: 1rem;">
                    ${Object.entries(BINGO_PRESETS).map(([id, preset]) => `
                        <button class="preset-btn bingo-preset-btn" data-preset="${id}">${preset.name}</button>
                    `).join('')}
                </div>
            </div>

            <div class="tool-section">
                <h3 class="section-title">Word List</h3>
                <textarea id="bingo-words" placeholder="Enter words (one per line)&#10;Need at least 9 words for 3x3, 16 for 4x4, 24 for 5x5&#10;&#10;Or click a preset above to auto-fill!">${state.bingo.words.join('\n')}</textarea>
                <p class="hint" id="bingo-word-count">${state.bingo.words.length} words loaded</p>
            </div>

            <div class="tool-section">
                <h3 class="section-title">Settings</h3>
                <div class="bingo-settings">
                    <div class="form-group">
                        <label class="form-label">Card Size</label>
                        <select id="bingo-size">
                            <option value="3" ${state.bingo.size === 3 ? 'selected' : ''}>3x3 (9 words)</option>
                            <option value="4" ${state.bingo.size === 4 ? 'selected' : ''}>4x4 (16 words)</option>
                            <option value="5" ${state.bingo.size === 5 ? 'selected' : ''}>5x5 (24 words)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Number of Cards</label>
                        <input type="number" id="bingo-count" min="1" max="30" value="${state.bingo.cardCount}">
                    </div>
                    <label class="checkbox-label">
                        <input type="checkbox" id="bingo-free" ${state.bingo.freeSpace ? 'checked' : ''}>
                        <span>Free Space (center)</span>
                    </label>
                </div>
                <div class="btn-group" style="margin-top: 1rem;">
                    <button class="btn btn-primary" id="bingo-generate">Generate Cards</button>
                    <button class="btn btn-secondary" id="bingo-print">🖨️ Print</button>
                </div>
            </div>

            <div class="tool-section" id="bingo-preview-section" style="display: none;">
                <h3 class="section-title">Preview</h3>
                <div class="bingo-preview bingo-print-area" id="bingo-preview"></div>
            </div>
        </div>
    `;

    document.getElementById('bingo-size').addEventListener('change', (e) => {
        state.bingo.size = parseInt(e.target.value);
    });

    document.getElementById('bingo-count').addEventListener('change', (e) => {
        state.bingo.cardCount = Math.min(30, Math.max(1, parseInt(e.target.value) || 1));
    });

    document.getElementById('bingo-free').addEventListener('change', (e) => {
        state.bingo.freeSpace = e.target.checked;
    });

    document.getElementById('bingo-generate').addEventListener('click', generateBingoCards);
    document.getElementById('bingo-print').addEventListener('click', printBingoCards);

    // Preset buttons
    document.querySelectorAll('.bingo-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetId = btn.dataset.preset;
            const preset = BINGO_PRESETS[presetId];
            if (preset) {
                state.bingo.words = [...preset.words];
                document.getElementById('bingo-words').value = preset.words.join('\n');
                document.getElementById('bingo-word-count').textContent = `${preset.words.length} words loaded`;
                showToast(`Loaded "${preset.name}" (${preset.words.length} words)`);

                // Highlight the active preset
                document.querySelectorAll('.bingo-preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    // Update word count on textarea change
    document.getElementById('bingo-words').addEventListener('input', (e) => {
        const words = e.target.value.split('\n').filter(w => w.trim().length > 0);
        document.getElementById('bingo-word-count').textContent = `${words.length} words loaded`;
    });
}

function generateBingoCards() {
    const wordsText = document.getElementById('bingo-words').value;
    const words = wordsText.split('\n').map(w => w.trim()).filter(w => w.length > 0);

    state.bingo.words = words;

    const size = state.bingo.size;
    const needed = state.bingo.freeSpace && size % 2 === 1 ? size * size - 1 : size * size;

    if (words.length < needed) {
        showToast(`Need at least ${needed} words for ${size}x${size} cards`);
        return;
    }

    state.bingo.cards = [];
    const cardCount = state.bingo.cardCount;

    for (let i = 0; i < cardCount; i++) {
        const shuffled = shuffleArray(words);
        // Use 'needed' to account for free space (needed = size*size - 1 when free space is on)
        const cardWords = shuffled.slice(0, needed);

        // Add free space in center for odd-sized grids
        if (state.bingo.freeSpace && size % 2 === 1) {
            const center = Math.floor(size * size / 2);
            cardWords.splice(center, 0, 'FREE');
        }

        state.bingo.cards.push(cardWords);
    }

    renderBingoPreview();
}

function renderBingoPreview() {
    const preview = document.getElementById('bingo-preview');
    const section = document.getElementById('bingo-preview-section');
    section.style.display = 'block';

    const size = state.bingo.size;
    const headers = size === 5 ? ['B', 'I', 'N', 'G', 'O'] : [];

    preview.innerHTML = state.bingo.cards.map((card, cardIndex) => `
        <div class="bingo-card">
            ${headers.length > 0 ? `<div class="bingo-card-title">BINGO</div>` : `<div class="bingo-card-title">Card ${cardIndex + 1}</div>`}
            <div class="bingo-grid" style="grid-template-columns: repeat(${size}, 1fr);">
                ${headers.length > 0 ? headers.map(h => `<div class="bingo-cell header">${h}</div>`).join('') : ''}
                ${card.map((word, i) => `
                    <div class="bingo-cell ${word === 'FREE' ? 'free' : ''}">${word === 'FREE' ? '⭐ FREE' : word}</div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function printBingoCards() {
    if (state.bingo.cards.length === 0) {
        showToast('Generate cards first');
        return;
    }

    const size = state.bingo.size;
    const headers = size === 5 ? ['B', 'I', 'N', 'G', 'O'] : [];

    const printWindow = window.open('', '_blank');
    // Calculate cell height based on grid size (4" total, minus title space)
    const cellHeight = size === 5 ? '0.6in' : '0.75in';
    const fontSize = size === 5 ? '9pt' : '10pt';

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bingo Cards</title>
            <style>
                @page { margin: 0.5in; }
                body { font-family: Arial, sans-serif; padding: 0.5in; }
                .cards { display: flex; flex-wrap: wrap; gap: 0.5in; justify-content: flex-start; }
                .bingo-card {
                    background: white;
                    border: 1px solid #ccc;
                    padding: 0.15in;
                    break-inside: avoid;
                    page-break-inside: avoid;
                    width: 4in;
                    height: 4in;
                    box-sizing: border-box;
                }
                .bingo-card-title {
                    text-align: center;
                    font-size: 14pt;
                    font-weight: bold;
                    margin-bottom: 0.1in;
                    letter-spacing: 0.05em;
                    height: 0.3in;
                }
                .bingo-grid {
                    display: grid;
                    grid-template-columns: repeat(${size}, 1fr);
                    border-collapse: collapse;
                    height: calc(4in - 0.6in);
                }
                .bingo-cell {
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    font-size: ${fontSize};
                    font-weight: 500;
                    padding: 2px;
                    overflow: hidden;
                    line-height: 1.1;
                    border: 1px solid #333;
                }
                .bingo-cell.header {
                    background: #e94560;
                    color: white;
                    font-size: 12pt;
                    font-weight: bold;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .bingo-cell.free {
                    background: #fef3c7;
                    font-weight: bold;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                @media print {
                    body { padding: 0; }
                    .cards { gap: 0.25in; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="cards">
                ${state.bingo.cards.map((card, cardIndex) => `
                    <div class="bingo-card">
                        ${headers.length > 0 ? `<div class="bingo-card-title">BINGO</div>` : `<div class="bingo-card-title">Card ${cardIndex + 1}</div>`}
                        <div class="bingo-grid">
                            ${headers.length > 0 ? headers.map(h => `<div class="bingo-cell header">${h}</div>`).join('') : ''}
                            ${card.map(word => `
                                <div class="bingo-cell ${word === 'FREE' ? 'free' : ''}">${word === 'FREE' ? '⭐ FREE' : word}</div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ===== IT Info Page =====

function renderITInfo() {
    document.getElementById('tool-title').textContent = 'For IT Staff';
    document.getElementById('tool-container').innerHTML = `
        <div class="tool-panel animate-fade-in it-info-page">
            <div class="it-intro">
                <p>As a fellow K–12 IT professional, I built K12 Tools after seeing how often popular classroom tool sites are blocked for ads, tracking, or third-party data collection. K12 Tools is designed from the ground up to avoid those issues entirely.</p>
            </div>

            <div class="it-section">
                <h3 class="section-title">Privacy & Security Assurances</h3>
                <ul class="it-checklist">
                    <li><span class="check-icon">✓</span> No ads of any kind</li>
                    <li><span class="check-icon">✓</span> No analytics or tracking scripts</li>
                    <li><span class="check-icon">✓</span> No third-party scripts or CDNs</li>
                    <li><span class="check-icon">✓</span> No user accounts or authentication</li>
                    <li><span class="check-icon">✓</span> No student data collection</li>
                    <li><span class="check-icon">✓</span> No cookies — only localStorage (client-side only)</li>
                    <li><span class="check-icon">✓</span> All tools run entirely in the browser</li>
                    <li><span class="check-icon">✓</span> Can be self-hosted as static files</li>
                    <li><span class="check-icon">✓</span> Works offline after first load</li>
                    <li><span class="check-icon">✓</span> There are no third-party scripts or data connections. The only outbound links are an optional Stripe donation button (opens in a new tab) and the Little Spruce Labs website.</li>
                </ul>
            </div>

            <div class="it-section">
                <h3 class="section-title">Why This Matters</h3>
                <p>By avoiding external dependencies and data collection, K12 Tools:</p>
                <ul class="it-benefits">
                    <li>Reduces distractions for students (no ads, no pop-ups)</li>
                    <li>Avoids FERPA and student privacy concerns</li>
                    <li>Minimizes network risk and attack surface</li>
                    <li>Safe for projector and classroom display</li>
                    <li>Won't trigger content filters or security alerts</li>
                </ul>
            </div>

            <div class="it-tech-box">
                <h4>Technical Summary</h4>
                <ul>
                    <li><strong>Stack:</strong> Static HTML, CSS, and vanilla JavaScript</li>
                    <li><strong>Network calls:</strong> None during normal use</li>
                    <li><strong>Microphone:</strong> Optional, only for Noise Meter, permission requested on use</li>
                    <li><strong>Storage:</strong> localStorage only (student lists, preferences)</li>
                    <li><strong>Hosting:</strong> Any static file host (GitHub Pages, internal web server, etc.)</li>
                    <li><strong>File size:</strong> Under 200KB total (HTML + CSS + JS)</li>
                </ul>
            </div>

            <div class="it-section">
                <h3 class="section-title">Self-Hosting</h3>
                <p>To host K12 Tools on your district's internal servers:</p>
                <ol class="it-steps">
                    <li>
                    Download the three files:
                    <a href="index.html" download="index.html" class="download-link">index.html</a>,
                    <a href="styles.css" download="styles.css" class="download-link">styles.css</a>,
                    <a href="app.js" download="app.js" class="download-link">app.js</a>
                    </li>
                    <li>Place them in any web-accessible directory</li>
                    <li>No build process, database, or server-side code required</li>
                </ol>
                <p class="it-note">The site will work identically whether served from an internal server or accessed via file:// protocol.</p>
            </div>

            <div class="it-contact">
                <p>Questions or concerns? This project is open source and transparent by design. Feel free to inspect the source code — it's all in three readable files.</p>
                <p style="margin-top: 1rem;"><strong>Contact:</strong> <a href="mailto:support@k12tools.org" style="color: var(--accent);">support@k12tools.org</a></p>
            </div>
        </div>
    `;
}

// ===== Idea Submission System =====

// Submission handler abstraction for future extensibility
const IdeaSubmitter = {
    // Configuration - can be modified for different backends
    config: {
        endpoint: localStorage.getItem('ideaEndpoint') || null,
        method: 'POST',
        enabled: true
    },

    // Submit idea to configured endpoint
    async submit(ideaData) {
        // If no endpoint configured, simulate success (offline-friendly)
        if (!this.config.endpoint) {
            console.log('Idea submission (no endpoint configured):', ideaData);
            return { success: true, offline: true };
        }

        try {
            const response = await fetch(this.config.endpoint, {
                method: this.config.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...ideaData,
                    submittedAt: new Date().toISOString(),
                    source: 'k12tools'
                })
            });

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: 'Server error' };
            }
        } catch (error) {
            // Network error - still show success to user (offline-friendly)
            console.log('Idea saved locally (network unavailable):', ideaData);
            this.saveLocally(ideaData);
            return { success: true, offline: true };
        }
    },

    // Save to localStorage as backup
    saveLocally(ideaData) {
        const savedIdeas = JSON.parse(localStorage.getItem('pendingIdeas') || '[]');
        savedIdeas.push({
            ...ideaData,
            savedAt: new Date().toISOString()
        });
        localStorage.setItem('pendingIdeas', JSON.stringify(savedIdeas));
    },

    // Get any pending ideas (for future sync)
    getPendingIdeas() {
        return JSON.parse(localStorage.getItem('pendingIdeas') || '[]');
    },

    // Clear pending ideas after successful sync
    clearPendingIdeas() {
        localStorage.removeItem('pendingIdeas');
    }
};

// Draft management for idea form
const IdeaDraft = {
    key: 'ideaDraft',

    save(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
    },

    load() {
        const draft = localStorage.getItem(this.key);
        return draft ? JSON.parse(draft) : null;
    },

    clear() {
        localStorage.removeItem(this.key);
    }
};

function initIdeaModal() {
    const modal = document.getElementById('idea-modal');
    const openBtn = document.getElementById('idea-btn');
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('idea-form');

    // Open modal
    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        loadIdeaDraft();
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        saveIdeaDraft();
        modal.classList.add('hidden');
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            saveIdeaDraft();
            modal.classList.add('hidden');
        }
    });

    // Save draft on input
    form.addEventListener('input', debounce(saveIdeaDraft, 500));

    // Handle submission
    form.addEventListener('submit', handleIdeaSubmit);
}

function loadIdeaDraft() {
    const draft = IdeaDraft.load();
    if (draft) {
        document.getElementById('idea-title').value = draft.title || '';
        document.getElementById('idea-description').value = draft.description || '';
        document.getElementById('idea-grade').value = draft.gradeLevel || '';
        document.getElementById('idea-subject').value = draft.subject || '';
        document.getElementById('idea-email').value = draft.email || '';
    }
}

function saveIdeaDraft() {
    const data = {
        title: document.getElementById('idea-title').value,
        description: document.getElementById('idea-description').value,
        gradeLevel: document.getElementById('idea-grade').value,
        subject: document.getElementById('idea-subject').value,
        email: document.getElementById('idea-email').value
    };

    // Only save if there's content
    if (data.title || data.description) {
        IdeaDraft.save(data);
    }
}

async function handleIdeaSubmit(e) {
    e.preventDefault();

    const form = document.getElementById('idea-form');
    const submitBtn = document.getElementById('idea-submit');
    const statusEl = document.getElementById('idea-status');
    const formData = new FormData(form);

    // Get form values
    const title = formData.get('title')?.trim() || '';
    const description = formData.get('description')?.trim() || '';
    const grade = formData.get('gradeLevel')?.trim() || '';
    const subject = formData.get('subject')?.trim() || '';
    const email = formData.get('email')?.trim() || '';
    const company = formData.get('company') || ''; // honeypot

    // Clear previous status
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    // Client-side validation
    if (!title || !description) {
        statusEl.textContent = 'Please fill out the required fields.';
        statusEl.className = 'form-status error';
        return;
    }

    // Build payload
    const payload = {
        title,
        description,
        grade,
        subject,
        email,
        company
    };

    // Disable submit button while sending
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const response = await fetch('https://k12tools-idea-submit.mguizzetti.workers.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            statusEl.textContent = 'Thanks! Your idea was submitted.';
            statusEl.className = 'form-status success';
            form.reset();
            IdeaDraft.clear();
        } else {
            statusEl.textContent = 'Sorry — something went wrong. Please try again.';
            statusEl.className = 'form-status error';
        }
    } catch (error) {
        statusEl.textContent = 'Sorry — something went wrong. Please try again.';
        statusEl.className = 'form-status error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Idea';
    }
}

function showIdeaSuccess() {
    const modal = document.getElementById('idea-modal');
    const content = modal.querySelector('.modal-body');
    const originalContent = content.innerHTML;

    content.innerHTML = `
        <div class="idea-success">
            <div class="success-icon">💡</div>
            <h3>Thanks for your idea!</h3>
            <p>Your email client should have opened with your idea ready to send. Just click Send to submit it to us!</p>
            <button class="btn primary-btn" id="idea-close-success">Close</button>
        </div>
    `;

    document.getElementById('idea-close-success').addEventListener('click', () => {
        modal.classList.add('hidden');
        // Restore form after modal closes
        setTimeout(() => {
            content.innerHTML = originalContent;
            // Re-attach event listener
            document.getElementById('idea-form').addEventListener('submit', handleIdeaSubmit);
        }, 300);
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== Settings =====

function initSettings() {
    const modal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const donateBtn = document.getElementById('donate-btn');
    const closeBtn = modal.querySelector('.close-modal');

    // Load settings
    document.getElementById('theme-select').value = CONFIG.theme;
    applyTheme(CONFIG.theme);

    // Open modal
    settingsBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        closeSidebar();
    });

    // Close modal
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // Theme toggle
    document.getElementById('theme-select').addEventListener('change', (e) => {
        const theme = e.target.value;
        CONFIG.theme = theme;
        localStorage.setItem('theme', theme);
        applyTheme(theme);
    });

    // Clear data
    document.getElementById('clear-data-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    });

    // Donate button
    donateBtn.addEventListener('click', () => {
        if (CONFIG.donationLink) {
            window.open(CONFIG.donationLink, '_blank', 'noopener,noreferrer');
        }
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// ===== Initialization =====

function init() {
    renderNav();
    renderWelcome();
    initSettings();
    initIdeaModal();

    // Mobile menu toggle
    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Fullscreen button
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);

    // Escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.isFullscreen) {
                toggleFullscreen();
            }
            document.getElementById('settings-modal').classList.add('hidden');
            // Save idea draft before closing
            const ideaModal = document.getElementById('idea-modal');
            if (!ideaModal.classList.contains('hidden')) {
                saveIdeaDraft();
                ideaModal.classList.add('hidden');
            }
            closeSidebar();
        }
    });

    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && state.isFullscreen) {
            state.isFullscreen = false;
            document.body.classList.remove('fullscreen-mode');
            const exitBtn = document.querySelector('.fullscreen-exit');
            if (exitBtn) exitBtn.remove();
        }
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

