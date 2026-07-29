import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import api from './utils/api';
import Sidebar from './components/sidebar/Sidebar';
import ChatHeader from './components/chat/ChatHeader';
import MessageList from './components/chat/MessageList';
import MessageInput from './components/chat/MessageInput';
import AuthModal from './components/auth/AuthModal';
import CreateRoomModal from './components/rooms/CreateRoomModal';
import JoinRoomModal from './components/rooms/JoinRoomModal';
import RoomMembersModal from './components/rooms/RoomMembersModal';
import ImageViewerModal from './components/chat/ImageViewerModal';
import Toast from './components/ui/Toast';
import { MessageSquare, Sparkles, PlusCircle, LogIn, Users, Loader2 } from 'lucide-react';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { socket, notifications, removeNotification } = useSocket();

  const [activeChat, setActiveChat] = useState(null); // { type: 'direct'|'room', target: Object }
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({}); // { 'direct_id': number, 'room_id': number }
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Modals state
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showRoomMembers, setShowRoomMembers] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch initial unread counts and follow request count on user login
  useEffect(() => {
    if (!user) return;
    const fetchInitialData = async () => {
      try {
        const [unreadRes, requestsRes] = await Promise.all([
          api.get('/chat/unread-counts'),
          api.get('/users/follow-requests'),
        ]);
        setUnreadCounts(unreadRes.data || {});
        setPendingRequestsCount(requestsRes.data?.length || 0);
      } catch (err) {
        console.error('Fetch initial data error:', err);
      }
    };
    fetchInitialData();
  }, [user]);

  // Mobile Chrome / Safari Visual Viewport height handler to prevent header hiding behind URL bar/3 dots
  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport) {
        document.documentElement.style.setProperty(
          '--visual-viewport-height',
          `${window.visualViewport.height}px`
        );
      }
      window.scrollTo(0, 0);
    };

    handleViewportResize();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    const preventScroll = () => window.scrollTo(0, 0);
    window.addEventListener('scroll', preventScroll);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      window.removeEventListener('scroll', preventScroll);
    };
  }, []);

  // Clear unread count & emit mark_read when activeChat opens
  useEffect(() => {
    if (activeChat) {
      const chatKey = `${activeChat.type}_${activeChat.target._id}`;
      if (unreadCounts[chatKey]) {
        setUnreadCounts((prev) => ({ ...prev, [chatKey]: 0 }));
      }
      if (activeChat.type === 'direct' && socket) {
        socket.emit('mark_read', { senderId: activeChat.target._id });
      }
    }
  }, [activeChat, socket]);

  // Handle mobile browser back button integration (popstate)
  useEffect(() => {
    if (activeChat) {
      if (!window.history.state?.chatActive) {
        window.history.pushState({ chatActive: true }, '');
      }
    }

    const handlePopState = () => {
      if (activeChat) {
        setActiveChat(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeChat]);

  const handleBackChat = () => {
    if (window.history.state?.chatActive) {
      window.history.back();
    } else {
      setActiveChat(null);
    }
  };

  // Fetch messages on activeChat change
  useEffect(() => {
    if (!activeChat || !user) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        if (activeChat.type === 'direct') {
          const res = await api.get(`/chat/messages/${activeChat.target._id}`);
          setMessages(res.data);
          if (socket) {
            socket.emit('mark_read', { senderId: activeChat.target._id });
          }
        } else if (activeChat.type === 'room') {
          const res = await api.get(`/rooms/${activeChat.target._id}/messages`);
          setMessages(res.data);

          // Join room socket channel
          if (socket) {
            socket.emit('join_room_channel', activeChat.target._id);
          }
        }
      } catch (err) {
        console.error('Fetch messages error:', err);
        if (err.response?.status === 403) {
          showToast(err.response.data.message || 'Access denied.', 'error');
          setActiveChat(null);
        }
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      if (activeChat?.type === 'room' && socket) {
        socket.emit('leave_room_channel', activeChat.target._id);
      }
    };
  }, [activeChat, user, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = (newMsg) => {
      const senderId = (typeof newMsg.sender === 'object' ? newMsg.sender?._id : newMsg.sender)?.toString();
      const receiverId = (typeof newMsg.receiver === 'object' ? newMsg.receiver?._id : newMsg.receiver)?.toString();
      const activeTargetId = activeChat?.target?._id?.toString();
      const currentUserId = user._id?.toString();

      // Show message if sent by friend to me OR by me to friend in current active chat
      const isFromActiveFriend = activeChat?.type === 'direct' && senderId === activeTargetId && receiverId === currentUserId;
      const isFromMeToActiveFriend = activeChat?.type === 'direct' && senderId === currentUserId && receiverId === activeTargetId;

      if (isFromActiveFriend || isFromMeToActiveFriend) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, { ...newMsg, isRead: isFromActiveFriend ? true : newMsg.isRead }];
        });

        if (isFromActiveFriend) {
          socket.emit('mark_read', { senderId: activeTargetId });
        }
      }

      // Track unread if message is from friend to me and chat is NOT active
      if (senderId !== currentUserId && receiverId === currentUserId) {
        if (activeChat?.type !== 'direct' || activeTargetId !== senderId) {
          const chatKey = `direct_${senderId}`;
          setUnreadCounts((prev) => ({
            ...prev,
            [chatKey]: (prev[chatKey] || 0) + 1,
          }));
        }
      }
    };

    const handleMessagesRead = ({ chatPartnerId }) => {
      const activeTargetId = (activeChat?.target?._id || activeChat?.target)?.toString();
      const partnerId = chatPartnerId?.toString();

      if (activeChat?.type === 'direct' && activeTargetId && activeTargetId === partnerId) {
        setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
      }
    };

    const handleRoomMessage = (newMsg) => {
      const senderId = (typeof newMsg.sender === 'object' ? newMsg.sender?._id : newMsg.sender)?.toString();
      const msgRoomId = (typeof newMsg.room === 'object' ? newMsg.room?._id : newMsg.room)?.toString();
      const activeRoomId = activeChat?.target?._id?.toString();
      const currentUserId = user._id?.toString();

      if (activeChat?.type === 'room' && msgRoomId === activeRoomId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }

      // Track unread if room message is from someone else and room is NOT active
      if (senderId !== currentUserId && msgRoomId) {
        if (activeChat?.type !== 'room' || activeRoomId !== msgRoomId) {
          const chatKey = `room_${msgRoomId}`;
          setUnreadCounts((prev) => ({
            ...prev,
            [chatKey]: (prev[chatKey] || 0) + 1,
          }));
        }
      }
    };

    const handleTyping = ({ senderId, senderUsername, roomId }) => {
      if (activeChat?.type === 'direct' && activeChat.target._id === senderId) {
        setTypingStatus('typing...');
      } else if (activeChat?.type === 'room' && activeChat.target._id === roomId) {
        setTypingStatus(`${senderUsername || 'Someone'} is typing...`);
      }
    };

    const handleStopTyping = () => {
      setTypingStatus('');
    };

    const handleMemberKicked = ({ roomId }) => {
      if (activeChat?.type === 'room' && activeChat.target._id === roomId) {
        setActiveChat(null);
        showToast('You were removed from the room by the Admin.', 'error');
      }
    };

    const handleErrorMessage = ({ message }) => {
      if (message) {
        showToast(message, 'error');
      }
    };

    socket.on('receive_private_message', handlePrivateMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('receive_room_message', handleRoomMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('member_kicked', handleMemberKicked);
    socket.on('error_message', handleErrorMessage);

    return () => {
      socket.off('receive_private_message', handlePrivateMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('receive_room_message', handleRoomMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('member_kicked', handleMemberKicked);
      socket.off('error_message', handleErrorMessage);
    };
  }, [socket, activeChat]);

  // Toast for incoming follow request notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      showToast(latest.message, 'success');
      setPendingRequestsCount((prev) => prev + 1);
      removeNotification(latest.id);
    }
  }, [notifications, removeNotification]);

  const handleSendMessage = ({ text, imageUrl }) => {
    if (!activeChat || (!text && !imageUrl) || !socket) return;

    if (activeChat.type === 'direct') {
      socket.emit('send_private_message', {
        senderId: user._id,
        receiverId: activeChat.target._id,
        text,
        imageUrl,
      });
    } else if (activeChat.type === 'room') {
      socket.emit('send_room_message', {
        senderId: user._id,
        roomId: activeChat.target._id,
        text,
        imageUrl,
      });
    }
  };

  const handleClearChat = async () => {
    if (!activeChat) return;
    if (!window.confirm('Are you sure you want to clear this chat history for yourself?')) return;

    try {
      if (activeChat.type === 'direct') {
        await api.delete(`/chat/clear/private/${activeChat.target._id}`);
      } else {
        await api.delete(`/chat/clear/room/${activeChat.target._id}`);
      }

      setMessages([]);
      showToast('Chat history cleared.', 'success');
    } catch (err) {
      showToast('Failed to clear chat.', 'error');
    }
  };

  const handleTyping = () => {
    if (!socket || !activeChat) return;
    if (activeChat.type === 'direct') {
      socket.emit('typing', { receiverId: activeChat.target._id, senderUsername: user.username });
    } else {
      socket.emit('typing', { roomId: activeChat.target._id, senderUsername: user.username });
    }
  };

  const handleStopTyping = () => {
    if (!socket || !activeChat) return;
    if (activeChat.type === 'direct') {
      socket.emit('stop_typing', { receiverId: activeChat.target._id });
    } else {
      socket.emit('stop_typing', { roomId: activeChat.target._id });
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#0b141a] text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#008069] to-[#00a884] flex items-center justify-center mb-4 shadow-xl shadow-[#00a884]/20 animate-pulse">
          <MessageSquare className="w-8 h-8 text-white fill-current" />
        </div>
        <Loader2 className="w-6 h-6 text-[#00a884] animate-spin mb-2" />
        <p className="text-xs text-[#8696a0] font-medium tracking-wide">Connecting to ChatMe...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div
      className="flex w-full overflow-hidden bg-[#0b141a] text-white select-none relative pt-[env(safe-area-inset-top,0px)]"
      style={{ height: 'var(--visual-viewport-height, 100dvh)' }}
    >
      {/* Responsive Sidebar Navigation */}
      <Sidebar
        activeChat={activeChat}
        unreadCounts={unreadCounts}
        pendingRequestsCount={pendingRequestsCount}
        onRequestProcessed={(count) => setPendingRequestsCount(count)}
        onSelectChat={(chat) => setActiveChat(chat)}
        onCreateRoomClick={() => setShowCreateRoom(true)}
        onJoinRoomClick={() => setShowJoinRoom(true)}
        className={activeChat ? 'hidden md:flex' : 'flex'}
      />

      {/* Main Active Chat View */}
      <div className={`flex-1 flex-col h-full min-h-0 bg-[#0b141a] relative chat-bg-pattern ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        {activeChat ? (
          <>
            <div className="shrink-0 sticky top-0 z-30 w-full">
              <ChatHeader
                activeChat={activeChat}
                onClearChat={handleClearChat}
                onOpenRoomMembers={() => setShowRoomMembers(true)}
                onBack={handleBackChat}
              />

              {typingStatus && (
                <div className="bg-[#1f2c34]/90 backdrop-blur-md text-[#00a884] text-xs px-4 py-1.5 italic animate-fade-in font-semibold flex items-center gap-2 border-b border-white/5">
                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-ping" />
                  {typingStatus}
                </div>
              )}
            </div>

            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-[#8696a0]">
                <Loader2 className="w-7 h-7 animate-spin text-[#00a884]" />
              </div>
            ) : (
              <MessageList
                messages={messages}
                onOpenImage={(url) => setSelectedImage(url)}
              />
            )}

            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
            />
          </>
        ) : (
          /* Empty Chat Splash Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center relative overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute w-72 h-72 bg-[#00a884]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute w-72 h-72 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" style={{ top: '20%', right: '20%' }} />

            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#008069] to-[#00a884] flex items-center justify-center mb-6 shadow-2xl shadow-[#00a884]/30 animate-pop-in border border-white/10">
              <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-current" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 flex items-center justify-center gap-2 font-display">
              ChatMe Web <Sparkles className="w-6 h-6 text-[#00a884]" />
            </h2>
            
            <p className="text-xs sm:text-sm text-[#8696a0] max-w-md leading-relaxed mb-8">
              Send instant direct messages to friends, join group rooms with custom codes, or discover new users on ChatMe!
            </p>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-sm">
              <button
                onClick={() => setShowCreateRoom(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1f2c34] hover:bg-[#222e35] text-white text-xs font-bold rounded-2xl border border-white/10 transition shadow-lg hover:border-[#00a884]/40 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-[#00a884]" /> Create Room
              </button>

              <button
                onClick={() => setShowJoinRoom(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1f2c34] hover:bg-[#222e35] text-white text-xs font-bold rounded-2xl border border-white/10 transition shadow-lg hover:border-[#00a884]/40 active:scale-95"
              >
                <LogIn className="w-4 h-4 text-[#00a884]" /> Join Room Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onRoomCreated={(newRoom) => {
            setActiveChat({ type: 'room', target: newRoom });
          }}
        />
      )}

      {showJoinRoom && (
        <JoinRoomModal
          onClose={() => setShowJoinRoom(false)}
          onRoomJoined={(room) => {
            setActiveChat({ type: 'room', target: room });
            showToast(`Successfully joined room "${room.name}"!`, 'success');
          }}
        />
      )}

      {showRoomMembers && activeChat?.type === 'room' && (
        <RoomMembersModal
          room={activeChat.target}
          onClose={() => setShowRoomMembers(false)}
          onMemberRemoved={(removedId) => {
            setActiveChat((prev) => ({
              ...prev,
              target: {
                ...prev.target,
                members: prev.target.members.filter((m) => (m._id || m) !== removedId),
              },
            }));
          }}
        />
      )}

      {selectedImage && (
        <ImageViewerModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}

export default App;
