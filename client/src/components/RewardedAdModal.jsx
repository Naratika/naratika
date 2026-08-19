import React, { useState, useEffect } from 'react';
import { X, Play, Gift, CheckCircle, Sparkles } from 'lucide-react';
import { useAdConfig } from '../context/AdConfigContext';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function RewardedAdModal() {
  const { rewardedAdModal, closeRewardedAd, adConfig } = useAdConfig();
  const { refreshUser } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [completed, setCompleted] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (rewardedAdModal.isOpen) {
      setCountdown(5);
      setCompleted(false);
      setClaiming(false);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [rewardedAdModal.isOpen]);

  if (!rewardedAdModal.isOpen) return null;

  const handleClaimReward = async () => {
    setClaiming(true);
    try {
      await api.claimAdReward();
      await refreshUser();
      if (rewardedAdModal.onReward) {
        rewardedAdModal.onReward();
      }
      closeRewardedAd();
    } catch (err) {
      console.error(err);
      closeRewardedAd();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 text-white flex flex-col justify-between aspect-[9/16] max-h-[85vh] p-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
            <Gift className="w-3.5 h-3.5" />
            <span>Rewarded Video Ad</span>
          </div>

          <div className="text-xs font-bold text-gray-400">
            {countdown > 0 ? `Hadiah dalam ${countdown}s` : 'Selesai!'}
          </div>
        </div>

        {/* Video Simulation Canvas */}
        <div className="my-auto flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30 mb-4 animate-bounce">
            {completed ? (
              <CheckCircle className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 fill-white text-white ml-1" />
            )}
          </div>

          <h3 className="text-lg font-black text-white">
            {completed ? '🎉 Selamat! Hadiah Siap Diklaim' : 'Tonton Video Sampai Selesai'}
          </h3>
          <p className="text-xs text-gray-400 mt-2 px-4">
            {completed
              ? 'Anda mendapatkan 1 Token Gratis untuk membuka bab novel VIP terkunci!'
              : 'Dapatkan token gratis pembuka bab VIP setelah video iklan selesai ditonton.'}
          </p>

          <div className="text-[10px] text-gray-500 mt-4 bg-gray-800/80 px-3 py-1 rounded-lg">
            Unit: {adConfig?.rewarded_ad_id}
          </div>
        </div>

        {/* Bottom Actions */}
        <div>
          {completed ? (
            <button
              onClick={handleClaimReward}
              disabled={claiming}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-98 transition text-sm flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>{claiming ? 'Mengklaim Hadiah...' : 'Klaim Token & Buka Bab VIP'}</span>
            </button>
          ) : (
            <div className="w-full py-3.5 bg-gray-800 text-gray-400 font-bold rounded-2xl text-center text-xs">
              Menonton Video Iklan ({countdown}s)...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
