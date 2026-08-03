import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Journey, Destination, JourneyMember } from '../types/journey';
import { colorForId } from '../utils/color';

const JOURNEYS_COLLECTION = 'journeys';

// Generates a random 6-character alphanumeric journey code
const generateJourneyId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const journeyService = {
    /**
     * Creates a new journey document in Firestore with the creator as its first member.
     * @returns The generated unique journey code
     */
    createJourney: async (
        destination: Destination,
        creatorId: string,
        creatorName: string
    ): Promise<string> => {
        const journeyId = generateJourneyId();
        const journeyRef = doc(db, JOURNEYS_COLLECTION, journeyId);
        const now = new Date().toISOString();

        const creator: JourneyMember = {
            id: creatorId,
            name: creatorName,
            color: colorForId(creatorId),
            isCreator: true,
            lat: null,
            lng: null,
            heading: null,
            hasArrived: false,
            arrivedAt: null,
            updatedAt: null,
        };

        const journey: Journey = {
            id: journeyId,
            destination,
            creatorId,
            createdAt: now,
            lastUpdatedAt: now,
            members: { [creatorId]: creator },
        };

        await setDoc(journeyRef, journey);
        return journeyId;
    },

    /**
     * Adds a member to an existing journey. Returns the journey, or null if it doesn't exist.
     */
    joinJourney: async (
        journeyId: string,
        memberId: string,
        memberName: string
    ): Promise<Journey | null> => {
        const journeyRef = doc(db, JOURNEYS_COLLECTION, journeyId);
        const snapshot = await getDoc(journeyRef);
        if (!snapshot.exists()) return null;

        const journey = snapshot.data() as Journey;
        if (!journey.members[memberId]) {
            const member: JourneyMember = {
                id: memberId,
                name: memberName,
                color: colorForId(memberId),
                isCreator: false,
                lat: null,
                lng: null,
                heading: null,
                hasArrived: false,
                arrivedAt: null,
                updatedAt: null,
            };

            await updateDoc(journeyRef, {
                [`members.${memberId}`]: member,
                lastUpdatedAt: new Date().toISOString(),
            });

            journey.members[memberId] = member;
        }

        return journey;
    },

    /**
     * Updates the calling member's own location within a journey. `hasArrived` is
     * one-way (once true, later calls with `false` never clear it) - it marks the
     * one-time "reached the destination" milestone, not a live in/out geofence.
     */
    updateMemberLocation: async (
        journeyId: string,
        memberId: string,
        lat: number,
        lng: number,
        heading?: number | null,
        hasArrived?: boolean
    ): Promise<void> => {
        const journeyRef = doc(db, JOURNEYS_COLLECTION, journeyId);
        const now = new Date().toISOString();

        const updates: Record<string, unknown> = {
            [`members.${memberId}.lat`]: lat,
            [`members.${memberId}.lng`]: lng,
            [`members.${memberId}.heading`]: heading ?? null,
            [`members.${memberId}.updatedAt`]: now,
            lastUpdatedAt: now,
        };
        if (hasArrived) {
            updates[`members.${memberId}.hasArrived`] = true;
            updates[`members.${memberId}.arrivedAt`] = now;
        }

        await updateDoc(journeyRef, updates);
    },

    /**
     * Removes the calling member from a journey.
     */
    leaveJourney: async (journeyId: string, memberId: string): Promise<void> => {
        const journeyRef = doc(db, JOURNEYS_COLLECTION, journeyId);
        await updateDoc(journeyRef, {
            [`members.${memberId}`]: deleteField(),
            lastUpdatedAt: new Date().toISOString(),
        });
    },

    /**
     * Ends a journey (creator only, enforced by Firestore rules) by deleting its document.
     * Subscribers naturally see this as a "not found" event.
     */
    endJourney: async (journeyId: string): Promise<void> => {
        const journeyRef = doc(db, JOURNEYS_COLLECTION, journeyId);
        await deleteDoc(journeyRef);
    },

    /**
     * Subscribes to real-time updates for a journey.
     * @returns An unsubscribe function
     */
    subscribeToJourney: (
        journeyId: string,
        onUpdate: (journey: Journey) => void,
        onError?: (error: Error) => void
    ) => {
        const journeyRef = doc(db, JOURNEYS_COLLECTION, journeyId);

        return onSnapshot(
            journeyRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    onUpdate(snapshot.data() as Journey);
                } else if (onError) {
                    onError(new Error('Journey not found'));
                }
            },
            (error) => {
                if (onError) onError(error);
            }
        );
    },

    /**
     * Fetches a journey once without subscribing.
     */
    getJourney: async (journeyId: string): Promise<Journey | null> => {
        const journeyRef = doc(db, JOURNEYS_COLLECTION, journeyId);
        const snapshot = await getDoc(journeyRef);
        return snapshot.exists() ? (snapshot.data() as Journey) : null;
    },
};
