import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJourneyHistoryStore } from '../store/useJourneyHistoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { journeyHistoryService } from '../services/journeyHistoryService';
import { getInitials } from '../utils/color';
import { RouteList } from '../components/RouteList';
import AdBanner from '../components/AdBanner';

export default function JourneyHistoryDetailScreen({ navigation, route }: any) {
    const entryId: string = route.params?.entryId;
    const entry = useJourneyHistoryStore((state) => state.entries.find((e) => e.id === entryId));
    const removeEntry = useJourneyHistoryStore((state) => state.removeEntry);
    const uid = useAuthStore((state) => state.uid);

    if (!entry) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-8" edges={['left', 'right']}>
                <Text className="text-gray-500 dark:text-gray-400 text-center text-base">This journey is no longer available.</Text>
            </SafeAreaView>
        );
    }

    const isEnded = entry.status === 'ended';
    const members = entry.members ?? [];

    const handleDelete = () => {
        Alert.alert(
            'Delete journey?',
            'This removes it from your history. The other members keep their own copies.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        removeEntry(entry.id);
                        navigation.goBack();
                        if (uid) {
                            journeyHistoryService.deleteEntry(uid, entry.id).catch((error) => {
                                console.error('Failed to delete journey history entry:', error);
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleRepeat = () => {
        navigation.navigate('HomeTabs', {
            screen: 'Start',
            params: { repeatFrom: { destination: entry.destination, stops: entry.stops ?? [] } },
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['left', 'right']}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
                <View className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 mb-6">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-gray-900 dark:text-white text-xl font-bold flex-1 mr-3" numberOfLines={2}>
                            {entry.destination?.name ?? 'Unknown destination'}
                        </Text>
                        <View className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            <Text className="text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                                {entry.role}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-gray-500 text-xs mt-2">
                        Started {new Date(entry.startedAt).toLocaleString()}
                    </Text>
                    {isEnded && entry.endedAt && (
                        <Text className="text-gray-500 text-xs mt-1">
                            Ended {new Date(entry.endedAt).toLocaleString()}
                        </Text>
                    )}
                </View>

                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] mb-3 ml-1">
                    Members{entry.members ? ` · ${members.length}` : ''}
                </Text>
                {entry.members ? (
                    <View className="gap-2 mb-6">
                        {members.map((member) => (
                            <View
                                key={member.id}
                                className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700"
                            >
                                <View
                                    style={{ backgroundColor: member.color }}
                                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                >
                                    <Text className="text-white font-bold">{getInitials(member.name)}</Text>
                                </View>
                                <Text className="text-gray-900 dark:text-white font-bold text-base flex-1" numberOfLines={1}>
                                    {member.name}
                                </Text>
                                {member.isCreator && (
                                    <View className="bg-ocean-600/10 px-2 py-0.5 rounded-full">
                                        <Text className="text-ocean-600 dark:text-ocean-400 text-[10px] font-bold uppercase tracking-widest">
                                            Creator
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text className="text-gray-500 dark:text-gray-400 text-sm mb-6 ml-1">
                        Members weren't recorded for this journey.
                    </Text>
                )}

                <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] mb-3 ml-1">Locations</Text>
                <View className="mb-6">
                    <RouteList destination={entry.destination} stops={entry.stops ?? []} />
                </View>

                {isEnded && (
                    <TouchableOpacity
                        onPress={handleRepeat}
                        className="flex-row items-center justify-center bg-ocean-600/10 border border-ocean-600/30 rounded-2xl py-3.5"
                    >
                        <Ionicons name="repeat" size={18} color="#0B74B1" />
                        <Text className="text-ocean-600 dark:text-ocean-400 font-bold text-sm uppercase tracking-wider ml-2">
                            Repeat Journey
                        </Text>
                    </TouchableOpacity>
                )}

                {isEnded && (
                    <TouchableOpacity
                        onPress={handleDelete}
                        accessibilityRole="button"
                        accessibilityLabel="Delete journey from history"
                        className="flex-row items-center justify-center rounded-2xl py-3.5 mt-3 border border-red-600/40 bg-red-600/10"
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        <Text className="text-red-500 font-bold text-sm uppercase tracking-wider ml-2">
                            Delete Journey
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
            <AdBanner />
        </SafeAreaView>
    );
}
