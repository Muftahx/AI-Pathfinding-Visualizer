import * as Grid from "./grid.js";

let _pendingTimeouts = [];
let _isRunning = false;

export function isRunning() { return _isRunning; }

export function cancel() {
    _pendingTimeouts.forEach((id) => clearTimeout(id));
    _pendingTimeouts = [];
    _isRunning = false;
}

/** Animate explored nodes then path, with per-step callbacks. */
export function animate({ explored, path, found, startPos, endPos, speed, onExploreStep, onPathStep, onComplete }) {
    cancel();
    _isRunning = true;

    const isSpecial = (r, c) =>
        (r === startPos[0] && c === startPos[1]) ||
        (r === endPos[0] && c === endPos[1]);

    // Phase 1: Explored nodes
    explored.forEach(([r, c], i) => {
        if (isSpecial(r, c)) return;
        const tid = setTimeout(() => {
            const cell = Grid.getCell(r, c);
            if (cell) {
                cell.classList.remove("current-explore");
                cell.classList.add("explored");
            }
            // Highlight next frontier node
            if (i + 1 < explored.length) {
                const [nr, nc] = explored[i + 1];
                if (!isSpecial(nr, nc)) Grid.addCellClass(nr, nc, "current-explore");
            }
            if (onExploreStep) onExploreStep(i + 1);
        }, i * speed);
        _pendingTimeouts.push(tid);
    });

    // Phase 2: Path rendering
    const pathDelay = explored.length * speed + 250;
    const pathSpeed = speed + 20;

    if (found && path.length > 0) {
        path.forEach(([r, c], i) => {
            if (isSpecial(r, c)) return;
            const tid = setTimeout(() => {
                const cell = Grid.getCell(r, c);
                if (cell) {
                    cell.classList.remove("explored", "current-explore");
                    cell.classList.add("path");
                }
                if (onPathStep) onPathStep(i + 1);
            }, pathDelay + i * pathSpeed);
            _pendingTimeouts.push(tid);
        });
    }

    // Phase 3: Completion
    const totalDelay = pathDelay + (found ? path.length * pathSpeed : 0) + 120;
    const doneId = setTimeout(() => {
        document.querySelectorAll(".cell.current-explore")
            .forEach((c) => c.classList.remove("current-explore"));
        _isRunning = false;
        if (onComplete) onComplete(found);
    }, totalDelay);
    _pendingTimeouts.push(doneId);
}
