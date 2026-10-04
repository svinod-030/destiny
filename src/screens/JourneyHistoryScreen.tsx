import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJourneyHistoryStore, JourneyHistoryEntry } from '../store/useJourneyHistoryStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { journeyService } from '../services/journeyService';
import { useThemeColors } from '../utils/theme';
import AdBanner from '../components/AdBanner';

export default function JourneyHistoryScreen({ navigation }: any) {
    const entries = useJourneyHistoryStore((state) => state.entries);
    const addHistoryEntry = useJourneyHistoryStore((state) => state.addEntry);
    const journeyId = useJourneyStore((state) => state.journeyId);
    const setActiveJourney = useJourneyStore((state) => state.setActiveJourney);
    const colors = useThemeColors();

    // Sort by the date shown on each row (ended date once a journey has ended,
    // otherwise when it started) - the store's own order can drift from this
    // since it's really "most recently touched", which reshuffles an entry to
    // the top just because it ended, even if it started before others still active.
    const sortedEntries = useMemo(() => {
        const entryDate = (entry: JourneyHistoryEntry) =>
            new Date(entry.status === 'ended' && entry.endedAt ? entry.endedAt : entry.startedAt).getTime();
        return [...entries].sort((a, b) => entryDate(b) - entryDate(a));
    }, [entries]);

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

    const handleRepeat = (entry: JourneyHistoryEntry) => {
        navigation.navigate('HomeTabs', {
            screen: 'Start',
            params: { repeatFrom: { destination: entry.destination, stops: entry.stops ?? [] } },
        });
    };

    const renderItem = ({ item }: { item: JourneyHistoryEntry }) => {
        const isActive = item.status === 'active';
        const memberCount = item.members?.length;
        const stopCount = item.stops?.length ?? 0;

        const details = [
            memberCount != null ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : null,
            stopCount > 0 ? `${stopCount} ${stopCount === 1 ? 'stop' : 'stops'}` : null,
        ]
            .filter(Boolean)
            .join(' · ');

        return (
            <View
                className="rounded-2xl mb-3"
                style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                }}
            >
                <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <TouchableOpacity
                        onPress={() => {
                            if (isActive) {
                                handlePressActive(item);
                            } else {
                                navigation.navigate('JourneyHistoryDetail', { entryId: item.id });
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <View className="p-4 flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-gray-900 dark:text-white font-bold text-base">
                                    {item.destination?.name ?? 'Unknown destination'}
                                </Text>
                                <Text className="text-gray-500 text-xs mt-1">
                                    {isActive
                                        ? `Started ${new Date(item.startedAt).toLocaleString()}`
                                        : `Ended ${new Date(item.endedAt as string).toLocaleString()}`}
                                </Text>
                                {details !== '' && (
                                    <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">{details}</Text>
                                )}
                            </View>
                            <View className="flex-row items-center">
                                <View className="items-end gap-1">
                                    {isActive && (
                                        <View className="flex-row items-center bg-green-600/20 border border-green-600/40 px-2 py-0.5 rounded-full">
                                            <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                                            <Text className="text-green-500 text-[10px] font-bold uppercase tracking-widest">
                                                Active
                                            </Text>
                                        </View>
                                    )}
                                    <View className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                        <Text className="text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                                            {item.role}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons
                                    name={isActive ? 'play-circle-outline' : 'chevron-forward'}
                                    size={18}
                                    color={colors.textSecondary}
                                    style={{ marginLeft: 8 }}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                    {!isActive && (
                        <TouchableOpacity
                            onPress={() => handleRepeat(item)}
                            accessibilityRole="button"
                            accessibilityLabel={`Repeat journey to ${item.destination?.name ?? 'destination'}`}
                            className="flex-row items-center justify-center border-t border-gray-200 dark:border-gray-700 py-3 active:bg-ocean-600/10"
                        >
                            <Ionicons name="repeat" size={16} color="#0B74B1" />
                            <Text className="text-ocean-600 dark:text-ocean-400 font-bold text-xs uppercase tracking-wider ml-1.5">
                                Repeat Journey
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['left', 'right']}>
            <View className="px-4 pt-4 pb-2">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">Journeys</Text>
            </View>

            {sortedEntries.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="time-outline" size={64} color={colors.placeholder} />
                    <Text className="text-gray-500 dark:text-gray-400 text-center mt-4 text-base">
                        Journeys you create or join will show up here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sortedEntries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                />
            )}
            <AdBanner />
        </SafeAreaView>
    );
}
