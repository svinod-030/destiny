import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';

export default function NameEntryScreen() {
    const [input, setInput] = useState('');
    const setName = useAuthStore((state) => state.setName);

    const handleContinue = () => {
        if (!input.trim()) return;
        setName(input);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1 justify-center px-8">
                        <View className="items-center mb-10">
                            <View className="bg-blue-600/20 p-6 rounded-full mb-6">
                                <Ionicons name="compass-outline" size={60} color="#3b82f6" />
                            </View>
                            <Text className="text-white text-3xl font-black text-center">Welcome to Destiny</Text>
                            <Text className="text-gray-400 text-center mt-3 text-base leading-6">
                                What should your group see you as?
                            </Text>
                        </View>

                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Your name"
                            placeholderTextColor="#4b5563"
                            autoFocus
                            autoCapitalize="words"
                            className="bg-gray-800 text-white p-5 rounded-2xl border border-gray-700 text-lg mb-6"
                            selectionColor="#3b82f6"
                            onSubmitEditing={handleContinue}
                            returnKeyType="done"
                        />

                        <TouchableOpacity
                            onPress={handleContinue}
                            disabled={!input.trim()}
                            className={`p-5 rounded-2xl items-center ${input.trim() ? 'bg-blue-600 active:bg-blue-700' : 'bg-blue-600/30'
                                }`}
                        >
                            <Text className="text-white font-black uppercase tracking-widest">Continue</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
