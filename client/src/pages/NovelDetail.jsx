import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Star, Eye, Bookmark, BookOpen, Lock, Unlock, ChevronLeft, Share2, Sparkles, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdConfig } from '../context/AdConfigContext';
import { AdBanner } from '../components/AdBanner';

export function NovelDetail({ novelId, onBack, onReadChapter }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const { user } = useAuth();
  const { triggerRewardedAd } = useAdConfig();

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await api.getNovelDetail(novelId);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [novelId]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      alert('Silakan masuk terlebih dahulu untuk menyimpan novel ke Rak Buku.');
      return;
    }
    try {
      setIsBookmarking(true);
      const res = await api.toggleBookmark(novelId);
      if (res.success) {
        setData((prev) => ({ ...prev, is_bookmarked: res.data }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleUnlockVip = (chapterId) => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk membuka bab VIP.');
      return;
    }

    triggerRewardedAd(async () => {
      try {
        await api.unlockChapter(chapterId, 'token');
        await loadDetail();
        alert('🎉 Bab VIP berhasil dibuka!');
      } catch (e) {
        alert(e.message);
      }
    });
  };

  if (loading || !data) {
    return (
      <div className="p-4 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-500 mt-3">Memuat detail novel...</span>
      </div>
    );
  }

  const { novel, chapters, is_bookmarked, last_read_chapter_id } = data;
  const firstChapterId = last_read_chapter_id || (chapters.length > 0 ? chapters[0].id : null);

  return (
    <div className="pb-28 max-w-md mx-auto sm:max-w-2xl px-4 pt-2">
      {/* Top navigation back button */}
      <div className="flex items-center justify-between py-2 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-xs hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: novel.title, url: window.location.href });
            } else {
              alert('Tautan disalin ke clipboard!');
            }
          }}
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Book Hero Card */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        <img
          src={novel.cover_url}
          alt={novel.title}
          className="w-32 sm:w-36 aspect-[3/4] object-cover rounded-2xl shadow-lg border border-gray-100 flex-shrink-0"
        />

        <div className="flex-1 text-center sm:text-left">
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md inline-block mb-1">
            {novel.category}
          </span>
          <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
            {novel.title}
          </h1>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Penulis: <span className="text-gray-800 font-bold">{novel.author_name}</span>
          </p>

          {/* Stats Badges */}
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 py-2 px-3 bg-gray-50 rounded-2xl text-xs">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{novel.rating.toFixed(1)}</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center gap-1 text-gray-600 font-semibold">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span>{(novel.views / 1000).toFixed(1)}k Baca</span>
            </div>
            <div className="text-gray-300">|</div>
            <span className="text-emerald-600 font-bold">{novel.status === 'ongoing' ? 'Ongoing' : 'Tamat'}</span>
          </div>
        </div>
      </div>

      {/* Synopsis Accordion */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mt-3">
        <h3 className="font-extrabold text-sm text-gray-900 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-orange-500" />
          Sinopsis
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
          {novel.synopsis}
        </p>

        {novel.tags && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
            {novel.tags.map((t, idx) => (
              <span key={idx} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <AdBanner />

      {/* Chapters List Table of Contents */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mt-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-sm text-gray-900">
            Daftar Bab ({chapters.length} Bab)
          </h3>
          <span className="text-[11px] text-gray-400 font-medium">Lengkap</span>
        </div>

        <div className="divide-y divide-gray-100">
          {chapters.map((ch) => (
            <div
              key={ch.id}
              className="py-3 flex items-center justify-between hover:bg-gray-50/80 px-2 rounded-xl transition cursor-pointer group"
              onClick={() => {
                if (ch.is_unlocked) {
                  onReadChapter(novel.id, ch.id);
                } else {
                  handleUnlockVip(ch.id);
                }
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs font-bold text-gray-400 w-6">
                  {ch.chapter_number}
                </span>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-orange-600 truncate">
                  {ch.title}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {ch.is_vip ? (
                  ch.is_unlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Unlock className="w-3 h-3" />
                      Terbuka
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlockVip(ch.id);
                      }}
                      className="flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-full transition shadow-xs"
                    >
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>Nonton Iklan</span>
                    </button>
                  )
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Gratis
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 p-3 max-w-md mx-auto sm:max-w-2xl flex items-center gap-3">
        <button
          onClick={handleBookmarkToggle}
          disabled={isBookmarking}
          className={`flex-1 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition border ${
            is_bookmarked
              ? 'bg-orange-50 text-orange-600 border-orange-200'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${is_bookmarked ? 'fill-orange-600' : ''}`} />
          <span>{is_bookmarked ? 'Di Rak Buku' : '+ Rak Buku'}</span>
        </button>

        {firstChapterId && (
          <button
            onClick={() => onReadChapter(novel.id, firstChapterId)}
            className="flex-2 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>{last_read_chapter_id ? 'Lanjutkan Membaca' : 'Mulai Membaca Sekarang'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
