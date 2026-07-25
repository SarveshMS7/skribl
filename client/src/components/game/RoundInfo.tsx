import { useSocket } from '../../context/SocketContext';
import { useGameStore } from '../../store/useGameStore';

export default function RoundInfo() {
  const { socket } = useSocket();
  const { gameState, room } = useGameStore();

  if (!gameState || !room) return null;

  const drawer = room.players.find(p => p.id === gameState.currentPlayerID);
  const isDrawer = socket.id === gameState.currentPlayerID;
  const totalRounds = room.settings.rounds;

  return (
    <div className="round-info">
      <span className="round-info__round">
        Round {gameState.currentRound} / {totalRounds}
      </span>
      <span className="round-info__drawer">
        {isDrawer ? '🖌️ You are drawing!' : `🖌️ ${drawer?.name ?? '?'} is drawing`}
      </span>
    </div>
  );
}
