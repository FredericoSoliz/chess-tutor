import csv
import io
import logging
from pathlib import Path
from typing import Optional, Tuple

import chess
import chess.pgn

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).parent / "openings_data"
_LOOKUP = None


def _pgn_to_epd(pgn_str: str) -> Optional[str]:
    try:
        game = chess.pgn.read_game(io.StringIO(pgn_str))
        if not game:
            return None
        board = game.board()
        for move in game.mainline_moves():
            board.push(move)
        return board.epd()
    except Exception:
        return None


def _load():
    global _LOOKUP
    if _LOOKUP is not None:
        return
    _LOOKUP = {}
    if not _DATA_DIR.exists():
        logger.warning("Openings data dir not found: %s", _DATA_DIR)
        return
    count = 0
    for tsv_file in sorted(_DATA_DIR.glob("*.tsv")):
        try:
            with open(tsv_file, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f, delimiter="\t")
                for row in reader:
                    epd = _pgn_to_epd(row.get("pgn", ""))
                    if epd:
                        _LOOKUP[epd] = (
                            row.get("eco", "").strip(),
                            row.get("name", "").strip(),
                        )
                        count += 1
        except Exception as e:
            logger.warning("Failed to read %s: %s", tsv_file, e)
    logger.info("Loaded %d openings from %d files", count, len(list(_DATA_DIR.glob("*.tsv"))))


def _fen_to_epd(fen: str) -> str:
    parts = fen.split()
    return " ".join(parts[:4]) if len(parts) >= 4 else fen


def lookup(fen: str) -> Optional[Tuple[str, str]]:
    _load()
    if not _LOOKUP:
        return None
    return _LOOKUP.get(_fen_to_epd(fen))


def lookup_best(fens):
    """Try each FEN in order and return the deepest match (longest opening name typically wins)."""
    _load()
    if not _LOOKUP:
        return None
    best = None
    for fen in fens:
        match = _LOOKUP.get(_fen_to_epd(fen))
        if match:
            best = match
    return best
