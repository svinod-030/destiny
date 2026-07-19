import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJourneyHistoryStore, JourneyHistoryEntry } from '../store/useJourneyHistoryStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { journeyService } from '../services/journeyService';

export default function JourneyHistoryScreen({ navigation }: any) {
    const entries = useJourneyHistoryStore((state) => state.entries);
    const addHistoryEntry = useJourneyHistoryStore((state) => state.addEntry);
    const journeyId = useJourneyStore((state) => state.journeyId);
    const setActiveJourney = useJourneyStore((state) => state.setActiveJourney);

    const handlePressActive = async (entry: JourneyHistoryEntry) => {
        if (entry.id === journeyId) {
            navigation.navigate('JourneyMap');
            return;
        }

        // Stale "active" entry (e.g. the app was killed mid-journey) - check whether
        // it's actually still running before jumping back in.
        const journey = await journeyService.getJourney(entry.id);
        if (!journey) {
            addHistoryEntry({ ...entry, status: 'ended', endedAt: new Date().toISOString() });
            Alert.alert('Journey ended', 'This journey is no longer active.');
            return;
        }

        setActiveJourney(entry.id, entry.role);
        navigation.navigate('JourneyMap');
    };

    const renderItem = ({ item }: { item: JourneyHistoryEntry }) => {
        const isActive = item.status === 'active';
        const content = (
            <View className="bg-gray-800 p-4 rounded-2xl border border-gray-700 mb-3 flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className="text-white font-bold text-base">{item.destinationName}</Text>
                    <Text className="text-gray-500 text-xs mt-1">
                        {isActive
                            ? `Started ${new Date(item.startedAt).toLocaleString()}`
                            : `Ended ${new Date(item.endedAt as string).toLocaleString()}`}
                    </Text>
                </View>
                <View className="items-end gap-1">
                    {isActive && (
                        <View className="flex-row items-center bg-green-600/20 border border-green-600/40 px-2 py-0.5 rounded-full">
                            <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                            <Text className="text-green-500 text-[10px] font-bold uppercase tracking-widest">
                                Active
                            </Text>
                        </View>
                    )}
                    <View className="bg-gray-700 px-3 py-1 rounded-full">
                        <Text className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                            {item.role}
                        </Text>
                    </View>
                </View>
            </View>
        );

        if (!isActive) return content;

        return (
            <TouchableOpacity onPress={() => handlePressActive(item)} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900" edges={['bottom', 'left', 'right']}>
            <View className="px-4 pt-4 pb-2">
                <Text className="text-white text-2xl font-black">Journeys</Text>
            </View>

            {entries.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="time-outline" size={64} color="#4b5563" />
                    <Text className="text-gray-400 text-center mt-4 text-base">
                        Journeys you create or join will show up here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                />
            )}
        </SafeAreaView>
    );
}
