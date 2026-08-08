import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';

// Calls a pair of Cloud Functions (see functions/src/index.ts) instead of
// Google's Places API directly - the real Google key lives server-side only
// (Secret Manager), authenticated per-user via Firebase Auth, and rate-limited
// there. No client-embedded Places key to extract, restrict, or leak.
const autocompleteCallable = httpsCallable<
    { query: string; sessionToken: string; near?: { lat: number; lng: number } },
    { suggestions: PlaceSuggestion[] }
>(functions, 'placesAutocomplete');

const detailsCallable = httpsCallable<{ placeId: string; sessionToken: string }, PlaceDetails>(
    functions,
    'placesDetails'
);

export interface PlaceSuggestion {
    placeId: string;
    primaryText: string;
    secondaryText: string;
}

export interface PlaceDetails {
    name: string;
    lat: number;
    lng: number;
}

const generateSessionToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const placesService = {
    // Kept for interface parity with the old direct-key implementation - the
    // proxy is always "configured" from the client's point of view now; a
    // missing/misconfigured server-side key surfaces as a call failure
    // instead, which callers already handle (see HomeScreen/EditStopsModal).
    isConfigured: () => true,

    newSessionToken: generateSessionToken,

    /**
     * Fetches live autocomplete suggestions for a partial search query, biased
     * toward a given location (e.g. the user's current position) when provided.
     */
    autocomplete: async (
        query: string,
        sessionToken: string,
        near?: { lat: number; lng: number }
    ): Promise<PlaceSuggestion[]> => {
        if (!query.trim()) return [];
        const result = await autocompleteCallable({ query, sessionToken, near });
        return result.data.suggestions;
    },

    /**
     * Resolves a suggestion's place_id to coordinates.
     */
    getPlaceDetails: async (placeId: string, sessionToken: string): Promise<PlaceDetails | null> => {
        const result = await detailsCallable({ placeId, sessionToken });
        return result.data;
    },
};
