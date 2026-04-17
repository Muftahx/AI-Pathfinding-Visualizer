import { solveGrid, compareGrid, ApiError } from "./api.js";
import * as Grid from "./grid.js";
import * as Animator from "./animator.js";
import * as Events from "./events.js";

// State
const state = {
    rows: 20,
    cols: 35,
    startPos: [10, 8],
    endPos: [10, 26],
    walls: new Set(),
    weights: new Map(),
    selectedAlgo: "bfs",
    selectedTool: "wall",
    animSpeed: 25,
};

const ALGO_LABELS = { bfs: "BFS", dfs: "DFS", dijkstra: "Dijkstra", astar: "A*" };
const key = (r, c) => `${r},${c}`;

// DOM refs
const dom = {
    grid: document.getElementById("grid"),
    btnRun: document.getElementById("btn-run"),
    btnCompare: document.getElementById("btn-compare"),
    speedDisplay: document.getElementById("speed-display"),
    statAlgo: document.getElementById("stat-algo"),
    statExplored: document.getElementById("stat-explored"),
    statPath: document.getElementById("stat-path"),
    statTime: document.getElementById("stat-time"),
    toast: document.getElementById("toast"),
    inputRows: document.getElementById("input-rows"),
    inputCols: document.getElementById("input-cols"),
    compareOverlay: document.getElementById("compare-overlay"),
    compareGrid: document.getElementById("compare-grid"),
    compareClose: document.getElementById("compare-close"),
};

// Toast
let _toastTimer = null;
function showToast(message, type = "") {
    clearTimeout(_toastTimer);
    dom.toast.textContent = message;
    dom.toast.className = `toast show ${type}`;
    _toastTimer = setTimeout(() => { dom.toast.className = "toast"; }, 3500);
}

// Drawing tools
function applyTool(r, c) {
    if (Animator.isRunning()) return;
    const k = key(r, c);
    const isStart = (r === state.startPos[0] && c === state.startPos[1]);
    const isEnd = (r === state.endPos[0] && c === state.endPos[1]);

    if (isStart && state.selectedTool !== "start") return;
    if (isEnd && state.selectedTool !== "end") return;

    switch (state.selectedTool) {
        case "start":
            Grid.removeCellClass(state.startPos[0], state.startPos[1], "start");
            Grid.clearCell(r, c, state.walls, state.weights);
            state.startPos = [r, c];
            Grid.addCellClass(r, c, "start");
            break;
        case "end":
            Grid.removeCellClass(state.endPos[0], state.endPos[1], "end");
            Grid.clearCell(r, c, state.walls, state.weights);
            state.endPos = [r, c];
            Grid.addCellClass(r, c, "end");
            break;
        case "wall":
            Grid.clearCell(r, c, state.walls, state.weights);
            state.walls.add(k);
            Grid.addCellClass(r, c, "wall");
            break;
        case "weight":
            Grid.clearCell(r, c, state.walls, state.weights);
            state.weights.set(k, 5);
            Grid.addCellClass(r, c, "weight");
            Grid.setCellText(r, c, "5");
            break;
        case "erase":
            Grid.clearCell(r, c, state.walls, state.weights);
            break;
    }
}

function onCellDown(r, c) {
    if (Animator.isRunning()) return;
    Events.setMouseDown(true);
    Grid.clearVisualization();
    applyTool(r, c);
}

function onCellEnter(r, c) {
    if (!Events.isMouseDown() || Animator.isRunning()) return;
    applyTool(r, c);
}

// Maze generators
function isSpecial(r, c) {
    return (r === state.startPos[0] && c === state.startPos[1]) ||
        (r === state.endPos[0] && c === state.endPos[1]);
}

function generateRandomWalls() {
    for (let r = 0; r < state.rows; r++)
        for (let c = 0; c < state.cols; c++)
            if (!isSpecial(r, c) && Math.random() < 0.3) state.walls.add(key(r, c));
}

function generateRecursiveDivision() {
    function divide(rS, rE, cS, cE, orient) {
        if (rE - rS < 2 || cE - cS < 2) return;
        if (orient === "h") {
            const wallRow = rS + 1 + Math.floor(Math.random() * (rE - rS - 1));
            const passage = cS + Math.floor(Math.random() * (cE - cS + 1));
            for (let c = cS; c <= cE; c++)
                if (c !== passage && !isSpecial(wallRow, c)) state.walls.add(key(wallRow, c));
            divide(rS, wallRow - 1, cS, cE, (cE - cS) > (wallRow - 1 - rS) ? "h" : "v");
            divide(wallRow + 1, rE, cS, cE, (cE - cS) > (rE - wallRow - 1) ? "h" : "v");
        } else {
            const wallCol = cS + 1 + Math.floor(Math.random() * (cE - cS - 1));
            const passage = rS + Math.floor(Math.random() * (rE - rS + 1));
            for (let r = rS; r <= rE; r++)
                if (r !== passage && !isSpecial(r, wallCol)) state.walls.add(key(r, wallCol));
            divide(rS, rE, cS, wallCol - 1, (wallCol - 1 - cS) < (rE - rS) ? "h" : "v");
            divide(rS, rE, wallCol + 1, cE, (cE - wallCol - 1) < (rE - rS) ? "h" : "v");
        }
    }
    divide(0, state.rows - 1, 0, state.cols - 1, state.cols > state.rows ? "v" : "h");
}

function generateSpiral() {
    let top = 0, bottom = state.rows - 1, left = 0, right = state.cols - 1, dir = 0;
    while (top <= bottom && left <= right) {
        if (dir === 0) {
            for (let c = left; c <= right; c++) if (!isSpecial(top, c)) state.walls.add(key(top, c));
            state.walls.delete(key(top, right)); top += 2;
        } else if (dir === 1) {
            for (let r = top; r <= bottom; r++) if (!isSpecial(r, right)) state.walls.add(key(r, right));
            state.walls.delete(key(bottom, right)); right -= 2;
        } else if (dir === 2) {
            for (let c = right; c >= left; c--) if (!isSpecial(bottom, c)) state.walls.add(key(bottom, c));
            state.walls.delete(key(bottom, left)); bottom -= 2;
        } else {
            for (let r = bottom; r >= top; r--) if (!isSpecial(r, left)) state.walls.add(key(r, left));
            state.walls.delete(key(top, left)); left += 2;
        }
        dir = (dir + 1) % 4;
    }
}

function generateStaircase() {
    let r = 0, c = 0;
    const stepW = Math.max(2, Math.floor(state.cols / 8));
    let down = true;
    while (c < state.cols) {
        const end = down
            ? Math.min(r + Math.floor(state.rows * 0.6), state.rows - 1)
            : Math.max(r - Math.floor(state.rows * 0.6), 0);
        const rDir = down ? 1 : -1;
        for (let i = r; down ? i <= end : i >= end; i += rDir)
            if (!isSpecial(i, c)) state.walls.add(key(i, c));
        r = end;
        for (let j = c; j < Math.min(c + stepW, state.cols); j++)
            if (!isSpecial(r, j)) state.walls.add(key(r, j));
        c += stepW;
        down = !down;
    }
}

const PATTERNS = {
    "random-walls": generateRandomWalls,
    "recursive-division": generateRecursiveDivision,
    "spiral": generateSpiral,
    "staircase": generateStaircase,
};

function inBounds(r, c) {
    return r >= 0 && r < state.rows && c >= 0 && c < state.cols;
}

function getNeighbours(r, c) {
    return [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
    ].filter(([nr, nc]) => inBounds(nr, nc) && !state.walls.has(key(nr, nc)));
}

function hasPath() {
    const startKey = key(...state.startPos);
    const endKey = key(...state.endPos);
    const visited = new Set([startKey]);
    const queue = [state.startPos];

    while (queue.length) {
        const [r, c] = queue.shift();
        if (key(r, c) === endKey) return true;

        for (const [nr, nc] of getNeighbours(r, c)) {
            const nbKey = key(nr, nc);
            if (!visited.has(nbKey)) {
                visited.add(nbKey);
                queue.push([nr, nc]);
            }
        }
    }

    return false;
}

function clearGuaranteedPath() {
    const [startRow, startCol] = state.startPos;
    const [endRow, endCol] = state.endPos;
    const horizontalFirst = Math.abs(endCol - startCol) >= Math.abs(endRow - startRow);

    const clearSegment = (from, to, fixed, horizontal) => {
        const step = from <= to ? 1 : -1;
        for (let value = from; value !== to + step; value += step) {
            const r = horizontal ? fixed : value;
            const c = horizontal ? value : fixed;
            state.walls.delete(key(r, c));
        }
    };

    if (horizontalFirst) {
        clearSegment(startCol, endCol, startRow, true);
        clearSegment(startRow, endRow, endCol, false);
    } else {
        clearSegment(startRow, endRow, startCol, false);
        clearSegment(startCol, endCol, endRow, true);
    }
}

function generatePattern(pattern) {
    const generator = PATTERNS[pattern];
    if (!generator) return false;

    const maxAttempts = pattern === "random-walls" ? 8 : pattern === "recursive-division" ? 10 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        state.walls.clear();
        state.weights.clear();
        generator();
        if (hasPath()) return true;
    }

    clearGuaranteedPath();
    return hasPath();
}

// Actions
function rebuildGrid() {
    Animator.cancel();
    Grid.buildGrid(state, onCellDown, onCellEnter);
}

function resetAll() {
    Animator.cancel();
    state.walls.clear();
    state.weights.clear();
    state.startPos = [Math.floor(state.rows / 2), Math.floor(state.cols * 0.25)];
    state.endPos = [Math.floor(state.rows / 2), Math.floor(state.cols * 0.75)];
    rebuildGrid();
    _resetStats();
    dom.btnRun.disabled = false;
    dom.btnRun.innerHTML = "▶ Visualize";
    showToast("🔄 Grid reset!");
}

function clearPath() {
    if (Animator.isRunning()) return;
    Animator.cancel();
    Grid.clearVisualization();
    dom.statExplored.textContent = "0";
    dom.statPath.textContent = "0";
    dom.statTime.textContent = "—";
}

function _resetStats() {
    dom.statExplored.textContent = "0";
    dom.statPath.textContent = "0";
    dom.statTime.textContent = "—";
}

/** Build payload from state and call the API. */
function _buildPayload() {
    const wallList = [];
    state.walls.forEach((k) => { const [r, c] = k.split(",").map(Number); wallList.push([r, c]); });
    const weightList = [];
    state.weights.forEach((w, k) => { const [r, c] = k.split(",").map(Number); weightList.push({ pos: [r, c], weight: w }); });
    return {
        algorithm: state.selectedAlgo,
        rows: state.rows, cols: state.cols,
        start: state.startPos, end: state.endPos,
        walls: wallList, weights: weightList,
    };
}

async function runAlgorithm() {
    if (Animator.isRunning()) return;
    Grid.clearVisualization();
    _resetStats();
    dom.statAlgo.textContent = ALGO_LABELS[state.selectedAlgo];
    dom.btnRun.disabled = true;
    dom.btnRun.innerHTML = '<span class="spinner"></span> Running…';

    const t0 = performance.now();
    try {
        const data = await solveGrid(_buildPayload());
        dom.statTime.textContent = `${((performance.now() - t0) / 1000).toFixed(2)}s (round-trip)`;

        Animator.animate({
            explored: data.explored, path: data.path, found: data.found,
            startPos: state.startPos, endPos: state.endPos, speed: state.animSpeed,
            onExploreStep: (i) => { dom.statExplored.textContent = String(i); },
            onPathStep: (i) => { dom.statPath.textContent = String(i); },
            onComplete: (found) => {
                dom.btnRun.disabled = false;
                dom.btnRun.innerHTML = "▶ Visualize";
                showToast(
                    found ? `✅ Path found! ${data.path.length - 1} moves, ${data.explored.length} nodes explored.`
                        : "❌ No path exists — the target is unreachable.",
                    found ? "success" : "error",
                );
            },
        });
    } catch (err) {
        dom.btnRun.disabled = false;
        dom.btnRun.innerHTML = "▶ Visualize";
        showToast(err instanceof ApiError ? err.message : "An unexpected error occurred.", "error");
        console.error("[Pathfinder]", err);
    }
}

// Comparison mode
const ALGO_META = {
    bfs: { icon: "🌊", label: "BFS" },
    dfs: { icon: "🔍", label: "DFS" },
    dijkstra: { icon: "⚖️", label: "Dijkstra" },
    astar: { icon: "⭐", label: "A*" },
};

function buildMiniGrid(result) {
    const exploredSet = new Set((result.explored || []).map(([r, c]) => `${r},${c}`));
    const pathSet = new Set((result.path || []).map(([r, c]) => `${r},${c}`));
    const wallSet = new Set();
    state.walls.forEach((k) => wallSet.add(k));
    const startKey = key(...state.startPos);
    const endKey = key(...state.endPos);

    let html = "";
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const k = key(r, c);
            let cls = "mini-cell";
            if (k === startKey) cls += " m-start";
            else if (k === endKey) cls += " m-end";
            else if (pathSet.has(k)) cls += " m-path";
            else if (wallSet.has(k)) cls += " m-wall";
            else if (state.weights.has(k) && !exploredSet.has(k)) cls += " m-weight";
            else if (exploredSet.has(k)) cls += " m-explored";
            html += `<div class="${cls}"></div>`;
        }
    }
    return html;
}

async function compareAllAlgorithms() {
    if (Animator.isRunning()) return;
    dom.btnCompare.disabled = true;
    dom.btnCompare.innerHTML = '<span class="spinner"></span> Comparing…';

    try {
        const data = await compareGrid(_buildPayload());

        // Find winner: lowest total_cost (weighted), fallback to path_length, tiebreak by explored
        let winnerId = null, bestCost = Infinity, bestExplored = Infinity;
        for (const [name, result] of Object.entries(data)) {
            if (result.found && result.stats) {
                const cost = result.stats.total_cost ?? result.stats.path_length;
                const eLen = result.stats.explored_count;
                if (cost < bestCost || (cost === bestCost && eLen < bestExplored)) {
                    bestCost = cost; bestExplored = eLen; winnerId = name;
                }
            }
        }

        dom.compareGrid.innerHTML = "";
        for (const algoName of ["bfs", "dfs", "dijkstra", "astar"]) {
            const result = data[algoName];
            if (!result) continue;
            const meta = ALGO_META[algoName];
            const stats = result.stats || {};
            const found = result.found;
            const isWinner = algoName === winnerId;

            let badgeHtml = "";
            if (!found) badgeHtml = `<span class="compare-badge badge-no-path">No Path</span>`;
            else if (isWinner) badgeHtml = `<span class="compare-badge badge-winner">🏆 Most Efficient</span>`;

            let costHtml = "";
            if (stats.total_cost !== undefined)
                costHtml = `<div class="compare-stat">Cost <strong>${stats.total_cost}</strong></div>`;

            const panel = document.createElement("div");
            panel.className = `compare-panel${isWinner ? " winner" : ""}`;
            panel.dataset.algo = algoName;
            panel.innerHTML = `
                <div class="compare-panel-header">
                    <div class="compare-algo-name"><span class="algo-icon">${meta.icon}</span>${meta.label}</div>
                    ${badgeHtml}
                </div>
                <div class="compare-stats">
                    <div class="compare-stat">Explored <strong>${stats.explored_count ?? "—"}</strong></div>
                    <div class="compare-stat">Path <strong>${found ? stats.path_length : "—"}</strong></div>
                    ${costHtml}
                </div>
                <div class="compare-mini-grid-wrap">
                    <div class="compare-mini-grid" style="grid-template-columns: repeat(${state.cols}, 12px);">${buildMiniGrid(result)}</div>
                </div>`;
            dom.compareGrid.appendChild(panel);
        }
        dom.compareOverlay.classList.add("open");
    } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Comparison failed.", "error");
        console.error("[Compare]", err);
    } finally {
        dom.btnCompare.disabled = false;
        dom.btnCompare.innerHTML = "⚡ Compare All";
    }
}

function closeCompare() { dom.compareOverlay.classList.remove("open"); }

dom.compareClose.addEventListener("click", closeCompare);
dom.compareOverlay.addEventListener("click", (e) => { if (e.target === dom.compareOverlay) closeCompare(); });
dom.btnCompare.addEventListener("click", compareAllAlgorithms);

// Bootstrap
Grid.init(dom.grid);
rebuildGrid();
dom.statAlgo.textContent = ALGO_LABELS[state.selectedAlgo];

Events.bindAll({
    onAlgoChange: (algo) => {
        if (Animator.isRunning()) return;
        state.selectedAlgo = algo;
        dom.statAlgo.textContent = ALGO_LABELS[algo];
    },
    onToolChange: (tool) => { if (!Animator.isRunning()) state.selectedTool = tool; },
    onSpeedChange: (raw) => {
        state.animSpeed = 155 - raw;
        dom.speedDisplay.textContent = `${state.animSpeed} ms`;
    },
    onGridSizeChange: () => {
        if (Animator.isRunning()) return;
        const r = Math.min(50, Math.max(5, parseInt(dom.inputRows.value, 10) || 20));
        const c = Math.min(60, Math.max(5, parseInt(dom.inputCols.value, 10) || 35));
        state.rows = r; state.cols = c;
        state.startPos = [Math.min(state.startPos[0], r - 1), Math.min(state.startPos[1], c - 1)];
        state.endPos = [Math.min(state.endPos[0], r - 1), Math.min(state.endPos[1], c - 1)];
        // Guarantee start ≠ end after clipping
        if (key(...state.startPos) === key(...state.endPos)) {
            if (state.endPos[1] + 1 < c) state.endPos[1] += 1;
            else if (state.endPos[1] - 1 >= 0) state.endPos[1] -= 1;
            else if (state.endPos[0] + 1 < r) state.endPos[0] += 1;
            else state.endPos[0] -= 1;
        }
        state.walls.clear(); state.weights.clear();
        rebuildGrid(); _resetStats();
    },
    onPatternSelect: (pattern) => {
        if (Animator.isRunning()) return;
        generatePattern(pattern);
        rebuildGrid();
        showToast("🏗️ Maze pattern generated!");
    },
    onRun: runAlgorithm,
    onClearPath: clearPath,
    onReset: resetAll,
    onEscape: () => {
        if (dom.compareOverlay.classList.contains("open")) { closeCompare(); return; }
        Animator.cancel();
        dom.btnRun.disabled = false;
        dom.btnRun.innerHTML = "▶ Visualize";
    },
});
