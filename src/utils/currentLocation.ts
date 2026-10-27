import * as Location from 'expo-location';

export interface Coords {
    lat: number;
    lng: number;
}

const FRESH_FIX_TIMEOUT_MS = 8000;
// Anything newer than this is good enough to centre a map on while waiting for a fresh fix.
const LAST_KNOWN_MAX_AGE_MS = 10 * 60_000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('location timeout')), ms);
        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });

const toCoords = (location: Location.LocationObject | null): Coords | null =>
    location ? { lat: location.coords.latitude, lng: location.coords.longitude } : null;

/**
 * The person's position, as quickly and reliably as the phone allows. A brand-new GPS
 * fix can take long or fail outright (cold start, indoors, weak signal), which used
 * to leave the app with no position at all. So: the last known position is reported
 * right away through `onEstimate`, a fresh fix then replaces it, and if the fresh fix
 * never comes the last known one stands. Resolves to null only when the phone has
 * neither.
 */
export const getBestCurrentLocation = async (onEstimate?: (c: Coords) => void): Promise<Coords | null> => {
    let lastKnown: Coords | null = null;
    try {
        lastKnown = toCoords(await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }));
    } catch {
        lastKnown = null;
    }
    if (lastKnown) onEstimate?.(lastKnown);

    try {
        const fresh = await withTimeout(
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            FRESH_FIX_TIMEOUT_MS
        );
        return toCoords(fresh);
    } catch {
        return lastKnown;
    }
};
