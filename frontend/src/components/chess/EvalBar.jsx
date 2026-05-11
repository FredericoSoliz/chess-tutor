import "./evalbar.css";

function evalToWhitePercent(scoreCp, mate) {
    if (mate !== null && mate !== undefined) {
        return mate > 0 ? 100 : 0;
    }
    if (scoreCp === null || scoreCp === undefined) {
        return 50;
    }
    // Lichess-like sigmoid mapping cp → win probability
    const winChance = 2 / (1 + Math.exp(-0.004 * scoreCp)) - 1;
    return 50 + 50 * winChance;
}

function formatEval(scoreCp, mate) {
    if (mate !== null && mate !== undefined) {
        return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
    }
    if (scoreCp === null || scoreCp === undefined) {
        return "—";
    }
    const pawns = scoreCp / 100;
    const sign = pawns >= 0 ? "+" : "";
    return `${sign}${pawns.toFixed(2)}`;
}

export default function EvalBar({ analysis, loading }) {
    const scoreCp = analysis?.score_cp;
    const mate = analysis?.mate;

    const whitePercent = evalToWhitePercent(scoreCp, mate);
    const blackPercent = 100 - whitePercent;
    const label = analysis ? formatEval(scoreCp, mate) : (loading ? "…" : "—");
    const isWhiteAdvantage = whitePercent >= 50;

    return (
        <div className="eval-bar" title={label}>
            <div className="eval-bar-track">
                <div
                    className="eval-bar-black"
                    style={{ height: `${blackPercent}%` }}
                />
                <div
                    className="eval-bar-white"
                    style={{ height: `${whitePercent}%` }}
                />
            </div>
            <div className={`eval-bar-label ${isWhiteAdvantage ? "on-white" : "on-black"}`}>
                {label}
            </div>
        </div>
    );
}
