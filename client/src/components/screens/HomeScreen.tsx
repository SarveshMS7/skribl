import { useState, useEffect } from 'react';
import { socket } from '../../services/socket/socket';
import { useGameDispatch } from '../../store/useGameStore';
import './HomeScreen.css';

const TITLE = 'SKRIBL';

export default function HomeScreen() {
  const dispatch = useGameDispatch();

  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
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
      <div className="bg-glow bg-glow--purple" />
      <div className="bg-glow bg-glow--blue" />

      <div className="home__container">
        <div className="home__header">
          <h1 className="home__title">
            {TITLE.split('').map((char, i) => (
              <span key={i} className="home__title-letter" style={{ '--i': i } as React.CSSProperties}>
                {char}
              </span>
            ))}
          </h1>
          <p className="home__subtitle">Draw, Guess, Win!</p>
        </div>

        {/* Connection status */}
        <div className={`home__status ${isConnected ? 'home__status--connected' : ''}`}>
          <span className="home__status-dot" />
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
        {!isConnected && showWakeupTip && (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '-8px 0 16px', textAlign: 'center' }}>
            Free tier backend may take ~50s to wake up if inactive.
          </p>
        )}

        {mode === 'menu' && (
          <div className="home__actions">
            <button className="btn btn-primary btn-lg home__btn" onClick={() => setMode('create')}>
              🎨 Create Room
            </button>
            <button className="btn btn-secondary btn-lg home__btn" onClick={() => setMode('join')}>
              🔗 Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form className="home__form glass-strong" onSubmit={e => { e.preventDefault(); handleCreate(); }}>
            <h2 className="home__form-title">Create a Room</h2>
            <div className="home__field">
              <label className="home__label">Your Name</label>
              <input
                className="input"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="home__form-actions">
              <button type="submit" className="btn btn-primary" disabled={!name.trim() || !isConnected}>
                Create
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('menu')}>
                Back
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form className="home__form glass-strong" onSubmit={e => { e.preventDefault(); handleJoin(); }}>
            <h2 className="home__form-title">Join a Room</h2>
            <div className="home__field">
              <label className="home__label">Your Name</label>
              <input
                className="input"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="home__field">
              <label className="home__label">Room Code</label>
              <input
                className="input"
                placeholder="Enter room code"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            <div className="home__form-actions">
              <button type="submit" className="btn btn-primary" disabled={!name.trim() || !code.trim() || !isConnected}>
                Join
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('menu')}>
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
