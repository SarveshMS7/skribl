// Shared types between client and server

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
    currentWord: string | null; // null when sent to non-drawers
    score: Record<string, number>;
    guessedPlayers: string[]; // player IDs who guessed correctly this turn
}

export interface DrawEvent {
    code: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    color: string;
    size: number;
    tool?: 'pencil' | 'eraser' | 'fill';
}

// Socket event payloads
export interface ServerToClientEvents {
    roomCreated: (data: { code: string }) => void;
    roomUpdated: (room: Room) => void;
    gamestarted: (data: { state: GameState }) => void;
    turnStart: (data: { state: GameState; wordlen?: number }) => void;
    turnended: (data: { reason: string; nextDrawer: string; word: string }) => void;
    gameEnded: (data: { state: GameState }) => void;
    correctguess: (data: { playerId: string; points: number }) => void;
    chatmessage: (data: { playerId: string; message: string }) => void;
    clearCanvas: () => void;
    draw: (data: DrawEvent) => void;
    error: (data: { message: string }) => void;
    wordChoices: (data: { words: string[] }) => void;
    timerTick: (data: { secondsLeft: number; hint: string }) => void;
    scoreUpdate: (data: { score: Record<string, number> }) => void;
    returnedToLobby: (data: { room: Room }) => void;
}

export interface ClientToServerEvents {
    createRoom: (data: { name: string }) => void;
    joinRoom: (data: { name: string; code: string }) => void;
    rejoinRoom: (data: { name: string; code: string }) => void;
    startGame: (data: { code: string }) => void;
    guess: (data: { code: string; guess: string }) => void;
    draw: (data: DrawEvent) => void;
    clearboard: (data: { code: string }) => void;
    gameSettings: (data: { code: string; settings: Partial<GameSettings> }) => void;
    wordChosen: (data: { code: string; word: string }) => void;
    playAgain: (data: { code: string }) => void;
}
