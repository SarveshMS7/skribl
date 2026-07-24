import redis from "../redis";
import { getRoom } from "./roomService";
import { gamestate, GameSettings } from "../types";


const words =['giraffe', 'elephant', 'octopus', 'dolphin', 'peacock', 'kangaroo', 'panda', 'owl', 'flamingo', 'turtle', 'skateboard', 'roller skates', 'traffic light', 'street lamp', 'mailbox', 'windmill', 'lighthouse', 'tent', 'hammock', 'swing', 'seesaw', 'carousel', 'ferris wheel', 'hot air balloon', 'parachute', 'submarine', 'train', 'taxi', 'helicopter', 'scooter', 'frying pan', 'teapot', 'blender', 'toaster', 'sandwich', 'noodles', 'popcorn', 'donut', 'cupcake', 'milkshake', 'sunglasses', 'backpack', 'headphones', 'camera', 'telescope', 'compass', 'map', 'hourglass', 'alarm clock', 'keychain', 'candle stand', 'bookshelf', 'ladder', 'paintbrush', 'palette', 'scissors', 'glue', 'notebook', 'pencil case', 'ruler', 'eraser', 'magnet', 'battery', 'flashlight', 'plug', 'fan', 'air conditioner', 'washing machine', 'vacuum cleaner', 'doorbell', 'window', 'curtain', 'carpet', 'pillow', 'blanket', 'sofa', 'dining table', 'wardrobe', 'mirror frame', 'flower pot', 'cactus', 'bonsai', 'sunflower', 'mushroom', 'leaf', 'snowman', 'igloo', 'campfire', 'rainbow', 'waterfall', 'bridge arch', 'cave', 'island hut', 'treasure chest', 'pirate ship', 'robot arm', 'drone', 'satellite dish']

function sel():string {
    return words[ Math.floor(Math.random() * words.length)];
}

/**
 * Pick 3 unique random words from the word bank.
 */
export function pickThreeWords(): string[] {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
}

/**
 * Generate a hint string that progressively reveals letters.
 * At 0% elapsed → all underscores.
 * At 25% → ~25% of letters revealed.
 * At 50% → ~50% of letters revealed.
 * At 75% → ~75% of letters revealed.
 * Spaces and hyphens are always visible.
 * Uses a seeded approach based on the word itself so the same letters
 * are revealed consistently across ticks.
 */
export function generateHint(word: string, elapsedMs: number, totalMs: number): string {
    const fraction = Math.min(1, Math.max(0, elapsedMs / totalMs));

    // Get indices of actual letters (not spaces/hyphens)
    const letterIndices: number[] = [];
    for (let i = 0; i < word.length; i++) {
        if (word[i] !== ' ' && word[i] !== '-') {
            letterIndices.push(i);
        }
    }

    // Deterministic shuffle based on word content so hints are stable
    const sorted = [...letterIndices].sort((a, b) => {
        const ca = word.charCodeAt(a) * 31 + a;
        const cb = word.charCodeAt(b) * 31 + b;
        return ca - cb;
    });

    // How many letters to reveal
    const revealCount = Math.floor(sorted.length * fraction * 0.75); // cap at 75% revealed

    const revealed = new Set(sorted.slice(0, revealCount));

    let hint = '';
    for (let i = 0; i < word.length; i++) {
        if (word[i] === ' ') {
            hint += '  '; // double space for readability
        } else if (word[i] === '-') {
            hint += '-';
        } else if (revealed.has(i)) {
            hint += word[i];
        } else {
            hint += '_';
        }
    }
    return hint;
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
        status:'choosing',
        currentWord: sel(),
        score:Object.fromEntries(players.map(p => [p.id, 0])),
        guessedPlayers: []
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
    state.status = 'choosing';
    state.guessedPlayers = [];

    await redis.set(`game:${code}`, JSON.stringify(state));
    return state;
 }

 //guess
 export async function handleguess(playerId:string, code:string, guess:string ){
    const val = await redis.get(`game:${code}`);
    if(!val)return {correct:false , points:0}

    const settings = await getSettings(code);
    const state : gamestate = JSON.parse(val)

    // can't guess if you're the drawer
    if(playerId === state.currentplayerID){
        return {correct:false, points:0}
    };

    // can't guess again if already guessed correctly
    if(state.guessedPlayers.includes(playerId)){
        return {correct:false, points:0}
    }

    const check = guess.toLowerCase() === state.currentWord.toLowerCase();
    if(!check)return {correct:false , points:0}

    const timeleft = Math.max(0,state.turnendtime - Date.now());
    const points = Math.floor((timeleft/(settings.drawtime*1000))*100);

    state.score[playerId] += points;
    state.guessedPlayers.push(playerId);

    await redis.set(`game:${code}`,JSON.stringify(state));
    return {correct:true, points, allGuessed: false};

 }