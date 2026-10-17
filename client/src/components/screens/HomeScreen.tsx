import { useState, useEffect } from 'react';
import { socket } from '../../services/socket/socket';
import { useGameDispatch } from '../../store/useGameStore';
import './HomeScreen.css';

interface LetterConfig {
  char: string;
  bg: string;
  rot: string;
}

const LETTERS: LetterConfig[] = [
  { char: 'S', bg: 'var(--neo-yellow)', rot: '-3deg' },
  { char: 'K', bg: 'var(--neo-pink)', rot: '2deg' },
  { char: 'R', bg: 'var(--neo-cyan)', rot: '-2deg' },
  { char: 'I', bg: 'var(--neo-green)', rot: '3deg' },
  { char: 'B', bg: 'var(--neo-purple)', rot: '-1deg' },
  { char: 'L', bg: 'var(--neo-orange)', rot: '2deg' },
];

export default function HomeScreen() {
  const dispatch = useGameDispatch();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [showWakeupTip, setShowWakeupTip] = useState(false);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setShowWakeupTip(false);
    }
    function onDisconnect() {
      setIsConnected(false);
    }
    function onConnectError() {
      setIsConnected(false);
    }

    if (socket.connected) {
      setIsConnected(true);
    } else {
      socket.connect();
    }

    const timer = setTimeout(() => {
      if (!socket.connected) {
        setShowWakeupTip(true);
      }
    }, 5000);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  function handleCreate() {
    if (!name.trim()) return;
    dispatch({ type: 'SET_PLAYER_NAME', name: name.trim() });
    socket.emit('createRoom', { name: name.trim() });
  }

  function handleJoin() {
    if (!name.trim() || !code.trim()) return;
    dispatch({ type: 'SET_PLAYER_NAME', name: name.trim() });
    dispatch({ type: 'SET_ROOM_CODE', code: code.trim().toUpperCase() });
    socket.emit('joinRoom', { code: code.trim().toUpperCase(), name: name.trim() });
  }

  return (
    <div className="home">
      {/* Decorative Neo Geometric Floating Badges */}
      <div className="bg-glow bg-glow--purple" />
      <div className="bg-glow bg-glow--blue" />

      <div className="home__container">
        {/* Header with Title & Status */}
        <div className="home__header">
          <div className="home__top-badges">
            <span className="home__sticker-tag">⚡ Draw & Guess Online ⚡</span>
            <div className={`home__status ${isConnected ? 'home__status--connected' : ''}`}>
              <span className="home__status-dot" />
              {isConnected ? 'Server Online' : 'Connecting...'}
            </div>
          </div>

          <div className="home__title-wrap">
            {LETTERS.map((item, i) => (
              <span
                key={i}
                className="home__title-letter"
                style={{
                  background: item.bg,
                  transform: `rotate(${item.rot})`,
                  '--i': i,
                  '--rot': item.rot,
                } as React.CSSProperties}
              >
                {item.char}
              </span>
            ))}
          </div>
          <p className="home__subtitle">Draw Fast • Guess Faster</p>

          {!isConnected && showWakeupTip && (
            <p className="home__tip">
              Free tier backend may take ~50s to wake up if inactive.
            </p>
          )}
        </div>

        {/* Global Nickname Card */}
        <div className="home__name-card neo-card">
          <label className="home__label" htmlFor="player-nickname">
            <span>👤</span>
            <span>Your Nickname</span>
            <span className="home__label-hint">(Required to Play)</span>
          </label>
          <input
            id="player-nickname"
            className="input home__name-input"
            placeholder="Enter your nickname (e.g. MasterDoodler)"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
        </div>

        {/* Both Parts Visible Directly: Part 1 (Create) & Part 2 (Join) */}
        <div className="home__two-parts">
          {/* Part 1: Create Room */}
          <div className="home__part home__part--create neo-card">
            <div className="home__part-header">
              <span className="home__part-badge home__part-badge--create">👑 Host a Game</span>
              <h2 className="home__part-title">Create Room</h2>
            </div>
            <p className="home__part-desc">
              Start a new room, set custom round timers, and invite your friends with a code.
            </p>
            <button
              type="button"
              className="btn btn-lg home__btn home__btn-create"
              onClick={handleCreate}
              disabled={!name.trim() || !isConnected}
            >
              🎨 Create Room
            </button>
          </div>

          {/* Part 2: Join Room */}
          <div className="home__part home__part--join neo-card">
            <div className="home__part-header">
              <span className="home__part-badge home__part-badge--join">🔗 Have a Code?</span>
              <h2 className="home__part-title">Join Room</h2>
            </div>
            <p className="home__part-desc">
              Enter the 6-letter room code shared by your friend to jump right into the game.
            </p>
            <div className="home__join-controls">
              <input
                className="input home__code-input"
                placeholder="ROOM CODE"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleJoin();
                }}
              />
              <button
                type="button"
                className="btn btn-lg home__btn home__btn-join"
                onClick={handleJoin}
                disabled={!name.trim() || !code.trim() || !isConnected}
              >
                Join 🚀
              </button>
            </div>
          </div>
        </div>

        {/* Quick Rules Footer */}
        <div className="home__features">
          <div className="home__feature-item">
            <span className="home__feature-icon">✏️</span>
            <span>1. One Player Draws</span>
          </div>
          <div className="home__feature-item">
            <span className="home__feature-icon">💬</span>
            <span>2. Everyone Guesses</span>
          </div>
          <div className="home__feature-item">
            <span className="home__feature-icon">🏆</span>
            <span>3. Highest Score Wins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
