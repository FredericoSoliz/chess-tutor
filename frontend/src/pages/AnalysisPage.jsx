import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Chess } from "chess.js";

import Layout from "../components/Layout";
import ChessBoard from "../components/chess/ChessBoard";
import BoardControls from "../components/chess/BoardControls";
import MoveHistory from "../components/chess/MoveHistory";
import EvalBar from "../components/chess/EvalBar";
import GameAnalysisStats from "../components/chess/GameAnalysisStats";
import useChessGame from "../hooks/useChessGame";
import useAnalysis from "../hooks/useAnalysis";
import { getGame, analyzeGame, analyzePgn } from "../services/games";

import "../components/chess/chessboard.css";
import "./analysispage.css";

function speedFromTimeControl(tc) {
    if (!tc || !tc.includes("+")) return "";
    const base = parseInt(tc.split("+")[0], 10);
    if (isNaN(base)) return "";
    if (base < 180) return "bullet";
    if (base < 480) return "blitz";
    if (base < 1500) return "rapid";
    return "classical";
}

function parsePgnToDetail(pgnText) {
    const chess = new Chess();
    try {
        chess.loadPgn(pgnText);
    } catch {
        return null;
    }

    const headers = chess.header() || {};
    const verbose = chess.history({ verbose: true });
    const moves = verbose.map((m) => m.san);

    if (moves.length === 0 && !headers.White && !headers.Black) {
        return null;
    }

    let winner = "";
    if (headers.Result === "1-0") winner = "white";
    else if (headers.Result === "0-1") winner = "black";

    let playedAt = 0;
    const dateStr = headers.UTCDate || headers.Date;
    if (dateStr && !dateStr.includes("?")) {
        const parsed = new Date(dateStr.replace(/\./g, "-")).getTime();
        if (!isNaN(parsed)) playedAt = parsed;
    }

    return {
        white: headers.White || "White",
        black: headers.Black || "Black",
        white_rating: parseInt(headers.WhiteElo, 10) || 0,
        black_rating: parseInt(headers.BlackElo, 10) || 0,
        winner,
        played_at: playedAt,
        speed: speedFromTimeControl(headers.TimeControl),
        opening_name: headers.Opening || "",
        opening_eco: headers.ECO || "",
        pgn: pgnText,
        moves,
    };
}

export default function AnalysisPage() {
    const { gameId } = useParams();
    const fileInputRef = useRef(null);

    const [gameDetail, setGameDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [importError, setImportError] = useState("");
    const [moveAnalysis, setMoveAnalysis] = useState(null);
    const [accuracy, setAccuracy] = useState(null); // {white, black}
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState("");

    useEffect(() => {
        if (!gameId) {
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError("");

        getGame(gameId)
            .then((data) => {
                if (!cancelled) setGameDetail(data);
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load game");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [gameId]);

    // Reset move analysis whenever the loaded game changes
    useEffect(() => {
        setMoveAnalysis(null);
        setAccuracy(null);
        setAnalysisError("");
    }, [gameDetail?.pgn]);

    async function handleAnalyzeGame() {
        if (analyzing) return;
        if (!gameId && !gameDetail?.pgn) return;

        setAnalyzing(true);
        setAnalysisError("");
        try {
            const data = gameId
                ? await analyzeGame(gameId, 0.1)
                : await analyzePgn(gameDetail.pgn, 0.1);
            setMoveAnalysis(data.moves || []);
            setAccuracy({
                white: data.accuracy_white,
                black: data.accuracy_black,
            });
        } catch (e) {
            setAnalysisError("Analysis failed");
        } finally {
            setAnalyzing(false);
        }
    }

    function handleImportClick() {
        setImportError("");
        fileInputRef.current?.click();
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        e.target.value = ""; // reset so picking the same file again re-fires
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || "");
            const parsed = parsePgnToDetail(text);
            if (!parsed) {
                setImportError("Could not parse this PGN file");
                return;
            }
            setGameDetail(parsed);
            setImportError("");
        };
        reader.onerror = () => setImportError("Could not read the file");
        reader.readAsText(file);
    }

    const game = useChessGame(gameDetail?.pgn || null);
    const { analysis } = useAnalysis(game.position);

    useEffect(() => {
        function onKey(e) {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                game.undo();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                game.redo();
            }
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [game]);

    useEffect(() => {
        if (!gameDetail) return;
        const desired = gameDetail.user_color === "black" ? "black" : "white";
        if (game.orientation !== desired) {
            game.flip();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameDetail]);

    const movesToShow = gameDetail?.moves?.length ? gameDetail.moves : game.history;

    const bestMoveArrows = analysis?.pv?.[0]
        ? [{
            startSquare: analysis.pv[0].slice(0, 2),
            endSquare: analysis.pv[0].slice(2, 4),
            color: "rgba(70, 140, 70, 0.75)",
        }]
        : [];

    return (
        <Layout>
            <div className="analysis-page">
                <div className="analysis-toolbar">
                    <button
                        className="analysis-import-btn"
                        onClick={handleImportClick}
                    >
                        Import PGN
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pgn,text/plain"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />
                    {importError && (
                        <span className="analysis-import-error">{importError}</span>
                    )}
                </div>

                {gameId && loading && (
                    <div className="analysis-status">Loading game...</div>
                )}
                {gameId && error && (
                    <div className="analysis-status analysis-error">{error}</div>
                )}

                <div className="game-container">
                    <EvalBar analysis={analysis} />

                    <div className="board-side">
                        <ChessBoard
                            position={game.position}
                            onMove={game.move}
                            getMoves={game.getMoves}
                            lastMove={game.lastMove}
                            orientation={game.orientation}
                            turn={game.turn}
                            arrows={bestMoveArrows}
                        />

                        <BoardControls
                            onUndo={game.undo}
                            onRedo={game.redo}
                            onReset={game.reset}
                            onFlip={game.flip}
                        />
                    </div>

                    <MoveHistory
                        moves={movesToShow}
                        currentPly={game.currentPly}
                        detail={gameDetail}
                        onJumpTo={gameDetail ? game.goToPly : null}
                        moveAnalysis={moveAnalysis}
                        onAnalyzeGame={(gameId || gameDetail?.pgn) ? handleAnalyzeGame : null}
                        analyzing={analyzing}
                        analysisError={analysisError}
                    />

                    {moveAnalysis && moveAnalysis.length > 0 && (
                        <GameAnalysisStats
                            moveAnalysis={moveAnalysis}
                            accuracy={accuracy}
                            detail={gameDetail}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
}
