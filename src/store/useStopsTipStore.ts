import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StopsTipStore {
    hasSeenStopsTip: boolean;
    markSeen: () => void;
}

export const useStopsTipStore = create<StopsTipStore>()(
    persist(
        (set) => ({
            hasSeenStopsTip: false,
            markSeen: () => set({ hasSeenStopsTip: true }),
        }),
        {
            name: 'stops-tip-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
