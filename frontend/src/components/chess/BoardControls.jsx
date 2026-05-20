import "./boardcontrols.css";

export default function BoardControls({ onUndo, onRedo, onReset, onFlip }) {
    return (
        <div className="board-controls">
            {onUndo && <button onClick={onUndo}>↶ Undo</button>}
            {onRedo && <button onClick={onRedo}>↷ Redo</button>}
            {onReset && <button onClick={onReset}>↺ Reset</button>}
            {onFlip && <button onClick={onFlip}>⇅ Flip</button>}
        </div>
    );
}