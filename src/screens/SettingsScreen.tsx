import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, ThemePreference } from '../store/useThemeStore';
import { useThemeColors } from '../utils/theme';

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
    { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
    const { name, setName } = useAuthStore();
    const [input, setInput] = useState(name);
    const { preference, setPreference } = useThemeStore();
    const colors = useThemeColors();

    const handleSave = () => {
        if (!input.trim()) {
            Alert.alert('Name required', 'Please enter a name so your group can recognize you.');
            return;
        }
        setName(input);
        Alert.alert('Saved', 'Your display name has been updated.');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="px-6 pt-8">
                    <View className="items-center mb-8">
                        <View className="bg-blue-600/20 p-6 rounded-full mb-4">
                            <Ionicons name="person-circle-outline" size={60} color="#3b82f6" />
                        </View>
                        <Text className="text-gray-900 dark:text-white text-2xl font-black">Settings</Text>
                    </View>

                    <Text className="text-gray-500 text-[10px] font-black uppercase mb-2 tracking-[3px] ml-1">
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
                        <Text className="text-white font-black uppercase tracking-widest">Save</Text>
                    </TouchableOpacity>

                    <Text className="text-gray-500 text-[10px] font-black uppercase mb-2 tracking-[3px] ml-1">
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
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
