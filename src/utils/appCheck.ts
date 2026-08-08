import { getApp as getNativeApp } from '@react-native-firebase/app';
import {
    getToken as getNativeAppCheckToken,
    initializeAppCheck as initializeNativeAppCheck,
    ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';
import { CustomProvider, initializeAppCheck } from 'firebase/app-check';
import { app } from './firebase';

// Real device attestation (Play Integrity / App Attest) only exists on the
// native RNFirebase SDK - the plain `firebase` JS SDK used everywhere else in
// this app (auth, firestore, functions) has no equivalent. This wires the two
// together: RNFirebase does the actual attestation, and its token is handed
// to the plain JS SDK via a CustomProvider so that `firebase/functions`'s
// httpsCallable (used by placesService.ts) attaches it automatically to every
// call - no changes needed anywhere else in the app.
export function setupAppCheck() {
    const provider = new ReactNativeFirebaseAppCheckProvider();
    provider.configure({
        android: {
            // 'debug' logs a per-install token you register once in Firebase
            // Console > App Check > Apps > (your app) > Manage debug tokens.
            // Switch to 'playIntegrity' only after that's set up for prod.
            provider: __DEV__ ? 'debug' : 'playIntegrity',
        },
        apple: {
            // Falls back to DeviceCheck on iOS < 14; App Attest above that.
            provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
        },
        isTokenAutoRefreshEnabled: true,
    });

    const nativeAppCheck = initializeNativeAppCheck(getNativeApp(), {
        provider,
        isTokenAutoRefreshEnabled: true,
    });

    initializeAppCheck(app, {
        isTokenAutoRefreshEnabled: true,
        provider: new CustomProvider({
            getToken: async () => {
                const result = await getNativeAppCheckToken(nativeAppCheck);
                return {
                    token: result.token,
                    // RNFirebase's getToken() doesn't expose the real expiry
                    // here - this TTL only controls how often the JS SDK
                    // re-invokes this provider; actual attestation/refresh is
                    // managed natively above.
                    expireTimeMillis: Date.now() + 30 * 60 * 1000,
                };
            },
        }),
    });
}
