const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceInMeters = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
};

export const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

// Within this radius, a member is considered to have reached the destination.
export const ARRIVAL_THRESHOLD_METERS = 100;

export const hasArrived = (distanceMeters: number): boolean => distanceMeters <= ARRIVAL_THRESHOLD_METERS;

// Orders intermediate stops farthest-from-destination first, so the list reads
// as the natural order they'd be visited in on the way to the final destination.
export const sortByDistanceFromPoint = <T extends { lat: number; lng: number }>(
    points: T[],
    from: { lat: number; lng: number }
): T[] => {
    return [...points].sort((a, b) => {
        const distA = distanceInMeters(a.lat, a.lng, from.lat, from.lng);
        const distB = distanceInMeters(b.lat, b.lng, from.lat, from.lng);
        return distB - distA;
    });
};

export const formatDuration = (seconds: number): string => {
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
};

interface Point {
    lat: number;
    lng: number;
}

/**
 * Stops a person still has ahead of them. Stops are stored in visiting order, farthest
 * from the destination first, so a stop that's farther from the destination than the
 * person is (or that they're standing at) has effectively been passed.
 */
export const stopsAheadOf = <T extends Point>(from: Point, stops: T[], destination: Point): T[] => {
    const fromDest = distanceInMeters(from.lat, from.lng, destination.lat, destination.lng);
    return stops.filter((s) => {
        if (distanceInMeters(from.lat, from.lng, s.lat, s.lng) <= ARRIVAL_THRESHOLD_METERS) return false;
        return distanceInMeters(s.lat, s.lng, destination.lat, destination.lng) < fromDest;
    });
};

/**
 * Straight-line length of the path from a position through the stops still ahead, in
 * order, to the destination. An estimate - a road route is longer - but it follows the
 * stops instead of cutting straight to the end like a direct distance does.
 */
export const distanceViaStops = (from: Point, stops: Point[], destination: Point): number => {
    const path = [from, ...stopsAheadOf(from, stops, destination), destination];
    let total = 0;
    for (let i = 1; i < path.length; i++) {
        total += distanceInMeters(path[i - 1].lat, path[i - 1].lng, path[i].lat, path[i].lng);
    }
    return total;
};
