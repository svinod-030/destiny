import React from 'react';
import { View, Text, TouchableOpacity, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../utils/constants';

interface BackgroundLocationDisclosureModalProps {
    visible: boolean;
    onAllow: () => void;
    onDeny: () => void;
}

// Shared with SettingsScreen's static "Location Access" info entry, so the
// disclosure is discoverable even by someone (or an automated reviewer) who
// never creates/joins a journey and so never sees this contextual modal.
export const LOCATION_DISCLOSURE_PARAGRAPHS = [
    "ConvoyMates collects your device's location — including while the app is closed or not in " +
        'use — so your journey group can keep seeing your live position, even when you switch to ' +
        'another app like Maps for directions.',
    "This only happens while you're actively part of a journey, and stops the moment you leave " +
        "or end it. A persistent notification stays visible the entire time it's active.",
];

// Google Play's "Prominent Disclosure and Consent Requirement" for background
// location access requires a distinct in-app screen (not just the OS permission
// dialog) that explicitly states location is collected even when the app is
// closed, explains why, links to the full privacy policy, and requires an
// affirmative tap to proceed - shown right before requesting the OS "Always"
// permission (see useLiveLocation.enableBackgroundTracking).
export function BackgroundLocationDisclosureModal({ visible, onAllow, onDeny }: BackgroundLocationDisclosureModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onDeny}>
            <View className="flex-1 bg-black/70 justify-center items-center px-6">
                <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm">
                    <View className="items-center mb-4">
                        <View className="bg-blue-600/20 p-4 rounded-full mb-3">
                            <Ionicons name="location" size={32} color="#3b82f6" />
                        </View>
                        <Text className="text-gray-900 dark:text-white text-xl font-bold text-center">
                            Background Location Access
                        </Text>
                    </View>

                    <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5 mb-3">
                        {LOCATION_DISCLOSURE_PARAGRAPHS[0]}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5 mb-4">
                        {LOCATION_DISCLOSURE_PARAGRAPHS[1]}
                    </Text>

                    <TouchableOpacity onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)} className="mb-5">
                        <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold underline">
                            Read our full Privacy Policy
                        </Text>
                    </TouchableOpacity>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={onDeny}
                            className="flex-1 p-4 rounded-2xl items-center border border-gray-300 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-700"
                        >
                            <Text className="text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-xs">
                                Don't Allow
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onAllow}
                            className="flex-1 p-4 rounded-2xl items-center bg-blue-600 active:bg-blue-700"
                        >
                            <Text className="text-white font-bold uppercase tracking-wider text-xs">
                                Allow
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
