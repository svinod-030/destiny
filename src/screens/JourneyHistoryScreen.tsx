import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJourneyHistoryStore, JourneyHistoryEntry } from '../store/useJourneyHistoryStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { useAuthStore } from '../store/useAuthStore';
import { journeyHistoryService } from '../services/journeyHistoryService';
import { journeyService } from '../services/journeyService';
import { useThemeColors } from '../utils/theme';
import AdBanner from '../components/AdBanner';

const ACTIVE_COLOR = '#10B981';
const ENDED_COLOR = '#0B74B1';
const STOP_COLOR = '#f97316';

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

    const removeEntry = useJourneyHistoryStore((state) => state.removeEntry);
    const uid = useAuthStore((state) => state.uid);

    const handleDelete = (entry: JourneyHistoryEntry) => {
        Alert.alert(
            'Delete journey?',
            'This removes it from your history. The other members keep their own copies.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        removeEntry(entry.id);
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

    const handleRepeat = (entry: JourneyHistoryEntry) => {
        navigation.navigate('HomeTabs', {
            screen: 'Start',
            params: { repeatFrom: { destination: entry.destination, stops: entry.stops ?? [] } },
        });
    };

    const renderProgressTrack = (item: JourneyHistoryEntry, isActive: boolean) => {
        const stopCount = item.stops?.length ?? 0;
        // Start, each stop, then destination. An ended journey has reached all of them;
        // an active one is only known to have started, so only the first step is lit.
        const steps = stopCount + 2;
        const litSteps = isActive ? 1 : steps;
        const litColor = isActive ? ACTIVE_COLOR : ENDED_COLOR;

        return (
            <View className="flex-row items-center mt-3">
                {Array.from({ length: steps }).map((_, index) => {
                    const lit = index < litSteps;
                    const isDestination = index === steps - 1;
                    const isStart = index === 0;
                    const dotColor = lit ? (isStart || isDestination ? litColor : STOP_COLOR) : undefined;
                    return (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <View
                                    className="flex-1 h-1 rounded-full mx-1"
                                    style={{ backgroundColor: index < litSteps ? litColor : colors.border }}
                                />
                            )}
                            <View
                                className="w-4 h-4 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: lit ? dotColor : colors.border,
                                }}
                            >
                                {isDestination ? (
                                    <Ionicons name="flag" size={9} color={lit ? '#fff' : colors.textSecondary} />
                                ) : null}
                            </View>
                        </React.Fragment>
                    );
                })}
            </View>
        );
    };

    const renderItem = ({ item }: { item: JourneyHistoryEntry }) => {
        const isActive = item.status === 'active';
        const isCreator = item.role === 'creator';
        const memberCount = item.members?.length;
        const stopCount = item.stops?.length ?? 0;
        const accent = isActive ? ACTIVE_COLOR : ENDED_COLOR;

        const details = [
            memberCount != null ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : null,
            stopCount > 0 ? `${stopCount} ${stopCount === 1 ? 'stop' : 'stops'}` : null,
        ]
            .filter(Boolean)
            .join(' · ');

        return (
            <View
                className="rounded-3xl mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
                style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 2,
                }}
            >
                <View style={{ height: 4, backgroundColor: accent }} />
                <TouchableOpacity
                    onPress={() => {
                        if (isActive) {
                            handlePressActive(item);
                        } else {
                            navigation.navigate('JourneyHistoryDetail', { entryId: item.id });
                        }
                    }}
                    activeOpacity={0.7}
                    className="p-4"
                >
                    <View className="flex-row items-start">
                        <View
                            className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
                            style={{ backgroundColor: `${accent}22` }}
                        >
                            <Ionicons
                                name={isActive ? 'navigate' : 'checkmark-done-circle'}
                                size={22}
                                color={accent}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white font-bold text-base" numberOfLines={1}>
                                {item.destination?.name ?? 'Unknown destination'}
                            </Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                {isActive
                                    ? `Started ${new Date(item.startedAt).toLocaleString()}`
                                    : `Ended ${new Date(item.endedAt as string).toLocaleString()}`}
                            </Text>
                            {details !== '' && (
                                <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">{details}</Text>
                            )}
                        </View>
                        <View className="items-end gap-1.5 ml-2">
                            <View
                                className="flex-row items-center px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${accent}22` }}
                            >
                                <Ionicons
                                    name={isActive ? 'pulse' : 'flag'}
                                    size={10}
                                    color={accent}
                                />
                                <Text
                                    className="text-[10px] font-bold uppercase tracking-widest ml-1"
                                    style={{ color: accent }}
                                >
                                    {isActive ? 'In progress' : 'Ended'}
                                </Text>
                            </View>
                            <View
                                className="flex-row items-center px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: isCreator ? '#f59e0b22' : '#8B5CF622' }}
                            >
                                <Ionicons
                                    name={isCreator ? 'ribbon' : 'person'}
                                    size={10}
                                    color={isCreator ? '#f59e0b' : '#8B5CF6'}
                                />
                                <Text
                                    className="text-[10px] font-bold uppercase tracking-widest ml-1"
                                    style={{ color: isCreator ? '#f59e0b' : '#8B5CF6' }}
                                >
                                    {item.role}
                                </Text>
                            </View>
                        </View>
                    </View>
                    {renderProgressTrack(item, isActive)}
                </TouchableOpacity>

                {!isActive && (
                    <View className="flex-row border-t border-gray-200 dark:border-gray-700">
                        <TouchableOpacity
                            onPress={() => handleRepeat(item)}
                            accessibilityRole="button"
                            accessibilityLabel={`Repeat journey to ${item.destination?.name ?? 'destination'}`}
                            className="flex-1 flex-row items-center justify-center py-3 active:bg-ocean-600/10"
                        >
                            <Ionicons name="repeat" size={16} color={ENDED_COLOR} />
                            <Text className="text-ocean-600 dark:text-ocean-400 font-bold text-xs uppercase tracking-wider ml-1.5">
                                Repeat
                            </Text>
                        </TouchableOpacity>
                        <View className="w-px bg-gray-200 dark:bg-gray-700" />
                        <TouchableOpacity
                            onPress={() => handleDelete(item)}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete journey to ${item.destination?.name ?? 'destination'}`}
                            className="flex-1 flex-row items-center justify-center py-3 active:bg-red-600/10"
                        >
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            <Text className="text-red-500 font-bold text-xs uppercase tracking-wider ml-1.5">
                                Delete
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
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
                    <View className="bg-ocean-600/15 p-6 rounded-full mb-4">
                        <Ionicons name="time-outline" size={56} color={ENDED_COLOR} />
                    </View>
                    <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 text-base">
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
