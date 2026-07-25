import { useSocket } from '../../context/SocketContext';
import { useGameStore } from '../../store/useGameStore';
import './PlayerList.css';

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#7c3aed',
  '#4f46e5', '#0d9488', '#ca8a04', '#e11d48',
];

export default function PlayerList() {
  const { socket } = useSocket();
  const { room, gameState } = useGameStore();

  if (!room || !gameState) return null;

  // Sort players by score (descending)
  const sortedPlayers = [...room.players].sort((a, b) => {
    return (gameState.score[b.id] ?? 0) - (gameState.score[a.id] ?? 0);
  });

  return (
    <div className="player-list glass">
      <h3 className="player-list__title">Scoreboard</h3>
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
