import React from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export function PrivacyPolicy({ onBack }) {
  return (
    <div className="pb-24 max-w-md mx-auto sm:max-w-2xl px-4 pt-3">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-black text-gray-900">Kebijakan Privasi</h2>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 text-xs text-gray-700 leading-relaxed">
        <div className="flex items-center gap-2 pb-3 border-b border-amber-100">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <span className="font-extrabold text-sm text-gray-900">
            Kepatuhan Google Play Store & Google AdMob
          </span>
        </div>

        <p><em>Terakhir diperbarui: 19 Agustus 2026</em></p>

        <h4 className="font-bold text-sm text-gray-900 pt-2">1. Pengumpulan & Penggunaan Data</h4>
        <p>
          Aplikasi <strong>Naratika</strong> mengumpulkan data pengguna hanya untuk keperluan
          operasional membaca novel, menyinkronkan progres bookmark antar perangkat, dan penayangan
          iklan yang relevan melalui Google AdMob.
        </p>

        <h4 className="font-bold text-sm text-gray-900 pt-2">2. Google AdMob & Monetisasi</h4>
        <p>
          Kami menggunakan <strong>Google AdMob SDK</strong> untuk menampilkan Banner, Interstitial,
          dan Rewarded Video Ads. Google AdMob dapat menggunakan pengenal iklan (Google Advertising ID)
          sesuai kebijakan privasi Google.
        </p>

        <h4 className="font-bold text-sm text-gray-900 pt-2">3. Keamanan Data</h4>
        <p>
          Kata sandi disimpan dalam bentuk hash enkripsi satu arah. Seluruh komunikasi data
          menggunakan protokol HTTPS aman.
        </p>

        <h4 className="font-bold text-sm text-gray-900 pt-2">4. Kontak Pengembang</h4>
        <p>
          Hubungi kami melalui email: <strong>support@naratika.com</strong>
        </p>
      </div>
    </div>
  );
}
