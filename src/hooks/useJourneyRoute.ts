import { useEffect, useRef, useState } from 'react';
import { Journey } from '../types/journey';
import { directionsService, JourneyRoute } from '../services/directionsService';
import { hasArrived, distanceInMeters } from '../utils/geo';
import { LastFetch, routeKeyFor, shouldRefreshRoute, stopsStillAhead } from '../utils/routeRefresh';

/**
 * Driving route from the viewer's own position, through the journey's stops (in
 * order), to the destination. Personal to each device - everyone is somewhere
 * different. Quietly yields no route if the position isn't known yet, the person has
 * arrived, or the Directions call fails (the map just keeps working without the line).
 */
export const useJourneyRoute = (journey: Journey | null, uid: string | null) => {
    const [route, setRoute] = useState<JourneyRoute | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const lastFetchRef = useRef<LastFetch | null>(null);
    const inFlightRef = useRef(false);

    const me = journey && uid ? journey.members[uid] : undefined;
    const myLat = me?.lat ?? null;
    const myLng = me?.lng ?? null;

    useEffect(() => {
        if (!journey || myLat == null || myLng == null) return;

        const origin = { lat: myLat, lng: myLng };
        const destination = journey.destination;

        if (hasArrived(distanceInMeters(myLat, myLng, destination.lat, destination.lng))) {
            lastFetchRef.current = null;
            setRoute(null);
            return;
        }

        const stops = stopsStillAhead(journey.stops ?? [], origin);
        const routeKey = routeKeyFor(stops, destination);
        if (inFlightRef.current || !shouldRefreshRoute(lastFetchRef.current, origin, routeKey, Date.now())) return;

        inFlightRef.current = true;
        setIsLoading(true);
        directionsService
            .getRoute(origin, stops, destination)
            .then((result) => {
                lastFetchRef.current = { origin, routeKey, at: Date.now(), failed: false };
                setRoute(result);
            })
            .catch((error) => {
                // No line is a fine fallback; log once per attempt and back off (see routeRefresh).
                console.warn('Could not load directions:', error?.message ?? error);
                lastFetchRef.current = { origin, routeKey, at: Date.now(), failed: true };
            })
            .finally(() => {
                inFlightRef.current = false;
                setIsLoading(false);
            });
        // Re-runs on every position / stop change; shouldRefreshRoute decides if it's worth a call.
    }, [journey?.id, journey?.stops, journey?.destination, myLat, myLng]);

    return { route, isLoading };
};
