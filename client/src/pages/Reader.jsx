import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useReader } from '../context/ReaderContext';
import { useAuth } from '../context/AuthContext';
import { useAdConfig } from '../context/AdConfigContext';
import { ReaderSettingsModal } from '../components/ReaderSettingsModal';
import { AdBanner } from '../components/AdBanner';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Settings,
  Lock,
  Gift,
  Coins,
  CheckCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export function Reader({ novelId, chapterId, onBack, onChangeChapter }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [novelChapters, setNovelChapters] = useState([]);
  const contentRef = useRef(null);

  const { theme, fontSize, fontFamily } = useReader();
  const { user, refreshUser } = useAuth();
  const { onChapterReadFinish, triggerRewardedAd } = useAdConfig();

  // Load chapter content
  const loadChapter = async () => {
    try {
      setLoading(true);
      const res = await api.getChapter(novelId, chapterId);
      if (res.success && res.data) {
        setData(res.data);
        
        // Trigger interstitial ad logic when chapter is completed/loaded
        onChapterReadFinish();

        // Save reading progress to database if user is logged in
        if (user) {
          api.saveProgress({
            novel_id: novelId,
            chapter_id: chapterId,
            chapter_number: res.data.chapter.chapter_number,
            scroll_percent: 0.0,
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load table of contents
  useEffect(() => {
    const loadToc = async () => {
      try {
        const res = await api.getNovelDetail(novelId);
        if (res.success && res.data) {
          setNovelChapters(res.data.chapters);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadToc();
  }, [novelId]);

  useEffect(() => {
    loadChapter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [novelId, chapterId]);

  const handleUnlockWithToken = async () => {
    try {
      await api.unlockChapter(chapterId, 'token');
      await refreshUser();
      await loadChapter();
      alert('🎉 Bab VIP berhasil dibuka!');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleWatchAdToUnlock = () => {
    triggerRewardedAd(async () => {
      try {
        await api.unlockChapter(chapterId, 'token');
        await refreshUser();
        await loadChapter();
        alert('🎉 Selamat! Bab VIP berhasil dibuka setelah menonton iklan!');
      } catch (e) {
        alert(e.message);
      }
    });
  };

  // Theme style classes
  const themeClasses = {
    light: 'bg-white text-gray-900',
    sepia: 'bg-[#fbf0d9] text-[#5f4b32]',
    green: 'bg-[#dceed6] text-[#2d4a2d]',
    dark: 'bg-[#1e293b] text-gray-200',
    amoled: 'bg-black text-gray-300',
  }[theme] || 'bg-[#fbf0d9] text-[#5f4b32]';

  const navThemeClasses = {
    light: 'bg-white/95 border-gray-200 text-gray-800',
    sepia: 'bg-[#f5e7cb]/95 border-[#e4d3b4] text-[#5f4b32]',
    green: 'bg-[#cfe4c8]/95 border-[#b8dab1] text-[#2d4a2d]',
    dark: 'bg-[#0f172a]/95 border-gray-800 text-gray-100',
    amoled: 'bg-black/95 border-gray-900 text-gray-200',
  }[theme] || 'bg-[#f5e7cb]/95 border-[#e4d3b4] text-[#5f4b32]';

  if (loading || !data) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeClasses}`}>
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold mt-3">Memuat bab novel...</span>
      </div>
    );
  }

  const { chapter, novel_title, prev_chapter_id, next_chapter_id, is_locked } = data;

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-300`}>
      {/* Sticky Reader Top Bar */}
      <header className={`sticky top-0 z-30 px-4 py-3 border-b backdrop-blur flex items-center justify-between shadow-xs ${navThemeClasses}`}>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg hover:bg-black/5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="truncate max-w-[120px] sm:max-w-[200px]">{novel_title}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Table of Contents Button */}
          <button
            onClick={() => setIsTocOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5"
            title="Daftar Bab"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Reader Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5"
            title="Pengaturan Tampilan"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Reader Content Body */}
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
        <h1 className="text-xl sm:text-2xl font-black mb-6 text-center leading-snug">
          {chapter.title}
        </h1>

        <div
          ref={contentRef}
          className={`space-y-6 leading-relaxed ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {chapter.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-justify indent-6 tracking-normal">
              {paragraph}
            </p>
          ))}
        </div>

        {/* VIP Locked Chapter Card */}
        {is_locked && (
          <div className="mt-8 p-6 bg-gradient-to-tr from-amber-50 to-orange-50 rounded-3xl border border-orange-200 text-gray-900 text-center shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-gray-900">
              Bab Ini Terkunci (VIP)
            </h3>
            <p className="text-xs text-gray-600 mt-1 mb-4 max-w-sm mx-auto">
              Dukung penulis dan baca kelanjutan cerita seru ini! Anda dapat membuka bab ini secara gratis dengan menonton 1 video iklan singkat.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto">
              <button
                onClick={handleWatchAdToUnlock}
                className="w-full sm:w-auto flex-1 py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-xs rounded-2xl shadow-md active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                <span>Nonton Iklan (Buka Gratis)</span>
              </button>

              {user && user.free_unlock_tokens > 0 && (
                <button
                  onClick={handleUnlockWithToken}
                  className="w-full sm:w-auto flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Gunakan 1 Token ({user.free_unlock_tokens} Tersedia)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mid-Reader Ad Banner */}
        <div className="my-8">
          <AdBanner />
        </div>

        {/* Chapter Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 mt-10 pt-6 border-t border-gray-200/40">
          <button
            onClick={() => prev_chapter_id && onChangeChapter(novelId, prev_chapter_id)}
            disabled={!prev_chapter_id}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
              prev_chapter_id
                ? 'bg-black/5 hover:bg-black/10 border-black/10 active:scale-98'
                : 'opacity-40 cursor-not-allowed border-transparent'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Bab Sebelumnya</span>
          </button>

          <button
            onClick={() => next_chapter_id && onChangeChapter(novelId, next_chapter_id)}
            disabled={!next_chapter_id}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
              next_chapter_id
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white border-transparent shadow-md active:scale-98'
                : 'opacity-40 cursor-not-allowed border-transparent'
            }`}
          >
            <span>Bab Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Table of Contents Drawer */}
      {isTocOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl p-5 flex flex-col text-gray-900 animate-slide-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-500" />
                Daftar Bab Novel
              </h3>
              <button
                onClick={() => setIsTocOpen(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 py-2">
              {novelChapters.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    setIsTocOpen(false);
                    onChangeChapter(novelId, ch.id);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                    ch.id === chapterId
                      ? 'bg-orange-50 text-orange-700 font-bold'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="truncate">
                    Bab {ch.chapter_number}: {ch.title}
                  </span>
                  {ch.is_vip && !ch.is_unlocked && (
                    <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
