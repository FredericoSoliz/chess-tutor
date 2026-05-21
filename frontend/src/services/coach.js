import api from "./api";

export async function coachMove({
    fenBefore,
    userMove,
    fenAfter,
    elo,
    history = [],
    recentUserMoves = [],
}) {
    const { data } = await api.post(
        "/api/coach/move",
        {
            fen_before: fenBefore,
            user_move: userMove,
            fen_after: fenAfter,
            elo,
            history,
            recent_user_moves: recentUserMoves,
        },
        { timeout: 30 * 1000 },
    );
    return data;
}
