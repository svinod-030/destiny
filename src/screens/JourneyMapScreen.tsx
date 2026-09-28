import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { journeyService } from '../services/journeyService';
import { journeyHistoryService } from '../services/journeyHistoryService';
import { useAuthStore } from '../store/useAuthStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { useJourneyHistoryStore } from '../store/useJourneyHistoryStore';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { Journey } from '../types/journey';
import { distanceInMeters } from '../utils/geo';
import { ShareJourneyCard } from '../components/ShareJourneyCard';
import { MemberListItem } from '../components/MemberListItem';
import { EditStopsModal } from '../components/EditStopsModal';
import { RouteList } from '../components/RouteList';
import { BackgroundLocationDisclosureModal } from '../components/BackgroundLocationDisclosureModal';
import { useThemeColors } from '../utils/theme';
import { showArrivalNotification, showMemberJoinedNotification, showMemberLeftNotification } from '../utils/journeyNotification';
import AdBanner from '../components/AdBanner';

const getFitCoordinates = (journey: Journey) => [
    { latitude: journey.destination.lat, longitude: journey.destination.lng },
    ...(journey.stops ?? []).map((s) => ({ latitude: s.lat, longitude: s.lng })),
    ...Object.values(journey.members)
        .filter((m) => m.lat != null && m.lng != null)
        .map((m) => ({ latitude: m.lat as number, longitude: m.lng as number })),
];

export default function JourneyMapScreen({ navigation }: any) {
    const mapRef = useRef<MapView>(null);
    const journeyRef = useRef<Journey | null>(null);
    const hasFitToMembers = useRef(false);
    const markerScales = useRef<Map<string, Animated.Value>>(new Map()).current;
    const calloutMarkerRefs = useRef<Map<string, any>>(new Map()).current;

    const { uid } = useAuthStore();
    const { journeyId, role, clear } = useJourneyStore();
    const addHistoryEntry = useJourneyHistoryStore((state) => state.addEntry);
    const colors = useThemeColors();

    const [journey, setJourney] = useState<Journey | null>(null);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [shareVisible, setShareVisible] = useState(false);
    const [editStopsVisible, setEditStopsVisible] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [activeTab, setActiveTab] = useState<'members' | 'route'>('members');

    const { permissionDenied, showBackgroundPrompt, enableBackgroundTracking, dismissBackgroundPrompt } = useLiveLocation({
        journeyId,
        memberId: uid,
        enabled: !!journeyId,
        destination: journey ? { lat: journey.destination.lat, lng: journey.destination.lng } : null,
    });

    useEffect(() => {
        if (!journeyId) return;

        const unsubscribe = journeyService.subscribeToJourney(
            journeyId,
            (updated) => {
                const previous = journeyRef.current;
                if (previous) {
                    Object.values(updated.members).forEach((member) => {
                        const justArrived = member.hasArrived && !previous.members[member.id]?.hasArrived;
                        if (justArrived) {
                            showArrivalNotification(member.name, member.id === uid);
                        }

                        const justJoined = !previous.members[member.id];
                        if (justJoined && member.id !== uid) {
                            showMemberJoinedNotification(member.name);
                        }
                    });

                    // The journey creator ending it for everyone deletes the whole
                    // document (handled below via the not-found callback), not this
                    // update path - so any member missing here voluntarily left.
                    Object.values(previous.members).forEach((member) => {
                        const justLeft = !updated.members[member.id];
                        if (justLeft && member.id !== uid) {
                            showMemberLeftNotification(member.name);
                        }
                    });
                }
                journeyRef.current = updated;
                setJourney(updated);
            },
            () => {
                const ended = journeyRef.current;
                if (ended) {
                    addHistoryEntry({
                        id: ended.id,
                        destination: ended.destination,
                        stops: ended.stops ?? [],
                        role: role || 'member',
                        status: 'ended',
                        startedAt: ended.createdAt,
                        endedAt: new Date().toISOString(),
                    });
                    if (uid) {
                        journeyHistoryService.markEnded(uid, ended.id).catch((error) => {
                            console.error('Failed to mark journey history as ended:', error);
                        });
                    }
                }
                setConnectionError('This journey has ended.');
                clear();
            }
        );

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [journeyId]);

    useEffect(() => {
        if (!journey || hasFitToMembers.current) return;
        const coords = getFitCoordinates(journey);
        if (coords.length === 0) return;
        hasFitToMembers.current = true;
        mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
        });
    }, [journey]);

    useEffect(() => {
        if (permissionDenied) {
            Alert.alert(
                'Location permission needed',
                'Allow RoadTrip to access your location so the group can see you on the map.'
            );
        }
    }, [permissionDenied]);

    const getMarkerScale = (key: string) => {
        let value = markerScales.get(key);
        if (!value) {
            value = new Animated.Value(1);
            markerScales.set(key, value);
        }
        return value;
    };

    const handleFocusPoint = (key: string) => {
        const scale = getMarkerScale(key);
        scale.setValue(1);
        Animated.sequence([
            Animated.timing(scale, { toValue: 1.6, duration: 180, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
        ]).start();

        // Selecting from the list doesn't count as tapping the marker itself,
        // so the callout (which shows its title) needs to be opened explicitly -
        // it's a no-op for the destination key, which has no ref registered here.
        calloutMarkerRefs.get(key)?.showCallout();
    };

    const handleRecenter = () => {
        if (!journey) return;
        const coords = getFitCoordinates(journey);
        if (coords.length === 0) return;
        mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
        });
    };

    const handleEndOrLeave = () => {
        if (!journeyId || !uid || !journey) return;
        const isCreator = role === 'creator';

        Alert.alert(
            isCreator ? 'End journey?' : 'Leave journey?',
            isCreator
                ? 'This will end the journey for everyone in the group.'
                : 'You can rejoin later using the same code if the journey is still active.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isCreator ? 'End' : 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        setIsEnding(true);
                        try {
                            if (isCreator) {
                                await journeyService.endJourney(journeyId);
                            } else {
                                await journeyService.leaveJourney(journeyId, uid);
                            }
                            addHistoryEntry({
                                id: journey.id,
                                destination: journey.destination,
                                stops: journey.stops ?? [],
                                role: role || 'member',
                                status: 'ended',
                                startedAt: journey.createdAt,
                                endedAt: new Date().toISOString(),
                            });
                            journeyHistoryService.markEnded(uid, journey.id).catch((error) => {
                                console.error('Failed to mark journey history as ended:', error);
                            });
                            clear();
                            navigation.navigate('HomeTabs');
                        } catch (error) {
                            console.error('Failed to end/leave journey:', error);
                            Alert.alert('Error', 'Something went wrong. Please try again.');
                        } finally {
                            setIsEnding(false);
                        }
                    },
                },
            ]
        );
    };

    if (connectionError) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center px-8">
                <Ionicons name="flag" size={64} color={colors.textSecondary} />
                <Text className="text-gray-900 dark:text-white text-xl font-bold mt-4 text-center">{connectionError}</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('HomeTabs')}
                    className="mt-8 bg-ocean-600 px-8 py-4 rounded-2xl active:bg-ocean-700"
                >
                    <Text className="text-white font-bold uppercase tracking-widest">Back Home</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (!journey) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center">
                <ActivityIndicator size="large" color="#0B74B1" />
                <Text className="text-gray-500 dark:text-gray-400 mt-4">Connecting to journey…</Text>
            </SafeAreaView>
        );
    }

    const members = Object.values(journey.members).sort((a, b) => {
        if (a.lat == null || a.lng == null) return 1;
        if (b.lat == null || b.lng == null) return -1;
        const distA = distanceInMeters(a.lat, a.lng, journey.destination.lat, journey.destination.lng);
        const distB = distanceInMeters(b.lat, b.lng, journey.destination.lat, journey.destination.lng);
        return distA - distB;
    });

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['bottom', 'left', 'right']}>
            <View style={{ flex: 3 }}>
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    initialRegion={{
                        latitude: journey.destination.lat,
                        longitude: journey.destination.lng,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    <Marker
                        coordinate={{ latitude: journey.destination.lat, longitude: journey.destination.lng }}
                        title={journey.destination.name}
                    >
                        <Animated.View style={{ transform: [{ scale: getMarkerScale('destination') }] }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: '#0B74B1',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: '#fff',
                                    overflow: 'hidden',
                                }}
                            >
                                <Ionicons name="flag" size={18} color="#fff" />
                            </View>
                        </Animated.View>
                    </Marker>
                    {(journey.stops ?? []).map((stop, index) => (
                        <Marker
                            key={`${stop.lat}-${stop.lng}-${index}`}
                            ref={(ref) => {
                                if (ref) calloutMarkerRefs.set(`stop-${index}`, ref);
                            }}
                            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                            title={stop.name}
                        >
                            <Animated.View style={{ transform: [{ scale: getMarkerScale(`stop-${index}`) }] }}>
                                <View
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 14,
                                        backgroundColor: '#f97316',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 2,
                                        borderColor: '#fff',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{index + 1}</Text>
                                </View>
                            </Animated.View>
                        </Marker>
                    ))}
                    {members
                        .filter((m) => m.lat != null && m.lng != null)
                        .map((m) => (
                            <Marker
                                key={m.id}
                                ref={(ref) => {
                                    if (ref) calloutMarkerRefs.set(m.id, ref);
                                }}
                                title={m.name}
                                coordinate={{ latitude: m.lat as number, longitude: m.lng as number }}
                            >
                                <Animated.View
                                    style={{ transform: [{ scale: getMarkerScale(m.id) }] }}
                                >
                                    <View
                                        style={{
                                            backgroundColor: m.color,
                                            borderColor: '#fff',
                                            borderWidth: 1.5,
                                            borderRadius: 999,
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            maxWidth: 180,
                                        }}
                                    >
                                        <Text
                                            style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}
                                            numberOfLines={1}
                                            maxFontSizeMultiplier={1.2}
                                        >
                                            {m.name.toUpperCase().substring(0, 2)}
                                        </Text>
                                    </View>
                                </Animated.View>
                            </Marker>
                        ))}
                </MapView>

                <View className="absolute top-4 right-4 gap-3 items-end">
                    <TouchableOpacity
                        onPress={() => setShareVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Share journey invite"
                        accessibilityHint="Opens your journey code and QR code to share with others"
                        className="flex-row items-center bg-white/90 dark:bg-gray-900/90 pl-3 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700"
                    >
                        <Ionicons name="share-social-outline" size={20} color="#0B74B1" />
                        <Text
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.4}
                            className="text-ocean-600 dark:text-ocean-400 font-bold ml-1.5 text-sm"
                        >
                            Share
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleRecenter}
                        accessibilityRole="button"
                        accessibilityLabel="Recenter map"
                        className="bg-white/90 dark:bg-gray-900/90 p-3 rounded-full border border-gray-200 dark:border-gray-700"
                    >
                        <Ionicons name="locate" size={22} color="#0B74B1" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 2 }} className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <Text
                            className="text-gray-900 dark:text-white text-lg font-bold"
                            numberOfLines={1}
                        >
                            {journey.destination.name}
                        </Text>
                        <Text className="text-gray-500 text-xs uppercase tracking-widest">
                            {members.length} {members.length === 1 ? 'member' : 'members'}
                            {(journey.stops?.length ?? 0) > 0
                                ? ` · ${journey.stops.length} ${journey.stops.length === 1 ? 'stop' : 'stops'}`
                                : ''}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleEndOrLeave}
                        disabled={isEnding}
                        className="bg-red-600/20 border border-red-600/40 px-4 py-2 rounded-xl flex-shrink-0"
                    >
                        {isEnding ? (
                            <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                            <Text className="text-red-500 font-bold text-sm">
                                {role === 'creator' ? 'End' : 'Leave'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="flex-row mx-4 mb-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                    <TouchableOpacity
                        onPress={() => setActiveTab('members')}
                        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${activeTab === 'members' ? 'bg-white dark:bg-gray-700' : ''
                            }`}
                    >
                        <Ionicons name="people" size={16} color={activeTab === 'members' ? '#0B74B1' : colors.textSecondary} />
                        <Text
                            className={`ml-1.5 font-bold text-xs uppercase tracking-wider ${activeTab === 'members' ? 'text-ocean-600 dark:text-ocean-400' : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            Members
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('route')}
                        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${activeTab === 'route' ? 'bg-white dark:bg-gray-700' : ''
                            }`}
                    >
                        <Ionicons name="map" size={16} color={activeTab === 'route' ? '#0B74B1' : colors.textSecondary} />
                        <Text
                            className={`ml-1.5 font-bold text-xs uppercase tracking-wider ${activeTab === 'route' ? 'text-ocean-600 dark:text-ocean-400' : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            Route
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'members' ? (
                    <ScrollView className="px-4" contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
                        {members.map((member) => (
                            <MemberListItem
                                key={member.id}
                                member={member}
                                destination={journey.destination}
                                isSelf={member.id === uid}
                                onPress={
                                    member.lat != null && member.lng != null
                                        ? () => handleFocusPoint(member.id)
                                        : undefined
                                }
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <View className="flex-1">
                        {role === 'creator' && (
                            <View className="px-4 pb-2">
                                <TouchableOpacity
                                    onPress={() => setEditStopsVisible(true)}
                                    className="flex-row items-center justify-center bg-ocean-600/10 border border-ocean-600/30 rounded-xl py-2.5"
                                >
                                    <Ionicons name="create-outline" size={16} color="#0B74B1" />
                                    <Text className="text-ocean-600 dark:text-ocean-400 font-bold text-xs uppercase tracking-wider ml-1.5">
                                        Edit Route
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 16 }}>
                            <RouteList
                                destination={journey.destination}
                                stops={journey.stops ?? []}
                                onSelect={(_point, key) => handleFocusPoint(key)}
                            />
                        </ScrollView>
                    </View>
                )}
            </View>

            <AdBanner />

            <Modal visible={shareVisible} transparent animationType="fade" onRequestClose={() => setShareVisible(false)}>
                <View className="flex-1 bg-black/70 justify-center items-center px-6">
                    <ShareJourneyCard journeyId={journey.id} onClose={() => setShareVisible(false)} />
                </View>
            </Modal>

            {role === 'creator' && (
                <EditStopsModal
                    visible={editStopsVisible}
                    onClose={() => setEditStopsVisible(false)}
                    journeyId={journey.id}
                    destination={journey.destination}
                    initialStops={journey.stops ?? []}
                />
            )}

            <BackgroundLocationDisclosureModal
                visible={showBackgroundPrompt}
                onAllow={() => enableBackgroundTracking()}
                onDeny={dismissBackgroundPrompt}
            />
        </SafeAreaView>
    );
}
