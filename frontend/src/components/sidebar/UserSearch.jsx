import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { Search, UserPlus, Clock, MessageSquare, Loader2, X, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const UserSearch = ({ onSelectFriend }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const { socket } = useSocket();
  const activeRequestRef = useRef(null);

  // Debounced real-time user search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      // Create controller for cancelling previous request
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }

      const controller = new AbortController();
      activeRequestRef.current = controller;

      try {
        const res = await api.get(`/users/search?query=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        setResults(res.data);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.error('Debounced search error:', err);
        }
      } finally {
        if (activeRequestRef.current === controller) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setLoading(false);
  };

  const sendRequest = async (targetUser) => {
    setSendingId(targetUser._id);
    try {
      await api.post('/users/follow-request', { recipientId: targetUser._id });
      setResults((prev) =>
        prev.map((u) =>
          u._id === targetUser._id ? { ...u, hasSentRequest: true } : u
        )
      );

      if (socket) {
        socket.emit('follow_request_sent', {
          recipientId: targetUser._id,
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      {/* Search Header Input */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type username or ID to search..."
            className="w-full bg-[#1f2c34] text-white text-sm pl-10 pr-10 py-2.5 rounded-xl border border-white/5 focus:border-[#00a884] focus:outline-none transition placeholder-[#667781]"
          />
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {loading && <Loader2 className="w-4 h-4 text-[#00a884] animate-spin" />}
            {query && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 text-[#8696a0] hover:text-white rounded-md hover:bg-white/10 transition"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-[#8696a0] mt-1.5 px-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#00a884]" /> Real-time debounced suggestions
        </p>
      </div>

      {/* Results Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!query.trim() && (
          <div className="text-center text-[#8696a0] text-xs py-10 space-y-2">
            <Search className="w-8 h-8 mx-auto text-[#8696a0]/40" />
            <p>Start typing a username or ID above for instant suggestions.</p>
          </div>
        )}

        {query.trim() && results.length === 0 && !loading && (
          <div className="text-center text-[#8696a0] text-xs py-10">
            No users found matching &quot;{query.trim()}&quot;
          </div>
        )}

        {results.map((u) => (
          <div
            key={u._id}
            className="flex items-center justify-between p-3 rounded-xl bg-[#1f2c34]/60 border border-white/5 hover:bg-[#1f2c34] transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={u.avatar} name={u.username} isOnline={u.isOnline} />
              <div className="truncate">
                <h4 className="text-sm font-semibold text-white truncate">{u.username}</h4>
                <p className="text-xs text-[#8696a0] truncate">{u.email}</p>
                <p className="text-[10px] text-[#667781] truncate">ID: {u._id}</p>
              </div>
            </div>

            <div>
              {u.isFriend ? (
                <button
                  onClick={() => onSelectFriend(u)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884] hover:text-[#0b141a] font-semibold text-xs rounded-lg transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
              ) : u.hasSentRequest ? (
                <span className="flex items-center gap-1 text-xs text-[#8696a0] bg-white/5 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3 h-3 text-amber-400" /> Pending
                </span>
              ) : (
                <button
                  onClick={() => sendRequest(u)}
                  disabled={sendingId === u._id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#00a884] hover:bg-[#06cf9c] text-[#0b141a] font-bold text-xs rounded-lg transition"
                >
                  {sendingId === u._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSearch;
