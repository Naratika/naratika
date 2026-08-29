import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdConfig } from '../context/AdConfigContext';
import { User, Key, Coins, Gift, ShieldCheck, LogOut, FileText, Sparkles, CheckCircle, Smartphone } from 'lucide-react';

export function Profile({ onNavigate }) {
  const { user, login, register, logout } = useAuth();
  const { triggerRewardedAd } = useAdConfig();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('reader');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginMode) {
        await login(username || email, password);
      } else {
        await register({
          username,
          email,
          password,
          display_name: displayName || username,
          role,
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUsername, demoPass) => {
    try {
      setLoading(true);
      await login(demoUsername, demoPass);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchAdBonus = () => {
    triggerRewardedAd(() => {
      alert('🎉 Selamat! Anda telah mendapatkan bonus 1 Token VIP gratis setelah menonton video iklan!');
    });
  };

  return (
    <div className="pb-28 max-w-md mx-auto sm:max-w-xl px-4 pt-3">
      {user ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-gray-900 truncate">
                  {user.display_name}
                </h3>
                <span className="text-[10px] font-extrabold uppercase bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-4 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-xs text-white/80 font-bold uppercase tracking-wider">Token Bab VIP</span>
                <div className="flex items-center gap-2 mt-1">
                  <Key className="w-6 h-6 fill-white text-white" />
                  <span className="text-2xl font-black">{user.free_unlock_tokens}</span>
                </div>
              </div>
              <p className="text-[10px] text-white/80 mt-2">Bisa digunakan membuka bab VIP gratis</p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-4 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Koin Pembaca</span>
                <div className="flex items-center gap-2 mt-1">
                  <Coins className="w-6 h-6 text-amber-400 fill-amber-400" />
                  <span className="text-2xl font-black">{user.coins}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Koin loyalty reward pembaca</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900">Dapatkan Token VIP Gratis</h4>
                <p className="text-[11px] text-gray-500">Tonton video iklan singkat untuk klaim token</p>
              </div>
            </div>

            <button
              onClick={handleWatchAdBonus}
              className="py-2 px-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition flex-shrink-0"
            >
              Tonton Iklan
            </button>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
            <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2.5">
              Beralih Akun Demo Cepat
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-bold text-gray-700 transition"
              >
                👑 Admin
              </button>
              <button
                onClick={() => handleQuickLogin('penulis_hebat', 'author123')}
                className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-bold text-gray-700 transition"
              >
                ✍️ Penulis
              </button>
              <button
                onClick={() => handleQuickLogin('nona_romansa', 'author123')}
                className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-bold text-gray-700 transition"
              >
                📖 Penulis 2
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-3 border border-gray-100 shadow-sm divide-y divide-gray-100 text-xs font-semibold">
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="w-full py-3 px-3 flex items-center justify-between text-orange-700 hover:bg-orange-50 rounded-2xl transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  <span>Panel Admin & Pengaturan AdMob</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('privacy-policy')}
              className="w-full py-3 px-3 flex items-center justify-between text-gray-700 hover:text-orange-600"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>Kebijakan Privasi (Google Play Store Compliant)</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              onClick={logout}
              className="w-full py-3 px-3 flex items-center justify-between text-red-600 hover:bg-red-50 rounded-2xl transition"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
              <User className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-gray-900">
              {isLoginMode ? 'Masuk ke Naratika' : 'Daftar Akun Baru'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isLoginMode
                ? 'Nikmati sinkronisasi rak buku dan token VIP gratis'
                : 'Bergabunglah sebagai Pembaca atau Penulis Novel'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Username {isLoginMode ? 'atau Email' : ''}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            {!isLoginMode && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nama pena atau nama Anda"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tipe Akun
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('reader')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        role === 'reader'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      📖 Pembaca
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('author')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        role === 'author'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      ✍️ Penulis
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition mt-2"
            >
              {loading ? 'Memproses...' : isLoginMode ? 'Masuk Sekarang' : 'Daftar Akun Baru'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-xs text-orange-600 font-bold hover:underline"
            >
              {isLoginMode ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 block text-center uppercase tracking-wider mb-2">
              Atau Masuk Cepat Sebagai:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="py-2 bg-gray-100 hover:bg-orange-100 text-xs font-bold text-gray-700 rounded-xl transition"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('penulis_hebat', 'author123')}
                className="py-2 bg-gray-100 hover:bg-orange-100 text-xs font-bold text-gray-700 rounded-xl transition"
              >
                ✍️ Penulis
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('nona_romansa', 'author123')}
                className="py-2 bg-gray-100 hover:bg-orange-100 text-xs font-bold text-gray-700 rounded-xl transition"
              >
                📖 Penulis 2
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}