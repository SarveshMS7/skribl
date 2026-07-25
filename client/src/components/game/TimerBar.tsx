import { useGameStore } from '../../store/useGameStore';
import './TimerBar.css';

export default function TimerBar() {
  const { secondsLeft, gameState } = useGameStore();

  if (!gameState) return null;

  const totalTime = 80; // fallback
  const pct = Math.max(0, Math.min(100, (secondsLeft / totalTime) * 100));

  let colorClass = 'timer-bar--green';
  if (pct < 25) colorClass = 'timer-bar--red';
  else if (pct < 50) colorClass = 'timer-bar--yellow';

  return (
    <div className="timer-bar">
      <div className="timer-bar__track">
        <div
          className={`timer-bar__fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="timer-bar__time">{secondsLeft}s</span>
    </div>
  );
}
