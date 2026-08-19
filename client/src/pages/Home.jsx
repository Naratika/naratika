import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookCard } from '../components/BookCard';
import { Sparkles, TrendingUp, Award, Flame, ChevronRight, BookOpen } from 'lucide-react';
import { AdBanner } from '../components/AdBanner';

export function Home({ onNavigate, onSelectNovel }) {
  const [novels, setNovels] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.getNovels({
          category: activeCategory !== 'Semua' ? activeCategory : undefined,
          sort: 'trending',
        });
        if (res.success && res.data) {
          setNovels(res.data.novels);
          setFeatured(res.data.featured);
          setCategories(['Semua', ...res.data.categories]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeCategory]);

  return (
    <div className="pb-24 max-w-md mx-auto sm:max-w-2xl px-4 pt-3">
      {/* Hero Banner Naratika Style */}
      {featured.length > 0 && (
        <div 
          onClick={() => onSelectNovel(featured[0].id)}
          className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-tr from-gray-950 via-gray-900 to-orange-950 cursor-pointer border border-orange-500/20 group"
        >
          <div className="relative p-5 sm:p-6 flex items-center justify-between gap-4 z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-md mb-2">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>NOVEL TERPOPULER</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight group-hover:text-orange-400 transition">
                {featured[0].title}
              </h2>
              <p className="text-xs text-gray-300 line-clamp-2 mt-1.5 leading-relaxed">
                {featured[0].synopsis}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs font-semibold text-amber-400">
                <span>{featured[0].author_name}</span>
                <span>•</span>
                <span>{featured[0].category}</span>
                <span>•</span>
                <span>⭐ {featured[0].rating.toFixed(1)}</span>
              </div>
            </div>

            <img
              src={featured[0].cover_url}
              alt={featured[0].title}
              className="w-24 sm:w-28 aspect-[3/4] object-cover rounded-2xl shadow-2xl border-2 border-white/20 flex-shrink-0 group-hover:scale-105 transition duration-500"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-transparent to-amber-500/10" />
        </div>
      )}

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/25 scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Top Banner Ad Slot */}
      <AdBanner />

      {/* Pilihan Editor / Rekomendasi Hari Ini */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Rekomendasi Terbaik
          </h3>
          <button
            onClick={() => onNavigate('discover')}
            className="text-xs font-bold text-orange-600 flex items-center gap-0.5 hover:underline"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/5] bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {novels.slice(0, 6).map((novel) => (
              <BookCard key={novel.id} novel={novel} onClick={onSelectNovel} />
            ))}
          </div>
        )}
      </div>

      {/* Paling Banyak Dibaca (Trending List) */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Paling Banyak Dibaca
          </h3>
        </div>

        <div className="flex flex-col gap-2.5">
          {novels.slice(0, 4).map((novel) => (
            <BookCard key={novel.id} novel={novel} onClick={onSelectNovel} compact={true} />
          ))}
        </div>
      </div>
    </div>
  );
}
