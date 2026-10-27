const mockAutocomplete = jest.fn();
const mockDetails = jest.fn();

jest.mock('../../utils/firebase', () => ({ functions: {} }));
jest.mock('firebase/functions', () => ({
    // Looked up at call time: the service creates its callables while being imported,
    // before the mock functions above have been initialised.
    httpsCallable: jest.fn((_fns: unknown, name: string) => (...args: unknown[]) =>
        (name === 'placesAutocomplete' ? mockAutocomplete : mockDetails)(...args)
    ),
}));

import { placesService, suggestionCacheKey } from '../placesService';

const suggestion = { placeId: 'p1', primaryText: 'Hyderabad', secondaryText: 'Telangana' };

describe('placesService caching', () => {
    beforeEach(() => {
        mockAutocomplete.mockReset();
        mockDetails.mockReset();
    });

    test('answers a repeated query from memory instead of calling the function again', async () => {
        mockAutocomplete.mockResolvedValue({ data: { suggestions: [suggestion] } });

        const first = await placesService.autocomplete('hyderabad', 's1');
        const second = await placesService.autocomplete('hyderabad', 's1');

        expect(first).toEqual([suggestion]);
        expect(second).toEqual([suggestion]);
        expect(mockAutocomplete).toHaveBeenCalledTimes(1);
    });

    test('treats case and extra spaces as the same query', async () => {
        mockAutocomplete.mockResolvedValue({ data: { suggestions: [suggestion] } });

        await placesService.autocomplete('Secunder  abad', 's1');
        await placesService.autocomplete('secunder abad', 's1');

        expect(mockAutocomplete).toHaveBeenCalledTimes(1);
    });

    test('shares one call between identical requests made at the same time', async () => {
        let resolve!: (v: unknown) => void;
        mockAutocomplete.mockReturnValue(new Promise((r) => (resolve = r)));

        const a = placesService.autocomplete('warangal', 's1');
        const b = placesService.autocomplete('warangal', 's1');
        resolve({ data: { suggestions: [suggestion] } });

        expect(await a).toEqual([suggestion]);
        expect(await b).toEqual([suggestion]);
        expect(mockAutocomplete).toHaveBeenCalledTimes(1);
    });

    test('does not cache a failed call, so a retry goes through', async () => {
        mockAutocomplete.mockRejectedValueOnce(new Error('network'));
        mockAutocomplete.mockResolvedValueOnce({ data: { suggestions: [suggestion] } });

        await expect(placesService.autocomplete('nizamabad', 's1')).rejects.toThrow('network');
        await expect(placesService.autocomplete('nizamabad', 's1')).resolves.toEqual([suggestion]);
        expect(mockAutocomplete).toHaveBeenCalledTimes(2);
    });

    test('caches place details by place id', async () => {
        mockDetails.mockResolvedValue({ data: { name: 'Charminar', lat: 17.36, lng: 78.47 } });

        await placesService.getPlaceDetails('place-1', 's1');
        await placesService.getPlaceDetails('place-1', 's2');

        expect(mockDetails).toHaveBeenCalledTimes(1);
    });

    test('different bias areas are cached separately', () => {
        expect(suggestionCacheKey('cafe', { lat: 17.4, lng: 78.4 })).not.toBe(
            suggestionCacheKey('cafe', { lat: 28.6, lng: 77.2 })
        );
        expect(suggestionCacheKey('cafe', { lat: 17.401, lng: 78.402 })).toBe(
            suggestionCacheKey('cafe', { lat: 17.398, lng: 78.399 })
        );
    });
});
