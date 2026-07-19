import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Journey } from '../types/journey';

export type JourneyRole = 'creator' | 'member';

interface JourneyStore {
    journeyId: string | null;
    role: JourneyRole | null;
    journey: Journey | null;
    setActiveJourney: (journeyId: string, role: JourneyRole) => void;
    setJourney: (journey: Journey | null) => void;
    clear: () => void;
}

export const useJourneyStore = create<JourneyStore>()(
    persist(
        (set) => ({
            journeyId: null,
            role: null,
            journey: null,
            setActiveJourney: (journeyId, role) => set({ journeyId, role }),
            setJourney: (journey) => set({ journey }),
            clear: () => set({ journeyId: null, role: null, journey: null }),
        }),
        {
            name: 'journey-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Only the code + role are worth surviving a relaunch — the live `journey`
            // snapshot is re-fetched from Firestore once the subscription reattaches.
            partialize: (state) => ({ journeyId: state.journeyId, role: state.role }),
        }
    )
);
