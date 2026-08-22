import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { startInAppUpdate } from '../utils/versionCheckService';

interface UpdateModalProps {
    visible: boolean;
    onClose: () => void;
    storeVersion: string;
}

export default function UpdateModal({ visible, onClose, storeVersion }: UpdateModalProps) {
    const handleUpdate = () => {
        startInAppUpdate();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/70 justify-center items-center px-6">
                <View className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl border border-gray-200 dark:border-gray-700 items-center p-8">
                    <View className="bg-blue-600/20 p-6 rounded-full mb-6">
                        <Ionicons name="rocket-outline" size={40} color="#3b82f6" />
                    </View>

                    <Text className="text-gray-900 dark:text-white text-2xl font-bold text-center mb-2">
                        Update Available
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-5">
                        A new version{storeVersion ? ` (${storeVersion})` : ''} of ConvoyMates is available with new
                        features and improvements.
                    </Text>

                    <TouchableOpacity
                        onPress={handleUpdate}
                        className="bg-blue-600 w-full p-5 rounded-2xl items-center active:bg-blue-700"
                    >
                        <Text className="text-white font-bold uppercase tracking-widest">Update Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} className="mt-4 py-2">
                        <Text className="text-gray-500 dark:text-gray-400 font-bold">Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
