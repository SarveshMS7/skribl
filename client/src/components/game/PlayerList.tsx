import { socket } from '../../services/socket/socket';
import { useGameStore } from '../../store/useGameStore';
import './PlayerList.css';

const AVATAR_COLORS = [
  '#ff577f', '#3b82f6', '#00f0ff', '#22e577',
  '#ff914d', '#ff334b', '#8b5cf6', '#ffde59',
  '#6366f1', '#14b8a6', '#f59e0b', '#ec4899',
];

export default function PlayerList() {
  const { room, gameState } = useGameStore();

  if (!room || !gameState) return null;

  // Sort players by score (descending)
  const sortedPlayers = [...room.players].sort((a, b) => {
    return (gameState.score[b.id] ?? 0) - (gameState.score[a.id] ?? 0);
  });

  return (
    <div className="player-list">
      <div className="player-list__header">
        <h3 className="player-list__title">Scoreboard</h3>
        <span className="neo-badge">🏆 Rank</span>
      </div>
      <ul className="player-list__items">
        {sortedPlayers.map((player, i) => {
          const isDrawer = player.id === gameState.currentPlayerID;
          const hasGuessed = gameState.guessedPlayers.includes(player.id);
          const isMe = player.id === socket.id;
          const originalIndex = room.players.findIndex(p => p.id === player.id);

          return (
            <li
              key={player.id}
              className={`player-list__item ${isDrawer ? 'player-list__item--drawer' : ''} ${hasGuessed ? 'player-list__item--guessed' : ''} ${isMe ? 'player-list__item--me' : ''}`}
            >
              <span className="player-list__rank">#{i + 1}</span>
              <div
                className="player-list__avatar"
                style={{ background: AVATAR_COLORS[originalIndex % AVATAR_COLORS.length] }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="player-list__info">
                <span className="player-list__name">
                  {player.name}
                  {isMe && <span className="player-list__you"> (You)</span>}
                </span>
                <span className="player-list__indicators">
                  {isDrawer && <span className="player-list__badge player-list__badge--drawer">🖌️ Drawing</span>}
                  {hasGuessed && <span className="player-list__badge player-list__badge--guessed">✓ Guessed</span>}
                </span>
              </div>
              <span className="player-list__score">
                {gameState.score[player.id] ?? 0}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
