import React from 'react';

const Badge = ({ count, variant = 'emerald' }) => {
  if (!count || count <= 0) return null;

  const bgClasses = {
    emerald: 'bg-[#00a884] text-[#0b141a]',
    teal: 'bg-teal-500 text-white',
    danger: 'bg-rose-500 text-white',
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-bold rounded-full ${bgClasses[variant]} animate-pop-in`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default Badge;
