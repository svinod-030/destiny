import { doc, setDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { JourneyHistoryEntry } from '../store/useJourneyHistoryStore';

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
