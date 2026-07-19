// Uses the Places API (New) - the legacy `maps.googleapis.com/maps/api/place/*`
// endpoints return a "legacy API not enabled" error on projects that only have
// the newer API turned on, which is now Google's default for newly enabled keys.
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';

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

        const body: Record<string, unknown> = {
            input: query,
            sessionToken,
        };
        if (near) {
            body.locationBias = {
                circle: {
                    center: { latitude: near.lat, longitude: near.lng },
                    radius: 50000,
                },
            };
        }

        const response = await fetch(AUTOCOMPLETE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
            },
            body: JSON.stringify(body),
        });
        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.error?.message || `Places autocomplete failed: ${response.status}`);
        }

        return (json.suggestions || [])
            .filter((suggestion: any) => suggestion.placePrediction)
            .map((suggestion: any) => {
                const prediction = suggestion.placePrediction;
                return {
                    placeId: prediction.placeId,
                    primaryText: prediction.structuredFormat?.mainText?.text || prediction.text?.text,
                    secondaryText: prediction.structuredFormat?.secondaryText?.text || '',
                };
            });
    },

    /**
     * Resolves a suggestion's place_id to coordinates.
     */
    getPlaceDetails: async (placeId: string, sessionToken: string): Promise<PlaceDetails | null> => {
        if (!API_KEY) return null;

        const params = new URLSearchParams({ sessionToken });
        const response = await fetch(`${DETAILS_URL}/${placeId}?${params.toString()}`, {
            headers: {
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'displayName,location',
            },
        });
        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.error?.message || `Place details failed: ${response.status}`);
        }

        return {
            name: json.displayName?.text || '',
            lat: json.location.latitude,
            lng: json.location.longitude,
        };
    },
};
