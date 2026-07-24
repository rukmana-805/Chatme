import React, { useState } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Users, UserX, X, Loader2, Crown } from 'lucide-react';

const RoomMembersModal = ({ room, onClose, onMemberRemoved }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [members, setMembers] = useState(room?.members || []);
  const [removingId, setRemovingId] = useState(null);

  if (!room) return null;

  const isAdmin = room.admin?._id === user._id || room.admin === user._id;

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the room?')) return;

    setRemovingId(memberId);
    try {
      await api.post(`/rooms/${room._id}/remove-member`, { memberId });

      setMembers((prev) => prev.filter((m) => m._id !== memberId));

      if (socket) {
        socket.emit('kick_member', { memberId, roomId: room._id });
      }

      if (onMemberRemoved) onMemberRemoved(memberId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 animate-pop-in relative border border-white/10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8696a0] hover:text-white p-2 rounded-xl hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <Avatar src={room.avatar} name={room.name} size="lg" showStatus={false} />
          <div className="truncate">
            <h3 className="text-lg font-bold text-white truncate font-display">{room.name}</h3>
            <p className="text-xs text-[#8696a0]">
              Code: <strong className="font-mono text-[#00a884] tracking-wider">{room.code}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 text-xs font-bold text-[#8696a0] uppercase tracking-wider">
          <span>Room Members ({members.length})</span>
          {isAdmin && (
            <span className="text-[#00a884] flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> You are Admin
            </span>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
          {members.map((m) => {
            const isMemberAdmin = room.admin?._id === m._id || room.admin === m._id;
            const isSelf = m._id === user._id;

            return (
              <div
                key={m._id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#111b21]/80 border border-white/5 hover:border-white/10 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={m.avatar} name={m.username} isOnline={m.isOnline} />
                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-white truncate flex items-center gap-1.5 font-display">
                      {m.username} {isSelf && <span className="text-xs text-[#8696a0] font-normal">(You)</span>}
                    </h4>
                    <p className="text-[11px] text-[#8696a0] truncate">{m.email}</p>
                  </div>
                </div>

                <div>
                  {isMemberAdmin ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold text-[11px] rounded-xl border border-amber-500/20">
                      <Crown className="w-3.5 h-3.5" /> Admin
                    </span>
                  ) : isAdmin ? (
                    <button
                      onClick={() => handleRemoveMember(m._id)}
                      disabled={removingId === m._id}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white font-bold text-xs rounded-xl transition border border-rose-500/30"
                      title="Remove Member from Room"
                    >
                      {removingId === m._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5" /> Remove
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#8696a0] font-medium">Member</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoomMembersModal;
