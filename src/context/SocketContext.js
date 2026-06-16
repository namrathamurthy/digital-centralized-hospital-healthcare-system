'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io();

    socketInstance.on('connect', () => {
      console.log('Socket connected: ', socketInstance.id);
      setConnected(true);

      // Join standard rooms
      socketInstance.emit('join_room', 'public');
      if (user?.role) {
        socketInstance.emit('join_room', user.role);
      }
      if (user?._id) {
        socketInstance.emit('join_room', user._id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
