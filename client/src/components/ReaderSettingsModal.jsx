import React from 'react';
import { X, Type, Sun, Moon, Eye, AlignLeft } from 'lucide-react';
import { useReader } from '../context/ReaderContext';

export function ReaderSettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const {
    theme,
    setTheme,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
  } = useReader();

  const themes = [
    { id: 'light', label: 'Putih', bg: 'bg-white text-gray-900 border-gray-300', icon: Sun },
    { id: 'sepia', label: 'Sepia', bg: 'bg-[#fbf0d9] text-[#5f4b32] border-[#e2d2b5]', icon: Sun },
    { id: 'green', label: 'Hijau Mata', bg: 'bg-[#dceed6] text-[#2d4a2d] border-[#b8dab1]', icon: Eye },
    { id: 'dark', label: 'Gelap', bg: 'bg-[#1e293b] text-gray-100 border-gray-700', icon: Moon },
    { id: 'amoled', label: 'AMOLED', bg: 'bg-black text-gray-300 border-gray-800', icon: Moon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 p-5 animate-slide-up sm:animate-fade-in text-gray-900">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
            <Type className="w-4 h-4 text-orange-500" />
            Pengaturan Tampilan Baca
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Ukuran Font */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Ukuran Huruf ({fontSize}px)
          </label>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={decreaseFontSize}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 font-extrabold rounded-xl transition text-base"
            >
              A-
            </button>
            <div className="flex-1 text-center font-bold text-gray-700 text-lg">
              {fontSize}
            </div>
            <button
              onClick={increaseFontSize}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 font-extrabold rounded-xl transition text-base"
            >
              A+
            </button>
          </div>
        </div>

        {/* 2. Jenis Huruf */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Jenis Font
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setFontFamily('serif')}
              className={`py-2 px-3 rounded-xl border text-sm font-serif transition ${
                fontFamily === 'serif'
                  ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-xs'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Serif (Klasik Buku)
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`py-2 px-3 rounded-xl border text-sm font-sans transition ${
                fontFamily === 'sans'
                  ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-xs'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sans (Modern Bersih)
            </button>
          </div>
        </div>

        {/* 3. Tema Warna Baca */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Tema Latar Belakang
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition ${t.bg} ${
                  theme === t.id ? 'border-orange-500 ring-2 ring-orange-400/40 shadow' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <t.icon className="w-4 h-4 mb-1" />
                <span className="text-[11px] font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition"
        >
          Selesai & Lanjutkan Membaca
        </button>
      </div>
    </div>
  );
}
