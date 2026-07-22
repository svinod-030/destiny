import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, LongPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { journeyService } from '../services/journeyService';
import { placesService, PlaceSuggestion } from '../services/placesService';
import { useAuthStore } from '../store/useAuthStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { useJourneyHistoryStore } from '../store/useJourneyHistoryStore';
import { useThemeColors } from '../utils/theme';

const DEFAULT_REGION = {
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
};

const MIN_QUERY_LENGTH = 3;
const AUTOCOMPLETE_DEBOUNCE_MS = 300;

export default function HomeScreen({ navigation }: any) {
    const mapRef = useRef<MapView>(null);
    const pinRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const currentLocationRef = useRef<{ lat: number; lng: number } | null>(null);
    const sessionTokenRef = useRef(placesService.newSessionToken());
    const suppressAutocompleteRef = useRef(false);

    const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
    const [destinationName, setDestinationName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showsUserLocation, setShowsUserLocation] = useState(false);
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const { uid, name } = useAuthStore();
    const setActiveJourney = useJourneyStore((state) => state.setActiveJourney);
    const addHistoryEntry = useJourneyHistoryStore((state) => state.addEntry);
    const colors = useThemeColors();

    // A pin the user picked (via search or long-press) always wins over the slow
    // GPS fix below - track it in a ref so the async effect can see the latest
    // value even if it resolves after the user has already chosen a destination.
    const setPinAndRef = (coordinate: { latitude: number; longitude: number } | null) => {
        pinRef.current = coordinate;
        setPin(coordinate);
    };

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') {
                    ({ status } = await Location.requestForegroundPermissionsAsync());
                }
                if (status !== 'granted') return;

                setShowsUserLocation(true);
                const current = await Location.getCurrentPositionAsync({});
                currentLocationRef.current = { lat: current.coords.latitude, lng: current.coords.longitude };
                if (pinRef.current) return;
                mapRef.current?.animateToRegion({
                    latitude: current.coords.latitude,
                    longitude: current.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            } catch (error) {
                console.error('Failed to get current location:', error);
            }
        })();
    }, []);

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
        setDestinationName('');
        setPinAndRef(coordinate);
        try {
            const [place] = await Location.reverseGeocodeAsync(coordinate);
            if (place) {
                const label = [place.name, place.street, place.city].filter(Boolean).join(', ');
                if (label) setDestinationName(label);
            }
        } catch (error) {
            console.error('Reverse geocode failed:', error);
        }
    };

    const focusOnCoordinate = (latitude: number, longitude: number) => {
        setPinAndRef({ latitude, longitude });
        mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        });
    };

    const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
        Keyboard.dismiss();
        setSuggestions([]);
        suppressAutocompleteRef.current = true;
        setSearchQuery(suggestion.primaryText);
        try {
            const details = await placesService.getPlaceDetails(suggestion.placeId, sessionTokenRef.current);
            sessionTokenRef.current = placesService.newSessionToken();
            if (!details) return;
            focusOnCoordinate(details.lat, details.lng);
            setDestinationName(details.name || suggestion.primaryText);
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
            focusOnCoordinate(latitude, longitude);
            setDestinationName(query);
            sessionTokenRef.current = placesService.newSessionToken();
        } catch (error) {
            console.error('Search failed:', error);
            Alert.alert('Error', 'Could not search for that location. Please try again.');
        }
    };

    const handleCreate = async () => {
        if (!pin) return;
        if (!uid) {
            Alert.alert(
                'Not signed in yet',
                "We're still connecting you to Destiny. Please wait a moment and try again."
            );
            return;
        }
        setIsCreating(true);
        try {
            const resolvedName = destinationName.trim() || 'Destination';
            const journeyId = await journeyService.createJourney(
                { name: resolvedName, lat: pin.latitude, lng: pin.longitude },
                uid,
                name
            );
            setActiveJourney(journeyId, 'creator');
            addHistoryEntry({
                id: journeyId,
                destinationName: resolvedName,
                role: 'creator',
                status: 'active',
                startedAt: new Date().toISOString(),
            });
            setPinAndRef(null);
            setDestinationName('');
            navigation.navigate('JourneyMap');
        } catch (error) {
            console.error('Failed to create journey:', error);
            Alert.alert('Error', 'Could not create the journey. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['bottom', 'left', 'right']}>
            <View className="px-4 pt-4 pb-2">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">Start a Journey</Text>
                <Text className="text-gray-500 dark:text-gray-400 mt-1">Search the map or long-press to drop a pin</Text>
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
                        {pin && <Marker coordinate={pin} pinColor="#3b82f6" />}
                    </MapView>
                </View>

                {/* Floating search, overlaid on the map like the Google Maps app */}
                <View className="absolute top-3 left-3 right-3">
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search for a destination"
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
                                shadowColor: '#000',
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 2 },
                                elevation: 4,
                            }}
                        >
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
                        </View>
                    )}
                </View>
            </View>

            <View className="p-4">
                {pin && (
                    <View className="flex-row items-center mb-3 px-1">
                        <Ionicons name="location" size={18} color="#3b82f6" />
                        <Text
                            className="text-gray-900 dark:text-white ml-2 text-base font-medium flex-1"
                            numberOfLines={1}
                        >
                            {destinationName.trim() || 'Destination'}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={!pin || isCreating}
                    className={`p-5 rounded-2xl items-center flex-row justify-center ${!pin || isCreating ? 'bg-blue-600/30' : 'bg-blue-600 active:bg-blue-700'
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
        </SafeAreaView>
    );
}
