import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'journey-in-progress';
const NOTIFICATION_ID = 'journey-in-progress-notification';

let channelReady = false;

const ensureChannel = async () => {
    if (channelReady) return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Journey in progress',
        importance: Notifications.AndroidImportance.LOW,
    });
    channelReady = true;
};

// A persistent (non-swipeable) notification shown only while location is being
// shared in the background, so it's always obvious to the user that tracking
// is still active even when Destiny isn't the app on screen.
export const showJourneyNotification = async () => {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            const result = await Notifications.requestPermissionsAsync();
            if (result.status !== 'granted') return;
        }

        await ensureChannel();
        await Notifications.scheduleNotificationAsync({
            identifier: NOTIFICATION_ID,
            content: {
                title: 'Journey in progress',
                body: 'Sharing your location with your group, even in the background.',
                sticky: true,
                autoDismiss: false,
            },
            trigger: { channelId: CHANNEL_ID },
        });
    } catch (e) {
        console.error('Failed to show journey notification:', e);
    }
};

export const dismissJourneyNotification = () =>
    Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => { });
