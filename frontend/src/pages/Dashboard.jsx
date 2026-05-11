import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import { getDashboard } from "../services/stats";
import { syncLichessGames } from "../services/games";

import "./dashboard.css";

const SPEEDS = ["bullet", "blitz", "rapid", "classical"];

function formatDate(ms) {
    if (!ms) return "";
    return new Date(ms).toLocaleDateString("pt-PT");
}

function ChangeBadge({ value }) {
    if (value == null) return <span className="dash-change neutral">—</span>;
    if (value > 0) return <span className="dash-change up">+{value}</span>;
    if (value < 0) return <span className="dash-change down">{value}</span>;
    return <span className="dash-change neutral">0</span>;
}

function RatingChart({ points }) {
    const svgRef = useRef(null);
    const [hover, setHover] = useState(null); // { i, px, py }

    if (!points || points.length < 2) {
        return <div className="dash-empty-chart">Not enough data for this speed</div>;
    }

    const width = 600;
    const height = 200;
    const padX = 30;
    const padY = 20;

    const ratings = points.map((p) => p.rating);
    const minR = Math.min(...ratings);
    const maxR = Math.max(...ratings);
    const range = Math.max(1, maxR - minR);

    const xs = points.map((_, i) => padX + (i / (points.length - 1)) * (width - 2 * padX));
    const ys = points.map((p) => padY + (1 - (p.rating - minR) / range) * (height - 2 * padY));

    const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(" ");

    function handleMove(e) {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const xViewBox = ((e.clientX - rect.left) / rect.width) * width;

        // Find nearest point index
        let nearest = 0;
        let bestDist = Infinity;
        for (let i = 0; i < xs.length; i += 1) {
            const d = Math.abs(xs[i] - xViewBox);
            if (d < bestDist) {
                bestDist = d;
                nearest = i;
            }
        }
        setHover({ i: nearest, px: xs[nearest], py: ys[nearest] });
    }

    function handleLeave() {
        setHover(null);
    }

    const hoveredPoint = hover ? points[hover.i] : null;
    const tooltipLabel = hoveredPoint
        ? `${new Date(hoveredPoint.played_at).toLocaleDateString("pt-PT")} — ${hoveredPoint.rating}`
        : "";

    // Tooltip position (anchored to point, flips if near right edge)
    let tooltipX = hover ? hover.px + 8 : 0;
    const tooltipY = hover ? Math.max(padY + 8, hover.py - 12) : 0;
    const flip = hover && hover.px > width - 110;
    if (flip) tooltipX = hover.px - 8;

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="dash-chart"
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
        >
            <line x1={padX} y1={padY} x2={padX} y2={height - padY} stroke="#c9beaf" />
            <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#c9beaf" />

            <text x={4} y={padY + 4} className="dash-chart-axis">{maxR}</text>
            <text x={4} y={height - padY} className="dash-chart-axis">{minR}</text>

            <polyline
                fill="none"
                stroke="#4a2f21"
                strokeWidth="2"
                points={polyline}
            />
            {xs.map((x, i) => (
                <circle key={i} cx={x} cy={ys[i]} r="2.5" fill="#4a2f21" />
            ))}

            {hover && (
                <>
                    <line
                        x1={hover.px}
                        y1={padY}
                        x2={hover.px}
                        y2={height - padY}
                        stroke="#a89870"
                        strokeDasharray="3,3"
                    />
                    <circle cx={hover.px} cy={hover.py} r="4.5" fill="#b6261d" stroke="#fff" strokeWidth="1.5" />
                    <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                        <rect
                            x={flip ? -110 : 0}
                            y={-16}
                            width="110"
                            height="22"
                            rx="3"
                            fill="#2e231c"
                            opacity="0.92"
                        />
                        <text
                            x={flip ? -55 : 55}
                            y={0}
                            textAnchor="middle"
                            className="dash-chart-tooltip"
                        >
                            {tooltipLabel}
                        </text>
                    </g>
                </>
            )}
        </svg>
    );
}

function ColorRow({ label, wins, losses, draws, total }) {
    if (total === 0) {
        return (
            <div className="dash-color-row">
                <span className="dash-color-label">{label}</span>
                <div className="dash-color-bar empty">No games</div>
            </div>
        );
    }
    const wPct = (wins / total) * 100;
    const dPct = (draws / total) * 100;
    const lPct = (losses / total) * 100;

    return (
        <div className="dash-color-row">
            <span className="dash-color-label">{label}</span>
            <div className="dash-color-bar">
                <div className="seg win" style={{ width: `${wPct}%` }} title={`Wins: ${wins}`}>
                    {wPct > 8 ? `${Math.round(wPct)}%` : ""}
                </div>
                <div className="seg draw" style={{ width: `${dPct}%` }} title={`Draws: ${draws}`}>
                    {dPct > 8 ? `${Math.round(dPct)}%` : ""}
                </div>
                <div className="seg loss" style={{ width: `${lPct}%` }} title={`Losses: ${losses}`}>
                    {lPct > 8 ? `${Math.round(lPct)}%` : ""}
                </div>
            </div>
            <span className="dash-color-total">{total}</span>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [speed, setSpeed] = useState("rapid");
    const [syncing, setSyncing] = useState(false);

    async function load(currentSpeed) {
        setLoading(true);
        setError("");
        try {
            const res = await getDashboard(currentSpeed);
            setData(res);
        } catch (e) {
            setError("Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(speed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speed]);

    async function handleSync() {
        setSyncing(true);
        try {
            await syncLichessGames();
            await load(speed);
        } catch (e) {
            setError("Sync failed");
        } finally {
            setSyncing(false);
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="dashboard-page"><div className="dash-status">Loading...</div></div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="dashboard-page"><div className="dash-status error">{error}</div></div>
            </Layout>
        );
    }

    if (!data || data.total_games === 0) {
        return (
            <Layout>
                <div className="dashboard-page">
                    <div className="dash-empty-state">
                        <h2>No games yet</h2>
                        <p>Sync your Lichess account to get started — your stats, openings and rating evolution will appear here.</p>
                        <button onClick={handleSync} disabled={syncing}>
                            {syncing ? "Syncing..." : "Sync Lichess games"}
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    const rating = data.current_rating;

    return (
        <Layout>
            <div className="dashboard-page">
                <section className="dash-cards">
                    <div className="dash-card">
                        <div className="dash-card-label">Total games</div>
                        <div className="dash-card-value">{data.total_games}</div>
                        <div className="dash-card-sub">
                            {data.wins}W / {data.losses}L / {data.draws}D
                        </div>
                    </div>

                    <div className="dash-card">
                        <div className="dash-card-label">Win rate</div>
                        <div className="dash-card-value">{data.win_rate.toFixed(1)}%</div>
                        <div className="dash-card-sub">across all games</div>
                    </div>

                    <div className="dash-card">
                        <div className="dash-card-label">Current rating ({speed})</div>
                        <div className="dash-card-value">
                            {rating ? rating.current : "—"}
                        </div>
                        <div className="dash-card-sub">
                            7d: <ChangeBadge value={rating?.change_week} />
                            <span style={{ marginLeft: 10 }}>
                                30d: <ChangeBadge value={rating?.change_month} />
                            </span>
                        </div>
                    </div>

                    <div className="dash-card">
                        <div className="dash-card-label">Sync</div>
                        <button className="dash-sync-btn" onClick={handleSync} disabled={syncing}>
                            {syncing ? "Syncing..." : "Sync Lichess"}
                        </button>
                    </div>
                </section>

                <section className="dash-grid">
                    <div className="dash-block dash-block-wide">
                        <div className="dash-block-header">
                            <h3>Rating evolution</h3>
                            <select value={speed} onChange={(e) => setSpeed(e.target.value)}>
                                {SPEEDS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <RatingChart points={data.rating_history} />
                    </div>

                    <div className="dash-block">
                        <h3>Win rate by color</h3>
                        <ColorRow
                            label="♔ White"
                            wins={data.by_color.white_wins}
                            losses={data.by_color.white_losses}
                            draws={data.by_color.white_draws}
                            total={data.by_color.white_games}
                        />
                        <ColorRow
                            label="♚ Black"
                            wins={data.by_color.black_wins}
                            losses={data.by_color.black_losses}
                            draws={data.by_color.black_draws}
                            total={data.by_color.black_games}
                        />
                        <div className="dash-color-legend">
                            <span><span className="dot win" /> Wins</span>
                            <span><span className="dot draw" /> Draws</span>
                            <span><span className="dot loss" /> Losses</span>
                        </div>
                    </div>
                </section>

                <section className="dash-grid">
                    <div className="dash-block">
                        <h3>Top openings</h3>
                        {data.top_openings && data.top_openings.length > 0 ? (
                            <table className="dash-openings">
                                <thead>
                                    <tr>
                                        <th>ECO</th>
                                        <th>Opening</th>
                                        <th>N</th>
                                        <th>Win%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.top_openings.map((o) => {
                                        const winPct = o.total > 0 ? (o.wins / o.total) * 100 : 0;
                                        return (
                                            <tr key={`${o.eco}-${o.name}`}>
                                                <td className="op-eco">{o.eco || "—"}</td>
                                                <td className="op-name">{o.name || "Unknown"}</td>
                                                <td>{o.total}</td>
                                                <td className="op-winrate">{winPct.toFixed(0)}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="dash-empty-chart">No openings yet</div>
                        )}
                    </div>

                    <div className="dash-block">
                        <h3>Recent games</h3>
                        {data.recent_games && data.recent_games.length > 0 ? (
                            <ul className="dash-recent">
                                {data.recent_games.map((g) => (
                                    <li
                                        key={g.id}
                                        className="dash-recent-row"
                                        onClick={() => navigate(`/analysis/${g.id}`)}
                                    >
                                        <span className={`dash-result-pill r-${g.user_result}`}>
                                            {g.user_result?.[0]?.toUpperCase() || "?"}
                                        </span>
                                        <span className="dash-recent-opp">vs {g.opponent || "—"}</span>
                                        <span className="dash-recent-speed">{g.speed}</span>
                                        <span className="dash-recent-date">{formatDate(g.played_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="dash-empty-chart">No recent games</div>
                        )}
                        <Link className="dash-see-all" to="/games">See all games →</Link>
                    </div>
                </section>
            </div>
        </Layout>
    );
}
