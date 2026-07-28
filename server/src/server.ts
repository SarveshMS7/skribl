import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import redis from "./redis";
import { createRoom, getRoom, joinRoom, removePlayer, updateRoom, updateSettings } from "./services/roomService";
import { handleguess, game, nextTurn, pickThreeWords, generateHint } from "./services/gameService";
import { gamestate, Draw, GameSettings } from "./types";

const app = express();
const httpserver = createServer(app);

const PORT = parseInt(process.env.PORT ?? '3001');
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

//need to explicitly allow the cross origin request as browser blocks it by default as the frontend and backend run on different ports.
const io = new Server(httpserver,{
    cors:{
        origin: CLIENT_ORIGIN,
        methods: ['GET' , 'POST']
    }
});
 
httpserver.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
})
 

//below part should also be in another folder like /handlers but ill do it later just because 

//map for all the turn-end timers
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();
//map for the per-second tick intervals
const tickIntervals = new Map<string, ReturnType<typeof setInterval>>();
//map for choose-word timeouts (15s to pick a word)
const chooseTimers = new Map<string, ReturnType<typeof setTimeout>>();
//map for storing draw events for active turns
const roomDrawEvents = new Map<string, Draw[]>();

//clears all timers for a room
function cleargametime(code : string){
    if(activeTimers.has(code)){
        clearTimeout(activeTimers.get(code));
        activeTimers.delete(code);
    }
    if(tickIntervals.has(code)){
        clearInterval(tickIntervals.get(code));
        tickIntervals.delete(code);
    }
    if(chooseTimers.has(code)){
        clearTimeout(chooseTimers.get(code));
        chooseTimers.delete(code);
    }
}

const CHOOSE_TIME_MS = 15000; // 15 seconds to pick a word

//this thing basically gets the room situation/status and decides what to do next 
async function nextprocess(io:Server, code:string){
    const room = await getRoom(code);
    if(!room)return;

    // get the current word before advancing (for the turn-ended reveal)
    const oldVal = await redis.get(`game:${code}`);
    const oldWord = oldVal ? (JSON.parse(oldVal) as gamestate).currentWord : '';

    const state =  await nextTurn(code , room.players );

    if(!state)return ;

    if(state.status==='Ended'){
        io.to(code).emit('gameEnded',{state});
        await updateRoom(code, 'waiting');
        cleargametime(code);
        return;
    }
    io.to(code).emit('turnended',{
        reason:'timeout',
        nextDrawer: state.currentPlayerID,
        word: oldWord
    });

    setTimeout(()=>{
        startWordChoice(io, code, state);
    },3000)
}

/**
 * Begin the word-choice phase for the current drawer.
 * Sends 3 random words to the drawer and waits up to 15s for them to pick.
 */
async function startWordChoice(io: Server, code: string, state: gamestate) {
    const words = pickThreeWords();

    roomDrawEvents.set(code, []);
    io.to(code).emit('clearCanvas');

    const choosingState: gamestate = {
        ...state,
        status: 'choosing',
        currentWord: ''
    };
    await redis.set(`game:${code}`, JSON.stringify(choosingState));

    // Tell all clients we're in the choosing phase
    io.to(code).emit('turnStart', { state: { ...choosingState, currentWord: null } });

    // Send word choices ONLY to the drawer
    io.to(state.currentPlayerID).emit('wordChoices', { words });

    // Auto-pick first word if drawer doesn't choose in time
    chooseTimers.set(code, setTimeout(async () => {
        chooseTimers.delete(code);
        await applyWordChoice(io, code, words[0]);
    }, CHOOSE_TIME_MS));
}

/**
 * Apply the drawer's word choice: update Redis, start turn timer + tick interval.
 */
async function applyWordChoice(io: Server, code: string, word: string) {
    // Clear the choose timer if it's still running
    if(chooseTimers.has(code)){
        clearTimeout(chooseTimers.get(code));
        chooseTimers.delete(code);
    }

    const val = await redis.get(`game:${code}`);
    if(!val) return;

    const room = await getRoom(code);
    if(!room) return;

    const state: gamestate = JSON.parse(val);
    const settings = room.settings;

    state.currentWord = word;
    state.status = 'playing';
    state.turnEndTime = Date.now() + settings.drawtime * 1000;
    state.guessedPlayers = [];

    await redis.set(`game:${code}`, JSON.stringify(state));

    emitTurndata(io, code, state);
}

// emits the data to players based on the player roles
function emitTurndata(io:Server, code:string, state:gamestate){
    const wordlen = state.currentWord.length;

    io.to(state.currentPlayerID).emit('turnStart',{state});

    const hiddenstate = {
        ...state,
        currentWord: null
    }
    io.to(code).except(state.currentPlayerID).emit('turnStart',{state:hiddenstate,wordlen});
    
    // Clear any old timers
    cleargametime(code);

    // Start the per-second tick interval with hints
    const totalMs = state.turnEndTime - Date.now();
    const turnStartTime = Date.now();

    tickIntervals.set(code, setInterval(async () => {
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.ceil((state.turnEndTime - now) / 1000));
        const elapsedMs = now - turnStartTime;
        const hint = generateHint(state.currentWord, elapsedMs, totalMs);

        io.to(code).emit('timerTick', { secondsLeft, hint });

        if(secondsLeft <= 0){
            // Timer ran out, will be handled by the turn timeout
            if(tickIntervals.has(code)){
                clearInterval(tickIntervals.get(code));
                tickIntervals.delete(code);
            }
        }
    }, 1000));

    // Set the turn-end timeout
    const delay = Math.max(0, state.turnEndTime - Date.now());
    activeTimers.set(code, setTimeout(() => nextprocess(io, code), delay));
}

// Map to rate-limit guesses per socket
const lastGuessTime = new Map<string, number>();

io.on('connection',(socket)=>{
    //createroom event
    socket.on('createRoom',async({name}:{name:string})=>{
        const code = await createRoom(name, socket.id)
        socket.join(code);
        socket.emit('roomCreated',{code});
        const room = await getRoom(code);
        if(room) io.to(code).emit('roomUpdated', room);

        console.log(`room created ${code} by ${name}`)
    })
    //joinroom event
    socket.on('joinRoom',async({name,code}: {name:string , code:string})=>{
        const room = await joinRoom(name,code,socket.id)
        if(!room){
            socket.emit('error', {message:"room not found or full"})
            return
        }
        socket.join(code);
        io.to(code).emit('roomUpdated', room);
    })
    //rejoinroom event (for page refreshes mid-game)
    socket.on('rejoinRoom', async ({ name, code }: { name: string; code: string }) => {
        let room = await getRoom(code);
        if (!room) {
            socket.emit('error', { message: 'Room no longer exists' });
            return;
        }
        socket.join(code);

        const existingPlayer = room.players.find(p => p.name === name);
        if (!existingPlayer) {
            const joined = await joinRoom(name, code, socket.id);
            if (!joined) {
                socket.emit('error', { message: 'Cannot rejoin room' });
                return;
            }
            room = joined;
        } else {
            existingPlayer.id = socket.id;
            await redis.set(`room:${code}`, JSON.stringify(room), 'EX', 7200);
        }

        await redis.set(`player:${socket.id}`, code);
        io.to(code).emit('roomUpdated', room);

        // Sync game state if game in progress
        const val = await redis.get(`game:${code}`);
        if (val) {
            const state: gamestate = JSON.parse(val);
            const isCurrentDrawer = state.currentPlayerID === socket.id;
            const hiddenState = isCurrentDrawer ? state : { ...state, currentWord: null };
            socket.emit('turnStart', { state: hiddenState, wordlen: state.currentWord?.length });
        }
    })
    //disconnect event
    socket.on('disconnect',async()=>{
        console.log(`disconnected ${socket.id}`)
        lastGuessTime.delete(socket.id);
        const code = await redis.get(`player:${socket.id}`)
        if(code){
            await removePlayer(code,socket.id);
            await redis.del(`player:${socket.id}`)
            const room = await getRoom(code);
            if(room) {
                io.to(code).emit('roomUpdated', room);

                // Handle mid-game disconnects
                const gameVal = await redis.get(`game:${code}`);
                if (gameVal) {
                    const gameState: gamestate = JSON.parse(gameVal);
                    if (room.players.length < 2) {
                        // Not enough players left to continue playing
                        cleargametime(code);
                        await updateRoom(code, 'waiting');
                        await redis.del(`game:${code}`);
                        io.to(code).emit('returnedToLobby', { room });
                        io.to(code).emit('error', { message: 'Game ended: Not enough players remaining.' });
                    } else if (gameState.currentPlayerID === socket.id) {
                        // Active drawer disconnected -> skip to next turn immediately
                        cleargametime(code);
                        nextprocess(io, code);
                    }
                }
            }
        }
    })
    //game-settings event (host only, lobby only)
    socket.on('gameSettings', async({code, settings}: {code:string, settings: Partial<GameSettings>})=>{
        const room = await updateSettings(code, socket.id, settings);
        if(!room){
            socket.emit('error', {message: 'cannot update settings'});
            return;
        }
        io.to(code).emit('roomUpdated', room);
    })
    //guess event with anti-spam rate limiting (min 250ms interval)
    socket.on('guess',async({code, guess})=>{
        const now = Date.now();
        const last = lastGuessTime.get(socket.id) ?? 0;
        if (now - last < 250) {
            socket.emit('error', { message: 'Please wait a moment before sending another guess' });
            return;
        }
        lastGuessTime.set(socket.id, now);

        const res = await handleguess(socket.id, code, guess);
    
        if(res.correct){
            io.to(code).emit('correctguess',{
                playerId: socket.id,
                points: res.points
            });
            // Emit updated scores
            const val = await redis.get(`game:${code}`);
            if(val){
                const state: gamestate = JSON.parse(val);
                io.to(code).emit('scoreUpdate', { score: state.score });

                // Check if all non-drawer players have guessed
                const room = await getRoom(code);
                if(room){
                    const nonDrawerCount = room.players.filter(p => p.id !== state.currentPlayerID).length;
                    if(state.guessedPlayers.length >= nonDrawerCount){
                        // Everyone guessed — end the turn early
                        cleargametime(code);
                        nextprocess(io, code);
                    }
                }
            }
        }else{
            io.to(code).emit('chatmessage',{
                playerId: socket.id,
                message: guess
            })
        }
    })
    //playAgain event — return everyone to lobby
    socket.on('playAgain', async ({ code }) => {
        const room = await getRoom(code);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        await updateRoom(code, 'waiting');
        await redis.del(`game:${code}`);
        cleargametime(code);
        const updatedRoom = await getRoom(code);
        if (updatedRoom) {
            io.to(code).emit('returnedToLobby', { room: updatedRoom });
        }
    })
    //gamestart event
    socket.on('startGame', async({code })=>{
            const room = await getRoom(code);

            if(!room){
                socket.emit('error',{message: 'room not found'});
                return;
            }
            if(room.hostId!= socket.id){
                socket.emit(`error`,{message:'only host can start the game'})
                return ;
            }
            await updateRoom (code,'playing');

            const state = await game(code,room.players)
            io.to(code).emit('gamestarted',{state: { ...state, currentWord: null }})

            setTimeout(()=>{
                startWordChoice(io, code, state);
            },3000);

    })
    //wordChosen event — drawer picks a word from the 3 choices
    socket.on('wordChosen', async({code, word})=>{
        const val = await redis.get(`game:${code}`);
        if(!val){
            socket.emit('error', {message: 'game not found'});
            return;
        }
        const state: gamestate = JSON.parse(val);
        // Only the current drawer can choose
        if(state.currentPlayerID !== socket.id){
            socket.emit('error', {message: 'only the drawer can choose a word'});
            return;
        }
        // Only allow choosing during the choosing phase
        if(state.status !== 'choosing'){
            socket.emit('error', {message: 'not in choosing phase'});
            return;
        }
        await applyWordChoice(io, code, word);
    })
    //draw event
    socket.on('draw',(data:Draw)=>{
        const events = roomDrawEvents.get(data.code) ?? [];
        if (events.length < 2500) {
            events.push(data);
            roomDrawEvents.set(data.code, events);
        }
        socket.to(data.code).emit('draw',data);
    })
    //clear event
    socket.on('clearboard',({code})=>{
        roomDrawEvents.set(code, []);
        io.to(code).emit('clearCanvas');
    })
    
})
