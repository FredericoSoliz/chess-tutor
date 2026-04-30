import Layout from "../components/Layout";
import ChessBoard from "../components/chess/ChessBoard";
import BoardControls from "../components/chess/BoardControls";
import MoveHistory from "../components/chess/MoveHistory";
import useChessGame from "../hooks/useChessGame";

import "../components/chess/chessboard.css";

export default function AnalysisPage() {
    const game = useChessGame();

    return (
        <Layout>
            <div className="game-container">

                <div className="board-side">

                    <ChessBoard
                        position={game.position}
                        onMove={game.move}
                        getMoves={game.getMoves}
                        lastMove={game.lastMove}
                        orientation={game.orientation}
                    />

                    <BoardControls
                        onUndo={game.undo}
                        onRedo={game.redo}
                        onReset={game.reset}
                        onFlip={game.flip}
                    />

                </div>

                <MoveHistory moves={game.history} />

            </div>
        </Layout>
    );
}