import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 animate-pop-in flex items-center gap-3 px-4 py-3.5 rounded-2xl glass-modal text-white shadow-2xl border border-white/10">
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-[#00a884] flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug font-display">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-xl text-[#8696a0] hover:text-white transition flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
