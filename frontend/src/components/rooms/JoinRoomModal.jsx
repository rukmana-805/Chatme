import React, { useState } from 'react';
import api from '../../utils/api';
import { LogIn, X, Loader2 } from 'lucide-react';

const JoinRoomModal = ({ onClose, onRoomJoined }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/rooms/join', { code: code.trim().toUpperCase() });
      onRoomJoined(res.data);
      onClose();
    } catch (err) {
      console.error('Join room error:', err);
      setError(err.response?.data?.message || 'Invalid Room Code. Please check and try again.');
    } finally {
      setLoading(false);
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
          <div className="p-3 bg-gradient-to-tr from-[#008069] to-[#00a884] rounded-2xl text-white shadow-lg shadow-[#00a884]/20">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">Join Room by Code</h3>
            <p className="text-xs text-[#8696a0]">
              Enter the unique room code provided by the Admin
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center animate-fade-in flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1.5 uppercase tracking-wider">
              Room Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. RM-892A47"
              required
              className="w-full bg-[#111b21] text-white text-center font-mono text-xl tracking-widest px-4 py-3.5 rounded-xl border border-white/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 transition uppercase placeholder-[#667781]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-[#008069] to-[#00a884] hover:from-[#00a884] hover:to-[#06cf9c] text-[#0b141a] font-extrabold text-sm rounded-xl transition shadow-lg shadow-[#00a884]/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#0b141a]" /> : 'Join Room Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomModal;
