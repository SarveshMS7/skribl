import redis from "../redis";
import { Room } from "../types";

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
        players:[{id:hostId, name}]
    }
    await redis.set(`room:${code}`, JSON.stringify(room));
    await redis.set(`player:${hostId}`, code);
    return code;
}

export async function joinRoom(name:string, code:string, playerId:string): Promise<Room | null>{
    const join = await redis.get(`room:${code}`)
    if(!join)return null;
    
    const room: Room = JSON.parse(join)
    if(room.players.length >= gamesetting.maxmembers) return null;

    room.players.push({id:playerId, name})
    await redis.set(`room:${code}`, JSON.stringify(room));
    await redis.set(`player:${playerId}`, code);
    return room;
}

export async function removePlayer(code:string, playerId:string): Promise<void>{
    const val = await redis.get(`room:${code}`)
    if(!val)return;

    const room: Room = JSON.parse(val)
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
/// check this 
export const gamesetting = {
    drawtime:1,
    maxmembers:5,
    rounds:3
}

// use this getroom for above functions
export async function getRoom(code: string): Promise<Room | null> {
    const val = await redis.get(`room:${code}`);
    if(!val)return null;
    //'as' is a ts thing that tells the val to be treated as--
    return JSON.parse(val) as Room;   
}

export async function updateRoom(code: string, status: 'playing' | 'waiting'): Promise<void> {
    const room = await getRoom(code);

    if(room){
        room.status =  status;
        await redis.set(`room:${code}`,JSON.stringify(room));
    }

}