import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';
import { decodePolyline, LatLng } from '../utils/polyline';
import { TtlCache } from '../utils/ttlCache';

// Calls the getDirections Cloud Function (functions/src/index.ts) rather than
// Google directly, so the key stays server-side - same approach as placesService.
interface DirectionsResponse {
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
    legs: { distanceMeters: number; durationSeconds: number }[];
}

const directionsCallable = httpsCallable<
    {
        origin: { lat: number; lng: number };
        destination: { lat: number; lng: number };
        waypoints: { lat: number; lng: number }[];
    },
    DirectionsResponse
>(functions, 'getDirections');

export interface JourneyRoute {
    coordinates: LatLng[];
    distanceMeters: number;
    durationSeconds: number;
    legs: { distanceMeters: number; durationSeconds: number }[];
}

interface Point {
    lat: number;
    lng: number;
}

// A route is reused for a few minutes when asked for again from (nearly) the same spot
// with the same stops - e.g. leaving the journey screen and coming back - instead of
// paying for a fresh Routes call. The origin is rounded to ~110 m for the key.
const ROUTE_TTL_MS = 5 * 60_000;
const routeCache = new TtlCache<JourneyRoute>(ROUTE_TTL_MS, 20);

export const routeCacheKey = (origin: Point, stops: Point[], destination: Point): string =>
    [origin, ...stops, destination].map((p, i) => (i === 0 ? `${p.lat.toFixed(3)},${p.lng.toFixed(3)}` : `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)).join('|');

export const directionsService = {
    /**
     * Driving route from `origin`, through `stops` in the order given, to `destination`.
     */
    getRoute: async (origin: Point, stops: Point[], destination: Point): Promise<JourneyRoute> => {
        const key = routeCacheKey(origin, stops, destination);
        const cached = routeCache.get(key);
        if (cached) return cached;

        const result = await directionsCallable({
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            waypoints: stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        });
        const { encodedPolyline, distanceMeters, durationSeconds, legs } = result.data;
        const route = { coordinates: decodePolyline(encodedPolyline), distanceMeters, durationSeconds, legs };
        routeCache.set(key, route);
        return route;
    },
};
