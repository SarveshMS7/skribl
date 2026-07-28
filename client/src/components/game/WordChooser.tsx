import { socket } from '../../services/socket/socket';
import { useGameStore, useGameDispatch } from '../../store/useGameStore';
import './WordChooser.css';

export default function WordChooser() {
  const { wordChoices, roomCode, gameState } = useGameStore();
  const dispatch = useGameDispatch();

  const isDrawer = socket.id === gameState?.currentPlayerID;
  if (!isDrawer || wordChoices.length === 0) return null;

  function handleChoose(word: string) {
    socket.emit('wordChosen', { code: roomCode, word });
    dispatch({ type: 'CLEAR_WORD_CHOICES' });
  }

  return (
    <div className="word-chooser__overlay">
      <div className="word-chooser glass-strong">
        <h2 className="word-chooser__title">Choose a Word</h2>
        <p className="word-chooser__subtitle">Pick a word to draw</p>
        <div className="word-chooser__cards">
          {wordChoices.map((word, i) => (
            <button
              key={word}
              className="word-chooser__card"
              onClick={() => handleChoose(word)}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {word}
            </button>
          ))}
        </div>
        <p className="word-chooser__timer-note">
          Auto-selecting in 15 seconds...
        </p>
      </div>
    </div>
  );
}
