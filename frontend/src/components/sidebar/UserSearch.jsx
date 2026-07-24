import React, { useState } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { Search, UserPlus, Check, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const UserSearch = ({ onSelectFriend }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const { socket } = useSocket();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.get(`/users/search?query=${encodeURIComponent(query.trim())}`);
      setResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (targetUser) => {
    setSendingId(targetUser._id);
    try {
      const res = await api.post('/users/follow-request', { recipientId: targetUser._id });
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
      {/* Search Header Form */}
      <form onSubmit={handleSearch} className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Username or User ID..."
            className="w-full bg-[#1f2c34] text-white text-sm pl-10 pr-10 py-2.5 rounded-xl border border-white/5 focus:border-[#00a884] transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 p-1 bg-[#00a884] text-[#0b141a] rounded-lg hover:bg-[#06cf9c] transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {results.length === 0 && !loading && (
          <div className="text-center text-[#8696a0] text-xs py-8">
            Type username or ID above to find friends.
          </div>
        )}

        {results.map((u) => (
          <div
            key={u._id}
            className="flex items-center justify-between p-3 rounded-xl bg-[#1f2c34]/60 border border-white/5 hover:bg-[#1f2c34] transition"
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
