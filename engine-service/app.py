from flask import Flask, request, jsonify
import atexit
import concurrent.futures
import io
import math
import os
import statistics

import chess
import chess.pgn
from engine.stockfish_service import StockfishService
from coach import llm_client
from coach import openings as openings_lookup
from coach.prompt import SYSTEM_PROMPT, build_coach_prompt

app = Flask(__name__)

ENGINE_PATH = os.getenv("STOCKFISH_PATH", "/usr/games/stockfish")

print(f"Using Stockfish at: {ENGINE_PATH}")

if not os.path.exists(ENGINE_PATH):
    raise Exception(f"Stockfish not found at {ENGINE_PATH}")

stockfish = StockfishService(ENGINE_PATH)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "engine-service"})


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()

    if not data or "fen" not in data:
        return jsonify({"error": "fen is required"}), 400

    fen = data["fen"]
    depth = data.get("depth", 15)

    try:
        result = stockfish.analyze_position(fen, depth)

        return jsonify({
            "fen": fen,
            "best_move": result["best_move"],
            "score_cp": result["score_cp"],
            "mate": result["mate"],
            "pv": result["pv"],
            "depth": result["depth"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _cp_loss(eval_before, eval_after, turn, mate_before, mate_after):
    if mate_before is not None:
        if turn == "w" and mate_before > 0:
            if mate_after is None or mate_after <= 0:
                return 9999
        elif turn == "b" and mate_before < 0:
            if mate_after is None or mate_after >= 0:
                return 9999

    if eval_before is None or eval_after is None:
        return 0

    if turn == "w":
        loss = eval_before - eval_after
    else:
        loss = eval_after - eval_before

    return max(0, loss)


def _win_percent(cp, mate):
    """Win probability for white (0-100). Lichess sigmoid."""
    if mate is not None:
        return 100.0 if mate > 0 else 0.0
    if cp is None:
        return 50.0
    return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * cp)) - 1)


def _move_accuracy(win_before, win_after):
    """Lichess per-move accuracy formula. win_* are from the mover's perspective."""
    drop = max(0.0, win_before - win_after)
    acc = 103.1668 * math.exp(-0.04354 * drop) - 3.1669
    return max(0.0, min(100.0, acc))


def _game_accuracy(per_move_accuracies, win_percents):
    if not per_move_accuracies:
        return None

    weights = []
    n = len(per_move_accuracies)
    for i in range(n):
        start = max(0, i - 2)
        end = min(len(win_percents), i + 3)
        window = win_percents[start:end]
        if len(window) > 1:
            std = statistics.pstdev(window)
        else:
            std = 0.5
        weights.append(max(0.5, min(12.0, std)))

    total_w = sum(weights)
    weighted = sum(a * w for a, w in zip(per_move_accuracies, weights)) / total_w
    return round(weighted, 2)


def _categorize(cp_loss, played_uci, best_uci):
    if played_uci == best_uci or cp_loss <= 5:
        return "best"
    if cp_loss <= 15:
        return "excellent"
    if cp_loss <= 40:
        return "good"
    if cp_loss <= 100:
        return "inaccuracy"
    if cp_loss <= 200:
        return "mistake"
    return "blunder"


@app.route("/analyze/pgn", methods=["POST"])
def analyze_pgn():
    data = request.get_json()

    if not data or "pgn" not in data:
        return jsonify({"error": "pgn is required"}), 400

    pgn_str = data["pgn"]
    time_per_move = float(data.get("time_per_move", 0.1))

    try:
        pgn_io = io.StringIO(pgn_str)
        game = chess.pgn.read_game(pgn_io)

        if game is None:
            return jsonify({"error": "invalid PGN"}), 400

        board = game.board()
        main_line = list(game.mainline_moves())

        if not main_line:
            return jsonify({"moves": []}), 200

        positions = []
        for move in main_line:
            san = board.san(move)
            turn = "w" if board.turn == chess.WHITE else "b"
            positions.append({
                "fen": board.fen(),
                "uci": move.uci(),
                "san": san,
                "turn": turn,
            })
            board.push(move)

        positions.append({
            "fen": board.fen(),
            "uci": None,
            "san": None,
            "turn": None,
        })

        evals = [
            stockfish.analyze_position_timed(pos["fen"], time_per_move)
            for pos in positions
        ]

        win_white = [_win_percent(e["score_cp"], e["mate"]) for e in evals]

        moves = []
        white_accs, black_accs = [], []
        white_wins, black_wins = [], []

        for i, pos in enumerate(positions[:-1]):
            e_before = evals[i]
            e_after = evals[i + 1]

            cp_loss = _cp_loss(
                e_before["score_cp"], e_after["score_cp"],
                pos["turn"],
                e_before["mate"], e_after["mate"],
            )
            category = _categorize(cp_loss, pos["uci"], e_before["best_move"])

            if pos["turn"] == "w":
                wb, wa = win_white[i], win_white[i + 1]
            else:
                wb, wa = 100 - win_white[i], 100 - win_white[i + 1]

            acc = _move_accuracy(wb, wa)

            if pos["turn"] == "w":
                white_accs.append(acc)
                white_wins.append(wb)
            else:
                black_accs.append(acc)
                black_wins.append(wb)

            moves.append({
                "ply": i + 1,
                "san": pos["san"],
                "uci": pos["uci"],
                "turn": pos["turn"],
                "score_cp_before": e_before["score_cp"],
                "score_cp_after": e_after["score_cp"],
                "mate_before": e_before["mate"],
                "mate_after": e_after["mate"],
                "best_move": e_before["best_move"],
                "cp_loss": cp_loss,
                "accuracy": round(acc, 2),
                "category": category,
            })

        if positions[:-1]:
            last_turn = positions[-2]["turn"]
            if last_turn == "w":
                white_wins.append(win_white[-1])
            else:
                black_wins.append(100 - win_white[-1])

        accuracy_white = _game_accuracy(white_accs, white_wins)
        accuracy_black = _game_accuracy(black_accs, black_wins)

        return jsonify({
            "moves": moves,
            "accuracy_white": accuracy_white,
            "accuracy_black": accuracy_black,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/play/coach-move", methods=["POST"])
def coach_move():
    data = request.get_json()

    if not data:
        return jsonify({"error": "missing body"}), 400

    fen_before = data.get("fen_before")
    user_move_uci = data.get("user_move")
    fen_after = data.get("fen_after")
    elo = int(data.get("elo", 1700))
    history_san = data.get("history") or []
    recent_user_moves = data.get("recent_user_moves") or []

    if not fen_after:
        return jsonify({"error": "fen_after required"}), 400

    has_user_move = bool(user_move_uci) and bool(fen_before)

    try:
        user_payload = None
        coach_prompt = None

        if has_user_move:
            eval_before = stockfish.analyze_position_timed(fen_before, 0.1)
            eval_after = stockfish.analyze_position_timed(fen_after, 0.1)

            board_before = chess.Board(fen_before)
            turn = "w" if board_before.turn == chess.WHITE else "b"
            cp_loss = _cp_loss(
                eval_before["score_cp"], eval_after["score_cp"],
                turn,
                eval_before["mate"], eval_after["mate"],
            )
            category = _categorize(cp_loss, user_move_uci, eval_before["best_move"])

            user_payload = {
                "uci": user_move_uci,
                "category": category,
                "cp_loss": cp_loss,
                "best_move": eval_before["best_move"],
                "score_cp": eval_after["score_cp"],
                "mate": eval_after["mate"],
            }

        board_after = chess.Board(fen_after)
        user_ended_game = board_after.is_game_over()

        if has_user_move:
            opening_match = openings_lookup.lookup_best([fen_before, fen_after])
            opening_eco = opening_match[0] if opening_match else None
            opening_name = opening_match[1] if opening_match else None

            coach_prompt = build_coach_prompt(
                fen_before=fen_before,
                user_move_uci=user_move_uci,
                history_san=history_san,
                recent_user_moves=recent_user_moves,
                category=user_payload["category"],
                cp_loss=user_payload["cp_loss"],
                score_cp_before=eval_before["score_cp"],
                score_cp_after=eval_after["score_cp"],
                mate_before=eval_before["mate"],
                mate_after=eval_after["mate"],
                best_move_uci=eval_before["best_move"],
                elo=elo,
                game_over=user_ended_game,
                result=(board_after.outcome().result() if user_ended_game and board_after.outcome() else None),
                opening_eco=opening_eco,
                opening_name=opening_name,
            )

        coach_message = None
        bot_uci = None
        fen_after_bot = fen_after
        game_over = user_ended_game
        result_str = None

        if user_ended_game:
            outcome = board_after.outcome()
            result_str = outcome.result() if outcome else None

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            llm_future = None
            if coach_prompt is not None:
                llm_future = pool.submit(
                    llm_client.chat,
                    [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": coach_prompt},
                    ],
                )

            if not user_ended_game:
                bot_result = stockfish.play_at_strength(fen_after, elo)
                bot_uci = bot_result["uci"]

                if bot_uci:
                    board_after.push(chess.Move.from_uci(bot_uci))
                    fen_after_bot = board_after.fen()
                    if board_after.is_game_over():
                        game_over = True
                        outcome = board_after.outcome()
                        if outcome:
                            result_str = outcome.result()

            if llm_future is not None:
                coach_message = llm_future.result()

        return jsonify({
            "user_move": user_payload,
            "bot_move": {"uci": bot_uci} if bot_uci else None,
            "fen_after_bot": fen_after_bot,
            "game_over": game_over,
            "result": result_str,
            "coach_message": coach_message,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def shutdown():
    print("Closing Stockfish engine...")
    stockfish.close()


atexit.register(shutdown)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
