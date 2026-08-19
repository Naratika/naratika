import React, { useState } from 'react';
import { api } from '../services/api';
import { ChevronLeft, Lock, Unlock, Feather, Sparkles } from 'lucide-react';

export function ChapterEditor({ novelId, onBack, onSaved }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Judul bab dan isi konten wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createChapter(novelId, {
        title,
        content,
        is_vip: isVip,
      });

      if (res.success && res.data) {
        alert('🎉 Bab baru berhasil diterbitkan!');
        onSaved();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto sm:max-w-2xl px-4 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-black text-gray-900">Tulis Bab Baru</h2>
        </div>

        <div className="text-xs font-bold text-gray-400">
          {wordCount} Kata
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        {/* Chapter Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Judul Bab *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Bab 4: Rahasia yang Terungkap"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* VIP Lock Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              {isVip ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Kunci Sebagai Bab VIP</h4>
              <p className="text-[11px] text-gray-500">Pembaca harus menonton video iklan AdMob atau koin untuk membuka</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isVip}
              onChange={(e) => setIsVip(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {/* Content Body */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Isi Cerita Bab *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Mulai menulis cerita Anda di sini... Gunakan spasi dua kali untuk paragraf baru."
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed font-serif"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2"
        >
          <Feather className="w-4 h-4" />
          <span>{submitting ? 'Menerbitkan Bab...' : 'Terbitkan Bab Sekarang'}</span>
        </button>
      </form>
    </div>
  );
}
