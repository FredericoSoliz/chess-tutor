import { useEffect, useRef } from "react";
import "./movehistory.css";

function formatDate(ms) {
    if (!ms) return "";
    const d = new Date(ms);
    return d.toLocaleDateString("pt-PT");
}

function resultScore(winner) {
    if (winner === "white") return "1-0";
    if (winner === "black") return "0-1";
    return "½-½";
}

export default function MoveHistory({
                                        moves = [],
                                        currentPly = null,
                                        detail = null,
                                        onJumpTo = null,
                                    }) {
    const scrollRef = useRef(null);
    const activeRef = useRef(null);

    const displayMoves = moves;

    const rows = [];
    for (let i = 0; i < displayMoves.length; i += 2) {
        rows.push({
            move: i / 2 + 1,
            white: displayMoves[i] || "",
            black: displayMoves[i + 1] || "",
        });
    }

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ block: "nearest" });
        }
    }, [currentPly]);

    const headerWhite = detail?.white || "White";
    const headerBlack = detail?.black || "Black";
    const whiteRating = detail?.white_rating || "";
    const blackRating = detail?.black_rating || "";
    const openingName = detail?.opening_name || "";
    const openingEco = detail?.opening_eco || "";
    const speed = detail?.speed || "";
    const playedAt = detail?.played_at || null;
    const score = detail ? resultScore(detail.winner) : null;
    const openingLabel = openingEco && openingName
        ? `${openingEco} - ${openingName}`
        : openingEco || openingName;

    return (
        <div className="history-panel">
            <div className="history-header">
                <div className="mh-matchup">
                    <span className="mh-side">
                        <span className="mh-king mh-king-white">♔</span>
                        <span className="mh-name">{headerWhite}</span>
                        {whiteRating && <span className="mh-rating">{whiteRating}</span>}
                    </span>
                    <span className="mh-vs">vs</span>
                    <span className="mh-side">
                        <span className="mh-king mh-king-black">♚</span>
                        <span className="mh-name">{headerBlack}</span>
                        {blackRating && <span className="mh-rating">{blackRating}</span>}
                    </span>
                </div>
                {playedAt && <div className="mh-date">{formatDate(playedAt)}</div>}
            </div>

            {openingLabel && (
                <div className="captured-box mh-info-row">
                    <span className="mh-opening">{openingLabel}</span>
                </div>
            )}

            <div className="history-list" ref={scrollRef}>
                {rows.map((row, i) => {
                    const whitePly = i * 2 + 1;
                    const blackPly = i * 2 + 2;
                    const whiteActive = currentPly === whitePly;
                    const blackActive = currentPly === blackPly;

                    return (
                        <div className="history-row" key={row.move}>
                            <span className="move-number">{row.move}.</span>
                            <span
                                className={whiteActive ? "active-move" : ""}
                                ref={whiteActive ? activeRef : null}
                                onClick={onJumpTo ? () => onJumpTo(whitePly) : undefined}
                            >
                                {row.white}
                            </span>
                            <span
                                className={blackActive ? "active-move" : ""}
                                ref={blackActive ? activeRef : null}
                                onClick={row.black && onJumpTo ? () => onJumpTo(blackPly) : undefined}
                            >
                                {row.black}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="captured-box bottom mh-info-row">
                {score && <span className="mh-score">{score}</span>}
                {speed && <span className="mh-speed">{speed}</span>}
            </div>
        </div>
    );
}
