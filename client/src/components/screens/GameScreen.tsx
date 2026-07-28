import Canvas from '../game/Canvas';
import WordChooser from '../game/WordChooser';
import WordDisplay from '../game/WordDisplay';
import TimerBar from '../game/TimerBar';
import ChatBox from '../game/ChatBox';
import PlayerList from '../game/PlayerList';
import { useGameStore } from '../../store/useGameStore';
import { socket } from '../../services/socket/socket';
import './GameScreen.css';

export default function GameScreen() {
  const { gameState, room } = useGameStore();

  const drawer = room?.players.find(p => p.id === gameState?.currentPlayerID);
  const isDrawer = socket.id === gameState?.currentPlayerID;

  return (
    <div className="game-screen">
      {/* Word chooser modal */}
      <WordChooser />

      {/* Top bar */}
      <header className="game-screen__header glass-strong">
        {gameState && room && (
          <div className="round-info">
            <span className="round-info__round">
              Round {gameState.currentRound} / {room.settings.rounds}
            </span>
            <span className="round-info__drawer">
              {isDrawer ? '🖌️ You are drawing!' : `🖌️ ${drawer?.name ?? '?'} is drawing`}
            </span>
          </div>
        )}
        <WordDisplay />
        <TimerBar />
      </header>

      {/* Main content */}
      <div className="game-screen__body">
        <aside className="game-screen__sidebar game-screen__sidebar--left">
          <PlayerList />
        </aside>

        <main className="game-screen__canvas-wrap glass">
          <Canvas />
        </main>

        <aside className="game-screen__sidebar game-screen__sidebar--right">
          <ChatBox />
        </aside>
      </div>
    </div>
  );
}
