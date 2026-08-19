import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { admobService } from '../services/admobService';

const AdConfigContext = createContext(null);

export function AdConfigProvider({ children }) {
  const [adConfig, setAdConfig] = useState({
    admob_app_id: 'ca-app-pub-3940256099942544~3347511713',
    banner_ad_id: 'ca-app-pub-3940256099942544/6300978111',
    interstitial_ad_id: 'ca-app-pub-3940256099942544/1033173712',
    rewarded_ad_id: 'ca-app-pub-3940256099942544/5224354917',
    interstitial_frequency: 3,
    reward_tokens_per_ad: 1,
    ads_enabled: true,
  });

  const [isInterstitialOpen, setIsInterstitialOpen] = useState(false);
  const [rewardedAdModal, setRewardedAdModal] = useState({ isOpen: false, onReward: null });

  const fetchAdConfig = async () => {
    try {
      const res = await api.getAdConfig();
      if (res.success && res.data) {
        setAdConfig(res.data);
        admobService.initialize(res.data);
      }
    } catch (err) {
      console.warn('Failed to load ad config from backend:', err);
    }
  };

  useEffect(() => {
    fetchAdConfig();

    admobService.setCallbacks({
      onShowInterstitial: () => setIsInterstitialOpen(true),
      onShowRewarded: (onReward) => setRewardedAdModal({ isOpen: true, onReward }),
    });
  }, []);

  const closeInterstitial = () => setIsInterstitialOpen(false);

  const closeRewardedAd = () => setRewardedAdModal({ isOpen: false, onReward: null });

  const onChapterReadFinish = () => {
    admobService.onChapterFinished(adConfig);
  };

  const triggerRewardedAd = (onRewardGranted) => {
    admobService.showRewardedAd(adConfig, onRewardGranted);
  };

  const updateConfig = async (newConfig) => {
    const res = await api.updateAdConfig(newConfig);
    if (res.success && res.data) {
      setAdConfig(res.data);
    }
    return res;
  };

  return (
    <AdConfigContext.Provider
      value={{
        adConfig,
        refreshAdConfig: fetchAdConfig,
        updateConfig,
        isInterstitialOpen,
        closeInterstitial,
        rewardedAdModal,
        closeRewardedAd,
        onChapterReadFinish,
        triggerRewardedAd,
      }}
    >
      {children}
    </AdConfigContext.Provider>
  );
}

export const useAdConfig = () => useContext(AdConfigContext);
