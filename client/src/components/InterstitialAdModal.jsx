import React, { useState, useEffect } from 'react';
import { X, Play, Volume2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAdConfig } from '../context/AdConfigContext';

export function InterstitialAdModal() {
  const { isInterstitialOpen, closeInterstitial, adConfig } = useAdConfig();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isInterstitialOpen) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isInterstitialOpen]);

  if (!isInterstitialOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 text-white flex flex-col justify-between aspect-[9/16] max-h-[85vh] p-5">
        {/* Top bar with timer & close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-400 border border-amber-400/30">
            <Sparkles className="w-3 h-3" />
            <span>Google AdMob Interstitial</span>
          </div>

          {countdown > 0 ? (
            <div className="text-xs font-bold bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700">
              Tutup dalam {countdown}s
            </div>
          ) : (
            <button
              onClick={closeInterstitial}
              className="flex items-center gap-1 bg-white text-gray-900 hover:bg-gray-200 px-3 py-1 rounded-full text-xs font-bold shadow transition"
            >
              <span>Lanjut Baca</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Ad Body Simulation */}
        <div className="text-center my-auto flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4 animate-pulse">
            <Play className="w-10 h-10 fill-white text-white ml-1" />
          </div>
          <h3 className="text-lg font-black text-white">
            Temukan Cerita Terpopuler
          </h3>
          <p className="text-xs text-gray-400 mt-2 px-4">
            Nikmati ribuan novel bestseller gratis setiap hari hanya di platform resmi Naratika.
          </p>
          <div className="text-[10px] text-gray-500 mt-4 bg-gray-800/80 px-3 py-1 rounded-lg">
            Ad Unit: {adConfig?.interstitial_ad_id}
          </div>
        </div>

        {/* Bottom CTA */}
        <div>
          <button
            onClick={closeInterstitial}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition text-sm"
          >
            {countdown > 0 ? `Menayangkan Iklan (${countdown}s)` : 'Tutup Iklan & Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
