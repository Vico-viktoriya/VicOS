const scatterArea = document.getElementById('scatter-area');
const timerDisplay = document.getElementById('timer-display');
const scoreDisplay = document.getElementById('score-display');
const bossOverlay = document.getElementById('boss-overlay');
const zones = document.querySelectorAll('.folder-zone');

// Config
let score = 0;
let timeLeft = 60;
let isPlaying = true;
let isBossMode = false;
let spawnTimer = 0;

const FILE_TYPES = [
    { type: 'doc', ext: '.docx', icon: '📄', color: '#4285f4' },
    { type: 'doc', ext: '.pdf', icon: '📄', color: '#db4437' },
    { type: 'doc', ext: '.txt', icon: '📝', color: '#888' },
    { type: 'img', ext: '.png', icon: '🖼️', color: '#0f9d58' },
    { type: 'img', ext: '.jpg', icon: '🖼️', color: '#0f9d58' },
    { type: 'trash', ext: '.exe', icon: '⚙️', color: '#333' }, // Suspicious executables to trash
    { type: 'trash', ext: '.tmp', icon: '🗑️', color: '#999' }
];

const NAMES = ["informe", "notas", "vacaciones", "setup", "budget", "logo", "error"];

function init() {
    spawnFile();
    spawnFile();
    spawnFile();
    requestAnimationFrame(loop);
}

// Drag & Drop
let draggedItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function loop(timestamp) {
    if (!isPlaying) return;

    // Timer
    if (!isBossMode) {
        // rough implementation using setInterval would be easier for timer but let's stick to frame loop for spawning
        // Using a separate interval for 1s ticks usually safer for display
    }

    requestAnimationFrame(loop);
}

// Game Loop / Ticker
setInterval(() => {
    if (!isPlaying || isBossMode) return;

    timeLeft--;
    timerDisplay.textContent = `Tiempo: ${timeLeft}s`;

    if (timeLeft <= 0) {
        endGame();
    }

    // Spawner
    if (Math.random() < 0.6) spawnFile(); // Chance per second? No, too slow.
}, 1000);

// Faster spawner
setInterval(() => {
    if (!isPlaying || isBossMode) return;
    if (document.querySelectorAll('.draggable-file').length < 15) {
        spawnFile();
    }
}, 800);


function spawnFile() {
    const template = FILE_TYPES[Math.floor(Math.random() * FILE_TYPES.length)];
    const name = NAMES[Math.floor(Math.random() * NAMES.length)] + template.ext;

    const el = document.createElement('div');
    el.className = 'draggable-file';
    el.innerHTML = `
        <div class="icon" style="color: ${template.color}">${template.icon}</div>
        <div class="name">${name}</div>
    `;

    // Random Pos
    const maxW = scatterArea.clientWidth - 80;
    const maxH = scatterArea.clientHeight - 80;
    el.style.left = Math.random() * maxW + 'px';
    el.style.top = Math.random() * maxH + 'px';
    el.style.zIndex = 1;

    el.dataset.type = template.type;

    // Events
    el.addEventListener('mousedown', onDragStart);

    scatterArea.appendChild(el);
}

function onDragStart(e) {
    if (isBossMode) return;
    draggedItem = e.currentTarget;
    const rect = draggedItem.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    draggedItem.style.zIndex = 1000;

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
}

function onDragMove(e) {
    if (!draggedItem) return;

    // Relative to scatter area? No, absolute is easier then mapped to relative
    // Actually parent is scatter-area which is relative.

    const containerRect = scatterArea.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffsetX;
    const y = e.clientY - containerRect.top - dragOffsetY;

    draggedItem.style.left = x + 'px';
    draggedItem.style.top = y + 'px';

    // Highlight drop zones
    checkHover(e.clientX, e.clientY);
}

function onDragEnd(e) {
    if (!draggedItem) return;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);

    // Check drop
    const dropped = checkDrop(e.clientX, e.clientY);

    if (!dropped) {
        draggedItem.style.zIndex = 1;
    }

    draggedItem = null;
    zones.forEach(z => z.classList.remove('drag-over'));
}

function checkHover(x, y) {
    zones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            zone.classList.add('drag-over');
        } else {
            zone.classList.remove('drag-over');
        }
    });
}

function checkDrop(x, y) {
    let hit = false;
    zones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            hit = true;
            const targetType = zone.dataset.type;
            const itemType = draggedItem.dataset.type;

            if (targetType === itemType) {
                // Correct
                score += 100;
                addXP(5);
                showFloatText("✅ +100", x, y, "green");
                draggedItem.remove();
            } else {
                // Wrong
                score -= 50;
                timeLeft -= 5; // Penalty
                showFloatText("❌ -5s", x, y, "red");
                // Bounce back? Or destroy anyway?
                // Destroy to keep flow, but punish
                draggedItem.remove();
            }
            scoreDisplay.textContent = `Puntos: ${score}`;
        }
    });
    return hit;
}

function showFloatText(text, x, y, color) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color;
    el.style.fontWeight = 'bold';
    el.style.fontSize = '20px';
    el.style.pointerEvents = 'none';
    el.style.transition = "all 0.5s";
    el.style.zIndex = 2000;

    document.body.appendChild(el);

    setTimeout(() => {
        el.style.transform = "translateY(-50px)";
        el.style.opacity = 0;
    }, 10);

    setTimeout(() => el.remove(), 500);
}

function addXP(amount) {
    let current = parseInt(localStorage.getItem('vicoTotalXP')) || 0;
    localStorage.setItem('vicoTotalXP', current + amount);
}

function endGame() {
    isPlaying = false;
    alert(`¡TIEMPO! Puntos Totales: ${score}\n\nLos archivos han sido organizados (más o menos).`);
    location.reload();
}

// Boss Key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        isBossMode = !isBossMode;
        bossOverlay.classList.toggle('hidden');
    }
});

// Resize handler (keep items inside?)
window.addEventListener('resize', () => {
    // just let them clip
});

init();
