import { Alert, Linking } from 'react-native';

// Google's universal directions URL: opens the Google Maps app when installed and
// falls back to the browser version otherwise, on both platforms, and starts from
// the person's current location - so it needs no per-platform scheme handling.
export const openDirections = async (lat: number, lng: number): Promise<void> => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    try {
        await Linking.openURL(url);
    } catch (error) {
        console.error('Failed to open directions:', error);
        Alert.alert('Could not open Maps', 'No maps app was available to open directions.');
    }
};
