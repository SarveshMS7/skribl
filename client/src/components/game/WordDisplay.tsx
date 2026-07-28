import { socket } from '../../services/socket/socket';
import { useGameStore } from '../../store/useGameStore';

export default function WordDisplay() {
  const { gameState, currentWord, hint, turnEndWord } = useGameStore();

  if (!gameState) return null;

  const isDrawer = socket.id === gameState.currentPlayerID;

  // After turn ended — reveal the word
  if (turnEndWord) {
    return (
      <div className="word-display word-display--revealed">
        <span className="word-display__label">The word was</span>
        <span className="word-display__word word-display__word--reveal">{turnEndWord}</span>
      </div>
    );
  }

  // During word choice phase
  if (gameState.status === 'choosing') {
    return (
      <div className="word-display">
        <span className="word-display__label">
          {isDrawer ? 'Pick a word below...' : 'Drawer is choosing a word...'}
        </span>
      </div>
    );
  }

  // Drawer sees the full word
  if (isDrawer && currentWord) {
    return (
      <div className="word-display">
        <span className="word-display__label">Your word</span>
        <span className="word-display__word word-display__word--drawer">{currentWord}</span>
      </div>
    );
  }

  // Non-drawer sees hint (underscores with revealed letters)
  if (hint) {
    return (
      <div className="word-display">
        <span className="word-display__label">Guess the word</span>
        <span className="word-display__word word-display__word--hint">
          {hint.split('').map((char, i) => (
            <span
              key={i}
              className={`word-display__char ${char !== '_' ? 'word-display__char--revealed' : ''}`}
            >
              {char}
            </span>
          ))}
        </span>
      </div>
    );
  }

  return (
    <div className="word-display">
      <span className="word-display__label">Waiting...</span>
    </div>
  );
}
