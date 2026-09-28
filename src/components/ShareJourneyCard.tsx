import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.vinodsigadana.destiny';

interface ShareJourneyCardProps {
    journeyId: string;
    onClose?: () => void;
}

export const ShareJourneyCard: React.FC<ShareJourneyCardProps> = ({ journeyId, onClose }) => {
    const viewShotRef = useRef<ViewShot>(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const uri = await viewShotRef.current?.capture?.();
            const message = `Join my journey on RoadTrip! Enter this code: ${journeyId}\n\nDon't have the app? Download it here: ${PLAY_STORE_URL}`;

            await Share.open({
                title: 'Join my journey on RoadTrip',
                message,
                url: uri,
                type: 'image/png',
            });
        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                console.error('Share failed:', error);
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <View
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl items-center border border-gray-200 dark:border-gray-700"
            style={{
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
            }}
        >
            {onClose && (
                <TouchableOpacity
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    className="absolute top-3 right-3 z-10 bg-gray-100 dark:bg-gray-700 p-2 rounded-full active:bg-gray-200 dark:active:bg-gray-600"
                >
                    <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
            )}

            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                <View className="items-center bg-white dark:bg-gray-800 px-4">
                    <Text className="text-gray-500 text-[10px] font-bold uppercase mb-4 tracking-[4px]">
                        Journey Code
                    </Text>

                    {/* Always white, regardless of theme - QR codes need contrast to scan reliably */}
                    <View className="bg-white p-3 rounded-2xl mb-4 border border-gray-200">
                        <QRCode value={journeyId} size={180} />
                    </View>

                    <Text className="text-gray-900 dark:text-white font-bold text-3xl tracking-[6px]">{journeyId}</Text>
                </View>
            </ViewShot>

            <TouchableOpacity
                onPress={handleShare}
                disabled={isSharing}
                accessibilityRole="button"
                accessibilityLabel="Share journey invite"
                accessibilityHint="Opens the share sheet to send your journey code and QR code to others"
                className="flex-row items-center justify-center bg-ocean-600 px-6 py-3 rounded-2xl active:bg-ocean-700 mt-6 self-stretch"
            >
                {isSharing ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        <Ionicons name="share-social-outline" size={18} color="#fff" />
                        <Text
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.4}
                            className="text-white font-bold ml-2 uppercase tracking-wide text-sm"
                        >
                            Share Invite
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};
