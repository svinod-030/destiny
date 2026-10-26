import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';
import { decodePolyline, LatLng } from '../utils/polyline';

// Calls the getDirections Cloud Function (functions/src/index.ts) rather than
// Google directly, so the key stays server-side - same approach as placesService.
interface DirectionsResponse {
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
    legs: { distanceMeters: number; durationSeconds: number }[];
}

const directionsCallable = httpsCallable<
    {
        origin: { lat: number; lng: number };
        destination: { lat: number; lng: number };
        waypoints: { lat: number; lng: number }[];
    },
    DirectionsResponse
>(functions, 'getDirections');

export interface JourneyRoute {
    coordinates: LatLng[];
    distanceMeters: number;
    durationSeconds: number;
    legs: { distanceMeters: number; durationSeconds: number }[];
}

interface Point {
    lat: number;
    lng: number;
}

export const directionsService = {
    /**
     * Driving route from `origin`, through `stops` in the order given, to `destination`.
     */
    getRoute: async (origin: Point, stops: Point[], destination: Point): Promise<JourneyRoute> => {
        const result = await directionsCallable({
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            waypoints: stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        });
        const { encodedPolyline, distanceMeters, durationSeconds, legs } = result.data;
        return { coordinates: decodePolyline(encodedPolyline), distanceMeters, durationSeconds, legs };
    },
};
