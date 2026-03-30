import express from "express";
import { createServer, get, METHODS } from "http";
import { Server  } from "socket.io";
import redis from "./redis";
import { createRoom, getRoom, joinRoom, removePlayer, updateRoom } from "./services/roomService";
import { handleguess ,game, nextTurn} from "./services/gameService";
import { gamestate } from "./types";

const app = express();
const httpserver = createServer(app);

//need to explicitly allow the cross origin request as browser blocks it by default as the frontend and backend run on different ports.
const io = new Server(httpserver,{
    cors:{
        origin: "http://localhost:5173",
        methods: ['GET' , 'POST']
    }
});
 
httpserver.listen( 3001 , ()=>{
    console.log("listening on port 3001")
})
 


//below part should also be in another folder like /handlers but ill do it later just because 

//map for all the timers
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();
//gets and deletes the timers 
function cleargametime(code : string){
    if(activeTimers.has(code)){
        clearTimeout(activeTimers.get(code));
        activeTimers.delete(code);
    }
}

//this thing basically gets the room situation/status and decides what to do next 
async function nextprocess(io:Server, code:string){
    const room = await getRoom(code);
    if(!room)return;

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
        nextDrawer: state.currentplayerID
    });

    setTimeout(()=>{
        emitTurndata(io,code,state);
    },3000)
}
// emits the data to players based on the player roles
function emitTurndata(io:Server, code:string, state:gamestate){
    const wordlen = state.currentWord.length;

    io.to(state.currentplayerID).emit('turnStart',{state});
    const hiddenstate = {
        //copy everything from state object to this hidden state object ...
        ...state,
        currentword: null
    }
    io.to(code).except(state.currentplayerID).emit('turnStart',{state:hiddenstate,wordlen});
    cleargametime(code);

    const delay = Math.max(0, state.turnendtime - Date.now());
    activeTimers.set(code, setTimeout(() => nextprocess(io, code), delay));
}

io.on('connection',(socket)=>{
    //createroom event
    socket.on('createRoom',async({name}:{name:string})=>{
        const code = await createRoom(name, socket.id)
        socket.join(code);
        socket.emit('roomCreated',{code});

        console.log(`room created ${code} by ${name}`)
    })
    //joinroom event
    socket.on('joinRoom',async({name,code}: {name:string , code:string})=>{
        const room = await joinRoom(name,code,socket.id)
        if(!room){
            socket.emit('error', {message:"room not found"})
            return 
        }
    })
    //disconnect event
    socket.on('disconnect',async()=>{
        console.log(`disconnected ${socket.id}`)
        const code = await redis.get(`player:${socket.id}`)
        if(code){
            await removePlayer(code,socket.id);
            await redis.del(`player:${socket.id}`)
        }
    })
    //guess event
    socket.on('guess',async({code, guess})=>{
    const res =  await handleguess(socket.id , code , guess);
    
        if(res.correct){
            io.to(code).emit('correctguess',{
                playerId: socket.id,
                points: res.points
            });
        }else{
            // wrong guess goes as a normal text in the chat    
            io.to(code).emit('chatmessage',{
                playerId: socket.id,
                message: guess
            })
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
            io.to(code).emit('gamestarted',{state})

            setTimeout(()=>{
                emitTurndata(io,code,state);
            },3000);

    })
    
})

