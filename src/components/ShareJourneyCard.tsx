import React from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

interface ShareJourneyCardProps {
    journeyId: string;
}

export const ShareJourneyCard: React.FC<ShareJourneyCardProps> = ({ journeyId }) => {
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join my journey on Destiny! Enter this code: ${journeyId}`,
            });
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    return (
        <View className="bg-gray-800 p-6 rounded-3xl items-center border border-gray-700">
            <Text className="text-gray-500 text-[10px] font-black uppercase mb-4 tracking-[4px]">
                Journey Code
            </Text>

            <View className="bg-white p-3 rounded-2xl mb-4">
                <QRCode value={journeyId} size={180} />
            </View>

            <Text className="text-white font-black text-3xl tracking-[6px] mb-4">{journeyId}</Text>

            <TouchableOpacity
                onPress={handleShare}
                className="flex-row items-center bg-blue-600 px-6 py-3 rounded-2xl active:bg-blue-700"
            >
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text className="text-white font-black ml-2 uppercase tracking-widest text-sm">
                    Share
                </Text>
            </TouchableOpacity>
        </View>
    );
};
