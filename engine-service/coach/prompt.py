from typing import List, Optional

import chess

SYSTEM_PROMPT = """You are a witty chess coach helping a player improve. Your job is to comment on the move they just played.

Style rules — these are strict:
- Reply in English only.
- 1-2 short sentences. Never more. Never a list.
- Didactic but with light humor.
- Be specific: name the move, the threat, the tactic, or the idea. Don't be generic.
- Never use chess clichés like "interesting move" or "let's see what happens".
- Never explain the rules or who is playing whom.

Tone by move category — follow strictly:
- best: warm compliment only. Do NOT suggest any alternative move; it WAS the best move.
- excellent: brief compliment. Do NOT mention any "preferred move" — the player nailed it.
- good: brief acknowledgement. You MAY very softly hint there was something slightly sharper, but DO NOT name a specific move (e.g. "solid choice — there might have been something a bit more incisive").
- inaccuracy: gentle nudge toward what was missed. You may name the engine's preferred move when it makes the point clearer.
- mistake: honest but kind, explain concretely what went wrong. Name the engine's preferred move.
- blunder: don't sugarcoat. Explain what they missed and name the engine's preferred move.

Opening phase (first ~6 plies of the game):
- If the prompt includes an "Opening:" line, ALWAYS mention that exact name in your reply (it's the verified name of the opening being played).
- Add a one-phrase comment on the character of the opening (e.g. "aggressive gambit", "solid setup", "hypermodern fianchetto"), but stay within the 1-2 sentence limit overall.
- If no Opening line is given, do NOT invent an opening name.

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


def _format_recent_moves(recent: List[dict]) -> str:
    if not recent:
        return "(none yet)"
    parts = []
    for m in recent:
        san = m.get("san", "?")
        cat = m.get("category", "?")
        cp = m.get("cp_loss")
        if cp is not None and cp > 0:
            parts.append(f"{san} ({cat}, -{cp}cp)")
        else:
            parts.append(f"{san} ({cat})")
    return ", ".join(parts)


def build_coach_prompt(
    *,
    fen_before: str,
    user_move_uci: str,
    history_san: List[str],
    recent_user_moves: List[dict],
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
    opening_eco: Optional[str] = None,
    opening_name: Optional[str] = None,
) -> str:
    move_san = _uci_to_san(fen_before, user_move_uci)

    tail = history_san[-6:]
    history_text = " ".join(tail) if tail else "(start of game)"

    eval_before = _format_eval(score_cp_before, mate_before)
    eval_after = _format_eval(score_cp_after, mate_after)

    is_opening = len(history_san) <= 6
    phase = "opening" if is_opening else ("middlegame" if len(history_san) <= 40 else "endgame")

    hide_best = category in ("best", "excellent")

    recent_text = _format_recent_moves(recent_user_moves)

    lines = [
        f"Context: The player has the white pieces and is facing an engine at approx. {elo} Elo.",
        f"Phase: {phase}",
    ]

    if opening_name:
        eco_part = f"{opening_eco} - " if opening_eco else ""
        lines.append(f"Opening: {eco_part}{opening_name}")
        if is_opening:
            lines.append("(You should mention this opening by name in your reply.)")

    lines.extend([
        f"Recent moves (both sides): {history_text}",
        f"Player's recent moves with feedback: {recent_text}",
        "",
        f"Player just played: {move_san} (uci {user_move_uci})",
        f"Eval before the move (white's POV): {eval_before}",
        f"Eval after the move (white's POV):  {eval_after}",
        f"Centipawn loss for the player: {cp_loss}",
        f"Category: {category}",
    ])

    if not hide_best and best_move_uci:
        best_san = _uci_to_san(fen_before, best_move_uci)
        lines.append(f"Engine's preferred move: {best_san}")

    if game_over:
        lines.append("")
        lines.append(f"The game is over. Result: {result or 'unknown'}.")
        lines.append("Write a single warm sentence about the outcome instead of analysing the move.")

    return "\n".join(lines)
