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
// is still active even when ConvoyMates isn't the app on screen.
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

const ARRIVAL_CHANNEL_ID = 'journey-arrivals';

let arrivalChannelReady = false;

const ensureArrivalChannel = async () => {
    if (arrivalChannelReady) return;
    await Notifications.setNotificationChannelAsync(ARRIVAL_CHANNEL_ID, {
        name: 'Arrivals',
        importance: Notifications.AndroidImportance.HIGH,
    });
    arrivalChannelReady = true;
};

// A one-off (dismissable) notification fired the moment a member's live position
// crosses into the destination's arrival radius. Every device watching the same
// journey detects this independently from the shared Firestore subscription, so
// no server/push infrastructure is needed for the rest of the group to find out.
export const showArrivalNotification = async (memberName: string, isSelf: boolean) => {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        await ensureArrivalChannel();
        await Notifications.scheduleNotificationAsync({
            content: {
                title: isSelf ? "You've arrived!" : 'Destination reached',
                body: isSelf ? "You've reached the destination." : `${memberName} has reached the destination.`,
                sound: true,
            },
            trigger: { channelId: ARRIVAL_CHANNEL_ID },
        });
    } catch (e) {
        console.error('Failed to show arrival notification:', e);
    }
};
