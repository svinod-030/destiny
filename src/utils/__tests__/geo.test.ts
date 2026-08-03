import { distanceInMeters, formatDistance, hasArrived, sortByDistanceFromPoint } from '../geo';

describe('distanceInMeters', () => {
    test('returns 0 for identical coordinates', () => {
        expect(distanceInMeters(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0);
    });

    test('matches the known distance between two well-known coordinates', () => {
        // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) is ~344 km
        const distance = distanceInMeters(51.5074, -0.1278, 48.8566, 2.3522);
        expect(distance).toBeGreaterThan(340000);
        expect(distance).toBeLessThan(350000);
    });
});

describe('formatDistance', () => {
    test('renders sub-kilometer distances in meters', () => {
        expect(formatDistance(250)).toBe('250 m');
        expect(formatDistance(999)).toBe('999 m');
    });

    test('renders distances of a kilometer or more in km with one decimal', () => {
        expect(formatDistance(1000)).toBe('1.0 km');
        expect(formatDistance(2540)).toBe('2.5 km');
    });
});

describe('hasArrived', () => {
    test('true at and inside the arrival radius', () => {
        expect(hasArrived(0)).toBe(true);
        expect(hasArrived(100)).toBe(true);
    });

    test('false outside the arrival radius', () => {
        expect(hasArrived(101)).toBe(false);
        expect(hasArrived(5000)).toBe(false);
    });
});

describe('sortByDistanceFromPoint', () => {
    const destination = { lat: 12.9716, lng: 77.5946 };
    const near = { id: 'near', lat: 12.9720, lng: 77.5950 };
    const mid = { id: 'mid', lat: 12.9800, lng: 77.6100 };
    const far = { id: 'far', lat: 13.0827, lng: 80.2707 }; // Chennai - genuinely far

    test('orders points farthest-from-destination first', () => {
        const sorted = sortByDistanceFromPoint([near, far, mid], destination);
        expect(sorted.map((p) => p.id)).toEqual(['far', 'mid', 'near']);
    });

    test('does not mutate the input array', () => {
        const input = [near, far, mid];
        const original = [...input];
        sortByDistanceFromPoint(input, destination);
        expect(input).toEqual(original);
    });

    test('returns an empty array for no points', () => {
        expect(sortByDistanceFromPoint([], destination)).toEqual([]);
    });
});
