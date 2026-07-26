export interface gamestate{
    currentRound: number,
    currentplayerID: string,
    turnendtime:number,
    status: 'playing' | 'waiting' | 'Ended' | 'choosing',
    currentWord:string,
    score: Record<string,number>,
    guessedPlayers: string[]
}

export interface Player{
    id:string;
    name:string;
}

export interface GameSettings{
    drawtime: number;   // seconds per turn
    maxmembers: number;
    rounds: number;
}

export interface Room{
    hostId:string;
    status: 'playing' | 'waiting';
    players: Player[];
    settings: GameSettings;
}

export interface Draw{
    code:string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    color: string;
    size: number;
    tool?: 'pencil' | 'eraser' | 'fill';
}
