import { doc, setDoc, getDoc, updateDoc, deleteDoc, deleteField, onSnapshot } from 'firebase/firestore';
import { journeyService } from '../journeyService';
import { Journey } from '../../types/journey';

jest.mock('../../utils/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(() => ({ id: 'mock-ref' })),
    setDoc: jest.fn().mockResolvedValue(undefined),
    getDoc: jest.fn(),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    deleteField: jest.fn(() => 'DELETE_FIELD_SENTINEL'),
    onSnapshot: jest.fn(() => jest.fn()),
}));

const existingJourney: Journey = {
    id: 'ABC123',
    destination: { name: 'The Lake House', lat: 12.9, lng: 77.6 },
    creatorId: 'creator-uid',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
    members: {
        'creator-uid': {
            id: 'creator-uid',
            name: 'Alex',
            color: '#3B82F6',
            isCreator: true,
            lat: null,
            lng: null,
            heading: null,
            updatedAt: null,
        },
    },
};

describe('journeyService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createJourney', () => {
        test('writes a new journey doc with the creator as its first member', async () => {
            const journeyId = await journeyService.createJourney(
                { name: 'The Lake House', lat: 12.9, lng: 77.6 },
                'creator-uid',
                'Alex'
            );

            expect(journeyId).toMatch(/^[A-Z0-9]{6}$/);
            expect(setDoc).toHaveBeenCalledTimes(1);

            const written = (setDoc as jest.Mock).mock.calls[0][1] as Journey;
            expect(written.creatorId).toBe('creator-uid');
            expect(written.destination).toEqual({ name: 'The Lake House', lat: 12.9, lng: 77.6 });
            expect(written.members['creator-uid']).toMatchObject({
                id: 'creator-uid',
                name: 'Alex',
                isCreator: true,
                lat: null,
                lng: null,
            });
        });
    });

    describe('joinJourney', () => {
        test('returns null when the journey does not exist', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

            const result = await journeyService.joinJourney('MISSING', 'member-uid', 'Sam');

            expect(result).toBeNull();
            expect(updateDoc).not.toHaveBeenCalled();
        });

        test('adds a new member to an existing journey', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => JSON.parse(JSON.stringify(existingJourney)),
            });

            const result = await journeyService.joinJourney('ABC123', 'member-uid', 'Sam');

            expect(result).not.toBeNull();
            expect(updateDoc).toHaveBeenCalledTimes(1);
            const [, update] = (updateDoc as jest.Mock).mock.calls[0];
            expect(update['members.member-uid']).toMatchObject({ id: 'member-uid', name: 'Sam', isCreator: false });
        });

        test('does not re-add a member who already joined', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => JSON.parse(JSON.stringify(existingJourney)),
            });

            await journeyService.joinJourney('ABC123', 'creator-uid', 'Alex');

            expect(updateDoc).not.toHaveBeenCalled();
        });
    });

    describe('updateMemberLocation', () => {
        test('writes location fields using the member-scoped dot path', async () => {
            await journeyService.updateMemberLocation('ABC123', 'member-uid', 12.34, 56.78, 90);

            expect(updateDoc).toHaveBeenCalledTimes(1);
            const [, update] = (updateDoc as jest.Mock).mock.calls[0];
            expect(update['members.member-uid.lat']).toBe(12.34);
            expect(update['members.member-uid.lng']).toBe(56.78);
            expect(update['members.member-uid.heading']).toBe(90);
        });
    });

    describe('leaveJourney', () => {
        test('deletes the member entry via a field-deletion sentinel', async () => {
            await journeyService.leaveJourney('ABC123', 'member-uid');

            expect(updateDoc).toHaveBeenCalledTimes(1);
            const [, update] = (updateDoc as jest.Mock).mock.calls[0];
            expect(update['members.member-uid']).toBe('DELETE_FIELD_SENTINEL');
            expect(deleteField).toHaveBeenCalled();
        });
    });

    describe('endJourney', () => {
        test('deletes the journey document', async () => {
            await journeyService.endJourney('ABC123');
            expect(deleteDoc).toHaveBeenCalledTimes(1);
        });
    });

    describe('subscribeToJourney', () => {
        test('forwards updates when the document exists', () => {
            const onUpdate = jest.fn();
            (onSnapshot as jest.Mock).mockImplementationOnce((_ref, next) => {
                next({ exists: () => true, data: () => existingJourney });
                return jest.fn();
            });

            journeyService.subscribeToJourney('ABC123', onUpdate);

            expect(onUpdate).toHaveBeenCalledWith(existingJourney);
        });

        test('reports an error when the document no longer exists', () => {
            const onUpdate = jest.fn();
            const onError = jest.fn();
            (onSnapshot as jest.Mock).mockImplementationOnce((_ref, next) => {
                next({ exists: () => false });
                return jest.fn();
            });

            journeyService.subscribeToJourney('ABC123', onUpdate, onError);

            expect(onUpdate).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
