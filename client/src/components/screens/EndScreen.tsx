import { useGameStore, useGameDispatch } from '../../store/useGameStore';
import { useSocket } from '../../context/SocketContext';
import './EndScreen.css';

const PODIUM_COLORS = ['#fbbf24', '#a7a3be', '#cd7c2f'];
const PODIUM_LABELS = ['🥇', '🥈', '🥉'];

export default function EndScreen() {
  const { gameState, room } = useGameStore();
  const dispatch = useGameDispatch();
  const { socket } = useSocket();

  if (!gameState || !room) return null;

  // Sort players by score descending
  const rankings = [...room.players]
    .map(p => ({ ...p, score: gameState.score[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  function handleBackToLobby() {
    dispatch({ type: 'SET_SCREEN', screen: 'lobby' });
  }

  function handleLeave() {
    socket.disconnect();
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="end-screen">
      <div className="bg-glow bg-glow--purple" />
      <div className="bg-glow bg-glow--blue" />

      <div className="end-screen__container">
        <h1 className="end-screen__title">Game Over!</h1>

        {/* Podium */}
        <div className="end-screen__podium">
          {rankings.slice(0, 3).map((player, i) => (
            <div
              key={player.id}
              className={`end-screen__podium-item end-screen__podium-item--${i + 1}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="end-screen__medal">{PODIUM_LABELS[i]}</span>
              <div
                className="end-screen__avatar"
                style={{
                  background: PODIUM_COLORS[i],
                  width: i === 0 ? 72 : 56,
                  height: i === 0 ? 72 : 56,
                  fontSize: i === 0 ? '1.6rem' : '1.2rem',
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="end-screen__name">{player.name}</span>
              <span className="end-screen__score">{player.score} pts</span>
              <div
                className="end-screen__bar"
                style={{
                  height: i === 0 ? 120 : i === 1 ? 90 : 60,
                  background: PODIUM_COLORS[i],
                }}
              />
            </div>
          ))}
        </div>

        {/* Full ranking */}
        {rankings.length > 3 && (
          <div className="end-screen__full-list glass">
            {rankings.slice(3).map((player, i) => (
              <div key={player.id} className="end-screen__rank-row">
                <span className="end-screen__rank-pos">#{i + 4}</span>
                <span className="end-screen__rank-name">{player.name}</span>
                <span className="end-screen__rank-score">{player.score}</span>
              </div>
            ))}
          </div>
        )}

        <div className="end-screen__actions">
          <button className="btn btn-primary btn-lg" onClick={handleBackToLobby}>
            🔄 Back to Lobby
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
