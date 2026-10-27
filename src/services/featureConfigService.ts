import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

export interface FeatureConfig {
    adsEnabled: boolean;
    // Route line + ETA on the live journey map (needs the getDirections Cloud Function).
    directionsEnabled: boolean;
}

const DEFAULT_FEATURE_CONFIG: FeatureConfig = { adsEnabled: false, directionsEnabled: false };

export const featureConfigService = {
    /**
     * Subscribes to the app-wide feature flags document. Missing fields (or a
     * missing document entirely) fall back to DEFAULT_FEATURE_CONFIG, so a
     * flag stays off until it's explicitly turned on in Firebase Console.
     * @returns An unsubscribe function
     */
    subscribeToFeatureConfig: (
        onUpdate: (config: FeatureConfig) => void,
        onError?: (error: Error) => void
    ) => {
        const configRef = doc(db, 'config', 'features');

        return onSnapshot(
            configRef,
            (snapshot) => {
                const data = snapshot.exists() ? (snapshot.data() as Partial<FeatureConfig>) : {};
                onUpdate({ ...DEFAULT_FEATURE_CONFIG, ...data });
            },
            (error) => {
                if (onError) onError(error);
            }
        );
    },
};
