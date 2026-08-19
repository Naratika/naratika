import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Feather, Plus, BookOpen, Eye, DollarSign, ChevronRight, BarChart3 } from 'lucide-react';
import { AdBanner } from '../components/AdBanner';

export function AuthorStudio({ onNavigate, onEditNovel, onAddChapter }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getAuthorDashboard();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4">
          <Feather className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-gray-900">Studio Penulis Naratika</h3>
        <p className="text-xs text-gray-500 mt-1 mb-5">
          Masuk atau daftar sebagai Penulis untuk menerbitkan novel dan mendapatkan royalti dari tayangan iklan!
        </p>
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
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Feather className="w-5 h-5 text-orange-500" />
            Studio Penulis
          </h2>
          <p className="text-xs text-gray-500">Kelola novel, bab, dan pantau penghasilan iklan Anda</p>
        </div>

        <button
          onClick={() => onNavigate('create-novel')}
          className="py-2 px-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Karya</span>
        </button>
      </div>

      {/* Analytics Summary Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-center">
            <BookOpen className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Karya</span>
            <span className="text-base font-black text-gray-900">{stats.total_novels}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-center">
            <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Pembaca</span>
            <span className="text-base font-black text-gray-900">{(stats.total_views / 1000).toFixed(1)}k</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-center">
            <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Bagi Hasil AdMob</span>
            <span className="text-base font-black text-emerald-600">${(stats.estimated_ad_earnings_cents / 100).toFixed(2)}</span>
          </div>
        </div>
      )}

      <AdBanner />

      {/* Novels List */}
      <div className="mt-4">
        <h3 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          Daftar Karya Anda
        </h3>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : stats?.novels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-6">
            <Feather className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">Anda belum menerbitkan novel</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Tulis cerita pertama Anda dan raih jutaan pembaca!</p>
            <button
              onClick={() => onNavigate('create-novel')}
              className="py-2.5 px-5 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Mulai Menulis
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {stats?.novels.map((novel) => (
              <div
                key={novel.id}
                className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between gap-3"
              >
                <div className="flex gap-3">
                  <img
                    src={novel.cover_url}
                    alt={novel.title}
                    className="w-16 h-22 object-cover rounded-xl shadow-xs flex-shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block mb-1">
                      {novel.category}
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{novel.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {novel.total_chapters} Bab • {novel.views} Pembaca • ⭐ {novel.rating.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 justify-end">
                  <button
                    onClick={() => onAddChapter(novel.id)}
                    className="py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl border border-orange-200 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tulis Bab Baru</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
