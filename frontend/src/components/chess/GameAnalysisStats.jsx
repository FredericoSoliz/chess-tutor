import "./gameanalysisstats.css";

const CATEGORIES = [
    { key: "best", label: "Best", symbol: "★" },
    { key: "excellent", label: "Excellent", symbol: "!" },
    { key: "good", label: "Good", symbol: "" },
    { key: "inaccuracy", label: "Inaccuracy", symbol: "?!" },
    { key: "mistake", label: "Mistake", symbol: "?" },
    { key: "blunder", label: "Blunder", symbol: "??" },
];

function countCategories(moves, turn) {
    const counts = { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    for (const m of moves) {
        if (m.turn !== turn) continue;
        if (counts[m.category] !== undefined) counts[m.category] += 1;
    }
    return counts;
}

function avgCpLoss(moves, turn) {
    const filtered = moves.filter((m) => m.turn === turn);
    if (!filtered.length) return null;
    const sum = filtered.reduce((acc, m) => acc + (m.cp_loss || 0), 0);
    return Math.round(sum / filtered.length);
}

export default function GameAnalysisStats({ moveAnalysis, accuracy, detail }) {
    if (!moveAnalysis || moveAnalysis.length === 0) return null;

    const whiteCounts = countCategories(moveAnalysis, "w");
    const blackCounts = countCategories(moveAnalysis, "b");
    const whiteAcpl = avgCpLoss(moveAnalysis, "w");
    const blackAcpl = avgCpLoss(moveAnalysis, "b");

    const whiteName = detail?.white || "White";
    const blackName = detail?.black || "Black";

    return (
        <div className="stats-panel">
            <div className="stats-header">
                <span className="stats-header-side">
                    <span className="mh-king mh-king-white">♔</span>
                    <span className="stats-header-name">{whiteName}</span>
                </span>
                <span className="stats-header-vs">vs</span>
                <span className="stats-header-side">
                    <span className="mh-king mh-king-black">♚</span>
                    <span className="stats-header-name">{blackName}</span>
                </span>
            </div>

            <table className="stats-table">
                <tbody>
                    <tr className="stats-accuracy-row">
                        <td>Accuracy</td>
                        <td className="stats-accuracy-cell">
                            {accuracy?.white != null ? `${accuracy.white.toFixed(1)}%` : "—"}
                        </td>
                        <td className="stats-accuracy-cell">
                            {accuracy?.black != null ? `${accuracy.black.toFixed(1)}%` : "—"}
                        </td>
                    </tr>

                    {CATEGORIES.map((cat) => (
                        <tr key={cat.key} className={`stats-row stats-row-${cat.key}`}>
                            <td className="stats-cat-label">
                                {cat.symbol && (
                                    <span className={`stats-sym stats-sym-${cat.key}`}>
                                        {cat.symbol}
                                    </span>
                                )}
                                {cat.label}
                            </td>
                            <td>{whiteCounts[cat.key]}</td>
                            <td>{blackCounts[cat.key]}</td>
                        </tr>
                    ))}

                    <tr className="stats-acpl-row">
                        <td>Avg cp loss</td>
                        <td>{whiteAcpl != null ? whiteAcpl : "—"}</td>
                        <td>{blackAcpl != null ? blackAcpl : "—"}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
