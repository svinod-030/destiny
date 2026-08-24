import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, ThemePreference } from '../store/useThemeStore';
import { useThemeColors } from '../utils/theme';
import { APP_CONFIG } from '../utils/constants';
import { LOCATION_DISCLOSURE_PARAGRAPHS } from '../components/BackgroundLocationDisclosureModal';
import AdBanner from '../components/AdBanner';

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
    { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    color = '#3b82f6',
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
}) => (
    <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 mb-3 active:bg-gray-100 dark:active:bg-gray-700"
    >
        <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${color}20` }}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <View className="flex-1">
            <Text className="text-gray-900 dark:text-white font-semibold text-base">{title}</Text>
            {subtitle && <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{subtitle}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
);

export default function SettingsScreen() {
    const { name, setName } = useAuthStore();
    const [input, setInput] = useState(name);
    const { preference, setPreference } = useThemeStore();
    const colors = useThemeColors();
    const [locationInfoVisible, setLocationInfoVisible] = useState(false);

    const handleSave = () => {
        if (!input.trim()) {
            Alert.alert('Name required', 'Please enter a name so your group can recognize you.');
            return;
        }
        setName(input);
        Alert.alert('Saved', 'Your display name has been updated.');
    };

    const handleRateApp = () => {
        Linking.openURL(APP_CONFIG.STORE_URL_ANDROID);
    };

    const handleContactUs = () => {
        Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}?subject=ConvoyMates Support ${APP_CONFIG.APP_VERSION}`);
    };

    const handlePrivacyPolicy = () => {
        Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}>
                    <View className="items-center mb-8">
                        <View className="bg-blue-600/20 p-6 rounded-full mb-4">
                            <Ionicons name="person-circle-outline" size={60} color="#3b82f6" />
                        </View>
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold">Settings</Text>
                    </View>

                    <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 tracking-[3px] ml-1">
                        Display Name
                    </Text>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Your name"
                        placeholderTextColor={colors.placeholder}
                        autoCapitalize="words"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-lg mb-6"
                        selectionColor="#3b82f6"
                    />

                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-blue-600 p-5 rounded-2xl items-center active:bg-blue-700 mb-10"
                    >
                        <Text className="text-white font-bold uppercase tracking-widest">Save</Text>
                    </TouchableOpacity>

                    <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 tracking-[3px] ml-1">
                        Appearance
                    </Text>
                    <View className="flex-row gap-3">
                        {APPEARANCE_OPTIONS.map((option) => {
                            const isActive = preference === option.value;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => setPreference(option.value)}
                                    className={`flex-1 items-center py-4 rounded-2xl border ${isActive
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <Ionicons
                                        name={option.icon}
                                        size={22}
                                        color={isActive ? '#fff' : colors.textSecondary}
                                    />
                                    <Text
                                        className={`mt-2 text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 mt-8 tracking-[3px] ml-1">
                        App
                    </Text>
                    <SettingItem
                        icon="star"
                        title="Rate App"
                        subtitle="Rate us on the Play Store"
                        onPress={handleRateApp}
                        color="#f59e0b"
                    />
                    <SettingItem
                        icon="chatbubble-ellipses"
                        title="Contact Us"
                        subtitle="Support and feedback"
                        onPress={handleContactUs}
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Privacy Policy"
                        subtitle="What data we collect and why"
                        onPress={handlePrivacyPolicy}
                        color="#6b7280"
                    />
                    <SettingItem
                        icon="navigate-circle-outline"
                        title="Location Access"
                        subtitle="How ConvoyMates uses your location"
                        onPress={() => setLocationInfoVisible(true)}
                        color="#10b981"
                    />

                    <View className="items-center mt-6">
                        <Text className="text-gray-500 dark:text-gray-400 font-bold text-base">ConvoyMates</Text>
                        <Text className="text-gray-400 dark:text-gray-600 text-sm mt-1">
                            Version {APP_CONFIG.APP_VERSION}
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <AdBanner />

            <Modal
                visible={locationInfoVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLocationInfoVisible(false)}
            >
                <View className="flex-1 bg-black/70 justify-center items-center px-6">
                    <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm">
                        <View className="items-center mb-4">
                            <View className="bg-green-600/20 p-4 rounded-full mb-3">
                                <Ionicons name="navigate-circle-outline" size={32} color="#10b981" />
                            </View>
                            <Text className="text-gray-900 dark:text-white text-xl font-bold text-center">
                                Location Access
                            </Text>
                        </View>

                        <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5 mb-3">
                            ConvoyMates only reads your location while you're actively part of a journey, to share
                            your position with your group on the live map.
                        </Text>
                        {LOCATION_DISCLOSURE_PARAGRAPHS.map((paragraph) => (
                            <Text key={paragraph} className="text-gray-600 dark:text-gray-300 text-sm leading-5 mb-3">
                                {paragraph}
                            </Text>
                        ))}
                        <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5 mb-4">
                            Background access is entirely optional and requested separately, only when you choose
                            to enable it — declining it doesn't stop you from using the app.
                        </Text>

                        <TouchableOpacity onPress={handlePrivacyPolicy} className="mb-5">
                            <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold underline">
                                Read our full Privacy Policy
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setLocationInfoVisible(false)}
                            className="p-4 rounded-2xl items-center bg-blue-600 active:bg-blue-700"
                        >
                            <Text className="text-white font-bold uppercase tracking-wider text-xs">Got It</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
