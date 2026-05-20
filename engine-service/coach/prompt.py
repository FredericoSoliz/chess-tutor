
from typing import List, Optional

import chess

SYSTEM_PROMPT = """You are a witty chess coach helping a player improve. Your job is to comment on the move they just played.

Style rules — these are strict:
- Reply in English only.
- 1-2 short sentences. Never more. Never a list.
- Didactic but with light humor — a chess Mr. Rogers, not a drill sergeant.
- Be specific: name the move, the threat, the tactic, or the idea. Don't be generic.
- Never use chess clichés like "interesting move" or "let's see what happens".
- Never explain the rules or who is playing whom.

Tone by move category:
- best / excellent: a quick, warm compliment. Sometimes a one-liner pun is fine.
- good: brief acknowledgement, no praise.
- inaccuracy: gentle nudge toward what was missed.
- mistake: honest but kind, point out concretely what went wrong.
- blunder: don't sugarcoat, but stay human. Mention what they missed and the engine's preferred move.

If the game just ended (checkmate / stalemate / draw), comment on the outcome warmly in one sentence.
"""


def _format_eval(cp: Optional[int], mate: Optional[int]) -> str:
    if mate is not None:
        if mate > 0:
            return f"M{mate} (white mates)"
        return f"-M{abs(mate)} (black mates)"
    if cp is None:
        return "0.00"
    pawns = cp / 100.0
    sign = "+" if pawns >= 0 else ""
    return f"{sign}{pawns:.2f}"


def _uci_to_san(fen: str, uci: str) -> str:
    try:
        board = chess.Board(fen)
        move = chess.Move.from_uci(uci)
        return board.san(move)
    except Exception:
        return uci


def build_coach_prompt(
    *,
    fen_before: str,
    user_move_uci: str,
    history_san: List[str],
    category: str,
    cp_loss: int,
    score_cp_before: Optional[int],
    score_cp_after: Optional[int],
    mate_before: Optional[int],
    mate_after: Optional[int],
    best_move_uci: Optional[str],
    elo: int,
    game_over: bool,
    result: Optional[str],
) -> str:

    move_san = _uci_to_san(fen_before, user_move_uci)
    best_san = _uci_to_san(fen_before, best_move_uci) if best_move_uci else "—"

    # Last 6 plies of history, formatted with move numbers
    tail = history_san[-6:]
    history_text = " ".join(tail) if tail else "(start of game)"

    eval_before = _format_eval(score_cp_before, mate_before)
    eval_after = _format_eval(score_cp_after, mate_after)

    lines = [
        "Context: The player has the white pieces and is facing an engine set to "
        f"approx. {elo} Elo.",
        f"Recent moves: {history_text}",
        "",
        f"Player just played: {move_san} (uci {user_move_uci})",
        f"Eval before the move (white's POV): {eval_before}",
        f"Eval after the move (white's POV):  {eval_after}",
        f"Centipawn loss for the player: {cp_loss}",
        f"Category: {category}",
        f"Engine's preferred move: {best_san}",
    ]

    if game_over:
        lines.append("")
        lines.append(f"The game is over. Result: {result or 'unknown'}.")
        lines.append("Write a single warm sentence about the outcome instead of analysing the move.")

    return "\n".join(lines)
