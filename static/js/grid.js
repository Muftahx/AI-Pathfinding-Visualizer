let _gridEl = null;

export function init(gridElement) {
    _gridEl = gridElement;
}

/** Build the full grid DOM from application state. */
export function buildGrid(state, onCellDown, onCellEnter) {
    if (!_gridEl) throw new Error("grid.init() must be called first.");

    const { rows, cols, startPos, endPos, walls, weights } = state;

    _gridEl.innerHTML = "";
    _gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    _gridEl.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

    const fragment = document.createDocumentFragment();

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.id = `cell-${r}-${c}`;
            cell.dataset.row = r;
            cell.dataset.col = c;

            const k = _key(r, c);
            if (r === startPos[0] && c === startPos[1]) cell.classList.add("start");
            else if (r === endPos[0] && c === endPos[1]) cell.classList.add("end");
            else if (walls.has(k)) cell.classList.add("wall");
            else if (weights.has(k)) {
                cell.classList.add("weight");
                cell.textContent = weights.get(k);
            }

            cell.addEventListener("mousedown", (e) => { e.preventDefault(); onCellDown(r, c); });
            cell.addEventListener("mouseenter", () => onCellEnter(r, c));
            cell.addEventListener("touchstart", (e) => { e.preventDefault(); onCellDown(r, c); }, { passive: false });
            cell.addEventListener("touchmove", (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el?.dataset?.row !== undefined) onCellEnter(+el.dataset.row, +el.dataset.col);
            }, { passive: false });

            fragment.appendChild(cell);
        }
    }
    _gridEl.appendChild(fragment);
}

export function getCell(row, col) {
    return document.getElementById(`cell-${row}-${col}`);
}

/** Remove all state classes and clear text from a cell. */
export function clearCell(row, col, walls, weights) {
    const cell = getCell(row, col);
    if (!cell) return;
    cell.classList.remove("wall", "start", "end", "weight", "explored", "path", "current-explore");
    cell.textContent = "";
    const k = _key(row, col);
    walls.delete(k);
    weights.delete(k);
}

/** Remove only visualization overlays — keeps walls and nodes. */
export function clearVisualization() {
    document.querySelectorAll(".cell.explored, .cell.path, .cell.current-explore")
        .forEach((cell) => cell.classList.remove("explored", "path", "current-explore"));
}

export function addCellClass(row, col, className) {
    const cell = getCell(row, col);
    if (cell) cell.classList.add(className);
}

export function removeCellClass(row, col, className) {
    const cell = getCell(row, col);
    if (cell) cell.classList.remove(className);
}

export function setCellText(row, col, text) {
    const cell = getCell(row, col);
    if (cell) cell.textContent = text;
}

function _key(r, c) {
    return `${r},${c}`;
}
