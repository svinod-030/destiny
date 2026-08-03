import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { journeyService } from '../services/journeyService';
import {
    BACKGROUND_LOCATION_TASK,
    setBackgroundLocationTarget,
    clearBackgroundLocationTarget,
} from '../tasks/locationTask';
import { showJourneyNotification, dismissJourneyNotification } from '../utils/journeyNotification';
import { distanceInMeters, hasArrived } from '../utils/geo';

type Coordinate = { lat: number; lng: number };

interface UseLiveLocationOptions {
    journeyId: string | null;
    memberId: string | null;
    enabled: boolean;
    destination: Coordinate | null;
}

const WATCH_OPTIONS: Location.LocationOptions = {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 8000,
    distanceInterval: 15,
};

const startBackgroundUpdates = async (journeyId: string, memberId: string, destination: Coordinate | null) => {
    await setBackgroundLocationTarget(journeyId, memberId, destination);
    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (alreadyStarted) return;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        ...WATCH_OPTIONS,
        foregroundService: {
            notificationTitle: 'Destiny is sharing your location',
            notificationBody: 'Your group can see your live position for this journey.',
        },
    });
    await showJourneyNotification();
};

// Foreground-only by default (updates pause while the app is backgrounded, so no
// "Always Allow" prompt is needed just to use the app). If the user opts into
// background access when prompted at journey start, we switch to a background
// location task instead, which keeps updating even while the app isn't in view.
export const useLiveLocation = ({ journeyId, memberId, enabled, destination }: UseLiveLocationOptions) => {
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(false);
    const [showBackgroundPrompt, setShowBackgroundPrompt] = useState(false);
    const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

    // The journey's destination is known asynchronously (after the Firestore doc
    // loads), slightly after tracking starts - a ref lets the location callbacks
    // always read the latest value without restarting the watcher/task.
    const destinationRef = useRef(destination);
    useEffect(() => {
        destinationRef.current = destination;
        if (journeyId && memberId) {
            Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).then((started) => {
                if (started) setBackgroundLocationTarget(journeyId, memberId, destination).catch(() => { });
            });
        }
    }, [destination, journeyId, memberId]);

    useEffect(() => {
        if (!enabled || !journeyId || !memberId) return;

        let isMounted = true;

        const pushLocation = (location: Location.LocationObject) => {
            const dest = destinationRef.current;
            const arrived = dest
                ? hasArrived(
                      distanceInMeters(location.coords.latitude, location.coords.longitude, dest.lat, dest.lng)
                  )
                : false;

            return journeyService.updateMemberLocation(
                journeyId,
                memberId,
                location.coords.latitude,
                location.coords.longitude,
                location.coords.heading,
                arrived
            );
        };

        const startForegroundWatch = async () => {
            subscriptionRef.current = await Location.watchPositionAsync(WATCH_OPTIONS, (location) => {
                pushLocation(location).catch((error) => console.error('Failed to push location:', error));
            });
        };

        const start = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (isMounted) setPermissionDenied(true);
                return;
            }
            if (isMounted) setPermissionDenied(false);

            const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
            if (backgroundStatus === 'granted') {
                if (isMounted) setIsBackgroundEnabled(true);
                await startBackgroundUpdates(journeyId, memberId, destinationRef.current);
            } else {
                if (isMounted) setShowBackgroundPrompt(true);
                await startForegroundWatch();
            }
        };

        start();

        return () => {
            isMounted = false;
            subscriptionRef.current?.remove();
            subscriptionRef.current = null;
            clearBackgroundLocationTarget().catch(() => { });
            dismissJourneyNotification();
            Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
                .then((started) => {
                    if (started) return Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
                })
                .catch(() => { });
        };
    }, [enabled, journeyId, memberId]);

    const enableBackgroundTracking = async (): Promise<boolean> => {
        setShowBackgroundPrompt(false);
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status !== 'granted' || !journeyId || !memberId) return false;

        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
        await startBackgroundUpdates(journeyId, memberId, destinationRef.current);
        setIsBackgroundEnabled(true);
        return true;
    };

    const dismissBackgroundPrompt = () => setShowBackgroundPrompt(false);

    return { permissionDenied, isBackgroundEnabled, showBackgroundPrompt, enableBackgroundTracking, dismissBackgroundPrompt };
};
