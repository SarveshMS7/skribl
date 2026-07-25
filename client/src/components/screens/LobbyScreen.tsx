import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGameStore, useGameDispatch } from '../../store/useGameStore';
import './LobbyScreen.css';

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#7c3aed',
  '#4f46e5', '#0d9488', '#ca8a04', '#e11d48',
];

export default function LobbyScreen() {
  const { socket } = useSocket();
  const state = useGameStore();
  const dispatch = useGameDispatch();
  const { room, roomCode } = state;

  const [copied, setCopied] = useState(false);

  if (!room) {
    return (
      <div className="lobby">
        <div className="bg-glow bg-glow--purple" />
        <div className="bg-glow bg-glow--blue" />
        <div className="lobby__loading">
          <div className="lobby__spinner" />
          <p>Connecting to room...</p>
        </div>
      </div>
    );
  }

  const isHost = socket.id === room.hostId;
  const canStart = isHost && room.players.length >= 2;

  function copyCode() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleStartGame() {
    socket.emit('startGame', { code: roomCode });
  }

  function handleSettingsChange(key: string, value: number) {
    socket.emit('gameSettings', {
      code: roomCode,
      settings: { [key]: value },
    });
  }

  function handleLeave() {
    socket.disconnect();
    dispatch({ type: 'RESET' });
  }

  return (
    <div className="lobby">
      <div className="bg-glow bg-glow--purple" />
      <div className="bg-glow bg-glow--blue" />

      <div className="lobby__container">
        {/* Header */}
        <div className="lobby__header">
          <h1 className="lobby__title">Game Lobby</h1>
          <div className="lobby__code-box glass" onClick={copyCode}>
            <span className="lobby__code-label">Room Code</span>
            <span className="lobby__code-value">{roomCode}</span>
            <span className="lobby__code-copy">
              {copied ? '✓ Copied!' : 'Click to copy'}
            </span>
          </div>
        </div>

        <div className="lobby__content">
          {/* Player List */}
          <div className="lobby__players glass">
            <h2 className="lobby__section-title">
              Players
              <span className="lobby__player-count">
                {room.players.length}/{room.settings.maxmembers}
              </span>
            </h2>
            <ul className="lobby__player-list">
              {room.players.map((player, i) => (
                <li key={player.id} className="lobby__player" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div
                    className="lobby__player-avatar"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="lobby__player-name">{player.name}</span>
                  {player.id === room.hostId && (
                    <span className="lobby__player-badge">👑 Host</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Settings */}
          <div className="lobby__settings glass">
            <h2 className="lobby__section-title">Settings</h2>

            <div className="lobby__setting">
              <label className="lobby__setting-label">
                Draw Time
                <span className="lobby__setting-value">{room.settings.drawtime}s</span>
              </label>
              <input
                type="range"
                className="lobby__slider"
                min={10}
                max={180}
                step={10}
                value={room.settings.drawtime}
                onChange={e => handleSettingsChange('drawtime', Number(e.target.value))}
                disabled={!isHost}
              />
            </div>

            <div className="lobby__setting">
              <label className="lobby__setting-label">
                Rounds
                <span className="lobby__setting-value">{room.settings.rounds}</span>
              </label>
              <input
                type="range"
                className="lobby__slider"
                min={1}
                max={10}
                step={1}
                value={room.settings.rounds}
                onChange={e => handleSettingsChange('rounds', Number(e.target.value))}
                disabled={!isHost}
              />
            </div>

            <div className="lobby__setting">
              <label className="lobby__setting-label">
                Max Players
                <span className="lobby__setting-value">{room.settings.maxmembers}</span>
              </label>
              <input
                type="range"
                className="lobby__slider"
                min={2}
                max={12}
                step={1}
                value={room.settings.maxmembers}
                onChange={e => handleSettingsChange('maxmembers', Number(e.target.value))}
                disabled={!isHost}
              />
            </div>

            {!isHost && (
              <p className="lobby__settings-note">Only the host can change settings</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="lobby__actions">
          {isHost ? (
            <button
              className="btn btn-primary btn-lg lobby__start-btn"
              onClick={handleStartGame}
              disabled={!canStart}
            >
              {canStart ? '🎮 Start Game' : `Need ${2 - room.players.length} more player(s)`}
            </button>
          ) : (
            <p className="lobby__waiting">Waiting for host to start the game...</p>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
