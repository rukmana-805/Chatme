import React, { useState, useEffect } from 'react';
import { getMostUsedEmojis, trackEmojiUsage } from '../../utils/emojiTracker';
import { Flame, Smile, Heart, Hand, Compass, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😊', '😂', '🤣', '😍', '😎', '🥳', '😭', '😜', '😇', '🤔', '😴', '🙄', '🤩', '🥺', '🤐', '🤗'],
  },
  {
    name: 'Gestures & Hearts',
    emojis: ['👍', '🙌', '👏', '🙏', '🔥', '❤️', '💖', '✨', '🎉', '💯', '🚀', '💪', '✌️', '🤝', '⭐', '🎈'],
  },
  {
    name: 'Objects & Symbols',
    emojis: ['💬', '📢', '📷', '🎵', '⚽', '🏆', '🍔', '☕', '💡', '🔒', '🎁', '⚡', '🌈', '🔥', '📱', '💰'],
  },
];

const EmojiPickerModal = ({ onSelectEmoji, onClose }) => {
  const [mostUsed, setMostUsed] = useState([]);

  useEffect(() => {
    setMostUsed(getMostUsedEmojis(10));
  }, []);

  const handlePick = (emoji) => {
    trackEmojiUsage(emoji);
    onSelectEmoji(emoji);
    setMostUsed(getMostUsedEmojis(10));
  };

  return (
    <div className="absolute bottom-16 left-4 z-40 w-80 bg-[#1f2c34] border border-white/10 rounded-2xl p-4 shadow-2xl animate-pop-in backdrop-blur-xl">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Smile className="w-4 h-4 text-[#00a884]" /> Emojis
        </h4>
        <button
          onClick={onClose}
          className="text-[#8696a0] hover:text-white p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Most Used / Recent Emojis Section */}
      <div className="mb-3 p-2 rounded-xl bg-[#111b21]/60 border border-white/5">
        <div className="text-[10px] font-bold text-[#00a884] uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-400" /> Most Used & Recent
        </div>
        <div className="grid grid-cols-5 gap-1">
          {mostUsed.map((emoji, idx) => (
            <button
              key={`most-used-${idx}`}
              onClick={() => handlePick(emoji)}
              className="text-xl p-1.5 hover:bg-white/10 rounded-lg transition transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
        {EMOJI_CATEGORIES.map((cat, catIdx) => (
          <div key={catIdx}>
            <div className="text-[10px] font-semibold text-[#8696a0] uppercase mb-1">
              {cat.name}
            </div>
            <div className="grid grid-cols-6 gap-1">
              {cat.emojis.map((emoji, eIdx) => (
                <button
                  key={eIdx}
                  onClick={() => handlePick(emoji)}
                  className="text-lg p-1 hover:bg-white/10 rounded-lg transition transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiPickerModal;
