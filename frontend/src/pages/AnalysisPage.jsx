import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Layout from "../components/Layout";
import ChessBoard from "../components/chess/ChessBoard";
import BoardControls from "../components/chess/BoardControls";
import MoveHistory from "../components/chess/MoveHistory";
import EvalBar from "../components/chess/EvalBar";
import GameAnalysisStats from "../components/chess/GameAnalysisStats";
import useChessGame from "../hooks/useChessGame";
import useAnalysis from "../hooks/useAnalysis";
import { getGame, analyzeGame } from "../services/games";

import "../components/chess/chessboard.css";

export default function AnalysisPage() {
    const { gameId } = useParams();
    const [gameDetail, setGameDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [moveAnalysis, setMoveAnalysis] = useState(null);
    const [accuracy, setAccuracy] = useState(null); // {white, black}
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState("");

    useEffect(() => {
        if (!gameId) {
            setGameDetail(null);
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

    // Reset move analysis when game changes
    useEffect(() => {
        setMoveAnalysis(null);
        setAccuracy(null);
        setAnalysisError("");
    }, [gameId]);

    async function handleAnalyzeGame() {
        if (!gameId || analyzing) return;
        setAnalyzing(true);
        setAnalysisError("");
        try {
            const data = await analyzeGame(gameId, 0.1);
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
                        onAnalyzeGame={gameId ? handleAnalyzeGame : null}
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
