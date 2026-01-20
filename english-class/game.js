const segmentsContainer = document.getElementById('segment-container');
const srcTextEl = document.getElementById('current-source');
const optsContainer = document.getElementById('option-container');
const confirmBtn = document.getElementById('confirm-btn');
const scoreEl = document.getElementById('qa-score');

let segments = [];
let currentSegmentId = null;
let currentScore = 0;
let completedCount = 0;
let level = 1;

// --- CONTENT DATABASE ---
// Grammar topics: Present Simple, Continuous, Prepositions, Future, Comparatives
const tasks = [
    // Level 1: Present Simple / To Be
    {
        src: "Ella es la nueva gerente de marketing.",
        correct: "She is the new marketing manager.",
        dummy: ["She be the new marketing manager.", "She are the new marketing manager.", "She is the new marketing manage."]
    },
    {
        src: "Nosotros trabajamos en el tercer piso.",
        correct: "We work on the third floor.",
        dummy: ["We works on the third floor.", "We working on the third floor.", "We work in the third floor."] // Preposition trap
    },
    // Level 1: Present Continuous
    {
        src: "¿Qué estás haciendo ahora?",
        correct: "What are you doing now?",
        dummy: ["What you doing now?", "What are you do now?", "What is you doing now?"]
    },
    // Level 2: Future (Will/Going to)
    {
        src: "Voy a enviar el reporte mañana.",
        correct: "I am going to send the report tomorrow.",
        dummy: ["I will to send the report tomorrow.", "I going send the report tomorrow.", "I am go to send the report tomorrow."]
    },
    // Level 2: Prepositions of time
    {
        src: "La reunión es el lunes a las 9.",
        correct: "The meeting is on Monday at 9.",
        dummy: ["The meeting is in Monday on 9.", "The meeting is at Monday at 9.", "The meeting is on Monday in 9."]
    },
    // Level 3: Comparatives
    {
        src: "Este servidor es más rápido que el viejo.",
        correct: "This server is faster than the old one.",
        dummy: ["This server is more fast than the old one.", "This server is faster that the old one.", "This server is fastter than the old one."]
    },
    // Level 3: Modals (Must/Can)
    {
        src: "No debes compartir tu contraseña.",
        correct: "You mustn't share your password.",
        dummy: ["You don't must share your password.", "You not must share your password.", "You haven't to share your password."]
    },
    {
        src: "¿Puedes ayudarme con esto?",
        correct: "Can you help me with this?",
        dummy: ["Can you to help me with this?", "Do you can help me with this?", "Can you helping me with this?"]
    }
];

// --- GENERATOR ---

function generateSegments() {
    segmentsContainer.innerHTML = '';
    segments = [];

    // Pick 5 random tasks
    for (let i = 0; i < 5; i++) {
        const t = tasks[Math.floor(Math.random() * tasks.length)];
        // Shuffle options
        let opts = [t.correct, ...t.dummy].sort(() => Math.random() - 0.5);

        segments.push({
            id: i + 1,
            src: t.src,
            opts: opts,
            correct: t.correct,
            status: 'pending', // pending, approved, error
            userSelect: null
        });

        renderSegmentRow(segments[i]);
    }

    // Select first
    loadSegment(segments[0].id);
}

function renderSegmentRow(seg) {
    const row = document.createElement('div');
    row.className = `segment-row ${seg.status}`;
    row.dataset.id = seg.id;
    row.onclick = () => loadSegment(seg.id);

    // Status text
    let statusTxt = "Pending";
    if (seg.status === 'approved') statusTxt = "Approved";
    if (seg.status === 'error') statusTxt = "Flagged";

    row.innerHTML = `
        <span>${seg.id}</span>
        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${seg.src}</span>
        <span style="color:#666;">${seg.userSelect ? seg.userSelect.substring(0, 20) + "..." : "---"}</span>
        <div class="status-badge ${seg.status}">${statusTxt}</div>
    `;

    segmentsContainer.appendChild(row);
}

function loadSegment(id) {
    currentSegmentId = id;
    const seg = segments.find(s => s.id === id);

    // Highlight UI
    document.querySelectorAll('.segment-row').forEach(r => r.classList.remove('active'));
    document.querySelector(`.segment-row[data-id="${id}"]`).classList.add('active');

    srcTextEl.textContent = seg.src;
    renderOptions(seg);
}

function renderOptions(seg) {
    optsContainer.innerHTML = '';
    confirmBtn.disabled = true;

    if (seg.status !== 'pending') {
        // Read only view
        const div = document.createElement('div');
        div.className = 'option-btn selected';
        div.textContent = seg.userSelect;
        div.style.background = seg.status === 'approved' ? '#d4edda' : '#f8d7da';
        optsContainer.appendChild(div);
        return;
    }

    seg.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => {
            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            confirmBtn.disabled = false;
            seg.tempSelect = opt;
        };
        optsContainer.appendChild(btn);
    });
}

confirmBtn.onclick = () => {
    const seg = segments.find(s => s.id === currentSegmentId);
    if (!seg || !seg.tempSelect) return;

    seg.userSelect = seg.tempSelect;

    if (seg.userSelect === seg.correct) {
        seg.status = "approved";
        currentScore += 20;
    } else {
        seg.status = "error";
    }

    completedCount++;
    refreshList();

    // Auto next
    if (currentSegmentId < 5) loadSegment(currentSegmentId + 1);
    else checkComplete();
};

function refreshList() {
    segmentsContainer.innerHTML = '';
    segments.forEach(renderSegmentRow);
}

function checkComplete() {
    if (completedCount === 5) {
        scoreEl.textContent = `Quality Score: ${currentScore}%`;

        let msg = currentScore >= 80 ? "QA PASSED. Batch Uploading..." : "QA FAILED. Reviewing Grammar...";
        setTimeout(() => {
            alert(msg);
            // Save level
            let savedLvl = parseInt(localStorage.getItem('vico_level_english')) || 1;
            if (currentScore >= 80) {
                localStorage.setItem('vico_level_english', savedLvl + 1);
            }
            // Reset
            completedCount = 0;
            currentScore = 0;
            scoreEl.textContent = "Quality Score: 100%";
            generateSegments();
        }, 500);
    }
}

// Boss Key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('boss-overlay').classList.toggle('hidden');
    }
});

// Init
let savedLvl = localStorage.getItem('vico_level_english');
if (!savedLvl) localStorage.setItem('vico_level_english', 1);
generateSegments();
