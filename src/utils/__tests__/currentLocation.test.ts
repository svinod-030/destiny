const mockLastKnown = jest.fn();
const mockCurrent = jest.fn();

jest.mock('expo-location', () => ({
    Accuracy: { Balanced: 3 },
    getLastKnownPositionAsync: (...a: unknown[]) => mockLastKnown(...a),
    getCurrentPositionAsync: (...a: unknown[]) => mockCurrent(...a),
}));

import { getBestCurrentLocation } from '../currentLocation';

const fix = (lat: number, lng: number) => ({ coords: { latitude: lat, longitude: lng } });

describe('getBestCurrentLocation', () => {
    beforeEach(() => {
        mockLastKnown.mockReset();
        mockCurrent.mockReset();
    });

    it('returns the fresh fix, after reporting the last known one early', async () => {
        mockLastKnown.mockResolvedValue(fix(1, 1));
        mockCurrent.mockResolvedValue(fix(2, 2));
        const onEstimate = jest.fn();

        const result = await getBestCurrentLocation(onEstimate);

        expect(onEstimate).toHaveBeenCalledWith({ lat: 1, lng: 1 });
        expect(result).toEqual({ lat: 2, lng: 2 });
    });

    it('falls back to the last known position when the fresh fix fails', async () => {
        mockLastKnown.mockResolvedValue(fix(1, 1));
        mockCurrent.mockRejectedValue(new Error('ERR_CURRENT_LOCATION_IS_UNAVAILABLE'));

        expect(await getBestCurrentLocation()).toEqual({ lat: 1, lng: 1 });
    });

    it('returns null when the phone has neither', async () => {
        mockLastKnown.mockResolvedValue(null);
        mockCurrent.mockRejectedValue(new Error('unavailable'));

        expect(await getBestCurrentLocation()).toBeNull();
    });

    it('still returns a fresh fix when there is no last known position', async () => {
        mockLastKnown.mockRejectedValue(new Error('no last known'));
        mockCurrent.mockResolvedValue(fix(3, 3));
        const onEstimate = jest.fn();

        expect(await getBestCurrentLocation(onEstimate)).toEqual({ lat: 3, lng: 3 });
        expect(onEstimate).not.toHaveBeenCalled();
    });
});
