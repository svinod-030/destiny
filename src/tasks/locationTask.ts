import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationObject } from 'expo-location';
import { journeyService } from '../services/journeyService';
import { distanceInMeters, hasArrived } from '../utils/geo';

export const BACKGROUND_LOCATION_TASK = 'destiny-background-location';

const TARGET_KEY = 'destiny-background-location-target';

interface BackgroundLocationTarget {
    journeyId: string;
    memberId: string;
    destination?: { lat: number; lng: number } | null;
}

export const setBackgroundLocationTarget = (
    journeyId: string,
    memberId: string,
    destination?: { lat: number; lng: number } | null
) => AsyncStorage.setItem(TARGET_KEY, JSON.stringify({ journeyId, memberId, destination } satisfies BackgroundLocationTarget));

export const clearBackgroundLocationTarget = () => AsyncStorage.removeItem(TARGET_KEY);

// Defined at module scope so it registers on app startup, including a headless relaunch
// after the OS kills the app while a background location task is still active.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Background location task error:', error);
        return;
    }

    const location = (data as { locations?: LocationObject[] } | undefined)?.locations?.[0];
    if (!location) return;

    try {
        const raw = await AsyncStorage.getItem(TARGET_KEY);
        if (!raw) return;

        const { journeyId, memberId, destination }: BackgroundLocationTarget = JSON.parse(raw);
        if (!journeyId || !memberId) return;

        const arrived = destination
            ? hasArrived(
                  distanceInMeters(location.coords.latitude, location.coords.longitude, destination.lat, destination.lng)
              )
            : false;

        await journeyService.updateMemberLocation(
            journeyId,
            memberId,
            location.coords.latitude,
            location.coords.longitude,
            location.coords.heading,
            arrived
        );
    } catch (e) {
        console.error('Failed to push background location:', e);
    }
});
