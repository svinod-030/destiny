import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationObject } from 'expo-location';
import { journeyService } from '../services/journeyService';

export const BACKGROUND_LOCATION_TASK = 'destiny-background-location';

const TARGET_KEY = 'destiny-background-location-target';

interface BackgroundLocationTarget {
    journeyId: string;
    memberId: string;
}

export const setBackgroundLocationTarget = (journeyId: string, memberId: string) =>
    AsyncStorage.setItem(TARGET_KEY, JSON.stringify({ journeyId, memberId } satisfies BackgroundLocationTarget));

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

        const { journeyId, memberId }: BackgroundLocationTarget = JSON.parse(raw);
        if (!journeyId || !memberId) return;

        await journeyService.updateMemberLocation(
            journeyId,
            memberId,
            location.coords.latitude,
            location.coords.longitude,
            location.coords.heading
        );
    } catch (e) {
        console.error('Failed to push background location:', e);
    }
});
