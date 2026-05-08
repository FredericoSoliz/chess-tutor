import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";

function buildPositionsFromPgn(pgn) {
    const game = new Chess();

    if (!pgn) {
        return null;
    }

    try {
        game.loadPgn(pgn);
    } catch {
        return null;
    }

    const verbose = game.history({ verbose: true });
    if (verbose.length === 0) return null;

    const replay = new Chess();
    const positions = [{ fen: replay.fen(), history: [], lastMove: null }];

    for (const m of verbose) {
        replay.move({ from: m.from, to: m.to, promotion: m.promotion });
        positions.push({
            fen: replay.fen(),
            history: positions[positions.length - 1].history.concat(m.san),
            lastMove: { from: m.from, to: m.to },
        });
    }

    return positions;
}

export default function useChessGame(initialPgn = null) {
    const initialFen = new Chess().fen();
    const emptyState = [{ fen: initialFen, history: [], lastMove: null }];

    const [position, setPosition] = useState(initialFen);
    const [positions, setPositions] = useState(emptyState);
    const [redoStack, setRedoStack] = useState([]);
    const [history, setHistory] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const [orientation, setOrientation] = useState("white");

    const loadPgn = useCallback((pgn) => {
        const built = buildPositionsFromPgn(pgn);

        if (!built) {
            setPosition(initialFen);
            setPositions(emptyState);
            setRedoStack([]);
            setHistory([]);
            setLastMove(null);
            return;
        }

        const start = built[0];
        const rest = built.slice(1).reverse();

        setPosition(start.fen);
        setPositions([start]);
        setRedoStack(rest);
        setHistory([]);
        setLastMove(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (initialPgn) loadPgn(initialPgn);
    }, [initialPgn, loadPgn]);

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
        const next = { fen, history: newHistory, lastMove: { from: m.from, to: m.to } };

        setRedoStack([]);
        setPositions((prev) => [...prev, next]);
        setPosition(fen);
        setHistory(newHistory);
        setLastMove(next.lastMove);

        return true;
    }

    function undo() {
        if (positions.length <= 1) return;

        const newPositions = positions.slice(0, -1);
        const current = positions[positions.length - 1];
        const prev = newPositions[newPositions.length - 1];

        setRedoStack((prevStack) => [...prevStack, current]);
        setPositions(newPositions);
        setPosition(prev.fen);
        setHistory(prev.history);
        setLastMove(prev.lastMove);
    }

    function redo() {
        if (redoStack.length === 0) return;

        const next = redoStack[redoStack.length - 1];

        setRedoStack((prev) => prev.slice(0, -1));
        setPositions((prev) => [...prev, next]);
        setPosition(next.fen);
        setHistory(next.history);
        setLastMove(next.lastMove);
    }

    function reset() {
        if (initialPgn) {
            loadPgn(initialPgn);
            return;
        }

        setPosition(initialFen);
        setPositions(emptyState);
        setRedoStack([]);
        setHistory([]);
        setLastMove(null);
    }

    function goToPly(ply) {
        const all = [...positions, ...redoStack.slice().reverse()];
        if (ply < 0 || ply >= all.length) return;

        const newPositions = all.slice(0, ply + 1);
        const newRedo = all.slice(ply + 1).reverse();
        const target = all[ply];

        setPositions(newPositions);
        setRedoStack(newRedo);
        setPosition(target.fen);
        setHistory(target.history);
        setLastMove(target.lastMove);
    }

    function getMoves(square) {
        const game = getGame();
        return game.moves({ square, verbose: true });
    }

    const turn = position.split(" ")[1];
    const currentPly = history.length;

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
        turn,
        currentPly,
        goToPly,
    };
}
