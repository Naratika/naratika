/**
 * Google AdMob Bridge & Simulator Service
 * Handles Banner, Interstitial, and Rewarded Video Ads across Android Native (Capacitor) and Web Simulator.
 */

class AdMobService {
  constructor() {
    this.isNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();
    this.chaptersReadCount = 0;
    this.interstitialTriggerCallback = null;
    this.rewardedAdTriggerCallback = null;
  }

  setCallbacks({ onShowInterstitial, onShowRewarded }) {
    this.interstitialTriggerCallback = onShowInterstitial;
    this.rewardedAdTriggerCallback = onShowRewarded;
  }

  async initialize(adConfig) {
    if (this.isNative) {
      try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.initialize({
          requestTrackingAuthorization: true,
          testingDevices: ['EMULATOR'],
          initializeForTesting: true,
        });
        console.log('Native AdMob initialized successfully');
      } catch (err) {
        console.warn('Native AdMob init failed, fallback to simulator:', err);
      }
    }
  }

  // Increment read counter and check if interstitial ad should fire
  onChapterFinished(adConfig) {
    if (!adConfig || !adConfig.ads_enabled) return;
    this.chaptersReadCount++;
    const freq = adConfig.interstitial_frequency || 3;
    
    if (this.chaptersReadCount >= freq) {
      this.chaptersReadCount = 0;
      this.showInterstitial(adConfig);
    }
  }

  showInterstitial(adConfig) {
    if (this.isNative) {
      // Native AdMob Interstitial
      import('@capacitor-community/admob').then(async ({ AdMob }) => {
        try {
          await AdMob.prepareInterstitial({
            adId: adConfig.interstitial_ad_id || 'ca-app-pub-3940256099942544/1033173712',
          });
          await AdMob.showInterstitial();
        } catch (e) {
          console.warn('Native interstitial error, triggering simulator', e);
          if (this.interstitialTriggerCallback) this.interstitialTriggerCallback();
        }
      });
    } else {
      // Trigger Web Interstitial Simulator modal
      if (this.interstitialTriggerCallback) {
        this.interstitialTriggerCallback();
      }
    }
  }

  showRewardedAd(adConfig, onRewardGranted) {
    if (this.isNative) {
      // Native AdMob Rewarded
      import('@capacitor-community/admob').then(async ({ AdMob, RewardAdEvents }) => {
        try {
          await AdMob.prepareRewardVideoAd({
            adId: adConfig.rewarded_ad_id || 'ca-app-pub-3940256099942544/5224354917',
          });
          
          AdMob.addListener(RewardAdEvents.Rewarded, (reward) => {
            if (onRewardGranted) onRewardGranted(reward);
          });

          await AdMob.showRewardVideoAd();
        } catch (e) {
          console.warn('Native rewarded ad error, triggering simulator', e);
          if (this.rewardedAdTriggerCallback) this.rewardedAdTriggerCallback(onRewardGranted);
        }
      });
    } else {
      // Trigger Web Rewarded Ad Video Simulator modal
      if (this.rewardedAdTriggerCallback) {
        this.rewardedAdTriggerCallback(onRewardGranted);
      }
    }
  }
}

export const admobService = new AdMobService();
