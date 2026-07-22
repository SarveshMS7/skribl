// Shared types between client and server

export interface Player {
    id: string;
    name: string;
}

export interface Room {
    hostId: string;
    status: 'waiting' | 'playing';
    players: Player[];
}

export interface GameState {
    currentRound: number;
    currentPlayerID: string;
    turnEndTime: number;
    status: 'playing' | 'waiting' | 'Ended';
    currentWord: string | null; // null when sent to non-drawers
    score: Record<string, number>;
}

export interface DrawEvent {
    code: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    color: string;
    size: number;
}

// Socket event payloads
export interface ServerToClientEvents {
    roomCreated: (data: { code: string }) => void;
    roomUpdated: (room: Room) => void;
    gamestarted: (data: { state: GameState }) => void;
    turnStart: (data: { state: GameState; wordlen?: number }) => void;
    turnended: (data: { reason: string; nextDrawer: string }) => void;
    gameEnded: (data: { state: GameState }) => void;
    correctguess: (data: { playerId: string; points: number }) => void;
    chatmessage: (data: { playerId: string; message: string }) => void;
    clearCanvas: () => void;
    draw: (data: DrawEvent) => void;
    error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
    createRoom: (data: { name: string }) => void;
    joinRoom: (data: { name: string; code: string }) => void;
    startGame: (data: { code: string }) => void;
    guess: (data: { code: string; guess: string }) => void;
    draw: (data: DrawEvent) => void;
    clearboard: (data: { code: string }) => void;
}
