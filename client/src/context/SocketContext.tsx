import { useContext,useState,useEffect,createContext, Children, type JSX } from "react";
import { socket } from "../services/socket/socket";
import type {Socket} from 'Socket.io-client'

//shift this interface later to /types
interface SocketContextType{
    socket:Socket,
    isConnected:boolean
}

const socketContext = createContext<SocketContextType|null>(null)

export const SocketProvider = ({children}:{children:React.ReactNode})=>{
    const [ isConnected, setIsConnected] = useState(socket.connected);

    useEffect(()=>{
        socket.on('connect',()=>setIsConnected(true));
        socket.on('disconnect', ()=>setIsConnected(false));

        return ()=>{
            socket.off('connect');
            socket.off('disconnect');

    }
    },[]);
    return (
        <socketContext.Provider value = {{socket,isConnected}}>
            {children}
        </socketContext.Provider>
    );
}