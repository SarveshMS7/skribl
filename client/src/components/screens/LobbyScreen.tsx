import { useState } from 'react';
import { socket } from '../../services/socket/socket';
import { useGameStore, useGameDispatch } from '../../store/useGameStore';
import './LobbyScreen.css';

const AVATAR_COLORS = [
  '#ff577f', '#3b82f6', '#00f0ff', '#22e577',
  '#ff914d', '#ff334b', '#8b5cf6', '#ffde59',
  '#6366f1', '#14b8a6', '#f59e0b', '#ec4899',
];

export default function LobbyScreen() {
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
          <p>Connecting to Room...</p>
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
          <div className="lobby__title-wrap">
            <h1 className="lobby__title">Game Lobby</h1>
            <span className="lobby__title-badge">Ready!</span>
          </div>

          <div
            className="lobby__code-box"
            onClick={copyCode}
            title="Click to copy room code"
          >
            <span className="lobby__code-label">Room Code</span>
            <span className="lobby__code-value">{roomCode}</span>
            <span className={`lobby__code-copy ${copied ? 'lobby__code-copy--copied' : ''}`}>
              {copied ? '✓ Copied to clipboard!' : '📋 Click to copy'}
            </span>
          </div>
        </div>

        <div className="lobby__content">
          {/* Player List */}
          <div className="lobby__players">
            <div className="lobby__section-header">
              <h2 className="lobby__section-title">Players</h2>
              <span className="lobby__player-count">
                {room.players.length} / {room.settings.maxmembers}
              </span>
            </div>

            <ul className="lobby__player-list">
              {room.players.map((player, i) => (
                <li
                  key={player.id}
                  className="lobby__player"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
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
          <div className="lobby__settings">
            <div className="lobby__section-header">
              <h2 className="lobby__section-title">Match Settings</h2>
              <span className="neo-badge">⚙️ Rules</span>
            </div>

            <div className="lobby__setting">
              <label className="lobby__setting-label">
                <span>⏱️ Draw Time</span>
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
                <span>🔄 Total Rounds</span>
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
                <span>👥 Max Players</span>
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
              <p className="lobby__settings-note">🔒 Only the room host can adjust settings</p>
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
              {canStart ? '🎮 Start Game Now!' : `Need ${2 - room.players.length} More Player(s)`}
            </button>
          ) : (
            <p className="lobby__waiting">⏳ Waiting for host to start the game...</p>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
            🚪 Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
