import { decodePolyline } from '../polyline';

describe('decodePolyline', () => {
    it('decodes the example from Google\'s polyline format documentation', () => {
        const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
        expect(points).toEqual([
            { latitude: 38.5, longitude: -120.2 },
            { latitude: 40.7, longitude: -120.95 },
            { latitude: 43.252, longitude: -126.453 },
        ]);
    });

    it('returns an empty list for an empty string', () => {
        expect(decodePolyline('')).toEqual([]);
    });

    it('handles a single point', () => {
        expect(decodePolyline('_p~iF~ps|U')).toEqual([{ latitude: 38.5, longitude: -120.2 }]);
    });
});
