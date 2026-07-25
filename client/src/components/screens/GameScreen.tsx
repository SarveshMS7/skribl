import Canvas from '../game/Canvas';
import WordChooser from '../game/WordChooser';
import WordDisplay from '../game/WordDisplay';
import TimerBar from '../game/TimerBar';
import ChatBox from '../game/ChatBox';
import PlayerList from '../game/PlayerList';
import RoundInfo from '../game/RoundInfo';
import './GameScreen.css';

export default function GameScreen() {
  return (
    <div className="game-screen">
      {/* Word chooser modal (only visible to drawer when choosing) */}
      <WordChooser />

      {/* Top bar */}
      <header className="game-screen__header glass-strong">
        <RoundInfo />
        <WordDisplay />
        <TimerBar />
      </header>

      {/* Main content */}
      <div className="game-screen__body">
        {/* Left: Players */}
        <aside className="game-screen__sidebar game-screen__sidebar--left">
          <PlayerList />
        </aside>

        {/* Center: Canvas */}
        <main className="game-screen__canvas-wrap glass">
          <Canvas />
        </main>

        {/* Right: Chat */}
        <aside className="game-screen__sidebar game-screen__sidebar--right">
          <ChatBox />
        </aside>
      </div>
    </div>
  );
}
