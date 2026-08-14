// app.json stays the static, committed source of truth for everything except
// the Google Maps API key. That value is injected here from the environment
// at config-evaluation time, so the real key never sits in a file that's
// checked into git (see EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env / .env.example).
const appJson = require('./app.json');

// Google's public AdMob test app IDs - always safe to build with, so a
// fresh checkout without .env still produces a working (test-ad-serving)
// build. Real IDs go in .env once an AdMob account exists.
const TEST_ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_ADMOB_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

module.exports = () => {
    const config = appJson.expo;
    config.android.config.googleMaps.apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    config.plugins.push([
        'react-native-google-mobile-ads',
        {
            androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || TEST_ADMOB_ANDROID_APP_ID,
            iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || TEST_ADMOB_IOS_APP_ID,
        },
    ]);
    return config;
};
