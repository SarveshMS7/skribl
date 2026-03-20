import express from "express";
import { createServer, get, METHODS } from "http";
import { Server  } from "socket.io";
import redis from "./redis";
import { createRoom, joinRoom, removePlayer } from "./rooms";

const app = express();
const httpserver = createServer(app);

//need to explicitly allow the cross origin request as browser blocks it by default as the frontend and backend run on different ports.
const io = new Server(httpserver,{
    cors:{
        origin: "https://localhost:5173",
        methods: ['GET' , 'POST']
    }
});

io.on('connection', (socket)=>{
    console.log(`connected ${socket}`);
    io.on('disconneted',(reason:string)=>{
        console.log(`disconnected ${socket.id} because ${reason}`);
    })
})

httpserver.listen( 3001 , ()=>{
    console.log("listening on port 3001")
})

io.on('connection',(socket)=>{
    redis.set('test','hi')
    redis.get('test').then(val=>{console.log('redis value: ',val)})
})

io.on('connection',(socket)=>{

    socket.on('createRoom',async({name}:{name:string})=>{
        const code = await createRoom(name, socket.id)
        socket.join(code);
        socket.emit('roomCreated',{code});

        console.log(`room created ${code} by ${name}`)
    })
    socket.on('joinRoom',async({name,code}: {name:string , code:string})=>{
        const room = await joinRoom(name,code,socket.id)
        if(!room){
            socket.emit('error', {message:"room not found"})
            return 
        }
    })
    socket.on('disconnect',async()=>{
        console.log(`disconnected ${socket.id}`)
    })
})