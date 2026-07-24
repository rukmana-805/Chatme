import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import { Image as ImageIcon, Check, CheckCheck } from 'lucide-react';

const MessageList = ({ messages, onOpenImage }) => {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 bg-opacity-95 scroll-smooth">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-[#8696a0] animate-fade-in p-6">
          <div className="p-4 rounded-3xl bg-[#1f2c34]/80 border border-white/10 mb-3 shadow-lg">
            <ImageIcon className="w-8 h-8 text-[#00a884]" />
          </div>
          <p className="text-sm font-bold text-white font-display">No messages yet</p>
          <p className="text-xs mt-1 text-[#8696a0]">Send a message or an image to start chatting!</p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const senderId = (typeof msg.sender === 'object' ? msg.sender?._id : msg.sender)?.toString();
          const currentUserId = user?._id?.toString();
          const isMe = senderId && currentUserId && senderId === currentUserId;

          return (
            <div
              key={msg._id || index}
              className={`flex items-end gap-2 animate-fade-in ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <Avatar
                  src={msg.sender?.avatar}
                  name={msg.sender?.username}
                  size="sm"
                  showStatus={false}
                />
              )}

              <div
                className={`max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl p-3 sm:p-3.5 shadow-lg border transition-all ${
                  isMe
                    ? 'bg-[#005c4b] text-white border-emerald-500/20 rounded-br-none shadow-[#005c4b]/10'
                    : 'bg-[#202c33] text-white border-white/10 rounded-bl-none shadow-black/20'
                }`}
              >
                {!isMe && msg.sender?.username && (
                  <div className="text-[11px] font-bold text-[#00a884] mb-1 font-display tracking-wide">
                    {msg.sender.username}
                  </div>
                )}

                {/* Attached Image */}
                {msg.imageUrl && (
                  <div className="mb-2 overflow-hidden rounded-xl cursor-pointer border border-white/10 group relative">
                    <img
                      src={msg.imageUrl}
                      alt="Attachment"
                      onClick={() => onOpenImage(msg.imageUrl)}
                      className="max-h-64 sm:max-h-72 w-full object-cover group-hover:scale-[1.02] transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                      Click to view
                    </div>
                  </div>
                )}

                {/* Message Text */}
                {msg.text && (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">
                    {msg.text}
                  </p>
                )}

                {/* Footer Timestamp & Status */}
                <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 font-medium ${isMe ? 'text-emerald-200/80' : 'text-[#8696a0]'}`}>
                  <span>{formatTime(msg.createdAt)}</span>
                  {isMe && (
                    msg.isRead ? (
                      <CheckCheck className="w-3.5 h-3.5 text-[#06cf9c]" title="Seen" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-200/70" title="Sent (Unseen)" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
