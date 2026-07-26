import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Plus, LogIn, Users, Loader2 } from 'lucide-react';

const RoomList = ({
  activeChat,
  unreadCounts = {},
  onSelectChat,
  onCreateRoomClick,
  onJoinRoomClick,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms/my-rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Socket listener for room messages to move room to TOP and update last message live
  useEffect(() => {
    if (!socket) return;

    const handleRoomMsg = (newMsg) => {
      const roomId = (typeof newMsg.room === 'object' ? newMsg.room?._id : newMsg.room)?.toString();
      if (!roomId) return;

      setRooms((prevRooms) => {
        const roomIndex = prevRooms.findIndex((r) => r._id.toString() === roomId);
        if (roomIndex === -1) return prevRooms;

        const targetRoom = {
          ...prevRooms[roomIndex],
          lastMessage: {
            text: newMsg.text,
            imageUrl: newMsg.imageUrl,
            createdAt: newMsg.createdAt || new Date().toISOString(),
            sender: newMsg.sender,
          },
        };

        const otherRooms = prevRooms.filter((r) => r._id.toString() !== roomId);
        return [targetRoom, ...otherRooms];
      });
    };

    socket.on('receive_room_message', handleRoomMsg);
    return () => {
      socket.off('receive_room_message', handleRoomMsg);
    };
  }, [socket]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderRoomPreview = (room) => {
    if (!room.lastMessage) {
      return (
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3 text-[#667781]" /> {room.members?.length || 0} Members
        </span>
      );
    }

    const senderName =
      typeof room.lastMessage.sender === 'object'
        ? room.lastMessage.sender?.username
        : 'Member';

    const isMe = (typeof room.lastMessage.sender === 'object' ? room.lastMessage.sender?._id : room.lastMessage.sender)?.toString() === user?._id?.toString();

    let content = '';
    if (room.lastMessage.text) {
      content = room.lastMessage.text;
    } else if (room.lastMessage.imageUrl) {
      content = '📷 Photo';
    }

    return (
      <span className="truncate block">
        <span className="text-[#00a884] font-medium">{isMe ? 'You' : senderName}: </span>
        <span>{content}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111b21] no-scrollbar">
      {/* Action Buttons Header */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between gap-2">
        <button
          onClick={onCreateRoomClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-[#008069] to-[#00a884] hover:from-[#00a884] hover:to-[#06cf9c] text-[#0b141a] font-bold text-xs rounded-xl transition shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Room
        </button>
        <button
          onClick={onJoinRoomClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1f2c34] hover:bg-[#222e35] text-white border border-white/10 font-bold text-xs rounded-xl transition"
        >
          <LogIn className="w-4 h-4 text-[#00a884]" /> Join Code
        </button>
      </div>

      <div className="p-3 text-[11px] font-bold text-[#8696a0] uppercase tracking-wider">
        My Rooms ({rooms.length})
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 text-[#8696a0]">
          <Loader2 className="w-5 h-5 animate-spin text-[#00a884]" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-6 text-center text-[#8696a0] text-xs">
          No rooms joined yet. Create a room or enter a room code to join!
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {rooms.map((room) => {
            const isSelected = activeChat?.type === 'room' && activeChat?.target._id === room._id;
            const unreadCount = unreadCounts[`room_${room._id}`] || 0;

            return (
              <div
                key={room._id}
                onClick={() => onSelectChat({ type: 'room', target: room })}
                className={`flex items-center gap-3.5 p-3 mx-2 my-1 rounded-2xl cursor-pointer transition duration-200 border ${
                  isSelected
                    ? 'bg-[#1f2c34] border-[#00a884]/40 shadow-md'
                    : unreadCount > 0
                    ? 'bg-[#1f2c34]/70 border-[#00a884]/30'
                    : 'border-transparent hover:bg-[#1f2c34]/50'
                }`}
              >
                <Avatar src={room.avatar} name={room.name} showStatus={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-white truncate font-display">
                      {room.name}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {room.lastMessage?.createdAt && (
                        <span className="text-[10px] text-[#8696a0] font-medium">
                          {formatTime(room.lastMessage.createdAt)}
                        </span>
                      )}
                      {unreadCount > 0 && !isSelected ? (
                        <span className="flex items-center justify-center px-2 py-0.5 text-[10px] font-black bg-[#00a884] text-[#0b141a] rounded-full shadow-lg shadow-[#00a884]/30 animate-bounce">
                          {unreadCount > 4 ? '4+' : unreadCount}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-[#00a884]/10 text-[#00a884] px-1.5 py-0.5 rounded font-bold">
                          {room.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#8696a0] truncate mt-0.5">
                    {renderRoomPreview(room)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomList;
