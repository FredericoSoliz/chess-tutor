import {useEffect, useState} from "react";
import {Chessboard} from "react-chessboard";

import "./chessboard.css";

const PIECE_SYMBOLS = {
    w: { q: "♕", r: "♖", b: "♗", n: "♘" },
    b: { q: "♛", r: "♜", b: "♝", n: "♞" },
};

export default function ChessBoard({
                                       position,
                                       onMove,
                                       getMoves,
                                       lastMove,
                                       orientation = "white",
                                       turn = "w",
                                       arrows = [],
                                   }) {
    const [moveFrom, setMoveFrom] = useState("");
    const [optionSquares, setOptionSquares] = useState({});
    const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMoveFrom("");
        setOptionSquares({});
        setPendingPromotion(null);
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

    function isPromotionMove(from, to) {
        const moves = getMoves(from) || [];
        return moves.some(
            (m) => m.to === to && (m.flags?.includes("p") || m.promotion)
        );
    }

    function completePromotion(piece) {
        if (!pendingPromotion) return;
        const success = onMove({
            from: pendingPromotion.from,
            to: pendingPromotion.to,
            promotion: piece,
        });
        if (success) {
            setPendingPromotion(null);
            setMoveFrom("");
            setOptionSquares({});
        }
    }

    function cancelPromotion() {
        setPendingPromotion(null);
        setMoveFrom("");
        setOptionSquares({});
    }

    function onSquareClick({ square }) {
        if (!square) return;
        if (pendingPromotion) return; // ignore clicks while picker is open

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

        if (isPromotionMove(moveFrom, square)) {
            setPendingPromotion({ from: moveFrom, to: square });
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

        if (isPromotionMove(sourceSquare, targetSquare)) {
            setPendingPromotion({ from: sourceSquare, to: targetSquare });
            return false; // piece animates back; will be applied after picker
        }

        return onMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q",
        });
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

    function canDragPiece({ piece }) {
        return piece?.pieceType?.[0] === turn;
    }

    const options = {
        position,
        onSquareClick,
        onPieceDrop,
        canDragPiece,
        boardOrientation: orientation,
        squareStyles: {
            ...lastMoveStyles,
            ...optionSquares,
        },
        arrows,
        id: "main-board",
    };

    const promoSymbols = PIECE_SYMBOLS[turn] || PIECE_SYMBOLS.w;

    return (
        <div className="board-wrapper">
            <Chessboard options={options} />

            {pendingPromotion && (
                <div className="promotion-overlay" onClick={cancelPromotion}>
                    <div
                        className="promotion-picker"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="promotion-title">Promote to</div>
                        <div className="promotion-pieces">
                            {["q", "n", "r", "b"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => completePromotion(p)}
                                    className="promotion-piece"
                                    aria-label={`Promote to ${p}`}
                                >
                                    {promoSymbols[p]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
