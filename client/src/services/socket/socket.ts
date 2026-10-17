import { io } from 'socket.io-client';

const rawServerUrl = import.meta.env.VITE_SERVER_URL;
export const SERVER_URL = (rawServerUrl ?? 'http://localhost:3001').replace(/\/+$/, '');

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('[Socket] Connected to server successfully (ID:', socket.id, ') at:', SERVER_URL);
});

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection error to', SERVER_URL, ':', error.message);
});

socket.on('disconnect', (reason) => {
  console.warn('[Socket] Disconnected:', reason);
});