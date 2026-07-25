import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGameStore } from '../../store/useGameStore';
import './ChatBox.css';

export default function ChatBox() {
  const { socket } = useSocket();
  const { messages, roomCode, gameState } = useGameStore();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !roomCode) return;

    socket.emit('guess', { code: roomCode, message: text.trim() });
    setText('');
  }

  const isDrawer = socket.id === gameState?.currentPlayerID;

  return (
    <div className="chatbox glass">
      <div className="chatbox__messages">
        {messages.length === 0 && (
          <p className="chatbox__empty">No messages yet. Start guessing!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`chatbox__msg chatbox__msg--${msg.type}`}>
            {msg.type === 'system' ? (
              <span className="chatbox__system">{msg.message}</span>
            ) : (
              <>
                <span className="chatbox__name">{msg.playerName}:</span>
                <span className="chatbox__text">{msg.message}</span>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chatbox__form" onSubmit={handleSubmit}>
        <input
          className="input chatbox__input"
          placeholder={isDrawer ? 'You are drawing...' : 'Type your guess...'}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={isDrawer}
        />
        <button
          type="submit"
          className="btn btn-primary chatbox__send"
          disabled={!text.trim() || isDrawer}
        >
          Send
        </button>
      </form>
    </div>
  );
}
