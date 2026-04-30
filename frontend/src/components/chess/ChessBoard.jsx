import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";

import "./chessboard.css";

export default function ChessBoard({
                                       position,
                                       onMove,
                                       getMoves,
                                       lastMove,
                                       orientation = "white"
                                   }) {
    const [moveFrom, setMoveFrom] = useState("");
    const [optionSquares, setOptionSquares] = useState({});

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMoveFrom("");
        setOptionSquares({});
    }, [position]);

    function showMoves(square) {
        const moves = getMoves(square);

        if (!moves || moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares = {};

        moves.forEach((move) => {
            newSquares[move.to] = {
                background: move.captured
                    ? "rgba(220,20,60,0.30)"
                    : "radial-gradient(circle, rgba(0,0,0,.18) 25%, transparent 27%)",
            };
        });

        newSquares[square] = {
            background: "rgba(255,215,0,0.35)",
        };

        setOptionSquares({ ...newSquares });
        return true;
    }

    function onSquareClick({ square }) {
        if (!square) return;

        if (square === moveFrom) {
            setMoveFrom("");
            setOptionSquares({});
            return;
        }

        if (!moveFrom) {
            const hasMoves = showMoves(square);
            if (hasMoves) setMoveFrom(square);
            return;
        }

        const moves = getMoves(moveFrom);

        const isValidMove = moves?.some(
            (m) => m.from === moveFrom && m.to === square
        );

        if (!isValidMove) {
            const hasMoves = showMoves(square);

            if (hasMoves) {
                setMoveFrom(square);
            } else {
                setMoveFrom("");
                setOptionSquares({});
            }

            return;
        }

        const success = onMove({
            from: moveFrom,
            to: square,
            promotion: "q",
        });

        if (success) {
            setMoveFrom("");
            setOptionSquares({});
        }
    }

    function onPieceDrop({ sourceSquare, targetSquare }) {
        if (!targetSquare) return false;

        const success = onMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q",
        });

        return success;
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
        boardOrientation: orientation,
        squareStyles: {
            ...lastMoveStyles,
            ...optionSquares,
        },
        id: "main-board",
    };

    return (
        <div className="board-wrapper">
            <Chessboard options={options} />
        </div>
    );
}