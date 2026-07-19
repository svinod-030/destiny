import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { journeyService } from '../services/journeyService';

interface UseLiveLocationOptions {
    journeyId: string | null;
    memberId: string | null;
    enabled: boolean;
}

// Foreground-only tracking: updates stop while the app is backgrounded, which keeps
// the permission ask simple (no "Always Allow" prompt) and avoids background-task setup.
export const useLiveLocation = ({ journeyId, memberId, enabled }: UseLiveLocationOptions) => {
    const [permissionDenied, setPermissionDenied] = useState(false);
    const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        if (!enabled || !journeyId || !memberId) return;

        let isMounted = true;

        const start = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (isMounted) setPermissionDenied(true);
                return;
            }
            if (isMounted) setPermissionDenied(false);

            subscriptionRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 8000,
                    distanceInterval: 15,
                },
                (location) => {
                    journeyService
                        .updateMemberLocation(
                            journeyId,
                            memberId,
                            location.coords.latitude,
                            location.coords.longitude,
                            location.coords.heading
                        )
                        .catch((error) => console.error('Failed to push location:', error));
                }
            );
        };

        start();

        return () => {
            isMounted = false;
            subscriptionRef.current?.remove();
            subscriptionRef.current = null;
        };
    }, [enabled, journeyId, memberId]);

    return { permissionDenied };
};
