const mockCallable = jest.fn();

jest.mock('../../utils/firebase', () => ({ functions: {} }));
jest.mock('firebase/functions', () => ({
    httpsCallable: jest.fn(() => (...args: unknown[]) => mockCallable(...args)),
}));

import { directionsService, routeCacheKey } from '../directionsService';

const response = {
    data: { encodedPolyline: '_p~iF~ps|U_ulLnnqC', distanceMeters: 1000, durationSeconds: 120, legs: [] },
};
const origin = { lat: 17.4, lng: 78.4 };
const dest = { lat: 17.5, lng: 78.5 };

describe('directionsService caching', () => {
    beforeEach(() => mockCallable.mockReset());

    test('reuses a route asked for again from nearly the same place', async () => {
        mockCallable.mockResolvedValue(response);

        await directionsService.getRoute(origin, [], dest);
        await directionsService.getRoute({ lat: 17.4003, lng: 78.4002 }, [], dest);

        expect(mockCallable).toHaveBeenCalledTimes(1);
    });

    test('calls again when the stops differ', async () => {
        mockCallable.mockResolvedValue(response);

        await directionsService.getRoute({ lat: 12.9, lng: 77.6 }, [], { lat: 13.0, lng: 77.7 });
        await directionsService.getRoute({ lat: 12.9, lng: 77.6 }, [{ lat: 12.95, lng: 77.65 }], { lat: 13.0, lng: 77.7 });

        expect(mockCallable).toHaveBeenCalledTimes(2);
    });

    test('does not cache failures', async () => {
        mockCallable.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(response);
        const o = { lat: 22.5, lng: 88.3 };
        const d = { lat: 22.6, lng: 88.4 };

        await expect(directionsService.getRoute(o, [], d)).rejects.toThrow('boom');
        await expect(directionsService.getRoute(o, [], d)).resolves.toBeDefined();
        expect(mockCallable).toHaveBeenCalledTimes(2);
    });

    test('keys a nearby origin to the same bucket, a distant one to another', () => {
        expect(routeCacheKey(origin, [], dest)).toBe(routeCacheKey({ lat: 17.4003, lng: 78.4002 }, [], dest));
        expect(routeCacheKey(origin, [], dest)).not.toBe(routeCacheKey({ lat: 17.41, lng: 78.4 }, [], dest));
    });
});
