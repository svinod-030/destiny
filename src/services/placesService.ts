const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface PlaceSuggestion {
    placeId: string;
    primaryText: string;
    secondaryText: string;
}

export interface PlaceDetails {
    name: string;
    lat: number;
    lng: number;
}

const generateSessionToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const placesService = {
    isConfigured: () => !!API_KEY,

    newSessionToken: generateSessionToken,

    /**
     * Fetches live autocomplete suggestions for a partial search query, biased
     * toward a given location (e.g. the user's current position) when provided.
     */
    autocomplete: async (
        query: string,
        sessionToken: string,
        near?: { lat: number; lng: number }
    ): Promise<PlaceSuggestion[]> => {
        if (!API_KEY || !query.trim()) return [];

        const params = new URLSearchParams({
            input: query,
            key: API_KEY,
            sessiontoken: sessionToken,
        });
        if (near) {
            params.set('location', `${near.lat},${near.lng}`);
            params.set('radius', '50000');
        }

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
        );
        const json = await response.json();

        if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
            throw new Error(json.error_message || `Places autocomplete failed: ${json.status}`);
        }

        return (json.predictions || []).map((prediction: any) => ({
            placeId: prediction.place_id,
            primaryText: prediction.structured_formatting?.main_text || prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text || '',
        }));
    },

    /**
     * Resolves a suggestion's place_id to coordinates, closing out the billing session.
     */
    getPlaceDetails: async (placeId: string, sessionToken: string): Promise<PlaceDetails | null> => {
        if (!API_KEY) return null;

        const params = new URLSearchParams({
            place_id: placeId,
            key: API_KEY,
            sessiontoken: sessionToken,
            fields: 'name,geometry',
        });

        const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
        const json = await response.json();

        if (json.status !== 'OK') {
            throw new Error(json.error_message || `Place details failed: ${json.status}`);
        }

        const { name, geometry } = json.result;
        return { name, lat: geometry.location.lat, lng: geometry.location.lng };
    },
};
