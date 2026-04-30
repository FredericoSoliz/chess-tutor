import { useEffect, useRef } from "react";
import "./movehistory.css";

export default function MoveHistory({
                                        moves = [],
                                        capturedWhite = [],
                                        capturedBlack = [],
                                    }) {
    const scrollRef = useRef(null);

    const iconsBlack = {
        p: "♟",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
    };

    const iconsWhite = {
        p: "♙",
        r: "♖",
        n: "♘",
        b: "♗",
        q: "♕",
        k: "♔",
    };

    function countPieces(arr = []) {
        return arr.reduce((acc, piece) => {
            acc[piece] = (acc[piece] || 0) + 1;
            return acc;
        }, {});
    }

    const topCaptured = countPieces(capturedWhite);
    const bottomCaptured = countPieces(capturedBlack);

    const rows = [];
    for (let i = 0; i < moves.length; i += 2) {
        rows.push({
            move: i / 2 + 1,
            white: moves[i] || "",
            black: moves[i + 1] || "",
        });
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop =
                scrollRef.current.scrollHeight;
        }
    }, [moves]);

    return (
        <div className="history-panel">
            <div className="history-header">
                Move History
            </div>

            <div className="captured-box">
                {Object.entries(topCaptured).map(([piece, qty]) => (
                    <span key={piece}>
                        {iconsWhite[piece]} x{qty}
                    </span>
                ))}
            </div>

            <div className="history-list" ref={scrollRef}>
                {rows.map((row) => (
                    <div className="history-row" key={row.move}>
                        <span className="move-number">
                            {row.move}.
                        </span>
                        <span>{row.white}</span>
                        <span>{row.black}</span>
                    </div>
                ))}
            </div>

            <div className="captured-box bottom">
                {Object.entries(bottomCaptured).map(([piece, qty]) => (
                    <span key={piece}>
                        {iconsBlack[piece]} x{qty}
                    </span>
                ))}
            </div>
        </div>
    );
}