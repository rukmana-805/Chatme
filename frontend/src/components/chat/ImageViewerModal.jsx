import React, { useState } from 'react';
import { X, Download, Loader2, Check } from 'lucide-react';

const ImageViewerModal = ({ imageUrl, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!imageUrl) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ChatMe_image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.error('Download error:', err);
      window.open(imageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center select-none">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition shadow-lg"
          title="Close Modal"
        >
          <X className="w-6 h-6" />
        </button>

        <img
          src={imageUrl}
          alt="Enlarged view"
          className="max-w-full max-h-[75vh] sm:max-h-[80vh] rounded-3xl object-contain shadow-2xl border border-white/10 animate-pop-in"
        />

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#008069] to-[#00a884] hover:from-[#00a884] hover:to-[#06cf9c] text-[#0b141a] font-extrabold text-xs sm:text-sm rounded-2xl transition shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0b141a]" />
                <span>Downloading Image...</span>
              </>
            ) : downloaded ? (
              <>
                <Check className="w-4 h-4 text-[#0b141a]" />
                <span>Downloaded to Device!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#0b141a]" />
                <span>Download Image</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;
