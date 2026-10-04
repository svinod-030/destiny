import { doc, setDoc, updateDoc, deleteDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { HistoryMember, JourneyHistoryEntry } from '../store/useJourneyHistoryStore';

const MAX_SYNCED_ENTRIES = 50;

const entryRef = (uid: string, journeyId: string) => doc(db, 'userJourneys', uid, 'entries', journeyId);
const entriesRef = (uid: string) => collection(db, 'userJourneys', uid, 'entries');

export const journeyHistoryService = {
    /**
     * Durably records a journey the user created or joined - destination and
     * stops included, so it survives the live `journeys/{id}` doc being
     * deleted when the journey ends.
     */
    recordEntry: async (uid: string, entry: JourneyHistoryEntry): Promise<void> => {
        await setDoc(entryRef(uid, entry.id), entry);
    },

    /**
     * Replaces the member snapshot on a recorded entry, e.g. when someone joins or leaves.
     */
    updateMembers: async (uid: string, journeyId: string, members: HistoryMember[]): Promise<void> => {
        await updateDoc(entryRef(uid, journeyId), { members });
    },

    /**
     * Removes this user's record of a journey. Doesn't touch the shared live journey.
     */
    deleteEntry: async (uid: string, journeyId: string): Promise<void> => {
        await deleteDoc(entryRef(uid, journeyId));
    },

    /**
     * Flips a previously recorded entry to "ended".
     */
    markEnded: async (uid: string, journeyId: string): Promise<void> => {
        await updateDoc(entryRef(uid, journeyId), {
            status: 'ended',
            endedAt: new Date().toISOString(),
        });
    },

    /**
     * Subscribes to this user's journey history, newest first.
     * @returns An unsubscribe function
     */
    subscribeToEntries: (
        uid: string,
        onUpdate: (entries: JourneyHistoryEntry[]) => void,
        onError?: (error: Error) => void
    ) => {
        const q = query(entriesRef(uid), orderBy('startedAt', 'desc'), limit(MAX_SYNCED_ENTRIES));

        return onSnapshot(
            q,
            (snapshot) => {
                onUpdate(snapshot.docs.map((d) => d.data() as JourneyHistoryEntry));
            },
            (error) => {
                if (onError) onError(error);
            }
        );
    },
};
