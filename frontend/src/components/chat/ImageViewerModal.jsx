import React from 'react';
import { X, Download } from 'lucide-react';

const ImageViewerModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition"
        >
          <X className="w-6 h-6" />
        </button>

        <img
          src={imageUrl}
          alt="Enlarged view"
          className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
        />

        <div className="mt-4 flex items-center gap-3">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-2 px-4 py-2 bg-[#00a884] hover:bg-[#06cf9c] text-[#0b141a] font-bold text-xs rounded-xl transition shadow-lg"
          >
            <Download className="w-4 h-4" /> Open Full Image
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;
