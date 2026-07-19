import { distanceInMeters, formatDistance } from '../geo';

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
