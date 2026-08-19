import React from 'react';
import { useAdConfig } from '../context/AdConfigContext';
import { Sparkles } from 'lucide-react';

export function AdBanner({ placement = 'sticky-bottom' }) {
  const { adConfig } = useAdConfig();

  if (!adConfig || !adConfig.ads_enabled) return null;

  return (
    <div className="w-full max-w-md mx-auto my-2 px-2 select-none">
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-3 rounded-2xl shadow-md border border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 text-white shadow">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="bg-amber-400 text-gray-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase">
                AdMob
              </span>
              <h5 className="font-bold text-xs text-gray-100 truncate">
                Google AdMob Banner Slot
              </h5>
            </div>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              Unit: {adConfig.banner_ad_id}
            </p>
          </div>
        </div>

        <span className="text-[10px] text-orange-400 font-bold border border-orange-400/40 rounded-lg px-2 py-1 flex-shrink-0">
          Install App
        </span>
      </div>
    </div>
  );
}
