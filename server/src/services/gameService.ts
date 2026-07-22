import redis from "../redis";
import { getRoom } from "./roomService";
import { gamestate, GameSettings } from "../types";


const words =['giraffe', 'elephant', 'octopus', 'dolphin', 'peacock', 'kangaroo', 'panda', 'owl', 'flamingo', 'turtle', 'skateboard', 'roller skates', 'traffic light', 'street lamp', 'mailbox', 'windmill', 'lighthouse', 'tent', 'hammock', 'swing', 'seesaw', 'carousel', 'ferris wheel', 'hot air balloon', 'parachute', 'submarine', 'train', 'taxi', 'helicopter', 'scooter', 'frying pan', 'teapot', 'blender', 'toaster', 'sandwich', 'noodles', 'popcorn', 'donut', 'cupcake', 'milkshake', 'sunglasses', 'backpack', 'headphones', 'camera', 'telescope', 'compass', 'map', 'hourglass', 'alarm clock', 'keychain', 'candle stand', 'bookshelf', 'ladder', 'paintbrush', 'palette', 'scissors', 'glue', 'notebook', 'pencil case', 'ruler', 'eraser', 'magnet', 'battery', 'flashlight', 'plug', 'fan', 'air conditioner', 'washing machine', 'vacuum cleaner', 'doorbell', 'window', 'curtain', 'carpet', 'pillow', 'blanket', 'sofa', 'dining table', 'wardrobe', 'mirror frame', 'flower pot', 'cactus', 'bonsai', 'sunflower', 'mushroom', 'leaf', 'snowman', 'igloo', 'campfire', 'rainbow', 'waterfall', 'bridge arch', 'cave', 'island hut', 'treasure chest', 'pirate ship', 'robot arm', 'drone', 'satellite dish']

function sel():string {
    return words[ Math.floor(Math.random() * words.length)];
}

// helper to get room settings for a game
async function getSettings(code: string): Promise<GameSettings> {
    const room = await getRoom(code);
    return room!.settings;
}

export async function game(code:string, players:{id:string}[]): Promise <gamestate> {
    const settings = await getSettings(code);
    const state : gamestate ={
        currentRound: 1,
        currentplayerID:players[0].id,
        turnendtime:Date.now() + settings.drawtime*1000,
        status:'playing',
        currentWord: sel(),
        score:Object.fromEntries(players.map(p => [p.id, 0]))
    };
    await redis.set(`game:${code}`,JSON.stringify(state));
    return state;
}

//next turn
 export async function nextTurn(code:string, players:{id:string}[]):Promise <gamestate | null>{
    const val = await redis.get(`game:${code}`)
    if(!val)return null;

    const settings = await getSettings(code);
    const state : gamestate = JSON.parse(val)

    const index = players.findIndex(p=>p.id === state.currentplayerID);
    const nextindex = index+1;

    if(nextindex>= players.length){
        state.currentRound +=1;

        if(state.currentRound > settings.rounds){
            state.status='Ended';
            await redis.set(`game:${code}`,JSON.stringify(state))
            return state;
        }
        state.currentplayerID = players[0].id;
    }else{
        state.currentplayerID = players[nextindex].id
    }

    state.currentWord = sel();
    state.turnendtime = Date.now() + settings.drawtime*1000;

    await redis.set(`game:${code}`, JSON.stringify(state));
    return state;
 }

 //guess
 export async function handleguess(playerId:string, code:string, guess:string ){
    const val = await redis.get(`game:${code}`);
    if(!val)return {correct:false , points:0}

    const settings = await getSettings(code);
    const state : gamestate = JSON.parse(val)

    if(playerId === state.currentplayerID){
        return {correct:false, points:0}
    };

    const check = guess.toLowerCase() === state.currentWord.toLowerCase();
    if(!check)return {correct:false , points:0}

    const timeleft = Math.max(0,state.turnendtime - Date.now());
    const points = Math.floor((timeleft/(settings.drawtime*1000))*100);

    state.score[playerId] += points;

    await redis.set(`game:${code}`,JSON.stringify(state));
    return {correct:true, points};

 }