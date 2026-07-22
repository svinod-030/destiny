import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.vinodsigadana.destiny';

interface ShareJourneyCardProps {
    journeyId: string;
}

export const ShareJourneyCard: React.FC<ShareJourneyCardProps> = ({ journeyId }) => {
    const viewShotRef = useRef<ViewShot>(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const uri = await viewShotRef.current?.capture?.();
            const message = `Join my journey on Destiny! Enter this code: ${journeyId}\n\nDon't have the app? Download it here: ${PLAY_STORE_URL}`;

            await Share.open({
                title: 'Join my journey on Destiny',
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
        <View className="bg-white dark:bg-gray-800 p-6 rounded-3xl items-center border border-gray-200 dark:border-gray-700">
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
                className="flex-row items-center bg-blue-600 px-6 py-3 rounded-2xl active:bg-blue-700 mt-6"
            >
                {isSharing ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        <Ionicons name="share-outline" size={18} color="#fff" />
                        <Text className="text-white font-bold ml-2 uppercase tracking-widest text-sm">
                            Share
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};
