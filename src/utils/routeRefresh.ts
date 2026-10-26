import { distanceInMeters } from './geo';

interface Point {
    lat: number;
    lng: number;
}

export interface LastFetch {
    origin: Point;
    // Identifies which stops/destination the route was built for.
    routeKey: string;
    at: number;
    failed: boolean;
}

export const MIN_REFRESH_INTERVAL_MS = 60_000;
export const RETRY_AFTER_FAILURE_MS = 5 * 60_000;
export const MOVED_FAR_METERS = 500;
// A stop this close to where the person is has already been reached - routing "via" it
// again would send them back to it.
export const STOP_REACHED_METERS = 150;

export const routeKeyFor = (stops: Point[], destination: Point): string =>
    [...stops, destination].map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');

/**
 * The route is refetched when the stops/destination change right away, and otherwise
 * only after a minimum interval and once the person has moved a good way from where
 * the last route started - so live location updates (every few seconds) don't each
 * cost a Routes API call. After a failure it backs off for a while.
 */
export const shouldRefreshRoute = (
    last: LastFetch | null,
    origin: Point,
    routeKey: string,
    now: number
): boolean => {
    if (!last) return true;
    if (last.routeKey !== routeKey) return true;

    const elapsed = now - last.at;
    if (last.failed) return elapsed >= RETRY_AFTER_FAILURE_MS;
    if (elapsed < MIN_REFRESH_INTERVAL_MS) return false;

    return distanceInMeters(last.origin.lat, last.origin.lng, origin.lat, origin.lng) >= MOVED_FAR_METERS;
};

export const stopsStillAhead = <T extends Point>(stops: T[], origin: Point): T[] =>
    stops.filter((s) => distanceInMeters(origin.lat, origin.lng, s.lat, s.lng) > STOP_REACHED_METERS);
