import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, Keyboard, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, LongPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { journeyService } from '../services/journeyService';
import { journeyHistoryService } from '../services/journeyHistoryService';
import { placesService, PlaceSuggestion } from '../services/placesService';
import { useAuthStore } from '../store/useAuthStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { useJourneyHistoryStore } from '../store/useJourneyHistoryStore';
import { useStopsTipStore } from '../store/useStopsTipStore';
import { useThemeColors } from '../utils/theme';
import { distanceInMeters, sortByDistanceFromPoint } from '../utils/geo';
import { Destination } from '../types/journey';
import { StopsDragList } from '../components/StopsDragList';
import { PermissionDisclosureModal } from '../components/PermissionDisclosureModal';

interface SelectedPoint {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

// Shown before the user's location or a destination is known - centered on
// India's geographic center, zoomed out to frame the whole country.
const DEFAULT_REGION = {
    latitude: 22.9734,
    longitude: 78.6569,
    latitudeDelta: 20,
    longitudeDelta: 20,
};

const MIN_QUERY_LENGTH = 3;
const AUTOCOMPLETE_DEBOUNCE_MS = 300;

// Points closer together than this are treated as "the same place" and
// rejected as a duplicate stop/destination rather than added again.
const DUPLICATE_THRESHOLD_METERS = 50;

const newPointId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function HomeScreen({ navigation, route }: any) {
    const mapRef = useRef<MapView>(null);
    const selectedPointsRef = useRef<SelectedPoint[]>([]);
    const currentLocationRef = useRef<{ lat: number; lng: number } | null>(null);
    const sessionTokenRef = useRef(placesService.newSessionToken());
    const suppressAutocompleteRef = useRef(false);

    // The first selected point is the destination; every point after that is an
    // intermediate stop. New stops default into farthest-from-destination-first
    // order, but from then on the array order is the source of truth - the user
    // can freely reorder stops with the up/down controls in the list.
    const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showsUserLocation, setShowsUserLocation] = useState(false);
    const [showLocationDisclosure, setShowLocationDisclosure] = useState(false);
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const { uid, name } = useAuthStore();
    const activeJourneyId = useJourneyStore((state) => state.journeyId);
    const setActiveJourney = useJourneyStore((state) => state.setActiveJourney);
    const addHistoryEntry = useJourneyHistoryStore((state) => state.addEntry);
    const hasSeenStopsTip = useStopsTipStore((state) => state.hasSeenStopsTip);
    const markStopsTipSeen = useStopsTipStore((state) => state.markSeen);
    const colors = useThemeColors();

    // Checked synchronously against the ref (rather than inside the setState
    // updater) so call sites can decide right away whether to show a "already
    // added" alert instead of silently adding a duplicate.
    const isDuplicatePoint = (lat: number, lng: number) =>
        selectedPointsRef.current.some((p) => distanceInMeters(p.lat, p.lng, lat, lng) < DUPLICATE_THRESHOLD_METERS);

    const addPoint = (point: SelectedPoint) => {
        setSelectedPoints((prev) => {
            let updated: SelectedPoint[];
            if (prev.length === 0) {
                // First point picked is always the destination.
                updated = [point];
            } else {
                const [destination, ...stops] = prev;
                const sortedStops = sortByDistanceFromPoint([...stops, point], destination);
                updated = [destination, ...sortedStops];
            }
            selectedPointsRef.current = updated;
            return updated;
        });
    };

    const updatePointName = (id: string, pointName: string) => {
        setSelectedPoints((prev) => {
            const updated = prev.map((p) => (p.id === id ? { ...p, name: pointName } : p));
            selectedPointsRef.current = updated;
            return updated;
        });
    };

    const removePoint = (id: string) => {
        setSelectedPoints((prev) => {
            const updated = prev.filter((p) => p.id !== id);
            selectedPointsRef.current = updated;
            return updated;
        });
    };

    // Applies a drag-and-drop reorder across the whole list, destination included -
    // "destination" just means "whichever point is at index 0", so dragging any
    // stop into that slot is how the user picks a new destination.
    const reorderPoints = (reordered: SelectedPoint[]) => {
        selectedPointsRef.current = reordered;
        setSelectedPoints(reordered);
    };

    // Seeds the map from a past journey when arriving via History's "Repeat"
    // button. Cleared from the route params right after so revisiting this
    // tab later doesn't re-seed stale data.
    useEffect(() => {
        const repeatFrom = route?.params?.repeatFrom as { destination: Destination; stops: Destination[] } | undefined;
        if (!repeatFrom) return;

        const points: SelectedPoint[] = [repeatFrom.destination, ...repeatFrom.stops].map((d) => ({
            id: newPointId(),
            name: d.name,
            lat: d.lat,
            lng: d.lng,
        }));
        selectedPointsRef.current = points;
        setSelectedPoints(points);
        navigation.setParams({ repeatFrom: undefined });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route?.params?.repeatFrom]);

    const useCurrentLocation = async () => {
        try {
            setShowsUserLocation(true);
            const current = await Location.getCurrentPositionAsync({});
            currentLocationRef.current = { lat: current.coords.latitude, lng: current.coords.longitude };
            if (selectedPointsRef.current.length > 0) return;
            mapRef.current?.animateToRegion({
                latitude: current.coords.latitude,
                longitude: current.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        } catch (error) {
            console.error('Failed to get current location:', error);
        }
    };

    const confirmLocationPermission = async () => {
        setShowLocationDisclosure(false);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') await useCurrentLocation();
    };

    // Prominent-disclosure requirement: the permission dialog must be
    // immediately preceded by an in-app explanation, not fired automatically
    // on mount - so this only checks the existing status here, and shows the
    // disclosure modal (which itself triggers the actual request) if needed.
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted') {
                    await useCurrentLocation();
                } else {
                    setShowLocationDisclosure(true);
                }
            } catch (error) {
                console.error('Failed to check location permission:', error);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the map framing every selected point: zoom to the single pin when
    // there's just one, otherwise fit all of them (destination + stops) in view.
    useEffect(() => {
        if (selectedPoints.length === 0) return;
        if (selectedPoints.length === 1) {
            mapRef.current?.animateToRegion({
                latitude: selectedPoints[0].lat,
                longitude: selectedPoints[0].lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            });
        } else {
            mapRef.current?.fitToCoordinates(
                selectedPoints.map((p) => ({ latitude: p.lat, longitude: p.lng })),
                { edgePadding: { top: 100, right: 80, bottom: 80, left: 80 }, animated: true }
            );
        }
    }, [selectedPoints]);

    // Live autocomplete suggestions as the user types, debounced and biased toward
    // their current location (like Google Maps). Silently does nothing if no
    // Places API key is configured - the search button below still works via
    // plain geocoding either way.
    useEffect(() => {
        if (suppressAutocompleteRef.current) {
            suppressAutocompleteRef.current = false;
            return;
        }

        if (!placesService.isConfigured()) return;

        const query = searchQuery.trim();
        if (query.length < MIN_QUERY_LENGTH) {
            setSuggestions([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const results = await placesService.autocomplete(
                    query,
                    sessionTokenRef.current,
                    currentLocationRef.current ?? undefined
                );
                setSuggestions(results);
            } catch (error) {
                console.error('Autocomplete failed:', error);
            }
        }, AUTOCOMPLETE_DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleLongPress = async (event: LongPressEvent) => {
        setSuggestions([]);
        const { coordinate } = event.nativeEvent;
        if (isDuplicatePoint(coordinate.latitude, coordinate.longitude)) {
            Alert.alert('Already added', 'That location is already part of this journey.');
            return;
        }
        const id = newPointId();
        addPoint({ id, name: '', lat: coordinate.latitude, lng: coordinate.longitude });
        try {
            const [place] = await Location.reverseGeocodeAsync(coordinate);
            if (place) {
                const label = [place.name, place.street, place.city].filter(Boolean).join(', ');
                if (label) updatePointName(id, label);
            }
        } catch (error) {
            console.error('Reverse geocode failed:', error);
        }
    };

    const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
        Keyboard.dismiss();
        setSuggestions([]);
        suppressAutocompleteRef.current = true;
        setSearchQuery('');
        try {
            const details = await placesService.getPlaceDetails(suggestion.placeId, sessionTokenRef.current);
            sessionTokenRef.current = placesService.newSessionToken();
            if (!details) return;
            if (isDuplicatePoint(details.lat, details.lng)) {
                Alert.alert('Already added', 'That location is already part of this journey.');
                return;
            }
            addPoint({
                id: newPointId(),
                name: details.name || suggestion.primaryText,
                lat: details.lat,
                lng: details.lng,
            });
        } catch (error) {
            console.error('Failed to resolve place:', error);
            Alert.alert('Error', 'Could not load that place. Please try again.');
        }
    };

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) return;

        Keyboard.dismiss();
        setSuggestions([]);
        try {
            const results = await Location.geocodeAsync(query);
            if (results.length === 0) {
                Alert.alert('Not found', 'No location matched that search. Try a different address.');
                return;
            }

            const { latitude, longitude } = results[0];
            if (isDuplicatePoint(latitude, longitude)) {
                Alert.alert('Already added', 'That location is already part of this journey.');
                return;
            }
            addPoint({ id: newPointId(), name: query, lat: latitude, lng: longitude });
            setSearchQuery('');
            sessionTokenRef.current = placesService.newSessionToken();
        } catch (error) {
            console.error('Search failed:', error);
            Alert.alert('Error', 'Could not search for that location. Please try again.');
        }
    };

    // The first time anyone starts a journey with no stops added, offer a quick
    // way to add one before committing - after that, it's assumed they know the
    // feature exists and starting without stops just proceeds normally.
    const handleCreate = () => {
        if (selectedPoints.length === 0) return;
        if (stopPoints.length === 0 && !hasSeenStopsTip) {
            markStopsTipSeen();
            Alert.alert(
                'Add stops along the way?',
                'You can add intermediate stops before starting - just search or long-press the map again after your destination.',
                [
                    { text: 'Add a Stop', style: 'cancel' },
                    { text: 'Start Without Stops', onPress: () => createJourneyNow() },
                ]
            );
            return;
        }
        createJourneyNow();
    };

    const createJourneyNow = async () => {
        if (selectedPoints.length === 0) return;
        if (!uid) {
            Alert.alert(
                'Not signed in yet',
                "We're still connecting you to ConvoyMates. Please wait a moment and try again."
            );
            return;
        }
        setIsCreating(true);
        try {
            const [destinationPoint, ...rest] = selectedPoints;
            const destination = {
                name: destinationPoint.name.trim() || 'Destination',
                lat: destinationPoint.lat,
                lng: destinationPoint.lng,
            };
            const stops = rest.map((p, i) => ({
                name: p.name.trim() || `Stop ${i + 1}`,
                lat: p.lat,
                lng: p.lng,
            }));

            const journeyId = await journeyService.createJourney(destination, uid, name, stops);
            setActiveJourney(journeyId, 'creator');
            const historyEntry = {
                id: journeyId,
                destination,
                stops,
                role: 'creator' as const,
                status: 'active' as const,
                startedAt: new Date().toISOString(),
            };
            addHistoryEntry(historyEntry);
            journeyHistoryService.recordEntry(uid, historyEntry).catch((error) => {
                console.error('Failed to record journey history:', error);
            });
            setSelectedPoints([]);
            selectedPointsRef.current = [];
            navigation.navigate('JourneyMap');
        } catch (error) {
            console.error('Failed to create journey:', error);
            Alert.alert('Error', 'Could not create the journey. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    // Only one journey can be active at a time - starting another here would
    // silently orphan the current one's live tracking (Firestore doc left
    // running with no one updating it). Send them back to it instead.
    if (activeJourneyId) {
        return (
            <SafeAreaView
                className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-8"
                edges={['left', 'right']}
            >
                <View className="bg-blue-600/20 p-6 rounded-full mb-6">
                    <Ionicons name="navigate" size={60} color="#3b82f6" />
                </View>
                <Text className="text-gray-900 dark:text-white text-2xl font-bold text-center">
                    Journey in progress
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center mt-3 text-base leading-6">
                    You already have an active journey. End it before starting a new one.
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('JourneyMap')}
                    className="mt-8 bg-blue-600 px-8 py-5 rounded-2xl flex-row items-center active:bg-blue-700"
                >
                    <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                    <Text className="text-white font-bold ml-2 uppercase tracking-widest">
                        Return to Journey
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const destinationPoint = selectedPoints[0] ?? null;
    const stopPoints = selectedPoints.slice(1);

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['left', 'right']}>
            <View className="px-4 pt-4 pb-2">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">Start a Journey</Text>
                <Text className="text-gray-500 dark:text-gray-400 mt-1">
                    {destinationPoint
                        ? 'Add more stops along the way, or start when ready'
                        : 'Search or long-press to set your destination'}
                </Text>
            </View>

            <View className="flex-1 mx-4">
                <View className="flex-1 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <MapView
                        ref={mapRef}
                        style={{ flex: 1 }}
                        initialRegion={DEFAULT_REGION}
                        onLongPress={handleLongPress}
                        showsUserLocation={showsUserLocation}
                        showsMyLocationButton={false}
                    >
                        {destinationPoint && (
                            <Marker
                                coordinate={{ latitude: destinationPoint.lat, longitude: destinationPoint.lng }}
                                pinColor="#3b82f6"
                                title={destinationPoint.name || 'Destination'}
                            />
                        )}
                        {stopPoints.map((stop, index) => (
                            <Marker
                                key={stop.id}
                                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                                title={stop.name || `Stop ${index + 1}`}
                            >
                                <View className="w-7 h-7 rounded-full bg-orange-500 items-center justify-center border-2 border-white">
                                    <Text className="text-white font-bold text-xs">{index + 1}</Text>
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                </View>

                {/* Floating search, overlaid on the map like the Google Maps app. zIndex/elevation
                    keep it painting above everything else on screen, and the suggestions list is
                    height-capped with its own internal scroll so it can never grow tall enough to
                    bleed into the destination/stops panel below. */}
                <View className="absolute top-3 left-3 right-3" style={{ zIndex: 30, elevation: 8 }}>
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={destinationPoint ? 'Search for a stop' : 'Search for a destination'}
                        placeholderTextColor={colors.placeholder}
                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-2xl border border-gray-200 dark:border-gray-700"
                        style={{
                            shadowColor: '#000',
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 4,
                        }}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                    />

                    {suggestions.length > 0 && (
                        <View
                            className="mt-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                            style={{
                                maxHeight: 240,
                                shadowColor: '#000',
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 2 },
                                elevation: 4,
                            }}
                        >
                            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                                {suggestions.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.placeId}
                                        onPress={() => handleSelectSuggestion(item)}
                                        className={`px-4 py-3 flex-row items-center active:bg-gray-100 dark:active:bg-gray-700 ${index < suggestions.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                                            }`}
                                    >
                                        <Ionicons name="location-outline" size={18} color="#3b82f6" />
                                        <View className="ml-3 flex-1">
                                            <Text className="text-gray-900 dark:text-white font-semibold" numberOfLines={1}>
                                                {item.primaryText}
                                            </Text>
                                            {!!item.secondaryText && (
                                                <Text className="text-gray-500 text-xs" numberOfLines={1}>
                                                    {item.secondaryText}
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>

            {/* Capped to a fraction of the screen so the map always keeps a sensible size and,
                with many stops, the list scrolls internally instead of pushing content off-screen. */}
            <View style={{ maxHeight: '46%' }} className="px-4 pt-2">
                <ScrollView
                    style={{ flexGrow: 0, flexShrink: 1 }}
                    contentContainerStyle={{ paddingBottom: 12 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {selectedPoints.length > 0 && (
                        <View className="mb-3">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1.5 tracking-[3px] ml-1">
                                {selectedPoints.length > 1 ? 'Drag to reorder or set destination' : 'Destination'}
                            </Text>
                            <StopsDragList
                                stops={selectedPoints}
                                onReorder={reorderPoints}
                                onRemove={removePoint}
                                firstIsDestination
                            />
                            {selectedPoints.length === 1 && (
                                <View className="flex-row items-center bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2.5 mt-3">
                                    <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
                                    <Text className="text-amber-700 dark:text-amber-400 text-xs ml-2 flex-1">
                                        Tip: search or long-press the map again to add stops along the way
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={selectedPoints.length === 0 || isCreating}
                    className={`mb-4 p-5 rounded-2xl items-center flex-row justify-center ${selectedPoints.length === 0 || isCreating ? 'bg-blue-600/30' : 'bg-blue-600 active:bg-blue-700'
                        }`}
                >
                    {isCreating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="navigate" size={20} color="#fff" />
                            <Text className="text-white font-bold ml-2 uppercase tracking-widest">
                                Start Journey
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <PermissionDisclosureModal
                visible={showLocationDisclosure}
                icon="location"
                iconColor="#3b82f6"
                title="Location Access"
                message="ConvoyMates uses your location to center the map near you and to share your position with your journey group while you're actively in a journey. This only happens while the app is open, unless you later choose to enable background access."
                confirmLabel="Allow"
                onAllow={confirmLocationPermission}
                onDeny={() => setShowLocationDisclosure(false)}
            />
        </SafeAreaView>
    );
}
