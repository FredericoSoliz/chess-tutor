import api from "./api";

export async function coachMove({ fenBefore, userMove, fenAfter, elo, history = [] }) {
    const { data } = await api.post(
        "/api/coach/move",
        {
            fen_before: fenBefore,
            user_move: userMove,
            fen_after: fenAfter,
            elo,
            history,
        },
        { timeout: 30 * 1000 },
    );
    return data;
}
