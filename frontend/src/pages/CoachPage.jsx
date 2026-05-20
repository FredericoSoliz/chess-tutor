import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";

import Layout from "../components/Layout";
import ChessBoard from "../components/chess/ChessBoard";
import BoardControls from "../components/chess/BoardControls";
import EvalBar from "../components/chess/EvalBar";
import { coachMove } from "../services/coach";

import "../components/chess/chessboard.css";
import "./coachpage.css";

const DIFFICULTIES = [
    { key: "beginner", label: "Beginner", elo: 1000 },
    { key: "easy", label: "Easy", elo: 1400 },
    { key: "medium", label: "Medium", elo: 1700 },
    { key: "hard", label: "Hard", elo: 2000 },
    { key: "master", label: "Master", elo: 2400 },
];

const CATEGORY_INFO = {
    best:       { symbol: "★",  label: "Best move",   tone: "good" },
    excellent:  { symbol: "!",  label: "Excellent",   tone: "good" },
    good:       { symbol: "",   label: "Good",        tone: "neutral" },
    inaccuracy: { symbol: "?!", label: "Inaccuracy",  tone: "warn" },
    mistake:    { symbol: "?",  label: "Mistake",     tone: "bad" },
    blunder:    { symbol: "??", label: "Blunder",     tone: "bad" },
};

function parseUci(uci) {
    if (!uci || uci.length < 4) return null;
    return {
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
    };
}

function buildEvalFromCoachResp(userMove) {
    if (!userMove) return null;
    return {
        score_cp: userMove.score_cp ?? null,
        mate: userMove.mate ?? null,
    };
}

export default function CoachPage() {
    const startFen = useMemo(() => new Chess().fen(), []);
    const [chess] = useState(() => new Chess());
    const [fenStack, setFenStack] = useState([startFen]);
    const [moveStack, setMoveStack] = useState([]);
    const [viewPly, setViewPly] = useState(0);

    const [elo, setElo] = useState(1700);
    const [difficultyKey, setDifficultyKey] = useState("medium");

    const [thinking, setThinking] = useState(false);
    const [chatLog, setChatLog] = useState([]);
    const [analysisEval, setAnalysisEval] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [resultText, setResultText] = useState("");
    const [error, setError] = useState("");

    const position = fenStack[viewPly] ?? startFen;
    const lastMove = viewPly > 0 && moveStack[viewPly - 1]
        ? { from: moveStack[viewPly - 1].from, to: moveStack[viewPly - 1].to }
        : null;
    const atLatest = viewPly === fenStack.length - 1;
    const turn = position.split(" ")[1];
    const currentDifficulty = DIFFICULTIES.find((d) => d.key === difficultyKey);
    const history = moveStack.map((m) => m.san);

    function resetGame(nextElo = elo) {
        chess.reset();
        setFenStack([chess.fen()]);
        setMoveStack([]);
        setViewPly(0);
        setChatLog([]);
        setAnalysisEval(null);
        setGameOver(false);
        setResultText("");
        setError("");
        setThinking(false);
        if (nextElo !== elo) setElo(nextElo);
    }

    function pickDifficulty(d) {
        setDifficultyKey(d.key);
        resetGame(d.elo);
    }

    function goPrev() {
        setViewPly((p) => Math.max(0, p - 1));
    }
    function goNext() {
        setViewPly((p) => Math.min(fenStack.length - 1, p + 1));
    }
    function jumpToPly(p) {
        setViewPly(Math.max(0, Math.min(fenStack.length - 1, p)));
    }

    function resetLastMove() {
        if (thinking) return;
        const plies = fenStack.length - 1;
        if (plies === 0) return;
        const toUndo = plies >= 2 ? 2 : 1;
        for (let i = 0; i < toUndo; i += 1) {
            chess.undo();
        }
        setFenStack((prev) => prev.slice(0, -toUndo));
        setMoveStack((prev) => prev.slice(0, -toUndo));
        setChatLog((prev) => prev.slice(0, -1));
        setViewPly((prev) => Math.min(prev, plies - toUndo));
        setAnalysisEval(null);
        setGameOver(false);
        setResultText("");
        setError("");
    }

    function applyMoveLocal(moveOpts) {
        const fenBefore = chess.fen();
        const m = chess.move(moveOpts);
        if (!m) return null;
        const fenAfter = chess.fen();

        setFenStack((prev) => {
            const next = [...prev, fenAfter];
            setViewPly(next.length - 1);
            return next;
        });
        setMoveStack((prev) => [
            ...prev,
            { san: m.san, from: m.from, to: m.to },
        ]);

        return { move: m, fenBefore, fenAfter };
    }

    function getMoves(square) {
        if (!atLatest) return [];
        return chess.moves({ square, verbose: true });
    }

    function isUserTurnNow() {
        return chess.turn() === "w";
    }

    async function handleUserMove({ from, to, promotion = "q" }) {
        if (thinking || gameOver) return false;
        if (!atLatest) return false;
        if (!isUserTurnNow()) return false;

        const applied = applyMoveLocal({ from, to, promotion });
        if (!applied) return false;

        const userUci = `${from}${to}${applied.move.promotion || ""}`;

        setThinking(true);
        setError("");
        try {
            const res = await coachMove({
                fenBefore: applied.fenBefore,
                userMove: userUci,
                fenAfter: applied.fenAfter,
                elo,
                history: [...history, applied.move.san],
            });

            setAnalysisEval(buildEvalFromCoachResp(res.user_move));

            setChatLog((prev) => [
                ...prev,
                {
                    moveSan: applied.move.san,
                    feedback: res.user_move,
                    message: res.coach_message || null,
                },
            ]);

            if (res.bot_move?.uci) {
                const botParsed = parseUci(res.bot_move.uci);
                if (botParsed) {
                    const botApplied = applyMoveLocal(botParsed);
                    if (!botApplied) {
                        setError("Bot move was illegal in local state");
                    }
                }
            }

            if (res.game_over) {
                setGameOver(true);
                setResultText(res.result || "Game over");
            }
        } catch (e) {
            setError("Coach engine error");
            chess.undo();
            setFenStack((prev) => prev.slice(0, -1));
            setMoveStack((prev) => prev.slice(0, -1));
            setViewPly((prev) => Math.max(0, prev - 1));
        } finally {
            setThinking(false);
        }

        return true;
    }

    useEffect(() => {
        function onKey(e) {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                goPrev();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goNext();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fenStack.length]);

    return (
        <Layout>
            <div className="coach-page">
                <div className="coach-toolbar">
                    <div className="coach-difficulty">
                        {DIFFICULTIES.map((d) => (
                            <button
                                key={d.key}
                                className={`coach-diff-btn${d.key === difficultyKey ? " active" : ""}`}
                                onClick={() => pickDifficulty(d)}
                                disabled={thinking}
                            >
                                <span className="diff-label">{d.label}</span>
                                <span className="diff-elo">{d.elo}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="game-container">
                    <EvalBar analysis={analysisEval} />

                    <div className="board-side">
                        <ChessBoard
                            position={position}
                            onMove={handleUserMove}
                            getMoves={getMoves}
                            lastMove={lastMove}
                            orientation="white"
                            turn={turn}
                        />

                        <BoardControls
                            onUndo={goPrev}
                            onRedo={goNext}
                            onReset={() => resetGame()}
                            onFlip={() => {}}
                        />
                    </div>

                    <div className="coach-panel">
                        <div className="coach-panel-header">Coach</div>

                        <div className="coach-panel-body">
                            <div className="coach-diff-pill">
                                Playing vs <strong>{currentDifficulty?.label}</strong>
                                <span className="coach-elo-chip">{currentDifficulty?.elo} Elo</span>
                            </div>

                            <ChatLog
                                entries={chatLog}
                                thinking={thinking}
                                error={error}
                            />

                            {gameOver && (
                                <div className="coach-gameover">
                                    <div className="coach-gameover-title">Game over</div>
                                    <div className="coach-gameover-result">{resultText}</div>
                                    <button
                                        className="coach-new-game-btn"
                                        onClick={() => resetGame()}
                                    >
                                        New game
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="coach-panel-footer">
                            <div className="coach-history-row">
                                <span className="coach-history-title">Moves</span>
                                <button
                                    className="coach-reset-move-btn"
                                    onClick={resetLastMove}
                                    disabled={thinking || moveStack.length === 0}
                                    title="Undo your last move (and the bot's reply) for good"
                                >
                                    ↶ Reset move
                                </button>
                            </div>

                            <div className="coach-history-list">
                                {history.length === 0 ? (
                                    <span className="coach-history-empty">
                                        Make your first move to start.
                                    </span>
                                ) : (
                                    history.map((san, i) => {
                                        const ply = i + 1;
                                        const active = ply === viewPly;
                                        return (
                                            <span
                                                key={i}
                                                className={`coach-history-move ${i % 2 === 0 ? "w" : "b"}${active ? " active" : ""}`}
                                                onClick={() => jumpToPly(ply)}
                                            >
                                                {i % 2 === 0 && (
                                                    <span className="coach-move-num">
                                                        {Math.floor(i / 2) + 1}.
                                                    </span>
                                                )}
                                                {san}
                                            </span>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function ChatLog({ entries, thinking, error }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [entries, thinking, error]);

    if (entries.length === 0 && !thinking && !error) {
        return (
            <div className="coach-chat empty">
                <span>Your coach will chime in after every move you make.</span>
            </div>
        );
    }

    return (
        <div className="coach-chat" ref={ref}>
            {entries.map((entry, i) => (
                <ChatMessage key={i} entry={entry} />
            ))}
            {thinking && (
                <div className="coach-chat-thinking">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
            )}
            {error && <div className="coach-error">{error}</div>}
        </div>
    );
}

function ChatMessage({ entry }) {
    const { feedback, message, moveSan } = entry;
    const info = CATEGORY_INFO[feedback?.category] || CATEGORY_INFO.good;

    return (
        <div className={`coach-msg tone-${info.tone}`}>
            <div className="coach-msg-head">
                {info.symbol && (
                    <span className={`coach-feedback-sym tone-${info.tone}`}>
                        {info.symbol}
                    </span>
                )}
                <span className="coach-msg-move">{moveSan}</span>
                <span className="coach-msg-label">{info.label}</span>
                {feedback.cp_loss > 0 && (
                    <span className="coach-feedback-cp">−{feedback.cp_loss} cp</span>
                )}
            </div>
            {message ? (
                <div className="coach-msg-body">{message}</div>
            ) : (
                <div className="coach-msg-body muted">
                    (coach is offline right now)
                </div>
            )}
        </div>
    );
}
