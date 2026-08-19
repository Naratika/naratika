import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bookmark, BookOpen, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { AdBanner } from '../components/AdBanner';

export function Library({ onSelectNovel, onReadChapter, onNavigate }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const loadLib = async () => {
      try {
        setLoading(true);
        const res = await api.getLibrary();
        if (res.success && res.data) {
          setBookmarks(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLib();
  }, [user]);

  if (!user) {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-gray-900">Rak Buku Anda Masih Kosong</h3>
        <p className="text-xs text-gray-500 mt-1 mb-5">Masuk untuk menyinkronkan riwayat bacaan dan novel favorit Anda.</p>
        <button
          onClick={() => onNavigate('profile')}
          className="py-3 px-6 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition"
        >
          Masuk / Daftar Akun
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-md mx-auto sm:max-w-2xl px-4 pt-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-orange-500 fill-orange-500" />
          Rak Buku Saya
        </h2>
        <span className="text-xs font-bold text-gray-400">
          {bookmarks.length} Novel
        </span>
      </div>

      <AdBanner />

      {loading ? (
        <div className="flex flex-col gap-3 mt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-6 mt-3">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700">Belum ada novel di rak buku</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Mulai jelajahi ribuan novel menarik dan simpan ke sini!</p>
          <button
            onClick={() => onNavigate('discover')}
            className="py-2.5 px-5 bg-orange-50 text-orange-600 font-bold text-xs rounded-xl border border-orange-200 hover:bg-orange-100 transition"
          >
            Jelajahi Novel
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-3">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition"
            >
              <img
                src={bm.novel_cover}
                alt={bm.novel_title}
                onClick={() => onSelectNovel(bm.novel_id)}
                className="w-16 h-22 object-cover rounded-xl shadow-xs cursor-pointer flex-shrink-0"
              />

              <div className="flex-1 min-w-0 py-0.5">
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block mb-1">
                  {bm.novel_category}
                </span>
                <h4 
                  onClick={() => onSelectNovel(bm.novel_id)}
                  className="font-bold text-sm text-gray-900 truncate cursor-pointer hover:text-orange-600 transition"
                >
                  {bm.novel_title}
                </h4>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Bab {bm.last_chapter_number || 1} / {bm.total_chapters}</span>
                </p>
              </div>

              <button
                onClick={() => onReadChapter(bm.novel_id, bm.last_chapter_id || `${bm.novel_id}-ch-1`)}
                className="py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition flex-shrink-0"
              >
                <span>Baca</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
