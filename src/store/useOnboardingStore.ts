import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingStore {
    hasSeenOnboarding: boolean;
    markSeen: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
    persist(
        (set) => ({
            hasSeenOnboarding: false,
            markSeen: () => set({ hasSeenOnboarding: true }),
        }),
        {
            name: 'onboarding-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
