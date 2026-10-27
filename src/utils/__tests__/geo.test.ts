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

import { formatDuration } from '../geo';

describe('formatDuration', () => {
    it('shows minutes under an hour, never below 1', () => {
        expect(formatDuration(10)).toBe('1 min');
        expect(formatDuration(24 * 60)).toBe('24 min');
    });

    it('shows hours and minutes', () => {
        expect(formatDuration(60 * 60)).toBe('1 hr');
        expect(formatDuration(95 * 60)).toBe('1 hr 35 min');
    });
});

import { distanceViaStops, stopsAheadOf } from '../geo';

describe('distance via stops', () => {
    const dest = { lat: 17.5, lng: 78.5 };
    const stopA = { lat: 17.3, lng: 78.3 }; // farthest from the destination
    const stopB = { lat: 17.4, lng: 78.4 };
    const start = { lat: 17.2, lng: 78.2 };

    it('goes through every stop when none has been reached', () => {
        const direct = distanceInMeters(start.lat, start.lng, dest.lat, dest.lng);
        const via = distanceViaStops(start, [stopA, stopB], dest);
        // These points lie on one line, so going via them is the same length.
        expect(via).toBeCloseTo(direct, -2);
        expect(stopsAheadOf(start, [stopA, stopB], dest)).toEqual([stopA, stopB]);
    });

    it('is longer than the direct distance when the stops are off to the side', () => {
        const side = { lat: 17.6, lng: 78.2 };
        const direct = distanceInMeters(start.lat, start.lng, dest.lat, dest.lng);
        expect(distanceViaStops(start, [side], dest)).toBeGreaterThan(direct * 1.2);
    });

    it('skips stops already passed (closer to the destination than the person is)', () => {
        const pastA = { lat: 17.41, lng: 78.41 }; // person is beyond stop A and B now
        expect(stopsAheadOf(pastA, [stopA, stopB], dest)).toEqual([]);
        expect(distanceViaStops(pastA, [stopA, stopB], dest)).toBeCloseTo(
            distanceInMeters(pastA.lat, pastA.lng, dest.lat, dest.lng),
            0
        );
    });

    it('skips a stop the person is standing at', () => {
        expect(stopsAheadOf({ lat: 17.3001, lng: 78.3 }, [stopA, stopB], dest)).toEqual([stopB]);
    });

    it('with no stops equals the direct distance', () => {
        expect(distanceViaStops(start, [], dest)).toBeCloseTo(
            distanceInMeters(start.lat, start.lng, dest.lat, dest.lng),
            0
        );
    });
});
