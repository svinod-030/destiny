import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JourneyRole } from './useJourneyStore';

export interface JourneyHistoryEntry {
    id: string;
    destinationName: string;
    role: JourneyRole;
    status: 'active' | 'ended';
    startedAt: string;
    endedAt?: string;
}

interface JourneyHistoryStore {
    entries: JourneyHistoryEntry[];
    // Adds a new entry, or replaces the existing one with the same id (used both
    // to record a journey as soon as it's created/joined, and again to flip it
    // to "ended" later - the second call just overwrites the first).
    addEntry: (entry: JourneyHistoryEntry) => void;
}

const MAX_HISTORY_ENTRIES = 50;

export const useJourneyHistoryStore = create<JourneyHistoryStore>()(
    persist(
        (set, get) => ({
            entries: [],
            addEntry: (entry) => {
                const withoutDuplicate = get().entries.filter((e) => e.id !== entry.id);
                set({ entries: [entry, ...withoutDuplicate].slice(0, MAX_HISTORY_ENTRIES) });
            },
        }),
        {
            name: 'journey-history-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
