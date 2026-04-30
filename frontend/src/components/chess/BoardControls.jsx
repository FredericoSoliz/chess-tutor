import "./boardcontrols.css";

export default function BoardControls({ onUndo, onRedo, onReset, onFlip }) {
    return (
        <div className="board-controls">
            <button onClick={onUndo}>↶ Undo</button>
            <button onClick={onRedo}>↷ Redo</button>
            <button onClick={onReset}>↺ Reset</button>
            <button onClick={onFlip}>⇅ Flip</button>
        </div>
    );
}