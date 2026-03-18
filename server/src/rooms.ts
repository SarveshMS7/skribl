import redis from "./redis";

export interface Player{
    id:string;
    name:string;
}

export interface Room{
    hostId:string;
    status: 'playing' | 'waiting';
    players: Player[]
}

function generateroom(): string{
    const char = 'abcdefghijklmnopqrstuvwxyz1234567890';
    let code = '';
     for (let i = 0; i < 6; i++) {
    code += char[Math.floor(Math.random() * char.length)];
  }
  return code;
}

export async function createRoom(hostId:string , hostName:string) :Promise<string>{
    const code = generateroom();

    const room: Room = {
        hostId,
        status: 'waiting',
        players:[{id:hostId, name:hostName}]
    }
    await redis.set(`room ${hostId} `, JSON.stringify(code) );
    return code;
}

export async function joinRoom(code:string ,playerId:string , playerName:string): Promise<Room | null>{
    const join = await redis.get(` rooms ${code}`)

    if(!join)return null;

    const room: Room = JSON.parse(join)

    room.players.push({id:playerId , name: playerName })

    await redis.set(`room ${code}`,JSON.stringify(room));
    return room;
}

export async function removePlayer(hostId:string, code:string, playerId:string): Promise<void>{
    const val = await redis.get(`room ${code}`)

    if(!val)return;
    const room: Room = JSON.parse(val)

    room.players = room.players.filter(p=>p.id !== playerId)

    if(room.players.length==0){
        await redis.del(` ${code}`)
    }
    else{
        await redis.set(`${code}`, JSON.stringify(room));
    }
}


