import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket Frontend] Connected with ID:', newSocket.id);
      newSocket.emit('setup', user);
    });

    newSocket.on('user_online', ({ userId }) => {
      setOnlineUserIds((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    newSocket.on('follow_request_notification', (data) => {
      setNotifications((prev) => [
        ...prev,
        { id: Date.now(), message: `New follow request from ${data.requesterName}` },
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUserIds,
        notifications,
        removeNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
