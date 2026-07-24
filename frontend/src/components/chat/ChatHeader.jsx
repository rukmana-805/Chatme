import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import { Trash2, Copy, Check, Users, Info, ChevronLeft } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const ChatHeader = ({ activeChat, onClearChat, onOpenRoomMembers, onBack }) => {
  const { onlineUserIds } = useSocket();
  const [copied, setCopied] = useState(false);

  if (!activeChat) return null;

  const isDirect = activeChat.type === 'direct';
  const target = activeChat.target;
  const isOnline = isDirect && (onlineUserIds.has(target._id) || target.isOnline);

  const copyRoomCode = () => {
    if (target.code) {
      navigator.clipboard.writeText(target.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 bg-[#111b21]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between shadow-md select-none relative z-20">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-2 text-[#8696a0] hover:text-white hover:bg-white/5 rounded-xl transition-all -ml-1"
            title="Back to Chats"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <Avatar
          src={target.avatar}
          name={isDirect ? target.username : target.name}
          isOnline={isOnline}
          showStatus={isDirect}
        />
        <div className="truncate">
          <h3 className="text-sm sm:text-base font-bold text-white truncate font-display">
            {isDirect ? target.username : target.name}
          </h3>
          <p className="text-xs text-[#8696a0] truncate mt-0.5 flex items-center gap-1.5">
            {isDirect ? (
              isOnline ? (
                <span className="text-[#00a884] font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" /> Online
                </span>
              ) : (
                'Offline'
              )
            ) : (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#00a884]" /> Code:{' '}
                <strong className="font-mono text-white tracking-wider">{target.code}</strong>
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {!isDirect && (
          <>
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-[#1f2c34] hover:bg-[#222e35] border border-white/10 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              title="Copy Room Code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00a884]" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#00a884]" />
                  <span className="hidden sm:inline">Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenRoomMembers}
              className="p-2 bg-[#1f2c34] hover:bg-[#222e35] border border-white/10 text-[#8696a0] hover:text-white rounded-xl transition"
              title="Room Members Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          onClick={onClearChat}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-semibold text-xs rounded-xl transition border border-rose-500/20"
          title="Clear Chat History"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
