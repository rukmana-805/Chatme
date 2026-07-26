import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import { Image as ImageIcon, Check, CheckCheck, Download, Eye, Copy, X } from 'lucide-react';

const MessageList = ({ messages, onOpenImage }) => {
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const touchTimerRef = useRef(null);

  const [copiedId, setCopiedId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';

    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }

    return date.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownloadImage = async (e, imageUrl) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ChatMe_image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(imageUrl, '_blank');
    }
  };

  const handleCopyText = (msgId, text, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setActiveMenuId(null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTouchStart = (msgId, text) => {
    if (!text) return;
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      setActiveMenuId(msgId);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  return (
    <div
      onClick={() => setActiveMenuId(null)}
      className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-3.5 bg-opacity-95 scroll-smooth no-scrollbar"
    >
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
          const msgKey = msg._id || index;

          const currentDateLabel = getDateLabel(msg.createdAt);
          const previousDateLabel = index > 0 ? getDateLabel(messages[index - 1].createdAt) : null;
          const showDateDivider = currentDateLabel !== previousDateLabel;

          return (
            <React.Fragment key={msgKey}>
              {/* Centered Date Separator Divider */}
              {showDateDivider && (
                <div className="flex items-center justify-center my-4 animate-fade-in">
                  <span className="px-3.5 py-1 bg-[#1f2c34]/90 text-[#8696a0] border border-white/10 text-[10px] font-extrabold rounded-full shadow-md backdrop-blur-md uppercase tracking-wider font-display select-none">
                    {currentDateLabel}
                  </span>
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`flex items-end gap-2 animate-fade-in relative group/item ${isMe ? 'justify-end' : 'justify-start'}`}
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
                  onTouchStart={() => handleTouchStart(msgKey, msg.text)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(msgKey, msg.text)}
                  onMouseUp={handleTouchEnd}
                  onContextMenu={(e) => {
                    if (msg.text) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveMenuId(msgKey);
                    }
                  }}
                  className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl p-3 sm:p-3.5 shadow-lg border transition-all ${
                    isMe
                      ? 'bg-[#005c4b] text-white border-emerald-500/20 rounded-br-none shadow-[#005c4b]/10'
                      : 'bg-[#202c33] text-white border-white/10 rounded-bl-none shadow-black/20'
                  }`}
                >
                  {/* Long Press / Context Menu Popup Overlay */}
                  {activeMenuId === msgKey && msg.text && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute -top-11 ${
                        isMe ? 'right-0' : 'left-0'
                      } z-30 flex items-center gap-1.5 bg-[#111b21] border border-white/20 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-pop-in`}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleCopyText(msgKey, msg.text, e)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#00a884] hover:bg-[#06cf9c] text-[#0b141a] text-xs font-extrabold rounded-xl transition shadow-md"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Text
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                        }}
                        className="p-1 text-[#8696a0] hover:text-white rounded-lg hover:bg-white/10 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {!isMe && msg.sender?.username && (
                    <div className="text-[11px] font-bold text-[#00a884] mb-1 font-display tracking-wide select-none">
                      {msg.sender.username}
                    </div>
                  )}

                  {/* Attached Image with Download & View Controls for Both Sender & Receiver */}
                  {msg.imageUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl border border-white/10 group relative cursor-pointer bg-black/20 select-none">
                      <img
                        src={msg.imageUrl}
                        alt="Attachment"
                        onClick={() => onOpenImage(msg.imageUrl)}
                        className="max-h-64 sm:max-h-72 w-full object-cover group-hover:scale-[1.02] transition duration-300"
                      />

                      {/* Permanent Direct Download Icon */}
                      <button
                        type="button"
                        onClick={(e) => handleDownloadImage(e, msg.imageUrl)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-[#00a884] text-white hover:text-[#0b141a] rounded-xl backdrop-blur-md border border-white/20 shadow-md transition z-10"
                        title="Download Image to Device"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Hover Actions Overlay: View & Download */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2 pointer-events-none group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => onOpenImage(msg.imageUrl)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition transform hover:scale-105"
                          title="View Image"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#00a884]" /> View
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadImage(e, msg.imageUrl)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00a884] hover:bg-[#06cf9c] text-[#0b141a] text-xs font-bold rounded-xl shadow-lg transition transform hover:scale-105"
                          title="Download Image to Device"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Text with Quick Hover Copy Button */}
                  {msg.text && (
                    <div className="relative group/text">
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-sans select-text">
                        {msg.text}
                      </p>

                      {/* Desktop Hover / Mobile Quick Copy Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyText(msgKey, msg.text, e)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover/item:opacity-100 p-1 text-[#8696a0] hover:text-white bg-[#111b21]/90 hover:bg-[#1f2c34] rounded-lg border border-white/10 transition shadow-md"
                        title="Copy message text"
                      >
                        {copiedId === msgKey ? (
                          <Check className="w-3 h-3 text-[#00a884]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Footer Timestamp & Status */}
                  <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 font-medium select-none ${isMe ? 'text-emerald-200/80' : 'text-[#8696a0]'}`}>
                    {copiedId === msgKey && (
                      <span className="text-[#00a884] font-bold flex items-center gap-0.5 mr-1 animate-pulse">
                        <Check className="w-3 h-3" /> Copied!
                      </span>
                    )}
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
            </React.Fragment>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
