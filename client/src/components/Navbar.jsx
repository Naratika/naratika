import React from 'react';
import { Coins, Key, Search, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NaratikaLogo } from './NaratikaLogo';

export function Navbar({ onNavigate, currentPage }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-xs px-4 py-2.5 flex items-center justify-between">
      {/* Brand Logo Naratika */}
      <div 
        onClick={() => onNavigate('home')} 
        className="cursor-pointer select-none"
      >
        <NaratikaLogo size="md" showText={true} />
      </div>

      {/* Right Action Icons & User Token Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <div className="flex items-center gap-2 bg-amber-50/90 border border-amber-200/70 rounded-full px-3 py-1 text-xs font-semibold text-amber-950 shadow-xs">
            {/* VIP Tokens */}
            <div className="flex items-center gap-1" title="Token Buka Bab VIP">
              <Key className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{user.free_unlock_tokens}</span>
            </div>
            <span className="text-amber-300">|</span>
            {/* Coins */}
            <div className="flex items-center gap-1" title="Koin Pembaca">
              <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{user.coins}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-full transition shadow-xs"
          >
            Masuk
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => onNavigate('discover')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          title="Cari Novel di Naratika"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => onNavigate('profile')}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-100 to-amber-200 flex items-center justify-center text-amber-900 font-bold text-xs border border-amber-300 shadow-xs"
        >
          {user ? user.display_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-amber-700" />}
        </button>
      </div>
    </header>
  );
}
