let _isMouseDown = false;

export function bindAll(handlers) {
    _bindAlgoButtons(handlers.onAlgoChange);
    _bindToolButtons(handlers.onToolChange);
    _bindSpeedSlider(handlers.onSpeedChange);
    _bindGridSizeInputs(handlers.onGridSizeChange);
    _bindPatternSelect(handlers.onPatternSelect);
    _bindActionButtons(handlers.onRun, handlers.onClearPath, handlers.onReset);
    _bindKeyboard(handlers.onRun, handlers.onEscape);
    _bindGlobalMouse();
}

export function isMouseDown() { return _isMouseDown; }
export function setMouseDown(val) { _isMouseDown = val; }

function _bindAlgoButtons(onChange) {
    const buttons = document.querySelectorAll("#algo-buttons .algo-btn");
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            onChange(btn.dataset.algo);
        });
    });
}

function _bindToolButtons(onChange) {
    const buttons = document.querySelectorAll("#tool-buttons .tool-btn");
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            onChange(btn.dataset.tool);
        });
    });
}

function _bindSpeedSlider(onChange) {
    const slider = document.getElementById("speed-slider");
    if (!slider) return;
    slider.addEventListener("input", () => onChange(parseInt(slider.value, 10)));
}

function _bindGridSizeInputs(onChange) {
    document.getElementById("input-rows")?.addEventListener("change", onChange);
    document.getElementById("input-cols")?.addEventListener("change", onChange);
}

function _bindPatternSelect(onSelect) {
    const select = document.getElementById("pattern-select");
    if (!select) return;
    select.addEventListener("change", () => {
        const val = select.value;
        if (val) {
            onSelect(val);
            select.value = "";
        }
    });
}

function _bindActionButtons(onRun, onClearPath, onReset) {
    document.getElementById("btn-run")?.addEventListener("click", onRun);
    document.getElementById("btn-clear-path")?.addEventListener("click", onClearPath);
    document.getElementById("btn-reset")?.addEventListener("click", onReset);
}

function _bindKeyboard(onRun, onEscape) {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") onRun();
        if (e.key === "Escape") onEscape();
    });
}

function _bindGlobalMouse() {
    document.addEventListener("mouseup", () => { _isMouseDown = false; });
    document.addEventListener("touchend", () => { _isMouseDown = false; });
}
