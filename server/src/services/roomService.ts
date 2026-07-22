import redis from "../redis";
import { Room, GameSettings } from "../types";

export const DEFAULT_SETTINGS: GameSettings = {
    drawtime: 60,
    maxmembers: 5,
    rounds: 3
};

function generateroom(): string{
    const char = 'abcdefghijklmnopqrstuvwxyz1234567890';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += char[Math.floor(Math.random() * char.length)];
    }
    return code;
}

export async function createRoom(name:string, hostId:string) :Promise<string>{
    const code = generateroom();

    const room: Room = {
        hostId,
        status: 'waiting',
        players:[{id:hostId, name}],
        settings: { ...DEFAULT_SETTINGS }
    }
    await redis.set(`room:${code}`, JSON.stringify(room));
    await redis.set(`player:${hostId}`, code);
    return code;
}

export async function joinRoom(name:string, code:string, playerId:string): Promise<Room | null>{
    const room = await getRoom(code);
    if(!room) return null;
    if(room.players.length >= room.settings.maxmembers) return null;

    room.players.push({id:playerId, name})
    await redis.set(`room:${code}`, JSON.stringify(room));
    await redis.set(`player:${playerId}`, code);
    return room;
}

export async function removePlayer(code:string, playerId:string): Promise<void>{
    const room = await getRoom(code);
    if(!room) return;

    room.players = room.players.filter(p => p.id !== playerId)

    if(room.players.length === 0){
        await redis.del(`room:${code}`)
        return;
    }
    // transfer host if the host left
    if(room.hostId === playerId){
        room.hostId = room.players[0].id
    }
    await redis.set(`room:${code}`, JSON.stringify(room));
}

export async function getRoom(code: string): Promise<Room | null> {
    const val = await redis.get(`room:${code}`);
    if(!val) return null;
    return JSON.parse(val) as Room;
}

export async function updateRoom(code: string, status: 'playing' | 'waiting'): Promise<void> {
    const room = await getRoom(code);
    if(room){
        room.status = status;
        await redis.set(`room:${code}`, JSON.stringify(room));
    }
}

export async function updateSettings(code: string, hostId: string, newSettings: Partial<GameSettings>): Promise<Room | null> {
    const room = await getRoom(code);
    if(!room) return null;
    // only host can change settings
    if(room.hostId !== hostId) return null;
    // can't change settings while playing
    if(room.status === 'playing') return null;

    // merge only valid fields, clamp values
    if(newSettings.drawtime != null){
        room.settings.drawtime = Math.min(180, Math.max(10, newSettings.drawtime));
    }
    if(newSettings.rounds != null){
        room.settings.rounds = Math.min(10, Math.max(1, newSettings.rounds));
    }
    if(newSettings.maxmembers != null){
        room.settings.maxmembers = Math.min(12, Math.max(2, newSettings.maxmembers));
    }

    await redis.set(`room:${code}`, JSON.stringify(room));
    return room;
}