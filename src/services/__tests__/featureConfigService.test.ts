import { doc, onSnapshot } from 'firebase/firestore';
import { featureConfigService } from '../featureConfigService';

jest.mock('../../utils/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(() => ({ id: 'mock-ref' })),
    onSnapshot: jest.fn(() => jest.fn()),
}));

describe('featureConfigService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('subscribeToFeatureConfig', () => {
        test('forwards the config when the document exists', () => {
            const onUpdate = jest.fn();
            (onSnapshot as jest.Mock).mockImplementationOnce((_ref, next) => {
                next({ exists: () => true, data: () => ({ adsEnabled: true }) });
                return jest.fn();
            });

            featureConfigService.subscribeToFeatureConfig(onUpdate);

            expect(onUpdate).toHaveBeenCalledWith({ adsEnabled: true });
        });

        test('defaults to adsEnabled: false when the document does not exist', () => {
            const onUpdate = jest.fn();
            (onSnapshot as jest.Mock).mockImplementationOnce((_ref, next) => {
                next({ exists: () => false });
                return jest.fn();
            });

            featureConfigService.subscribeToFeatureConfig(onUpdate);

            expect(onUpdate).toHaveBeenCalledWith({ adsEnabled: false });
        });

        test('forwards errors from the subscription', () => {
            const onUpdate = jest.fn();
            const onError = jest.fn();
            (onSnapshot as jest.Mock).mockImplementationOnce((_ref, _next, error) => {
                error(new Error('permission-denied'));
                return jest.fn();
            });

            featureConfigService.subscribeToFeatureConfig(onUpdate, onError);

            expect(onUpdate).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
