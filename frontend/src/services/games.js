import api from "./api";

export async function listGames(filters = {}) {
    const params = {};

    if (filters.result) params.result = filters.result;
    if (filters.color) params.color = filters.color;
    if (filters.speed) params.speed = filters.speed;
    if (filters.opening) params.opening = filters.opening;
    if (filters.since) params.since = filters.since;
    if (filters.until) params.until = filters.until;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;

    const { data } = await api.get("/api/games", { params });
    return data;
}

export async function syncLichessGames() {
    const { data } = await api.post("/lichess/sync");
    return data;
}

export async function getGame(id) {
    const { data } = await api.get(`/api/games/${id}`);
    return data;
}

export async function analyzePosition(fen, depth = 15, signal = null) {
    const { data } = await api.post(
        "/api/analyze/position",
        { fen, depth },
        { signal },
    );
    return data;
}
