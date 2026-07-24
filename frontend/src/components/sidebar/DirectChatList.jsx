import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { useSocket } from '../../context/SocketContext';
import { MessageSquare, Loader2 } from 'lucide-react';

const DirectChatList = ({ activeChat, unreadCounts = {}, onSelectChat }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onlineUserIds } = useSocket();

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
                  {unreadCount > 0 && !isSelected && (
                    <span className="flex items-center justify-center px-2 py-0.5 text-[10px] font-black bg-[#00a884] text-[#0b141a] rounded-full shadow-lg shadow-[#00a884]/30 animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8696a0] truncate mt-0.5">
                  {isOnline ? (
                    <span className="text-[#00a884] font-semibold">Online</span>
                  ) : (
                    friend.bio || 'Connected Friend'
                  )}
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
