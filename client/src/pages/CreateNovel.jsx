import React, { useState } from 'react';
import { api } from '../services/api';
import { ChevronLeft, Plus, Image, Sparkles } from 'lucide-react';

export function CreateNovel({ onBack, onCreated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Urban & CEO');
  const [tagsInput, setTagsInput] = useState('Billionaire, Romance, Drama');
  const [synopsis, setSynopsis] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Urban & CEO',
    'Romance',
    'Fantasy & Cultivation',
    'Sci-Fi & System',
    'Mystery & Thriller',
    'Action & Martial Arts',
  ];

  const coverPresets = [
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !synopsis.trim()) {
      alert('Judul dan sinopsis wajib diisi!');
      return;
    }

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      setSubmitting(true);
      const res = await api.createNovel({
        title,
        category,
        tags,
        synopsis,
        cover_url: coverUrl || coverPresets[0],
      });

      if (res.success && res.data) {
        alert('🎉 Novel baru berhasil diterbitkan!');
        onCreated(res.data.id);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto sm:max-w-xl px-4 pt-2">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-black text-gray-900">Terbitkan Novel Baru</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Judul Novel *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Sang Pewaris Tahta Tersembunyi"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Genre / Kategori *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Tags (Pisahkan dengan koma)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Billionaire, Action, Reincarnation"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Synopsis */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Sinopsis Cerita *
          </label>
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            rows={4}
            placeholder="Ceritakan gambaran besar alur cerita novel Anda..."
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
          />
        </div>

        {/* Cover Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Pilih Cover atau Masukkan URL Gambar
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {coverPresets.map((preset, idx) => (
              <img
                key={idx}
                src={preset}
                alt="cover preset"
                onClick={() => setCoverUrl(preset)}
                className={`w-full aspect-[3/4] object-cover rounded-xl cursor-pointer border-2 transition ${
                  coverUrl === preset ? 'border-orange-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition mt-4"
        >
          {submitting ? 'Menerbitkan...' : 'Terbitkan Novel Sekarang'}
        </button>
      </form>
    </div>
  );
}
