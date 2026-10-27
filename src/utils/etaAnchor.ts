import AsyncStorage from '@react-native-async-storage/async-storage';
import { ARRIVAL_THRESHOLD_METERS, distanceViaStops } from './geo';

interface Point {
    lat: number;
    lng: number;
}

// A snapshot of the last real route this phone fetched (the road time from where the
// person was then, via the stops, to the destination). Location updates between route
// refreshes - including those sent from the background task, where no screen is
// mounted - scale that time by how much of the way is left, so the ETA written to
// Firestore tracks actual progress without a Directions call per update.
export interface EtaAnchor {
    journeyId: string;
    durationSeconds: number;
    // Straight-line length of the path (via the stops ahead) from where the route started.
    baselineMeters: number;
    stops: Point[];
    destination: Point;
}

// Past this multiple of the fetched time the estimate stops being believable (the person
// has gone far off the route); better to show nothing than a huge number.
const MAX_RATIO = 3;
const MIN_BASELINE_METERS = 50;

export const estimateEtaSeconds = (anchor: EtaAnchor, pos: Point): number | null => {
    if (anchor.baselineMeters < MIN_BASELINE_METERS) return null;
    const remaining = distanceViaStops(pos, anchor.stops, anchor.destination);
    if (remaining <= ARRIVAL_THRESHOLD_METERS) return 0;
    const ratio = remaining / anchor.baselineMeters;
    if (ratio > MAX_RATIO) return null;
    return Math.round(anchor.durationSeconds * ratio);
};

export const buildEtaAnchor = (
    journeyId: string,
    durationSeconds: number,
    origin: Point,
    stops: Point[],
    destination: Point
): EtaAnchor => ({
    journeyId,
    durationSeconds,
    baselineMeters: distanceViaStops(origin, stops, destination),
    stops,
    destination,
});

const ANCHOR_KEY = 'destiny-eta-anchor';
let memoryAnchor: EtaAnchor | null | undefined;

export const setEtaAnchor = async (anchor: EtaAnchor | null): Promise<void> => {
    memoryAnchor = anchor;
    // Kept on disk too: the background location task can be started fresh by the OS
    // with no memory of the screen, and still needs this to attach an ETA.
    if (anchor) await AsyncStorage.setItem(ANCHOR_KEY, JSON.stringify(anchor));
    else await AsyncStorage.removeItem(ANCHOR_KEY);
};

const getEtaAnchor = async (): Promise<EtaAnchor | null> => {
    if (memoryAnchor !== undefined) return memoryAnchor;
    try {
        const raw = await AsyncStorage.getItem(ANCHOR_KEY);
        memoryAnchor = raw ? (JSON.parse(raw) as EtaAnchor) : null;
    } catch {
        memoryAnchor = null;
    }
    return memoryAnchor;
};

/** ETA in seconds for a position on this journey, or null when no route is known. */
export const currentEtaSeconds = async (journeyId: string, pos: Point): Promise<number | null> => {
    const anchor = await getEtaAnchor();
    if (!anchor || anchor.journeyId !== journeyId) return null;
    return estimateEtaSeconds(anchor, pos);
};
