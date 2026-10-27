import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeatureFlagsStore {
    directionsEnabled: boolean;
    setDirectionsEnabled: (enabled: boolean) => void;
}

// Last-known values of the remote feature flags (config/features in Firestore, synced
// from App.tsx), persisted so a feature shows/hides correctly on relaunch - including
// offline - instead of flashing while the subscription reconnects. Same idea as
// useAdConfigStore, for flags that aren't about ads.
export const useFeatureFlagsStore = create<FeatureFlagsStore>()(
    persist(
        (set) => ({
            directionsEnabled: false,
            setDirectionsEnabled: (enabled) => set({ directionsEnabled: enabled }),
        }),
        {
            name: 'feature-flags-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
