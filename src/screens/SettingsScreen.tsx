import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';

export default function SettingsScreen() {
    const { name, setName } = useAuthStore();
    const [input, setInput] = useState(name);

    const handleSave = () => {
        if (!input.trim()) {
            Alert.alert('Name required', 'Please enter a name so your group can recognize you.');
            return;
        }
        setName(input);
        Alert.alert('Saved', 'Your display name has been updated.');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900" edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="px-6 pt-8">
                    <View className="items-center mb-8">
                        <View className="bg-blue-600/20 p-6 rounded-full mb-4">
                            <Ionicons name="person-circle-outline" size={60} color="#3b82f6" />
                        </View>
                        <Text className="text-white text-2xl font-black">Settings</Text>
                    </View>

                    <Text className="text-gray-500 text-[10px] font-black uppercase mb-2 tracking-[3px] ml-1">
                        Display Name
                    </Text>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Your name"
                        placeholderTextColor="#4b5563"
                        autoCapitalize="words"
                        className="bg-gray-800 text-white p-5 rounded-2xl border border-gray-700 text-lg mb-6"
                        selectionColor="#3b82f6"
                    />

                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-blue-600 p-5 rounded-2xl items-center active:bg-blue-700"
                    >
                        <Text className="text-white font-black uppercase tracking-widest">Save</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
