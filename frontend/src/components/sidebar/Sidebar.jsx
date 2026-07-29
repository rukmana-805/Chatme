import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import DirectChatList from './DirectChatList';
import RoomList from './RoomList';
import UserSearch from './UserSearch';
import FollowRequestsList from './FollowRequestsList';
import { MessageSquare, Users, UserPlus, Bell, LogOut, Sparkles } from 'lucide-react';

const Sidebar = ({
  activeChat,
  unreadCounts = {},
  pendingRequestsCount = 0,
  onRequestProcessed,
  onSelectChat,
  onCreateRoomClick,
  onJoinRoomClick,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'rooms' | 'search' | 'requests'

  if (!user) return null;

  // Count distinct persons with unread messages
  const directUnreadTotal = Object.keys(unreadCounts)
    .filter((k) => k.startsWith('direct_') && (unreadCounts[k] || 0) > 0)
    .length;

  // Count distinct rooms with unread messages
  const roomUnreadTotal = Object.keys(unreadCounts)
    .filter((k) => k.startsWith('room_') && (unreadCounts[k] || 0) > 0)
    .length;

  return (
    <div className={`w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#111b21] border-r border-white/5 select-none flex-shrink-0 relative z-10 ${className}`}>
      {/* Top User Profile Header */}
      <div className="p-3.5 sm:p-4 bg-[#1f2c34]/70 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={user.avatar} name={user.username} isOnline={true} size="md" />
          <div className="truncate">
            <h3 className="text-sm font-bold text-white truncate flex items-center gap-1 font-display">
              {user.username} <Sparkles className="w-3.5 h-3.5 text-[#00a884]" />
            </h3>
            <p className="text-[11px] text-[#00a884] font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" /> Active Now
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition duration-200"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex bg-[#0b141a]/60 border-b border-white/5 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 px-1.5 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl transition-all duration-200 relative ${
            activeTab === 'chats'
              ? 'bg-[#1f2c34] text-[#00a884] shadow-md border border-white/5'
              : 'text-[#8696a0] hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="truncate">Chats</span>
          {directUnreadTotal > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#00a884] text-[#0b141a] rounded-full animate-pulse shadow-sm">
              {directUnreadTotal > 4 ? '4+' : directUnreadTotal}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2 px-1.5 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl transition-all duration-200 relative ${
            activeTab === 'rooms'
              ? 'bg-[#1f2c34] text-[#00a884] shadow-md border border-white/5'
              : 'text-[#8696a0] hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="truncate">Rooms</span>
          {roomUnreadTotal > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#00a884] text-[#0b141a] rounded-full animate-pulse shadow-sm">
              {roomUnreadTotal > 4 ? '4+' : roomUnreadTotal}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2 px-1.5 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
            activeTab === 'search'
              ? 'bg-[#1f2c34] text-[#00a884] shadow-md border border-white/5'
              : 'text-[#8696a0] hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="truncate">Search</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-1.5 flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl transition-all duration-200 relative ${
            activeTab === 'requests'
              ? 'bg-[#1f2c34] text-[#00a884] shadow-md border border-white/5'
              : 'text-[#8696a0] hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="truncate">Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#00a884] text-[#0b141a] rounded-full animate-pulse shadow-sm">
              {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content List Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#111b21]">
        {activeTab === 'chats' && (
          <DirectChatList
            activeChat={activeChat}
            unreadCounts={unreadCounts}
            onSelectChat={onSelectChat}
          />
        )}
        {activeTab === 'rooms' && (
          <RoomList
            activeChat={activeChat}
            unreadCounts={unreadCounts}
            onSelectChat={onSelectChat}
            onCreateRoomClick={onCreateRoomClick}
            onJoinRoomClick={onJoinRoomClick}
          />
        )}
        {activeTab === 'search' && (
          <UserSearch
            onSelectFriend={(friend) => {
              onSelectChat({ type: 'direct', target: friend });
              setActiveTab('chats');
            }}
          />
        )}
        {activeTab === 'requests' && (
          <FollowRequestsList
            onRequestAccepted={() => {
              setActiveTab('chats');
            }}
            onRequestProcessed={onRequestProcessed}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
