import { useGameStore, useGameDispatch } from '../../store/useGameStore';
import { socket } from '../../services/socket/socket';
import './EndScreen.css';

const PODIUM_COLORS = ['#ffde59', '#00f0ff', '#ff914d'];
const PODIUM_LABELS = ['🥇 1st', '🥈 2nd', '🥉 3rd'];

export default function EndScreen() {
  const { gameState, room, roomCode } = useGameStore();
  const dispatch = useGameDispatch();

  if (!gameState || !room) return null;

  // Sort players by score descending
  const rankings = [...room.players]
    .map(p => ({ ...p, score: gameState.score[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  function handleBackToLobby() {
    if (roomCode) {
      socket.emit('playAgain', { code: roomCode });
    }
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
        <span className="end-screen__badge">🏆 Match Finished!</span>
        <h1 className="end-screen__title">Final Results</h1>

        {/* Neo 3D Podium */}
        <div className="end-screen__podium">
          {rankings.slice(0, 3).map((player, i) => (
            <div
              key={player.id}
              className={`end-screen__podium-item end-screen__podium-item--${i + 1}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="end-screen__medal-badge">{PODIUM_LABELS[i]}</span>
              <div
                className="end-screen__avatar"
                style={{
                  background: PODIUM_COLORS[i],
                  width: i === 0 ? 80 : 64,
                  height: i === 0 ? 80 : 64,
                  fontSize: i === 0 ? '2rem' : '1.4rem',
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="end-screen__name">{player.name}</span>
              <span className="end-screen__score">{player.score} pts</span>
              <div
                className="end-screen__bar"
                style={{
                  height: i === 0 ? 140 : i === 1 ? 100 : 70,
                  backgroundColor: PODIUM_COLORS[i],
                }}
              />
            </div>
          ))}
        </div>

        {/* Full ranking */}
        {rankings.length > 3 && (
          <div className="end-screen__full-list">
            {rankings.slice(3).map((player, i) => (
              <div key={player.id} className="end-screen__rank-row">
                <span className="end-screen__rank-pos">#{i + 4}</span>
                <span className="end-screen__rank-name">{player.name}</span>
                <span className="end-screen__rank-score">{player.score} pts</span>
              </div>
            ))}
          </div>
        )}

        <div className="end-screen__actions">
          <button
            className="btn btn-primary btn-lg end-screen__btn-play"
            onClick={handleBackToLobby}
          >
            🔄 Play Again!
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
            🚪 Leave to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
