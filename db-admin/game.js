const dropZone = document.getElementById('drop-zone');
const reqIdEl = document.getElementById('req-id');
const reqDescEl = document.getElementById('req-desc');
const resultsArea = document.getElementById('results-table');

let currentLevel = 0;
let builtQuery = []; // Array of string values

// --- LEVELS ---
const levels = [
    {
        id: 101,
        desc: "List all columns from the Employees table.",
        solution: ["SELECT", "*", "FROM", "EMPLOYEES"],
        preview: "Query OK. Returned 150 rows."
    },
    {
        id: 102,
        desc: "Find names of employees with salary greater than 50,000.",
        solution: ["SELECT", "name", "FROM", "EMPLOYEES", "WHERE", "salary", "> 50000"],
        preview: "Query OK. Returned 42 rows (High Earners)."
    },
    {
        id: 103,
        desc: "List names and locations by joining Employees with Departments.",
        solution: ["SELECT", "name", "FROM", "EMPLOYEES", "JOIN", "DEPARTMENTS", "ON", "dept_id"], // Simplified logic check
        // We will check key components rather than exact order due to UI limitations
        required: ["SELECT", "name", "FROM", "EMPLOYEES", "JOIN", "DEPARTMENTS"],
        preview: "Query OK. Returned 150 rows with locations."
    },
    {
        id: 104,
        desc: "Find employees in 'Sales' department.",
        solution: ["SELECT", "*", "FROM", "EMPLOYEES", "WHERE", "dept_id", "= 'Sales'"], // Simplification
        required: ["SELECT", "FROM", "EMPLOYEES", "WHERE", "= 'Sales'"],
        preview: "Query OK. Returned 12 Sales Reps."
    }
];

function loadLevel(idx) {
    if (idx >= levels.length) {
        alert("ALL REPORTS GENERATED. Good job.");
        currentLevel = 0; // Loop or finish
        idx = 0;
    }

    currentLevel = idx;
    const lvl = levels[idx];

    reqIdEl.textContent = lvl.id;
    reqDescEl.textContent = lvl.desc;

    // Reset Zone
    dropZone.innerHTML = '<div class="placeholder-text">Drag blocks here to build your query...</div>';
    builtQuery = [];
    resultsArea.innerHTML = '<div class="no-results">No data loaded.</div>';
}

// --- DRAG & DROP ---

document.querySelectorAll('.draggable-block').forEach(block => {
    block.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', block.dataset.val);
        e.dataTransfer.setData('type', block.classList.contains('command') ? 'command' : 'value');
        e.effectAllowed = 'copy';
    });
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const val = e.dataTransfer.getData('text/plain');
    const type = e.dataTransfer.getData('type');

    if (dropZone.querySelector('.placeholder-text')) {
        dropZone.innerHTML = '';
    }

    addBlockToZone(val, type);
});

function addBlockToZone(val, type) {
    const el = document.createElement('div');
    el.className = `draggable-block ${type}`;
    el.textContent = val;
    el.onclick = () => {
        el.remove();
        updateQueryFromDOM();
        if (dropZone.children.length === 0) {
            dropZone.innerHTML = '<div class="placeholder-text">Drag blocks here to build your query...</div>';
        }
    };
    dropZone.appendChild(el);
    updateQueryFromDOM();
}

function updateQueryFromDOM() {
    builtQuery = Array.from(dropZone.children)
        .filter(el => !el.classList.contains('placeholder-text'))
        .map(el => el.textContent);
}

// --- EXECUTION ---

document.getElementById('run-btn').onclick = () => {
    const lvl = levels[currentLevel];

    // Validation Logic
    // 1. Strict match or Partial Match?
    let passed = false;

    if (lvl.required) {
        // Check if all required blocks are present in builtQuery
        const allPresent = lvl.required.every(req => builtQuery.includes(req));
        passed = allPresent;
    } else {
        // Strict order match
        passed = JSON.stringify(builtQuery) === JSON.stringify(lvl.solution);
    }

    if (passed) {
        resultsArea.innerHTML = `<div class="success-msg">
            > EXECUTING...<br>
            > ${lvl.preview}<br>
            > <strong>SUCCESS: Report Generated.</strong>
        </div>`;

        setTimeout(() => {
            let savedLvl = parseInt(localStorage.getItem('vico_level_sql')) || 1;
            localStorage.setItem('vico_level_sql', savedLvl + 1);
            loadLevel(currentLevel + 1);
        }, 1500);

    } else {
        resultsArea.innerHTML = `<div class="error-msg">
            > EXECUTING...<br>
            > ERROR: Syntax Error or Invalid Logic.<br>
            > Expected similar to: ${lvl.solution.join(' ')}
        </div>`;
    }
};

document.getElementById('clear-btn').onclick = () => {
    loadLevel(currentLevel); // Reset
};

// Boss Key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('boss-overlay').classList.toggle('hidden');
    }
});

// Init
loadLevel(0);
