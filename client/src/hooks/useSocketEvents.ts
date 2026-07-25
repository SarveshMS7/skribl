import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGameDispatch } from '../store/useGameStore';
import type { Room, GameState } from '../store/useGameStore';

/**
 * Subscribes to all server→client socket events and dispatches
 * actions to the game store. Mount once in App.
 */
export function useSocketEvents() {
  const { socket } = useSocket();
  const dispatch = useGameDispatch();

  useEffect(() => {
    // Room events
    socket.on('roomCreated', (data: { code: string }) => {
      dispatch({ type: 'ROOM_CREATED', code: data.code });
    });

    socket.on('roomUpdated', (room: Room) => {
      dispatch({ type: 'ROOM_UPDATED', room });
    });

    // Game lifecycle
    socket.on('gamestarted', (data: { state: GameState }) => {
      dispatch({ type: 'GAME_STARTED', state: data.state });
    });

    socket.on('turnStart', (data: { state: GameState; wordlen?: number }) => {
      dispatch({ type: 'TURN_START', state: data.state, wordlen: data.wordlen });
    });

    socket.on('wordChoices', (data: { words: string[] }) => {
      dispatch({ type: 'WORD_CHOICES', words: data.words });
    });

    socket.on('timerTick', (data: { secondsLeft: number; hint: string }) => {
      dispatch({ type: 'TIMER_TICK', secondsLeft: data.secondsLeft, hint: data.hint });
    });

    socket.on('correctguess', (data: { playerId: string; points: number }) => {
      dispatch({ type: 'CORRECT_GUESS', playerId: data.playerId, points: data.points });
    });

    socket.on('chatmessage', (data: { playerId: string; message: string }) => {
      dispatch({ type: 'CHAT_MESSAGE', playerId: data.playerId, message: data.message });
    });

    socket.on('scoreUpdate', (data: { score: Record<string, number> }) => {
      dispatch({ type: 'SCORE_UPDATE', score: data.score });
    });

    socket.on('turnended', (data: { reason: string; nextDrawer: string; word: string }) => {
      dispatch({ type: 'TURN_ENDED', word: data.word, nextDrawer: data.nextDrawer });
    });

    socket.on('gameEnded', (data: { state: GameState }) => {
      dispatch({ type: 'GAME_ENDED', state: data.state });
    });

    socket.on('clearCanvas', () => {
      dispatch({ type: 'CLEAR_CANVAS' });
    });

    socket.on('error', (data: { message: string }) => {
      dispatch({ type: 'SET_TOAST', toast: { message: data.message, type: 'error' } });
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        dispatch({ type: 'SET_TOAST', toast: null });
      }, 3000);
    });

    // Cleanup on unmount
    return () => {
      socket.off('roomCreated');
      socket.off('roomUpdated');
      socket.off('gamestarted');
      socket.off('turnStart');
      socket.off('wordChoices');
      socket.off('timerTick');
      socket.off('correctguess');
      socket.off('chatmessage');
      socket.off('scoreUpdate');
      socket.off('turnended');
      socket.off('gameEnded');
      socket.off('clearCanvas');
      socket.off('error');
    };
  }, [socket, dispatch]);
}
