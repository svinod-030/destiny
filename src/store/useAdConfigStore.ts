import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdConfigStore {
    adsEnabled: boolean;
    setAdsEnabled: (enabled: boolean) => void;
    sdkReady: boolean;
    setSdkReady: (ready: boolean) => void;
}

// Persists the last-known value of the remote adsEnabled flag so banners
// show/hide instantly (and correctly offline) on relaunch, instead of
// flashing while the Firestore subscription in App.tsx reconnects.
export const useAdConfigStore = create<AdConfigStore>()(
    persist(
        (set) => ({
            adsEnabled: false,
            setAdsEnabled: (enabled) => set({ adsEnabled: enabled }),
            sdkReady: false,
            setSdkReady: (ready) => set({ sdkReady: ready }),
        }),
        {
            name: 'ad-config-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ adsEnabled: state.adsEnabled }),
        }
    )
);
