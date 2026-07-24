import React, { useState } from 'react';
import api from '../../utils/api';
import { Users, X, Copy, Check, Sparkles, Loader2 } from 'lucide-react';

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/rooms/create', { name: name.trim() });
      setCreatedRoom(res.data);
      onRoomCreated(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (createdRoom?.code) {
      navigator.clipboard.writeText(createdRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
              Create New Room <Sparkles className="w-4 h-4 text-[#00a884]" />
            </h3>
            <p className="text-xs text-[#8696a0]">
              Generate a custom group room with a unique join code
            </p>
          </div>
        </div>

        {!createdRoom ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1.5 uppercase tracking-wider">
                Room Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Developers Lounge, College Squad"
                required
                className="w-full bg-[#111b21] text-white text-sm px-4 py-3 rounded-xl border border-white/10 focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 transition placeholder-[#667781]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-[#008069] to-[#00a884] hover:from-[#00a884] hover:to-[#06cf9c] text-[#0b141a] font-extrabold text-sm rounded-xl transition shadow-lg shadow-[#00a884]/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0b141a]" />
              ) : (
                'Create Room & Generate Code'
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="p-5 bg-[#111b21] rounded-2xl border border-[#00a884]/40 shadow-inner">
              <span className="text-xs text-[#8696a0] block uppercase tracking-wider font-semibold mb-1">
                Room Created! Share Code:
              </span>
              <div className="text-3xl font-black font-mono text-[#00a884] tracking-widest my-2 select-all">
                {createdRoom.code}
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#008069] to-[#00a884] text-[#0b141a] font-extrabold text-xs rounded-xl transition shadow-md hover:from-[#00a884] hover:to-[#06cf9c]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Code Copied!' : 'Copy Room Code'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition"
            >
              Done & Start Chatting
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRoomModal;
