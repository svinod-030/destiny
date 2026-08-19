import { doc, setDoc, updateDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { journeyHistoryService } from '../journeyHistoryService';
import { JourneyHistoryEntry } from '../../store/useJourneyHistoryStore';

jest.mock('../../utils/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(() => ({ id: 'mock-doc-ref' })),
    setDoc: jest.fn().mockResolvedValue(undefined),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn(() => ({ id: 'mock-collection-ref' })),
    query: jest.fn((ref) => ref),
    orderBy: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(() => jest.fn()),
}));

const sampleEntry: JourneyHistoryEntry = {
    id: 'ABC123',
    destination: { name: 'The Lake House', lat: 12.9, lng: 77.6 },
    stops: [{ name: 'Coffee Stop', lat: 12.95, lng: 77.62 }],
    role: 'creator',
    status: 'active',
    startedAt: '2026-01-01T00:00:00.000Z',
};

describe('journeyHistoryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('recordEntry', () => {
        test('writes the full entry (destination + stops) to the user-scoped doc', async () => {
            await journeyHistoryService.recordEntry('user-uid', sampleEntry);

            expect(doc).toHaveBeenCalledWith({}, 'userJourneys', 'user-uid', 'entries', 'ABC123');
            expect(setDoc).toHaveBeenCalledTimes(1);
            expect((setDoc as jest.Mock).mock.calls[0][1]).toEqual(sampleEntry);
        });
    });

    describe('markEnded', () => {
        test('updates status to ended with a timestamp', async () => {
            await journeyHistoryService.markEnded('user-uid', 'ABC123');

            expect(updateDoc).toHaveBeenCalledTimes(1);
            const [, update] = (updateDoc as jest.Mock).mock.calls[0];
            expect(update.status).toBe('ended');
            expect(update.endedAt).toEqual(expect.any(String));
        });
    });

    describe('subscribeToEntries', () => {
        test('forwards the list of entries on update', () => {
            const onUpdate = jest.fn();
            (onSnapshot as jest.Mock).mockImplementationOnce((_q, next) => {
                next({ docs: [{ data: () => sampleEntry }] });
                return jest.fn();
            });

            journeyHistoryService.subscribeToEntries('user-uid', onUpdate);

            expect(collection).toHaveBeenCalledWith({}, 'userJourneys', 'user-uid', 'entries');
            expect(onUpdate).toHaveBeenCalledWith([sampleEntry]);
        });

        test('forwards subscription errors', () => {
            const onUpdate = jest.fn();
            const onError = jest.fn();
            (onSnapshot as jest.Mock).mockImplementationOnce((_q, _next, error) => {
                error(new Error('permission-denied'));
                return jest.fn();
            });

            journeyHistoryService.subscribeToEntries('user-uid', onUpdate, onError);

            expect(onUpdate).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
