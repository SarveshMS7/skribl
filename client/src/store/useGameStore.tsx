import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';

//This is the central state manager for the entire client app.
// It uses React's Context + useReducer pattern (like a mini-Redux).
// ── Types ──────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
}
export interface Room {
  hostId: string;
  status: 'waiting' | 'playing';
  players: Player[];
  settings: GameSettings;
}
export interface GameSettings {
  drawtime: number;
  maxmembers: number;
  rounds: number;
}
export interface GameState {
  currentRound: number;
  currentPlayerID: string;
  turnEndTime: number;
  status: 'playing' | 'waiting' | 'Ended' | 'choosing';
  currentWord: string | null;
  score: Record<string, number>;
  guessedPlayers: string[];
}
export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  type: 'chat' | 'correct' | 'system';
  timestamp: number;
}
export type Screen = 'home' | 'lobby' | 'game' | 'end';
export interface StoreState {
  screen: Screen;
  room: Room | null;
  roomCode: string;
  playerName: string;
  gameState: GameState | null;
  wordChoices: string[];
  currentWord: string | null;
  wordLength: number;
  hint: string;
  secondsLeft: number;
  messages: ChatMessage[];
  toast: { message: string; type: 'error' | 'success' } | null;
  turnEndWord: string | null;
}
// ── Actions ────────────────────────────────────────────────
export type StoreAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_PLAYER_NAME'; name: string }
  | { type: 'SET_ROOM_CODE'; code: string }
  | { type: 'ROOM_UPDATED'; room: Room }
  | { type: 'ROOM_CREATED'; code: string }
  | { type: 'GAME_STARTED'; state: GameState }
  | { type: 'TURN_START'; state: GameState; wordlen?: number }
  | { type: 'WORD_CHOICES'; words: string[] }
  | { type: 'CLEAR_WORD_CHOICES' }
  | { type: 'TIMER_TICK'; secondsLeft: number; hint: string }
  | { type: 'CORRECT_GUESS'; playerId: string; points: number }
  | { type: 'CHAT_MESSAGE'; playerId: string; message: string }
  | { type: 'SCORE_UPDATE'; score: Record<string, number> }
  | { type: 'TURN_ENDED'; word: string; nextDrawer: string }
  | { type: 'GAME_ENDED'; state: GameState }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'SET_TOAST'; toast: { message: string; type: 'error' | 'success' } | null }
  | { type: 'RESET' };
// ── Initial state ──────────────────────────────────────────
const initialState: StoreState = {
  screen: 'home',
  room: null,
  roomCode: '',
  playerName: '',
  gameState: null,
  wordChoices: [],
  currentWord: null,
  wordLength: 0,
  hint: '',
  secondsLeft: 0,
  messages: [],
  toast: null,
  turnEndWord: null,
};
// ── Helpers ────────────────────────────────────────────────
let msgIdCounter = 0;
function nextMsgId(): string {
  return `msg-${Date.now()}-${msgIdCounter++}`;
}
function getPlayerName(state: StoreState, playerId: string): string {
  const player = state.room?.players.find(p => p.id === playerId);
  return player?.name ?? 'Unknown';
}
// ── Reducer ────────────────────────────────────────────────
function gameReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.name };
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.code };
    case 'ROOM_CREATED':
      return { ...state, roomCode: action.code, screen: 'lobby' };
    case 'ROOM_UPDATED':
      return { ...state, room: action.room };
    case 'GAME_STARTED':
      return {
        ...state,
        screen: 'game',
        gameState: action.state,
        messages: [],
        wordChoices: [],
        currentWord: null,
        hint: '',
        turnEndWord: null,
      };
    case 'TURN_START': {
      const newWord = action.state.currentWord;
      const newWordLen = action.wordlen ?? (newWord ? newWord.length : state.wordLength);
      return {
        ...state,
        gameState: action.state,
        currentWord: newWord,
        wordLength: newWordLen,
        hint: '',
        wordChoices: [],
        turnEndWord: null,
      };
    }
    case 'WORD_CHOICES':
      return { ...state, wordChoices: action.words };
    case 'CLEAR_WORD_CHOICES':
      return { ...state, wordChoices: [] };
    case 'TIMER_TICK':
      return { ...state, secondsLeft: action.secondsLeft, hint: action.hint };
    case 'CORRECT_GUESS': {
      const name = getPlayerName(state, action.playerId);
      const msg: ChatMessage = {
        id: nextMsgId(),
        playerId: action.playerId,
        playerName: name,
        message: `${name} guessed the word! (+${action.points})`,
        type: 'correct',
        timestamp: Date.now(),
      };
      return { ...state, messages: [...state.messages, msg] };
    }
    case 'CHAT_MESSAGE': {
      const name = getPlayerName(state, action.playerId);
      const msg: ChatMessage = {
        id: nextMsgId(),
        playerId: action.playerId,
        playerName: name,
        message: action.message,
        type: 'chat',
        timestamp: Date.now(),
      };
      return { ...state, messages: [...state.messages, msg] };
    }
    case 'SCORE_UPDATE':
      if (!state.gameState) return state;
      return {
        ...state,
        gameState: { ...state.gameState, score: action.score },
      };
    case 'TURN_ENDED': {
      const sysMsg: ChatMessage = {
        id: nextMsgId(),
        playerId: 'system',
        playerName: 'System',
        message: `The word was: ${action.word}`,
        type: 'system',
        timestamp: Date.now(),
      };
      return {
        ...state,
        turnEndWord: action.word,
        messages: [...state.messages, sysMsg],
      };
    }
    case 'GAME_ENDED':
      return {
        ...state,
        screen: 'end',
        gameState: action.state,
      };
    case 'CLEAR_CANVAS':
      // Canvas clearing is handled by ref in Canvas component
      return state;
    case 'SET_TOAST':
      return { ...state, toast: action.toast };
    case 'RESET':
      return { ...initialState, playerName: state.playerName };
    default:
      return state;
  }
}
// ── Context ────────────────────────────────────────────────
const GameStoreContext = createContext<StoreState | null>(null);
const GameDispatchContext = createContext<Dispatch<StoreAction> | null>(null);
export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameStoreContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStoreContext.Provider>
  );
}
export function useGameStore(): StoreState {
  const ctx = useContext(GameStoreContext);
  if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider');
  return ctx;
}
export function useGameDispatch(): Dispatch<StoreAction> {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error('useGameDispatch must be used within GameStoreProvider');
  return ctx;
}