import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';
import { TtlCache } from '../utils/ttlCache';

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

// Every call below is a billed Cloud Function invocation, so repeats are answered from
// memory: backspacing and retyping a query, reopening search, or re-picking a result
// shouldn't cost again. Suggestions are biased toward a location, so the cache key
// includes a coarse bucket of it (~11 km) - the bias radius is far larger than that.
const SUGGESTION_TTL_MS = 10 * 60_000;
const DETAILS_TTL_MS = 60 * 60_000;
const suggestionCache = new TtlCache<PlaceSuggestion[]>(SUGGESTION_TTL_MS, 100);
const detailsCache = new TtlCache<PlaceDetails | null>(DETAILS_TTL_MS, 100);
const inFlight = new Map<string, Promise<unknown>>();

export const suggestionCacheKey = (query: string, near?: { lat: number; lng: number }): string =>
    `${query.trim().toLowerCase().replace(/\s+/g, ' ')}|${near ? `${near.lat.toFixed(1)},${near.lng.toFixed(1)}` : ''}`;

// Concurrent identical requests share one call.
const dedupe = <T>(key: string, run: () => Promise<T>): Promise<T> => {
    const existing = inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = run().finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
};

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
        const key = `ac:${suggestionCacheKey(query, near)}`;
        const cached = suggestionCache.get(key);
        if (cached) return cached;

        return dedupe(key, async () => {
            const result = await autocompleteCallable({ query, sessionToken, near });
            suggestionCache.set(key, result.data.suggestions);
            return result.data.suggestions;
        });
    },

    /**
     * Resolves a suggestion's place_id to coordinates.
     */
    getPlaceDetails: async (placeId: string, sessionToken: string): Promise<PlaceDetails | null> => {
        const key = `pd:${placeId}`;
        const cached = detailsCache.get(key);
        if (cached) return cached;

        return dedupe(key, async () => {
            const result = await detailsCallable({ placeId, sessionToken });
            detailsCache.set(key, result.data);
            return result.data;
        });
    },
};
