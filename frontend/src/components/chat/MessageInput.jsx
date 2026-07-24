import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';
import EmojiPickerModal from './EmojiPickerModal';
import { getMostUsedEmojis, trackEmojiUsage } from '../../utils/emojiTracker';
import { Send, Paperclip, Smile, X, Loader2 } from 'lucide-react';

const MessageInput = ({ onSendMessage, onTyping, onStopTyping }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [quickEmojis, setQuickEmojis] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setQuickEmojis(getMostUsedEmojis(6));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImagePreview = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuickEmojiClick = (emoji) => {
    trackEmojiUsage(emoji);
    setText((prev) => prev + emoji);
    setQuickEmojis(getMostUsedEmojis(6));
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setQuickEmojis(getMostUsedEmojis(6));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;

    let uploadedUrl = '';

    if (imageFile) {
      setUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const res = await api.post('/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrl = res.data.imageUrl;
      } catch (err) {
        console.error('Image upload error:', err);
        alert('Failed to upload image. Please try again.');
        setUploadingImage(false);
        return;
      } flex-1;
    }

    onSendMessage({ text: text.trim(), imageUrl: uploadedUrl });

    setText('');
    setImageFile(null);
    setImagePreview(null);
    setShowEmojiPicker(false);
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (onTyping) onTyping();
  };

  return (
    <div className="relative p-2.5 sm:p-3 bg-[#111b21]/90 backdrop-blur-md border-t border-white/5 select-none z-20">
      {/* Quick Emojis Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1 mb-2 bg-[#1f2c34]/60 rounded-xl overflow-x-auto border border-white/5 no-scrollbar">
        <span className="text-[10px] font-bold text-[#8696a0] uppercase flex-shrink-0 mr-1">
          Recent:
        </span>
        {quickEmojis.map((emoji, idx) => (
          <button
            key={`quick-${idx}`}
            type="button"
            onClick={() => handleQuickEmojiClick(emoji)}
            className="text-sm sm:text-base px-1.5 py-0.5 hover:bg-white/10 rounded-md transition transform hover:scale-125 flex-shrink-0"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Image Preview Box */}
      {imagePreview && (
        <div className="mb-2.5 p-2 bg-[#1f2c34] rounded-xl flex items-center justify-between border border-white/10 animate-fade-in">
          <div className="flex items-center gap-3">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="w-10 h-10 object-cover rounded-lg border border-white/10"
            />
            <span className="text-xs text-white font-medium truncate max-w-[180px] sm:max-w-[240px]">
              {imageFile?.name}
            </span>
          </div>
          <button
            type="button"
            onClick={removeImagePreview}
            className="p-1 text-[#8696a0] hover:text-rose-400 rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <EmojiPickerModal
          onSelectEmoji={handleSelectEmoji}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Input Controls Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2.5 rounded-xl transition ${
            showEmojiPicker
              ? 'bg-[#00a884] text-[#0b141a] shadow-md'
              : 'text-[#8696a0] hover:text-white hover:bg-white/5'
          }`}
          title="Emoji Picker"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-[#8696a0] hover:text-white hover:bg-white/5 rounded-xl transition"
          title="Attach Image"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={onStopTyping}
          placeholder="Type a message..."
          className="flex-1 bg-[#1f2c34] text-white text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-white/10 focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/30 transition placeholder-[#667781]"
        />

        <button
          type="submit"
          disabled={uploadingImage || (!text.trim() && !imageFile)}
          className="p-2.5 sm:p-3 bg-gradient-to-r from-[#008069] to-[#00a884] hover:from-[#00a884] hover:to-[#06cf9c] text-[#0b141a] font-bold rounded-xl shadow-md shadow-[#00a884]/20 transition transform active:scale-95 disabled:opacity-40 flex-shrink-0"
        >
          {uploadingImage ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#0b141a]" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
