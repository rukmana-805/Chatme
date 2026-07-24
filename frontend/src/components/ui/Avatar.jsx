import React from 'react';

const Avatar = ({ src, name, size = 'md', isOnline = false, showStatus = true }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitial = (str) => {
    return str ? str.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeClasses[size]} rounded-full object-cover border border-white/10 shadow-sm`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'User')}`;
          }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center border border-white/10 shadow-sm`}
        >
          {getInitial(name)}
        </div>
      )}
      {showStatus && (
        <span
          className={isOnline ? 'online-badge' : 'offline-badge'}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
