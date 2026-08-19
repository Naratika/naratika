import React from 'react';

export function NaratikaLogo({ size = 'md', showText = true, variant = 'dark' }) {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Aesthetic Quill & Book SVG Emblem */}
      <div className={`${s.icon} rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-amber-950 p-1.5 shadow-md shadow-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 relative overflow-hidden group`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="logoPage" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          {/* Book Wings */}
          <path d="M20 72 C35 62 45 64 50 74 C47 48 38 32 24 28 C20 44 20 60 20 72 Z" fill="url(#logoPage)" opacity="0.8" />
          <path d="M80 72 C65 62 55 64 50 74 C53 48 62 32 76 28 C80 44 80 60 80 72 Z" fill="url(#logoPage)" opacity="0.95" />
          {/* Central Quill Flame "N" */}
          <path d="M50 16 C53 30 60 48 70 64 C58 64 51 54 50 48 C49 54 42 64 30 64 C40 48 47 30 50 16 Z" fill="url(#logoGold)" />
          {/* Gold Sparkle */}
          <circle cx="50" cy="14" r="2.5" fill="#fef08a" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className={`font-serif font-black tracking-tight ${s.text} bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent`}>
              Naratika
            </span>
          </div>
          <span className={`font-sans font-semibold uppercase tracking-widest text-gray-400 ${s.sub} -mt-0.5`}>
            Narasi &amp; Estetika
          </span>
        </div>
      )}
    </div>
  );
}
