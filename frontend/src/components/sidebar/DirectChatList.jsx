import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Loader2 } from 'lucide-react';

const DirectChatList = ({ activeChat, unreadCounts = {}, onSelectChat }) => {
  const { user } = useAuth();
  const { socket, onlineUserIds } = useSocket();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/users/friends');
      setFriends(res.data);
    } catch (err) {
      console.error('Fetch friends error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // Listen for socket private messages to update lastMessage and re-sort list in real-time
  useEffect(() => {
    if (!socket || !user) return;

    const handlePrivateMsg = (newMsg) => {
      const senderId = (typeof newMsg.sender === 'object' ? newMsg.sender?._id : newMsg.sender)?.toString();
      const receiverId = (typeof newMsg.receiver === 'object' ? newMsg.receiver?._id : newMsg.receiver)?.toString();
      const currentUserId = user._id?.toString();

      const partnerId = senderId === currentUserId ? receiverId : senderId;
      if (!partnerId) return;

      setFriends((prevFriends) => {
        const friendIndex = prevFriends.findIndex((f) => f._id.toString() === partnerId);
        if (friendIndex === -1) return prevFriends;

        const targetFriend = {
          ...prevFriends[friendIndex],
          lastMessage: {
            text: newMsg.text,
            imageUrl: newMsg.imageUrl,
            createdAt: newMsg.createdAt || new Date().toISOString(),
            sender: newMsg.sender,
          },
        };

        const otherFriends = prevFriends.filter((f) => f._id.toString() !== partnerId);
        return [targetFriend, ...otherFriends];
      });
    };

    socket.on('receive_private_message', handlePrivateMsg);
    return () => {
      socket.off('receive_private_message', handlePrivateMsg);
    };
  }, [socket, user]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderPreview = (friend) => {
    if (!friend.lastMessage) {
      return friend.bio && friend.bio.trim() ? friend.bio : 'Hey there! I am using ChatMe.';
    }

    const senderId = (typeof friend.lastMessage.sender === 'object' ? friend.lastMessage.sender?._id : friend.lastMessage.sender)?.toString();
    const isMe = senderId === user?._id?.toString();

    let content = '';
    if (friend.lastMessage.text) {
      content = friend.lastMessage.text;
    } else if (friend.lastMessage.imageUrl) {
      content = '📷 Photo';
    }

    return (
      <span className="truncate block">
        {isMe && <span className="text-[#00a884] font-medium">You: </span>}
        <span>{content}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-[#8696a0]">
        <Loader2 className="w-5 h-5 animate-spin text-[#00a884]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#111b21] no-scrollbar">
      <div className="p-3 text-[11px] font-bold text-[#8696a0] uppercase tracking-wider">
        Direct Chats ({friends.length})
      </div>

      {friends.length === 0 ? (
        <div className="p-6 text-center text-[#8696a0] text-xs">
          No connected friends yet. Search users and send follow requests to start chatting!
        </div>
      ) : (
        friends.map((friend) => {
          const isOnline = onlineUserIds.has(friend._id) || friend.isOnline;
          const isSelected = activeChat?.type === 'direct' && activeChat?.target._id === friend._id;
          const unreadCount = unreadCounts[`direct_${friend._id}`] || 0;

          return (
            <div
              key={friend._id}
              onClick={() => onSelectChat({ type: 'direct', target: friend })}
              className={`flex items-center gap-3.5 p-3 mx-2 my-1 rounded-2xl cursor-pointer transition duration-200 border ${
                isSelected
                  ? 'bg-[#1f2c34] border-[#00a884]/40 shadow-md'
                  : unreadCount > 0
                  ? 'bg-[#1f2c34]/70 border-[#00a884]/30'
                  : 'border-transparent hover:bg-[#1f2c34]/50'
              }`}
            >
              <Avatar
                src={friend.avatar}
                name={friend.username}
                isOnline={isOnline}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-white truncate font-display">
                    {friend.username}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {friend.lastMessage?.createdAt && (
                      <span className="text-[10px] text-[#8696a0] font-medium">
                        {formatTime(friend.lastMessage.createdAt)}
                      </span>
                    )}
                    {unreadCount > 0 && !isSelected && (
                      <span className="flex items-center justify-center px-2 py-0.5 text-[10px] font-black bg-[#00a884] text-[#0b141a] rounded-full shadow-lg shadow-[#00a884]/30 animate-bounce">
                        {unreadCount > 4 ? '4+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#8696a0] truncate mt-0.5">
                  {renderPreview(friend)}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default DirectChatList;
