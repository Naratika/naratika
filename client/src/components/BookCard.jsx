import React from 'react';
import { Star, Eye, BookOpen } from 'lucide-react';

export function BookCard({ novel, onClick, compact = false }) {
  if (compact) {
    return (
      <div
        onClick={() => onClick(novel.id)}
        className="flex gap-3 bg-white p-2.5 rounded-2xl border border-gray-100 hover:shadow-md transition cursor-pointer group"
      >
        <img
          src={novel.cover_url}
          alt={novel.title}
          className="w-16 h-22 object-cover rounded-xl shadow-sm flex-shrink-0 group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
          <div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block mb-1">
              {novel.category}
            </span>
            <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-orange-600 transition">
              {novel.title}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-tight">
              {novel.synopsis}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1 font-medium">
            <span>{novel.author_name}</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{novel.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(novel.id)}
      className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={novel.cover_url}
          alt={novel.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {novel.is_featured && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
            UNGGULAN
          </span>
        )}

        <div className="absolute bottom-2 left-2 right-2 text-white">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{novel.rating.toFixed(1)}</span>
            <span className="text-white/60">•</span>
            <Eye className="w-3.5 h-3.5 text-white/80" />
            <span>{(novel.views / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col justify-between flex-1">
        <div>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block mb-1">
            {novel.category}
          </span>
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition">
            {novel.title}
          </h3>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-50">
          <span className="truncate max-w-[100px]">{novel.author_name}</span>
          <span className="text-gray-400 font-medium">{novel.total_chapters} Bab</span>
        </div>
      </div>
    </div>
  );
}
