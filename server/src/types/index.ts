export interface gamestate{
    currentRound: number,
    currentplayerID: string,
    turnendtime:number,
    status: 'playing' | 'waiting' | 'Ended' ,
    currentWord:string,
    score: Record<string,number>
}

export interface Player{
    id:string;
    name:string;
}

export interface Room{
    hostId:string;
    status: 'playing' | 'waiting';
    players: Player[],
}
