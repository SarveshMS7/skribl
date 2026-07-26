import './CanvasToolbar.css';

export type Tool = 'pencil' | 'eraser' | 'fill';

interface CanvasToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  size: number;
  setSize: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#000000', // Black
  '#7f7f7f', // Gray
  '#ffffff', // White
  '#e74c3c', // Red
  '#e67e22', // Orange
  '#f1c40f', // Yellow
  '#2ecc71', // Green
  '#1abc9c', // Teal
  '#3498db', // Blue
  '#9b59b6', // Purple
  '#fd79a8', // Pink
  '#8d6e63', // Brown
  '#00bec4', // Cyan
  '#2c3e50', // Dark Blue
];

const PRESET_SIZES = [2, 6, 12, 24];

export function CanvasToolbar({
  tool,
  setTool,
  color,
  setColor,
  size,
  setSize,
  onUndo,
  onClear,
  canUndo,
  disabled = false,
}: CanvasToolbarProps) {
  if (disabled) {
    return null;
  }

  return (
    <div className="canvas-toolbar glass-strong">
      {/* Tools Section */}
      <div className="canvas-toolbar__group">
        <button
          type="button"
          className={`canvas-toolbar__btn ${tool === 'pencil' ? 'active' : ''}`}
          onClick={() => setTool('pencil')}
          title="Pencil"
        >
          ✏️ <span className="canvas-toolbar__label">Pencil</span>
        </button>
        <button
          type="button"
          className={`canvas-toolbar__btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser"
        >
          🧹 <span className="canvas-toolbar__label">Eraser</span>
        </button>
        <button
          type="button"
          className={`canvas-toolbar__btn ${tool === 'fill' ? 'active' : ''}`}
          onClick={() => setTool('fill')}
          title="Fill Bucket"
        >
          🪣 <span className="canvas-toolbar__label">Fill</span>
        </button>
      </div>

      <div className="canvas-toolbar__divider" />

      {/* Size Section */}
      <div className="canvas-toolbar__group canvas-toolbar__sizes">
        {PRESET_SIZES.map(s => (
          <button
            key={s}
            type="button"
            className={`canvas-toolbar__size-btn ${size === s ? 'active' : ''}`}
            onClick={() => setSize(s)}
            title={`Size: ${s}px`}
          >
            <span
              className="canvas-toolbar__size-dot"
              style={{ width: Math.max(4, s), height: Math.max(4, s) }}
            />
          </button>
        ))}
        <input
          type="range"
          min="1"
          max="40"
          value={size}
          onChange={e => setSize(Number(e.target.value))}
          className="canvas-toolbar__slider"
          title={`Custom size: ${size}px`}
        />
      </div>

      <div className="canvas-toolbar__divider" />

      {/* Colors Section */}
      <div className="canvas-toolbar__group canvas-toolbar__colors">
        <div className="canvas-toolbar__palette">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`canvas-toolbar__color-swatch ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                setColor(c);
                if (tool === 'eraser') setTool('pencil');
              }}
              title={c}
            />
          ))}
        </div>
        <label className="canvas-toolbar__color-picker" title="Custom color">
          🎨
          <input
            type="color"
            value={color}
            onChange={e => {
              setColor(e.target.value);
              if (tool === 'eraser') setTool('pencil');
            }}
          />
        </label>
      </div>

      <div className="canvas-toolbar__divider" />

      {/* Action Buttons */}
      <div className="canvas-toolbar__group">
        <button
          type="button"
          className="canvas-toolbar__btn canvas-toolbar__btn--action"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last stroke (Ctrl+Z)"
        >
          ↩️ <span className="canvas-toolbar__label">Undo</span>
        </button>
        <button
          type="button"
          className="canvas-toolbar__btn canvas-toolbar__btn--danger"
          onClick={onClear}
          title="Clear canvas"
        >
          🗑️ <span className="canvas-toolbar__label">Clear</span>
        </button>
      </div>
    </div>
  );
}

export default CanvasToolbar;
