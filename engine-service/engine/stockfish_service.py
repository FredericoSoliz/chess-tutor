import threading

import chess
import chess.engine


class StockfishService:
    def __init__(self, engine_path: str):
        self.engine = chess.engine.SimpleEngine.popen_uci(engine_path)
        self._lock = threading.Lock()

    def analyze_position(self, fen: str, depth: int = 15):
        board = chess.Board(fen)

        with self._lock:
            info = self.engine.analyse(
                board,
                chess.engine.Limit(depth=depth)
            )

        score = info["score"].white()

        score_cp = None
        mate = None

        if score.is_mate():
            mate = score.mate()
        else:
            score_cp = score.score()

        pv_moves = info.get("pv") or []
        pv = [m.uci() for m in pv_moves]
        best_move = pv[0] if pv else None

        return {
            "best_move": best_move,
            "score_cp": score_cp,
            "mate": mate,
            "pv": pv,
            "depth": info.get("depth", depth),
        }

    def analyze_position_timed(self, fen: str, time_limit: float = 0.1):
        board = chess.Board(fen)

        with self._lock:
            info = self.engine.analyse(
                board,
                chess.engine.Limit(time=time_limit)
            )

        score = info["score"].white()
        score_cp = None
        mate = None

        if score.is_mate():
            mate = score.mate()
        else:
            score_cp = score.score()

        pv_moves = info.get("pv") or []
        pv = [m.uci() for m in pv_moves]
        best_move = pv[0] if pv else None

        return {
            "best_move": best_move,
            "score_cp": score_cp,
            "mate": mate,
            "pv": pv[:3],
            "depth": info.get("depth", 0),
        }

    def play_at_strength(self, fen: str, elo: int, time_limit: float = 1.0):
        board = chess.Board(fen)

        with self._lock:
            try:
                if elo >= 1320:
                    self.engine.configure({
                        "UCI_LimitStrength": True,
                        "UCI_Elo": int(elo),
                    })
                else:
                    skill = max(0, min(8, int((elo - 500) / 100)))
                    self.engine.configure({
                        "UCI_LimitStrength": False,
                        "Skill Level": skill,
                    })

                result = self.engine.play(
                    board,
                    chess.engine.Limit(time=time_limit),
                )
            finally:
                self.engine.configure({
                    "UCI_LimitStrength": False,
                    "Skill Level": 20,
                })

        move = result.move
        return {"uci": move.uci() if move else None}

    def close(self):
        self.engine.quit()
