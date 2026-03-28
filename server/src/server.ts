import express from "express";
import { createServer, get, METHODS } from "http";
import { Server  } from "socket.io";
import redis from "./redis";
import { createRoom, getRoom, joinRoom, removePlayer, updateRoom } from "./services/roomService";
import { handleguess ,game, nextTurn} from "./services/gameService";

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
                
            },3000);

    })
})

