import express from "express";
import { createServer, get, METHODS } from "http";
import { Server  } from "socket.io";

const app = express();
const httpserver = createServer(app);

//need to explicitly allow the cross origin request as browser blocks it by default as the frontend and backend run on different ports.
const io = new Server(httpserver,{
    cors:{
        origin: "https://localhost:5173",
        methods: ['GET' , 'POST']
    }
});

io.on("connection", (Socket)=>{
    console.log(`connected ${Socket}`);
    io.on("disconnetion",(reason)=>{
        console.log(`disconnected ${Socket.id} because ${reason}`);
    })
})

httpserver.listen( 3001 , ()=>{
    console.log("listening on port 3001")
})