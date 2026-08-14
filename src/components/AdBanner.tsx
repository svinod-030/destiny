import React from 'react';
import { View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useAdConfigStore } from '../store/useAdConfigStore';

const PROD_UNIT_ID = Platform.select({
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_ANDROID,
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_IOS,
});

// Google's public test unit ID whenever a real one isn't configured yet (or
// in __DEV__, so local builds never accidentally request real ads).
const UNIT_ID = __DEV__ || !PROD_UNIT_ID ? TestIds.BANNER : PROD_UNIT_ID;

/**
 * Renders nothing unless the remote `adsEnabled` flag (config/features in
 * Firestore, synced into useAdConfigStore from App.tsx) is on. A failed ad
 * load is swallowed - no fill / no network are routine and must never break
 * the screen it's placed on.
 */
export default function AdBanner() {
    const adsEnabled = useAdConfigStore((state) => state.adsEnabled);

    if (!adsEnabled) return null;

    return (
        <View className="items-center bg-gray-50 dark:bg-gray-900">
            <BannerAd unitId={UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} onAdFailedToLoad={() => {}} />
        </View>
    );
}
