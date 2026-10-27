import {
    shouldRefreshRoute,
    routeKeyFor,
    stopsStillAhead,
    LastFetch,
    MIN_REFRESH_INTERVAL_MS,
    RETRY_AFTER_FAILURE_MS,
} from '../routeRefresh';

const origin = { lat: 17.4, lng: 78.4 };
const farOrigin = { lat: 17.41, lng: 78.4 }; // ~1.1 km north
const nearOrigin = { lat: 17.4002, lng: 78.4 }; // ~22 m
const dest = { lat: 17.5, lng: 78.5 };
const key = routeKeyFor([], dest);
const last = (over: Partial<LastFetch> = {}): LastFetch => ({
    origin,
    routeKey: key,
    at: 1_000_000,
    failed: false,
    ...over,
});

describe('shouldRefreshRoute', () => {
    it('fetches when there is no previous route', () => {
        expect(shouldRefreshRoute(null, origin, key, 0)).toBe(true);
    });

    it('refetches immediately when the stops change', () => {
        const newKey = routeKeyFor([{ lat: 17.45, lng: 78.45 }], dest);
        expect(shouldRefreshRoute(last(), origin, newKey, 1_000_001)).toBe(true);
    });

    it('does not refetch within the minimum interval, even after moving far', () => {
        expect(shouldRefreshRoute(last(), farOrigin, key, 1_000_000 + MIN_REFRESH_INTERVAL_MS - 1)).toBe(false);
    });

    it('does not refetch after the interval if barely moved', () => {
        expect(shouldRefreshRoute(last(), nearOrigin, key, 1_000_000 + MIN_REFRESH_INTERVAL_MS)).toBe(false);
    });

    it('refetches after the interval once moved far enough', () => {
        expect(shouldRefreshRoute(last(), farOrigin, key, 1_000_000 + MIN_REFRESH_INTERVAL_MS)).toBe(true);
    });

    it('backs off after a failure, then retries', () => {
        expect(shouldRefreshRoute(last({ failed: true }), farOrigin, key, 1_000_000 + RETRY_AFTER_FAILURE_MS - 1)).toBe(false);
        expect(shouldRefreshRoute(last({ failed: true }), farOrigin, key, 1_000_000 + RETRY_AFTER_FAILURE_MS)).toBe(true);
    });
});

describe('stopsStillAhead', () => {
    it('drops stops already reached and keeps the rest in order', () => {
        const stops = [
            { lat: 17.4001, lng: 78.4 }, // ~11 m away - reached
            { lat: 17.45, lng: 78.45 },
            { lat: 17.48, lng: 78.48 },
        ];
        expect(stopsStillAhead(stops, origin)).toEqual([stops[1], stops[2]]);
    });
});
