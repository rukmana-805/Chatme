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

  const userId = user?._id;

  useEffect(() => {
    if (!userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket Frontend] Connected with ID:', newSocket.id);
      newSocket.emit('setup', user);
    });

    newSocket.on('user_online', ({ userId: onlineId }) => {
      setOnlineUserIds((prev) => new Set([...prev, onlineId]));
    });

    newSocket.on('user_offline', ({ userId: offlineId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(offlineId);
        return next;
      });
    });

    newSocket.on('follow_request_notification', (data) => {
      setNotifications((prev) => [
        ...prev,
        { id: Date.now(), message: `New follow request from ${data.requesterName || 'someone'}` },
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

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
