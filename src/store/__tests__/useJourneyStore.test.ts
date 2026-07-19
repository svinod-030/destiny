import { useJourneyStore } from '../useJourneyStore';
import { Journey } from '../../types/journey';

const sampleJourney: Journey = {
    id: 'ABC123',
    destination: { name: 'The Lake House', lat: 12.9, lng: 77.6 },
    creatorId: 'creator-uid',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
    members: {},
};

describe('useJourneyStore', () => {
    beforeEach(() => {
        useJourneyStore.setState({ journeyId: null, role: null, journey: null });
    });

    test('setActiveJourney stores the journey code and role', () => {
        useJourneyStore.getState().setActiveJourney('ABC123', 'creator');

        expect(useJourneyStore.getState().journeyId).toBe('ABC123');
        expect(useJourneyStore.getState().role).toBe('creator');
    });

    test('setJourney updates the live journey snapshot without touching journeyId/role', () => {
        useJourneyStore.getState().setActiveJourney('ABC123', 'member');
        useJourneyStore.getState().setJourney(sampleJourney);

        expect(useJourneyStore.getState().journey).toEqual(sampleJourney);
        expect(useJourneyStore.getState().journeyId).toBe('ABC123');
        expect(useJourneyStore.getState().role).toBe('member');
    });

    test('clear resets journeyId, role, and journey', () => {
        useJourneyStore.getState().setActiveJourney('ABC123', 'creator');
        useJourneyStore.getState().setJourney(sampleJourney);

        useJourneyStore.getState().clear();

        expect(useJourneyStore.getState().journeyId).toBeNull();
        expect(useJourneyStore.getState().role).toBeNull();
        expect(useJourneyStore.getState().journey).toBeNull();
    });
});
