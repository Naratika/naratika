import React from 'react';
import { Home, Compass, BookOpen, PenLine, User } from 'lucide-react';

const navItems = [
  { id: 'home',    icon: Home,      label: 'Beranda' },
  { id: 'discover',icon: Compass,   label: 'Jelajahi' },
  { id: 'library', icon: BookOpen,  label: 'Perpustakaan' },
  { id: 'author',  icon: PenLine,   label: 'Penulis' },
  { id: 'profile', icon: User,      label: 'Akun' },
];

export function BottomNav({ currentPage, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto sm:max-w-2xl">
      <div className="bg-white/95 backdrop-blur border-t border-gray-100 shadow-lg px-1 py-1.5 safe-area-pb flex items-center justify-around">
        {navItems.map(({ id, icon: Icon, label }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all ${
                active
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-gray-400 hover:text-amber-600'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${active ? 'stroke-amber-700 fill-amber-700/10' : ''}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-semibold ${active ? 'text-amber-700' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
