import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAdConfig } from '../context/AdConfigContext';
import { ShieldAlert, Settings, Save, CheckCircle, RefreshCw, BarChart2, Radio, Play } from 'lucide-react';

export function AdminDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { adConfig, refreshAdConfig } = useAdConfig();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [appId, setAppId] = useState('');
  const [bannerId, setBannerId] = useState('');
  const [interstitialId, setInterstitialId] = useState('');
  const [rewardedId, setRewardedId] = useState('');
  const [frequency, setFrequency] = useState(3);
  const [rewardTokens, setRewardTokens] = useState(1);
  const [adsEnabled, setAdsEnabled] = useState(true);

  useEffect(() => {
    if (adConfig) {
      setAppId(adConfig.admob_app_id || '');
      setBannerId(adConfig.banner_ad_id || '');
      setInterstitialId(adConfig.interstitial_ad_id || '');
      setRewardedId(adConfig.rewarded_ad_id || '');
      setFrequency(adConfig.interstitial_frequency || 3);
      setRewardTokens(adConfig.reward_tokens_per_ad || 1);
      setAdsEnabled(adConfig.ads_enabled);
    }
  }, [adConfig]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
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
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const handleSaveAdConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateAdConfig({
        admob_app_id: appId,
        banner_ad_id: bannerId,
        interstitial_ad_id: interstitialId,
        rewarded_ad_id: rewardedId,
        interstitial_frequency: parseInt(frequency),
        reward_tokens_per_ad: parseInt(rewardTokens),
        ads_enabled: adsEnabled,
      });

      if (res.success) {
        await refreshAdConfig();
        alert('✅ Pengaturan Google AdMob berhasil disimpan secara Real-Time!');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="pb-24 max-w-md mx-auto px-4 pt-12 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-gray-900">Akses Ditolak</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">Halaman ini hanya dapat diakses oleh akun Administrator.</p>
        <button
          onClick={() => onNavigate('profile')}
          className="py-2.5 px-5 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md"
        >
          Beralih ke Akun Admin Demo
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-md mx-auto sm:max-w-2xl px-4 pt-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            Pusat Kontrol Google AdMob
          </h2>
          <p className="text-xs text-gray-500">Ubah ID Iklan Google AdMob secara live tanpa upload ulang APK</p>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Pengguna</span>
            <span className="text-sm font-black text-gray-900">{stats.total_users}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Penulis</span>
            <span className="text-sm font-black text-gray-900">{stats.total_authors}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Novel</span>
            <span className="text-sm font-black text-gray-900">{stats.total_novels}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Baca</span>
            <span className="text-sm font-black text-gray-900">{(stats.total_reads / 1000).toFixed(1)}k</span>
          </div>
        </div>
      )}

      {/* AdMob Settings Form */}
      <form onSubmit={handleSaveAdConfig} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-500" />
            Pengaturan Unit Iklan AdMob
          </h3>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-gray-700">Status Iklan</span>
            <input
              type="checkbox"
              checked={adsEnabled}
              onChange={(e) => setAdsEnabled(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Google AdMob App ID
          </label>
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Banner Ad Unit ID
          </label>
          <input
            type="text"
            value={bannerId}
            onChange={(e) => setBannerId(e.target.value)}
            placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Interstitial Ad Unit ID (Iklan Transisi Tiap Bab)
          </label>
          <input
            type="text"
            value={interstitialId}
            onChange={(e) => setInterstitialId(e.target.value)}
            placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Rewarded Video Ad Unit ID (Buka Bab VIP)
          </label>
          <input
            type="text"
            value={rewardedId}
            onChange={(e) => setRewardedId(e.target.value)}
            placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Frekuensi Interstitial
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 focus:bg-white"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">Bab sekali</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Hadiah Rewarded Ad
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="5"
                value={rewardTokens}
                onChange={(e) => setRewardTokens(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 focus:bg-white"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">Token/Iklan</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2 mt-4"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan AdMob Live'}</span>
        </button>
      </form>
    </div>
  );
}
