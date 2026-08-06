// app.json stays the static, committed source of truth for everything except
// the Google Maps API key. That value is injected here from the environment
// at config-evaluation time, so the real key never sits in a file that's
// checked into git (see EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env / .env.example).
const appJson = require('./app.json');

module.exports = () => {
    const config = appJson.expo;
    config.android.config.googleMaps.apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    return config;
};
