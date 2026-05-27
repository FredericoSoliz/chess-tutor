import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { listGames, syncLichessGames } from "../services/games";
import "./gamespage.css";

const PAGE_SIZE = 20;

const RESULT_BADGE = {
    win: { label: "Win", className: "result-win" },
    loss: { label: "Loss", className: "result-loss" },
    draw: { label: "Draw", className: "result-draw" },
};

function formatDate(ms) {
    if (!ms) return "-";
    const d = new Date(ms);
    return d.toLocaleDateString("pt-PT") + " " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export default function GamesPage() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState("");

    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState({
        result: "",
        color: "",
        speed: "",
        opening: "",
    });

    const fetchGames = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await listGames({
                ...filters,
                limit: PAGE_SIZE,
                offset: page * PAGE_SIZE,
            });
            setGames(data.games || []);
            setTotal(data.total || 0);
        } catch (err) {
            setError("Failed to load games");
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    function updateFilter(key, value) {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(0);
    }

    async function handleSync() {
        setSyncing(true);
        setError("");
        try {
            const result = await syncLichessGames();
            await fetchGames();
            if (result.inserted > 0) {
                setError(`Imported ${result.inserted} new game(s)`);
            }
        } catch (err) {
            setError("Sync failed — make sure your Lichess username is set");
        } finally {
            setSyncing(false);
        }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

    return (
        <Layout>
            <div className="games-page">
                <div className="games-header">
                    <div>
                        <h2>My Games</h2>
                        <p className="games-subtitle">{total} game{total === 1 ? "" : "s"} stored</p>
                    </div>

                    <button
                        className="sync-btn"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        <span>{syncing ? "Syncing..." : "Sync from Lichess"}</span>
                    </button>
                </div>

                <div className="games-filters">
                    <select
                        value={filters.result}
                        onChange={(e) => updateFilter("result", e.target.value)}
                    >
                        <option value="">All results</option>
                        <option value="win">Wins</option>
                        <option value="loss">Losses</option>
                        <option value="draw">Draws</option>
                    </select>

                    <select
                        value={filters.color}
                        onChange={(e) => updateFilter("color", e.target.value)}
                    >
                        <option value="">Both colors</option>
                        <option value="white">White</option>
                        <option value="black">Black</option>
                    </select>

                    <select
                        value={filters.speed}
                        onChange={(e) => updateFilter("speed", e.target.value)}
                    >
                        <option value="">All speeds</option>
                        <option value="bullet">Bullet</option>
                        <option value="blitz">Blitz</option>
                        <option value="rapid">Rapid</option>
                        <option value="classical">Classical</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Search opening..."
                        value={filters.opening}
                        onChange={(e) => updateFilter("opening", e.target.value)}
                    />
                </div>

                {error && <div className="games-error">{error}</div>}

                <div className="games-table-wrapper">
                    <table className="games-table">
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Result</th>
                            <th>Color</th>
                            <th>Opponent</th>
                            <th>Rating</th>
                            <th>Opening</th>
                            <th>Speed</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="games-empty">Loading...</td></tr>
                        ) : games.length === 0 ? (
                            <tr><td colSpan={7} className="games-empty">No games found</td></tr>
                        ) : (
                            games.map((g) => {
                                const badge = RESULT_BADGE[g.user_result] || { label: "-", className: "" };
                                return (
                                    <tr
                                        key={g.id}
                                        className="games-row-clickable"
                                        onClick={() => navigate(`/analysis/${g.id}`)}
                                    >
                                        <td>{formatDate(g.played_at)}</td>
                                        <td>
                                            <span className={`result-badge ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="capitalize">{g.user_color || "-"}</td>
                                        <td>{g.opponent || "-"}</td>
                                        <td>{g.opponent_rating || "-"}</td>
                                        <td>
                                            <div className="opening-cell">
                                                <span className="opening-eco">{g.opening_eco}</span>
                                                <span>{g.opening_name || "Unknown"}</span>
                                            </div>
                                        </td>
                                        <td className="capitalize">{g.speed || "-"}</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="games-pagination">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                    >
                        ← Previous
                    </button>
                    <span>Page {page + 1} of {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page + 1 >= totalPages || loading}
                    >
                        Next →
                    </button>
                </div>
            </div>
        </Layout>
    );
}
