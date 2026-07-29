import React, { useState, useEffect } from 'react';
import { getMostUsedEmojis, trackEmojiUsage } from '../../utils/emojiTracker';
import { Flame, Smile, Heart, ThumbsUp, Dog, Utensils, Trophy, Lightbulb, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Expressions',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹',
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗',
      '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓',
      '😎', '🥸', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
      '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
      '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '🤫', '🫠', '🫡', '🫣', '🫢'
    ],
  },
  {
    id: 'love',
    name: 'Kiss & Romance',
    icon: Heart,
    emojis: [
      '😘', '💋', '💏', '💑', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '❤️', '🧡', '💛',
      '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
      '💓', '💗', '💖', '💘', '💝', '💟', '💌', '😍', '🥰', '😻', '👩‍❤️‍👨', '👩‍❤️‍👩'
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures & People',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
      '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '✌️', '🤟', '🤘',
      '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🖐️', '✋', '🖖',
      '👶', '🧒', '👦', '👧', '👨', '👩', '🧑', '👨‍💻', '👩‍💻', '🧑‍🚀'
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: Dog,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
      '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
      '🐌', '🐞', '🐜', '🦟', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖',
      '🐙', '🐬', '🐳', '🦈', '🐊', '🐅', '🐆', '🐘', '🦒', '🌲',
      '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🌸', '🌹', '🌺', '🌻', '🌼', '🌷'
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: Utensils,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦',
      '🥒', '🌶️', '🌽', '🥕', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚',
      '🍳', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟',
      '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜',
      '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍨', '🍧', '🍦', '🥧',
      '🧁', '🍰', '🎂', '🍩', '🍪', '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾', '🧊'
    ],
  },
  {
    id: 'activities',
    name: 'Activities & Sports',
    icon: Trophy,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🏏', '🏹', '🎣', '🤿', '🥊',
      '🥋', '🛹', '🛼', '🛷', '⛸️', '⛷️', '🏂', '🏋️', '🧘', '🏄',
      '🏊', '🚴', '🚗', '🚘', '🚙', '🚚', '🏎️', '🏍️', '🛵', '🚲',
      '🚌', '🚑', '🚒', '🚂', '✈️', '🚀', '🛸', '🚁', '⚓', '⛵', '🎡', '🎢'
    ],
  },
  {
    id: 'objects',
    name: 'Objects & Symbols',
    icon: Lightbulb,
    emojis: [
      '💡', '🔦', '🕯️', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
      '📷', '📸', '📹', '🎥', '📽️', '📞', '☎️', '📺', '📻', '🎙️',
      '⏱️', '⏰', '🔒', '🔓', '🔑', '🗝️', '🔨', '⚔️', '💣', '🛡️',
      '💊', '🎁', '🎈', '🎉', '🎊', '💎', '💍', '👑', '🏆', '🥇',
      '🥈', '🥉', '🏅', '📢', '💬', '💭', '♨️', '🔔', '🎵', '🎶',
      '⚡', '💥', '🌟', '✨', '🔥', '💯', '⚠️', '🚫', '⛔', '❌', '⭕', '✅'
    ],
  },
];

const EmojiPickerModal = ({ onSelectEmoji, onClose }) => {
  const [mostUsed, setMostUsed] = useState([]);
  const [selectedCat, setSelectedCat] = useState('smileys');

  useEffect(() => {
    setMostUsed(getMostUsedEmojis(10));
  }, []);

  const handlePick = (emoji) => {
    trackEmojiUsage(emoji);
    onSelectEmoji(emoji);
    setMostUsed(getMostUsedEmojis(10));
  };

  const activeCategory = EMOJI_CATEGORIES.find((c) => c.id === selectedCat) || EMOJI_CATEGORIES[0];

  return (
    <div className="absolute bottom-16 left-2 sm:left-4 z-40 w-[92vw] sm:w-88 md:w-96 max-h-[60vh] sm:max-h-[480px] bg-[#1f2c34] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl animate-pop-in backdrop-blur-xl flex flex-col select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
          <Smile className="w-4 h-4 text-[#00a884]" /> WhatsApp Emojis
        </h4>
        <button
          onClick={onClose}
          className="text-[#8696a0] hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Selection Tabs Bar */}
      <div className="flex items-center gap-1 pb-2 border-b border-white/5 overflow-x-auto no-scrollbar">
        {EMOJI_CATEGORIES.map((cat) => {
          const IconComp = cat.icon;
          const isActive = cat.id === selectedCat;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`p-2 rounded-xl transition flex items-center justify-center flex-shrink-0 ${
                isActive
                  ? 'bg-[#00a884] text-[#0b141a] shadow-md font-bold'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/5'
              }`}
              title={cat.name}
            >
              <IconComp className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Most Used / Recent Emojis Section */}
      {mostUsed.length > 0 && (
        <div className="my-2 p-2 rounded-xl bg-[#111b21]/60 border border-white/5 shrink-0">
          <div className="text-[10px] font-bold text-[#00a884] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" /> Recent & Top
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
            {mostUsed.slice(0, 8).map((emoji, idx) => (
              <button
                key={`most-used-${idx}`}
                onClick={() => handlePick(emoji)}
                className="text-lg p-1 hover:bg-white/10 rounded-lg transition transform hover:scale-125 flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Category Emoji Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar">
        <div className="text-[10px] font-semibold text-[#8696a0] uppercase tracking-wider sticky top-0 bg-[#1f2c34]/90 backdrop-blur-md py-1 z-10">
          {activeCategory.name}
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
          {activeCategory.emojis.map((emoji, eIdx) => (
            <button
              key={`${activeCategory.id}-${eIdx}`}
              onClick={() => handlePick(emoji)}
              className="text-xl p-1.5 hover:bg-white/10 rounded-xl transition transform hover:scale-125 flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPickerModal;
