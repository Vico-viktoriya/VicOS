const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const msgArea = document.getElementById('message-area');
const bossOverlay = document.getElementById('boss-overlay');

// Config
const GRAVITY = 0.4;
const GROUND_Y = 400; // Visual floor at 80% height (500*0.8=400)
const BOUNCE = 0.6;
const FRICTION = 0.98;

let score = 0;
let isBossMode = false;
let gameLoopId;
let shotsLeft = 5;
const MAX_SHOTS = 5;
let currentLevel = 1;
const MAX_LEVELS = 5;

// Entities
let intern = { x: 150, y: 300, vx: 0, vy: 0, r: 15, state: 'idle' }; // idle, drag, fly, finish
let targets = []; // Managers and blocks
let particles = [];

// Slingshot
const SLING = { x: 150, y: 300 };
let dragStart = null;
let dragCurrent = null;

function init() {
    setupLevel();

    // Interactions
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            isBossMode = !isBossMode;
            bossOverlay.classList.toggle('hidden');
        }
    });

    loop();
}

function setupLevel(lvl) {
    if (lvl) currentLevel = lvl;

    intern = { x: SLING.x, y: SLING.y, vx: 0, vy: 0, r: 15, state: 'idle' };
    targets = [];
    particles = [];
    msgArea.innerHTML = '';
    shotsLeft = MAX_SHOTS;
    updateHUDMessages();

    // Level Designs
    if (currentLevel === 1) {
        // "The Cubicle"
        for (let i = 0; i < 3; i++) {
            targets.push({ type: 'block', x: 600, y: 350 - (i * 60), w: 30, h: 60, hp: 2 });
            targets.push({ type: 'block', x: 700, y: 350 - (i * 60), w: 30, h: 60, hp: 2 });
        }
        targets.push({ type: 'block', x: 580, y: 160, w: 170, h: 20, hp: 3 });
        targets.push({ type: 'block', x: 580, y: 280, w: 170, h: 20, hp: 3 });
        targets.push({ type: 'enemy', x: 650, y: 380, r: 20, hp: 1 });
        targets.push({ type: 'enemy', x: 650, y: 260, r: 20, hp: 1 });
        targets.push({ type: 'enemy', x: 650, y: 140, r: 20, hp: 1 });
    }
    else if (currentLevel === 2) {
        // "The Corner Office" (Taller, thinner)
        for (let i = 0; i < 5; i++) {
            targets.push({ type: 'block', x: 650, y: 350 - (i * 60), w: 20, h: 60, hp: 2 });
            targets.push({ type: 'block', x: 730, y: 350 - (i * 60), w: 20, h: 60, hp: 2 });
        }
        targets.push({ type: 'block', x: 640, y: 50, w: 120, h: 20, hp: 4 }); // Penthouse roof
        targets.push({ type: 'enemy', x: 700, y: 380, r: 20, hp: 1 });
        targets.push({ type: 'enemy', x: 700, y: 200, r: 20, hp: 1 });
        targets.push({ type: 'enemy', x: 700, y: 30, r: 25, hp: 2 }); // Mini boss
    }
    else if (currentLevel === 3) {
        // "The Boardroom Bunker" (Wide, heavy)
        for (let i = 0; i < 4; i++) {
            targets.push({ type: 'block', x: 550 + (i * 60), y: 350, w: 50, h: 50, hp: 5 });
            targets.push({ type: 'block', x: 550 + (i * 60), y: 290, w: 50, h: 50, hp: 4 });
        }
        targets.push({ type: 'enemy', x: 580, y: 250, r: 20, hp: 2 });
        targets.push({ type: 'enemy', x: 700, y: 250, r: 20, hp: 2 });
        targets.push({ type: 'enemy', x: 640, y: 150, r: 35, hp: 5 }); // CEO
        targets.push({ type: 'block', x: 600, y: 200, w: 100, h: 20, hp: 10 }); // Desk
    }
    else if (currentLevel === 4) {
        // "The Server Farm" (Racks, narrow gaps)
        for (let i = 0; i < 4; i++) {
            // Server racks
            targets.push({ type: 'block', x: 500 + (i * 80), y: 320, w: 40, h: 80, hp: 4 });
            targets.push({ type: 'block', x: 500 + (i * 80), y: 220, w: 40, h: 80, hp: 4 });
        }
        targets.push({ type: 'block', x: 480, y: 140, w: 300, h: 10, hp: 6 }); // Cable conduit
        targets.push({ type: 'enemy', x: 520, y: 200, r: 15, hp: 2 }); // Sysadmin
        targets.push({ type: 'enemy', x: 600, y: 200, r: 15, hp: 2 });
        targets.push({ type: 'enemy', x: 680, y: 200, r: 15, hp: 2 });
        targets.push({ type: 'enemy', x: 600, y: 120, r: 25, hp: 3 }); // Head of IT
    }
    else if (currentLevel === 5) {
        // "The CEO Penthouse" (Floating platform, protected)
        // Base supports
        targets.push({ type: 'block', x: 600, y: 350, w: 20, h: 50, hp: 5 });
        targets.push({ type: 'block', x: 700, y: 350, w: 20, h: 50, hp: 5 });

        // Floating structure
        targets.push({ type: 'block', x: 550, y: 250, w: 200, h: 20, hp: 10 }); // Main floor
        targets.push({ type: 'block', x: 550, y: 150, w: 20, h: 100, hp: 8 }); // Left wall
        targets.push({ type: 'block', x: 730, y: 150, w: 20, h: 100, hp: 8 }); // Right wall
        targets.push({ type: 'block', x: 550, y: 130, w: 200, h: 20, hp: 10 }); // Roof

        // Elite Guards
        targets.push({ type: 'enemy', x: 600, y: 320, r: 15, hp: 3 });
        targets.push({ type: 'enemy', x: 700, y: 320, r: 15, hp: 3 });

        // THE CHAIRMAN
        targets.push({ type: 'enemy', x: 650, y: 220, r: 40, hp: 10 });
    }
}

function onMouseDown(e) {
    if (intern.state !== 'idle') return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if clicking near intern
    const dx = mx - intern.x;
    const dy = my - intern.y;
    if (dx * dx + dy * dy < 1600) { // 40 radius grab
        intern.state = 'drag';
        dragStart = { x: SLING.x, y: SLING.y };
        dragCurrent = { x: mx, y: my };
    }
}

function onMouseMove(e) {
    if (intern.state !== 'drag') return;
    const rect = canvas.getBoundingClientRect();
    dragCurrent = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Clamp drag distance
    const dx = dragCurrent.x - SLING.x;
    const dy = dragCurrent.y - SLING.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDrag = 200; // INCREASED
    if (dist > maxDrag) {
        const angle = Math.atan2(dy, dx);
        dragCurrent.x = SLING.x + Math.cos(angle) * maxDrag;
        dragCurrent.y = SLING.y + Math.sin(angle) * maxDrag;
    }

    intern.x = dragCurrent.x;
    intern.y = dragCurrent.y;
}

function onMouseUp(e) {
    if (intern.state !== 'drag') return;
    intern.state = 'fly';

    // Launch vector opposite to drag
    const power = 0.15;
    intern.vx = (SLING.x - intern.x) * power;
    intern.vy = (SLING.y - intern.y) * power;
}

function loop() {
    update();
    draw();
    gameLoopId = requestAnimationFrame(loop);
}

function update() {
    if (isBossMode) return;

    // Intern Physics
    if (intern.state === 'fly') {
        intern.vy += GRAVITY;
        intern.x += intern.vx;
        intern.y += intern.vy;

        // Floor bounce
        if (intern.y + intern.r > GROUND_Y) {
            intern.y = GROUND_Y - intern.r;
            intern.vy *= -BOUNCE;
            intern.vx *= FRICTION;

            // Relaxed stop condition: < 0.5
            if (Math.abs(intern.vx) < 0.5 && Math.abs(intern.vy) < 0.5) {
                if (!intern.isResetting) {
                    intern.isResetting = true;
                    setTimeout(resetShot, 500); // Faster reset
                }
            }
        }

        // Failsafe: Reset after 4 seconds of flying no matter what
        if (!intern.isResetting) {
            if (!intern.timer) intern.timer = setTimeout(() => {
                if (intern.state === 'fly') {
                    intern.isResetting = true;
                    resetShot();
                    intern.timer = null;
                }
            }, 4000);
        }

        // Wall bounce
        if (intern.x + intern.r > canvas.width || intern.x - intern.r < 0) {
            intern.vx *= -BOUNCE;
            intern.x = Math.max(intern.r, Math.min(canvas.width - intern.r, intern.x));
        }

        checkCollisions();
    }

    // Particles
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
    });
    particles = particles.filter(p => p.life > 0);
}

function checkCollisions() {
    targets.forEach(t => {
        if (t.hp <= 0) return;

        let hit = false;

        if (t.type === 'block') {
            // AABB vs Circle approx
            if (intern.x + intern.r > t.x && intern.x - intern.r < t.x + t.w &&
                intern.y + intern.r > t.y && intern.y - intern.r < t.y + t.h) {
                hit = true;
            }
        } else if (t.type === 'enemy') {
            // Circle vs Circle
            const dx = intern.x - t.x;
            const dy = intern.y - t.y;
            if (Math.sqrt(dx * dx + dy * dy) < intern.r + t.r) {
                hit = true;
            }
        }

        if (hit) {
            // Physics Impulse (Simple bounce)
            intern.vx *= -0.8;
            intern.vy *= -0.8;

            // Damage
            const impact = Math.sqrt(intern.vx * intern.vx + intern.vy * intern.vy);
            if (impact > 2) {
                t.hp--;
                createExplosion(t.x, t.y);
                if (t.hp <= 0) {
                    score += (t.type === 'enemy' ? 500 : 100);
                    addXP(10);
                    scoreEl.textContent = score;
                }
            }
        }
    });

    if (targets.filter(t => t.type === 'enemy' && t.hp > 0).length === 0 && !msgArea.textContent.includes('PURGADO')) {
        winLevel();
    }
}

function createExplosion(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 20, color: 'orange'
        });
    }
}

function resetShot() {
    if (targets.some(t => t.type === 'enemy' && t.hp > 0)) {
        if (shotsLeft > 0) {
            shotsLeft--;
            updateHUDMessages();

            // Reset position
            intern.state = 'idle';
            intern.isResetting = false;
            intern.x = SLING.x;
            intern.y = SLING.y;
            intern.vx = 0; intern.vy = 0;
        } else {
            // Out of ammo
            msgArea.classList.remove('hidden');
            shotsLeft--;
            updateHUDMessages();

            // Reset position
            // Out of ammo, but enemies still exist
            msgArea.classList.remove('hidden');
            msgArea.innerHTML = "<h1>¡SIN RECURSOS HUMANOS!</h1><br><button onclick='resetLevel()' style='padding:10px; font-size:20px; cursor:pointer;'>REINTENTAR</button>";
        }
    } else {
        // All enemies cleared, but shot reset was triggered (e.g., intern fell off screen after last enemy)
        intern.state = 'idle';
        intern.isResetting = false;
        intern.x = SLING.x;
        intern.y = SLING.y;
        intern.vx = 0; intern.vy = 0;
        msgArea.classList.remove('hidden');
        msgArea.innerHTML = "<h1>¡PROYECTO FINALIZADO!</h1><br><p>Todas las oficinas han sido optimizadas.</p><br><button onclick='location.reload()'>Volver al Inicio</button>";
    }
}

function winLevel() {
    msgArea.classList.remove('hidden');
    msgArea.textContent = `¡NIVEL ${currentLevel} PURGADO!`;
    addXP(100);

    currentLevel++;
    localStorage.setItem('vico_level_angryinterns', currentLevel); // Save Progress

    setTimeout(() => {
        if (currentLevel <= MAX_LEVELS) {
            setupLevel(currentLevel);
        } else {
            msgArea.textContent = "¡REESTRUCTURACIÓN COMPLETA!";
            setTimeout(() => {
                alert("Has optimizado toda la infraestructura.");
                location.reload();
            }, 2000);
        }
    }, 2000);
}

function resetLevel() {
    setupLevel(currentLevel);
}

function updateHUDMessages() {
    // Show remaining shots
    const title = document.querySelector('.title');
    if (title) title.textContent = `Nivel ${currentLevel} | Becarios: ${shotsLeft}`;
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Slingshot Cord (Back)
    if (intern.state === 'drag') {
        ctx.beginPath();
        ctx.moveTo(SLING.x - 10, SLING.y);
        ctx.lineTo(intern.x, intern.y);
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Targets
    targets.forEach(t => {
        if (t.hp <= 0) return;
        if (t.type === 'block') {
            ctx.fillStyle = '#8d6e63'; // Wood
            ctx.fillRect(t.x, t.y, t.w, t.h);
            ctx.strokeStyle = '#5d4037';
            ctx.strokeRect(t.x, t.y, t.w, t.h);
        } else {
            // Manager
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.fillStyle = '#ffccbc'; // Skin
            ctx.fill();
            // Tie
            ctx.fillStyle = 'red';
            ctx.fillRect(t.x - 5, t.y + 5, 10, 15);
        }
    });

    // Intern
    ctx.beginPath();
    ctx.arc(intern.x, intern.y, intern.r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffeb3b'; // Yellow Ball
    ctx.fill();
    // Helmet
    ctx.fillStyle = '#eee';
    ctx.fillRect(intern.x - 12, intern.y - 15, 24, 10);

    // Loop physics debug? Nah.

    // Slingshot Stick
    ctx.fillStyle = '#795548';
    ctx.fillRect(SLING.x - 5, SLING.y, 10, 100); // Pole

    // Slingshot Cord (Front)
    if (intern.state === 'drag') {
        ctx.beginPath();
        ctx.moveTo(SLING.x + 10, SLING.y);
        ctx.lineTo(intern.x, intern.y);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
}

function addXP(amount) {
    let current = parseInt(localStorage.getItem('vicoTotalXP')) || 0;
    localStorage.setItem('vicoTotalXP', current + amount);
}

init();
