import chess
import chess.engine


class StockfishService:
    def __init__(self, engine_path: str):
        self.engine = chess.engine.SimpleEngine.popen_uci(engine_path)

    def analyze_position(self, fen: str, depth: int = 15):
        board = chess.Board(fen)

        info = self.engine.analyse(
            board,
            chess.engine.Limit(depth=depth)
        )

        result = self.engine.play(
            board,
            chess.engine.Limit(depth=depth)
        )

        score = info["score"].relative
        
        #evaluation in centipawns
        if score.is_mate():
            evaluation = f"mate {score.mate()}"
        else:
            evaluation = round(score.score() / 100, 2)

        return {
            "best_move": str(result.move),
            "evaluation": evaluation
        }

    def close(self):
        self.engine.quit()