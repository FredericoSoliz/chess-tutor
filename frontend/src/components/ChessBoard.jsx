import { useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import MoveHistory from "./MoveHistory";
import "./chessboard.css";

export default function ChessBoard() {
    const chessGameRef = useRef(new Chess());
    const chessGame = chessGameRef.current;

    const [position, setPosition] = useState(chessGame.fen());
    const [moveFrom, setMoveFrom] = useState("");
    const [optionSquares, setOptionSquares] = useState({});
    const [lastMove, setLastMove] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [capturedWhite, setCapturedWhite] = useState([]);
    const [capturedBlack, setCapturedBlack] = useState([]);
    const [boardOrientation, setBoardOrientation] = useState("white");
    const [redoStack, setRedoStack] = useState([]);

    function rebuildCaptured() {
        const white = [];
        const black = [];

        chessGame.history({ verbose: true }).forEach((move) => {
            if (move.captured) {
                if (move.color === "w") {
                    black.push(move.captured);
                } else {
                    white.push(move.captured);
                }
            }
        });

        setCapturedWhite(white);
        setCapturedBlack(black);
    }

    function updateGameState(move) {
        setRedoStack([]);

        setLastMove({
            from: move.from,
            to: move.to,
        });

        setPosition(chessGame.fen());
        setMoveHistory(chessGame.history());
        rebuildCaptured();
        setMoveFrom("");
        setOptionSquares({});
    }

    function showMoves(square) {
        const moves = chessGame.moves({
            square,
            verbose: true,
        });

        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares = {};

        moves.forEach((move) => {
            const isCapture = chessGame.get(move.to);

            newSquares[move.to] = {
                background: isCapture
                    ? "rgba(220,20,60,0.30)"
                    : "radial-gradient(circle, rgba(0,0,0,.18) 25%, transparent 27%)",
            };
        });

        newSquares[square] = {
            background: "rgba(255,215,0,0.35)",
        };

        setOptionSquares(newSquares);
        return true;
    }

    function onSquareClick({ square, piece }) {
        if (!moveFrom && piece) {
            const hasMoves = showMoves(square);
            if (hasMoves) setMoveFrom(square);
            return;
        }

        try {
            const move = chessGame.move({
                from: moveFrom,
                to: square,
                promotion: "q",
            });

            updateGameState(move);
        } catch {
            setMoveFrom("");
            setOptionSquares({});
        }
    }

    function onPieceDrop({ sourceSquare, targetSquare }) {
        if (!targetSquare) return false;

        try {
            const move = chessGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q",
            });

            updateGameState(move);
            return true;
        } catch {
            return false;
        }
    }

    function handleUndo() {
        const undoneMove = chessGame.undo();

        if (!undoneMove) return;

        setRedoStack((prev) => [...prev, undoneMove]);

        setPosition(chessGame.fen());
        setMoveHistory(chessGame.history());
        setLastMove(null);
        setMoveFrom("");
        setOptionSquares({});
        rebuildCaptured();
    }

    function handleRedo() {
        if (redoStack.length === 0) return;

        const move = redoStack[redoStack.length - 1];

        try {
            const redoneMove = chessGame.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion || "q",
            });

            setRedoStack((prev) => prev.slice(0, -1));

            setLastMove({
                from: redoneMove.from,
                to: redoneMove.to,
            });

            setPosition(chessGame.fen());
            setMoveHistory(chessGame.history());
            rebuildCaptured();
            setMoveFrom("");
            setOptionSquares({});
        } catch {
            return;
        }
    }

    function handleReset() {
        chessGame.reset();

        setPosition(chessGame.fen());
        setMoveHistory([]);
        setCapturedWhite([]);
        setCapturedBlack([]);
        setLastMove(null);
        setMoveFrom("");
        setOptionSquares({});
        setRedoStack([]);
    }

    function handleFlip() {
        setBoardOrientation((prev) =>
            prev === "white" ? "black" : "white"
        );
    }

    const lastMoveStyles = lastMove
        ? {
            [lastMove.from]: {
                background: "rgba(255,215,0,0.25)",
            },
            [lastMove.to]: {
                background: "rgba(255,215,0,0.38)",
            },
        }
        : {};

    const options = {
        position,
        onSquareClick,
        onPieceDrop,
        boardOrientation,
        squareStyles: {
            ...lastMoveStyles,
            ...optionSquares,
        },
        id: "main-board",
    };

    return (
        <div className="game-container">
            <div className="board-side">
                <div className="board-wrapper">
                    <Chessboard options={options} />
                </div>

                <div className="board-controls">
                    <button onClick={handleUndo}>↶ Undo</button>
                    <button onClick={handleRedo}>↷ Redo</button>
                    <button onClick={handleReset}>↺ Reset</button>
                    <button onClick={handleFlip}>⇅ Flip</button>
                </div>
            </div>

            <MoveHistory
                moves={moveHistory}
                capturedWhite={capturedWhite}
                capturedBlack={capturedBlack}
            />
        </div>
    );
}