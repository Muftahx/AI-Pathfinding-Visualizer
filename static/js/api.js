export class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

const API_BASE = "/api/v1";
const TIMEOUT_MS = 30_000;

/** Send grid state to backend, receive exploration order + path. */
export async function solveGrid(payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${API_BASE}/solve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMsg = `Server responded with ${response.status}`;
            try {
                const body = await response.json();
                if (body.error) errorMsg = body.error;
            } catch { }
            throw new ApiError(errorMsg, response.status);
        }

        return await response.json();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof ApiError) throw err;
        if (err.name === "AbortError") {
            throw new ApiError("Request timed out — the server took too long to respond.", 408);
        }
        throw new ApiError("Could not connect to the backend. Is the server running?", 0);
    }
}

/** Run all 4 algorithms on the same grid, return combined results. */
export async function compareGrid(payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${API_BASE}/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMsg = `Server responded with ${response.status}`;
            try {
                const body = await response.json();
                if (body.error) errorMsg = body.error;
            } catch { }
            throw new ApiError(errorMsg, response.status);
        }

        return await response.json();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof ApiError) throw err;
        if (err.name === "AbortError") {
            throw new ApiError("Request timed out — the server took too long to respond.", 408);
        }
        throw new ApiError("Could not connect to the backend. Is the server running?", 0);
    }
}
