import redis from "./redis";

export interface Player{
    id:string;
    name:string;
}

export interface Room{
    hostId:string;
    status: 'playing' | 'waiting';
    players: Player[],
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
    await redis.set(`room:${code} `, JSON.stringify(room) );
    return code;
}

export async function joinRoom(code:string ,playerId:string , playerName:string): Promise<Room | null>{

    const join = await redis.get(`rooms:${code}`)
    
    if(!join)return null;
    
    const room: Room = JSON.parse(join)
    //check if full
    if(room.players.length>=gamesetting.maxmembers){
        return null;
    }

    //can add somthing to prevent duplicate join if required here

    //else
    room.players.push({id:playerId , name: playerName })

    await redis.set(`room:${code}`,JSON.stringify(room));
    return room;
}

export async function removePlayer(code:string, playerId:string): Promise<void>{
    const val = await redis.get(`room:${code}`)

    if(!val)return;
    const room: Room = JSON.parse(val)
    //check for every player    keep them only of p id is not equal to playerID   remove players whose id dont match
    room.players = room.players.filter(p=>p.id !== playerId)

    if(room.players.length==0){
        await redis.del(`room:${code}`)
        return;
    }
    else{
        await redis.set(`room:${code}`, JSON.stringify(room));
    }
    // if the host is removed then make the next one in the array the host
    if(room.hostId == playerId){
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


