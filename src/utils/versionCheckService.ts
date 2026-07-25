import { Platform } from 'react-native';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import { APP_CONFIG } from './constants';

export interface VersionCheckResult {
    isUpdateAvailable: boolean;
    storeVersion: string;
}

const inAppUpdates = new SpInAppUpdates(__DEV__);

// Play Core's update API only works for apps actually installed via Google Play -
// it throws ERROR_APP_NOT_OWNED for sideloaded/adb/debug installs, which is expected
// during development and not worth logging as an error. Android-only, since there's
// no App Store listing for this app yet.
export const checkVersion = async (): Promise<VersionCheckResult> => {
    if (Platform.OS !== 'android') {
        return { isUpdateAvailable: false, storeVersion: APP_CONFIG.APP_VERSION };
    }

    try {
        const result = await inAppUpdates.checkNeedsUpdate({ curVersion: APP_CONFIG.APP_VERSION });
        return {
            isUpdateAvailable: result.shouldUpdate,
            storeVersion: result.storeVersion || APP_CONFIG.APP_VERSION,
        };
    } catch (error) {
        if (!String(error).includes('APP_NOT_OWNED')) {
            console.error('Error checking for version update:', error);
        }
        return { isUpdateAvailable: false, storeVersion: APP_CONFIG.APP_VERSION };
    }
};

export const startInAppUpdate = () => {
    if (Platform.OS !== 'android') return;
    inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE }).catch((error) => {
        console.error('Failed to start in-app update:', error);
    });
};
