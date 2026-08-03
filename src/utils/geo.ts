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
