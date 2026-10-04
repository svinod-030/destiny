import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeColors } from '../utils/theme';

export default function NameEntryScreen() {
    const [input, setInput] = useState('');
    const setName = useAuthStore((state) => state.setName);
    const colors = useThemeColors();
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        // This is the very first screen shown on a fresh install, right after
        // the launch animation - focusing immediately on mount races with
        // KeyboardAvoidingView/ScrollView before they've settled their layout,
        // which is what let the keyboard cover the Continue button. A short
        // delay lets that layout finish first.
        const timer = setTimeout(() => inputRef.current?.focus(), 350);
        return () => clearTimeout(timer);
    }, []);

    const handleContinue = () => {
        if (!input.trim()) return;
        setName(input);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <View className="items-center mb-10">
                        <View className="bg-ocean-600/20 p-6 rounded-full mb-6">
                            <Ionicons name="compass-outline" size={60} color="#0B74B1" />
                        </View>
                        <Text className="text-gray-900 dark:text-white text-3xl font-bold text-center">Welcome to RoadTrip</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-center mt-3 text-base leading-6">
                            What should your group see you as?
                        </Text>
                    </View>

                    <TextInput
                        ref={inputRef}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Your name"
                        placeholderTextColor={colors.placeholder}
                        autoCapitalize="words"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-5 rounded-2xl border border-gray-200 dark:border-gray-700 text-lg mb-6"
                        selectionColor="#0B74B1"
                        onSubmitEditing={handleContinue}
                        returnKeyType="done"
                    />

                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={!input.trim()}
                        className={`p-5 rounded-2xl items-center ${input.trim() ? 'bg-ocean-600 active:bg-ocean-700' : 'bg-ocean-600/30'
                            }`}
                        style={
                            input.trim()
                                ? {
                                    shadowColor: '#000',
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    shadowOffset: { width: 0, height: 3 },
                                    elevation: 4,
                                }
                                : undefined
                        }
                    >
                        <Text className="text-white font-bold uppercase tracking-widest">Continue</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
