import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JourneyRole } from './useJourneyStore';
import { Destination } from '../types/journey';

export interface HistoryMember {
    id: string;
    name: string;
    color: string;
    isCreator: boolean;
}

export interface JourneyHistoryEntry {
    id: string;
    destination: Destination;
    stops: Destination[];
    role: JourneyRole;
    status: 'active' | 'ended';
    startedAt: string;
    endedAt?: string;
    // Snapshot of who was in the journey - kept here since the live journey doc is
    // deleted when it ends. Absent on entries recorded before this was tracked.
    members?: HistoryMember[];
}

interface JourneyHistoryStore {
    entries: JourneyHistoryEntry[];
    // Adds a new entry, or replaces the existing one with the same id (used both
    // to record a journey as soon as it's created/joined, and again to flip it
    // to "ended" later - the second call just overwrites the first).
    addEntry: (entry: JourneyHistoryEntry) => void;
    removeEntry: (id: string) => void;
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
            removeEntry: (id) => {
                set({ entries: get().entries.filter((e) => e.id !== id) });
            },
        }),
        {
            name: 'journey-history-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
