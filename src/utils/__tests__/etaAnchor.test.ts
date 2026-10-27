import { buildEtaAnchor, estimateEtaSeconds } from '../etaAnchor';

const start = { lat: 17.2, lng: 78.2 };
const dest = { lat: 17.5, lng: 78.5 };
const stop = { lat: 17.35, lng: 78.35 }; // on the line between them

describe('estimateEtaSeconds', () => {
    const anchor = buildEtaAnchor('J1', 1800, start, [stop], dest); // 30 min from the start

    it('is the fetched time at the start of the route', () => {
        expect(estimateEtaSeconds(anchor, start)).toBe(1800);
    });

    it('shrinks in proportion to the way covered', () => {
        const halfway = { lat: 17.35, lng: 78.35 };
        const eta = estimateEtaSeconds(anchor, halfway) as number;
        expect(eta).toBeGreaterThan(850);
        expect(eta).toBeLessThan(950);
    });

    it('is 0 at the destination', () => {
        expect(estimateEtaSeconds(anchor, { lat: 17.5001, lng: 78.5 })).toBe(0);
    });

    it('grows when the person moves away from the destination', () => {
        const back = { lat: 17.1, lng: 78.1 };
        expect(estimateEtaSeconds(anchor, back) as number).toBeGreaterThan(1800);
    });

    it('gives up (null) when the person is wildly off the route', () => {
        expect(estimateEtaSeconds(anchor, { lat: 25, lng: 85 })).toBeNull();
    });

    it('returns null when the route was too short to scale from', () => {
        const tiny = buildEtaAnchor('J1', 60, { lat: 17.5, lng: 78.5001 }, [], dest);
        expect(estimateEtaSeconds(tiny, start)).toBeNull();
    });
});
