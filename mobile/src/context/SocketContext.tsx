import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';

interface SocketContextData {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextData>({ socket: null, connected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Initialize socket
    // Strip '/api' from URL if present for socket connection
    const socketUrl = API_URL.replace('/api', '');
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Mobile Socket Connected:', newSocket.id);
      
      // Join rooms
      newSocket.emit('join', { 
        userId: user?._id, 
        tenantId: user?.tenantId 
      });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Mobile Socket Disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
