import { useState } from "react";
import { Chess } from "chess.js";

export default function useChessGame() {
    const initialGame = new Chess();
    const initialFen = initialGame.fen();

    const [position, setPosition] = useState(initialFen);
    const [positions, setPositions] = useState([
        { fen: initialFen, history: [] }
    ]);
    const [redoStack, setRedoStack] = useState([]);
    const [history, setHistory] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const [orientation, setOrientation] = useState("white");

    function getGame(fen = position) {
        return new Chess(fen);
    }

    function flip() {
        setOrientation((prev) => (prev === "white" ? "black" : "white"));
    }

    function move({ from, to, promotion = "q" }) {
        const game = getGame();
        const m = game.move({ from, to, promotion });
        if (!m) return false;

        const fen = game.fen();
        const newHistory = [...history, m.san];

        setRedoStack([]);
        setPositions(prev => [
            ...prev,
            { fen, history: newHistory }
        ]);
        setPosition(fen);
        setHistory(newHistory);
        setLastMove({ from: m.from, to: m.to });

        return true;
    }

    function undo() {
        if (positions.length <= 1) return;

        const newPositions = positions.slice(0, -1);
        const current = positions[positions.length - 1];
        const prev = newPositions[newPositions.length - 1];

        setRedoStack(prevStack => [...prevStack, current]);
        setPositions(newPositions);
        setPosition(prev.fen);
        setHistory(prev.history);
        setLastMove(null);
    }

    function redo() {
        if (redoStack.length === 0) return;

        const next = redoStack[redoStack.length - 1];

        setRedoStack(prev => prev.slice(0, -1));
        setPositions(prev => [...prev, next]);
        setPosition(next.fen);
        setHistory(next.history);
        setLastMove(null);
    }

    function reset() {
        const game = new Chess();
        const fen = game.fen();

        setPosition(fen);
        setPositions([{ fen, history: [] }]);
        setRedoStack([]);
        setHistory([]);
        setLastMove(null);
    }

    function getMoves(square) {
        const game = getGame();
        return game.moves({
            square,
            verbose: true,
        });
    }

    return {
        position,
        history,
        lastMove,
        move,
        undo,
        redo,
        reset,
        orientation,
        getMoves,
        flip,
    };
}