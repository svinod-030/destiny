import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PermissionDisclosureModalProps {
    visible: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    message: string;
    confirmLabel?: string;
    onAllow: () => void;
    onDeny: () => void;
}

// Google Play's Prominent Disclosure requirement applies to every runtime
// permission request, not just background location: each one must be
// immediately preceded by an in-app explanation, with an explicit tap
// required before the OS permission dialog fires. This is the shared,
// generic version of that pattern for permissions that only need a single
// short explanation (camera, photo library, foreground location) - see
// BackgroundLocationDisclosureModal for the richer background-location one.
export function PermissionDisclosureModal({
    visible,
    icon,
    iconColor,
    title,
    message,
    confirmLabel = 'Allow',
    onAllow,
    onDeny,
}: PermissionDisclosureModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onDeny}>
            <View className="flex-1 bg-black/70 justify-center items-center px-6">
                <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm">
                    <View className="items-center mb-4">
                        <View className="p-4 rounded-full mb-3" style={{ backgroundColor: `${iconColor}20` }}>
                            <Ionicons name={icon} size={32} color={iconColor} />
                        </View>
                        <Text className="text-gray-900 dark:text-white text-xl font-bold text-center">{title}</Text>
                    </View>

                    <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5 mb-5">{message}</Text>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={onDeny}
                            className="flex-1 p-4 rounded-2xl items-center border border-gray-300 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-700"
                        >
                            <Text className="text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-xs">
                                Not Now
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onAllow}
                            className="flex-1 p-4 rounded-2xl items-center bg-blue-600 active:bg-blue-700"
                        >
                            <Text className="text-white font-bold uppercase tracking-wider text-xs">{confirmLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
