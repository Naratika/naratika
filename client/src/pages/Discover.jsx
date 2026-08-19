import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookCard } from '../components/BookCard';
import { Search, Filter, Flame, Star, Clock } from 'lucide-react';
import { AdBanner } from '../components/AdBanner';

export function Discover({ onSelectNovel }) {
  const [novels, setNovels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [loading, setLoading] = useState(false);

  const fetchNovels = async () => {
    try {
      setLoading(true);
      const res = await api.getNovels({
        category: selectedCategory !== 'Semua' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        sort: sortBy,
      });
      if (res.success && res.data) {
        setNovels(res.data.novels);
        setCategories(['Semua', ...res.data.categories]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovels();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNovels();
  };

  return (
    <div className="pb-24 max-w-md mx-auto sm:max-w-2xl px-4 pt-3">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari judul novel, nama penulis, atau genre..."
          className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setSortBy('trending')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            sortBy === 'trending'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Trending</span>
        </button>

        <button
          onClick={() => setSortBy('top')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            sortBy === 'top'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Rating Tertinggi</span>
        </button>

        <button
          onClick={() => setSortBy('new')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            sortBy === 'new'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Terbaru</span>
        </button>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-none no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-orange-100 text-orange-700 font-bold border border-orange-300'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AdBanner />

      {/* Novel Results Grid */}
      <div className="mt-3">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/5] bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : novels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-6">
            <p className="text-sm font-bold text-gray-600">Tidak ada novel yang ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">Coba gunakan kata kunci pencarian atau kategori lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {novels.map((novel) => (
              <BookCard key={novel.id} novel={novel} onClick={onSelectNovel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
