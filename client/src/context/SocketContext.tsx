import { useContext, useState, useEffect, createContext } from "react";
import { socket } from "../services/socket/socket";
import type { Socket } from "socket.io-client";

//shift this interface later to /types
interface SocketContextType {
    socket: Socket;
    isConnected: boolean;
}

const socketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
    const context = useContext(socketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        socket.connect();
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        return () => {
            socket.off('connect');
            socket.off('disconnect');
        };
    }, []);

    return (
        <socketContext.Provider value={{ socket, isConnected }}>
            {children}
        </socketContext.Provider>
    );
};