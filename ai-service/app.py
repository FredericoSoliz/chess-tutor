from flask import Flask, request, jsonify
import atexit
import os

from engine.stockfish_service import StockfishService

app = Flask(__name__)

ENGINE_PATH = os.getenv("STOCKFISH_PATH", "/usr/games/stockfish")

print(f"Using Stockfish at: {ENGINE_PATH}")

if not os.path.exists(ENGINE_PATH):
    raise Exception(f"Stockfish not found at {ENGINE_PATH}")

stockfish = StockfishService(ENGINE_PATH)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


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


def shutdown():
    print("Closing Stockfish engine...")
    stockfish.close()


atexit.register(shutdown)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
