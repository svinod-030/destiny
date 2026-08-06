import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, LongPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { journeyService } from '../services/journeyService';
import { placesService, PlaceSuggestion } from '../services/placesService';
import { Destination } from '../types/journey';
import { distanceInMeters, sortByDistanceFromPoint } from '../utils/geo';
import { useThemeColors } from '../utils/theme';
import { StopsDragList, DraggableStop } from './StopsDragList';

interface EditStopsModalProps {
    visible: boolean;
    onClose: () => void;
    journeyId: string;
    destination: Destination;
    initialStops: Destination[];
}

const MIN_QUERY_LENGTH = 3;
const AUTOCOMPLETE_DEBOUNCE_MS = 300;

// Points closer together than this are treated as "the same place" and
// rejected as a duplicate stop rather than added again.
const DUPLICATE_THRESHOLD_METERS = 50;

const newPointId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function EditStopsModal({ visible, onClose, journeyId, destination, initialStops }: EditStopsModalProps) {
    const colors = useThemeColors();
    const mapRef = useRef<MapView>(null);
    // The first point is always the destination - same "array position is the
    // role" model as the journey-creation screen, so dragging any point into
    // that slot is how the creator picks a new destination.
    const pointsRef = useRef<DraggableStop[]>([]);
    const sessionTokenRef = useRef(placesService.newSessionToken());
    const suppressAutocompleteRef = useRef(false);

    const [points, setPoints] = useState<DraggableStop[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Reset local editing state to the journey's current route each time the modal opens.
    useEffect(() => {
        if (!visible) return;
        const initial = [destination, ...initialStops].map((s) => ({ ...s, id: newPointId() }));
        setPoints(initial);
        pointsRef.current = initial;
        setSearchQuery('');
        setSuggestions([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

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

        const near = pointsRef.current[0] ?? destination;
        const timeout = setTimeout(async () => {
            try {
                const results = await placesService.autocomplete(query, sessionTokenRef.current, {
                    lat: near.lat,
                    lng: near.lng,
                });
                setSuggestions(results);
            } catch (error) {
                console.error('Autocomplete failed:', error);
            }
        }, AUTOCOMPLETE_DEBOUNCE_MS);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const isDuplicate = (lat: number, lng: number) =>
        pointsRef.current.some((p) => distanceInMeters(p.lat, p.lng, lat, lng) < DUPLICATE_THRESHOLD_METERS);

    // New points always join as stops (never silently replace the destination) -
    // inserted among the existing stops by distance, same ordering rule as
    // journey creation. Reordering afterward is how the user promotes one.
    const addPoint = (point: DraggableStop) => {
        const [current, ...stops] = pointsRef.current;
        const sortedStops = sortByDistanceFromPoint([...stops, point], current);
        const updated = [current, ...sortedStops];
        pointsRef.current = updated;
        setPoints(updated);
    };

    const handleLongPress = async (event: LongPressEvent) => {
        setSuggestions([]);
        const { coordinate } = event.nativeEvent;
        if (isDuplicate(coordinate.latitude, coordinate.longitude)) {
            Alert.alert('Already added', 'That location is already part of this journey.');
            return;
        }
        const id = newPointId();
        addPoint({ id, name: '', lat: coordinate.latitude, lng: coordinate.longitude });
        try {
            const [place] = await Location.reverseGeocodeAsync(coordinate);
            const label = place ? [place.name, place.street, place.city].filter(Boolean).join(', ') : '';
            if (label) {
                pointsRef.current = pointsRef.current.map((p) => (p.id === id ? { ...p, name: label } : p));
                setPoints(pointsRef.current);
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
            if (isDuplicate(details.lat, details.lng)) {
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

    const removePoint = (id: string) => {
        pointsRef.current = pointsRef.current.filter((p) => p.id !== id);
        setPoints(pointsRef.current);
    };

    const reorderPoints = (reordered: DraggableStop[]) => {
        pointsRef.current = reordered;
        setPoints(reordered);
    };

    const handleSave = async () => {
        if (points.length === 0) return;
        setIsSaving(true);
        try {
            const [newDestination, ...newStops] = points;
            await journeyService.updateRoute(
                journeyId,
                { name: newDestination.name.trim() || 'Destination', lat: newDestination.lat, lng: newDestination.lng },
                newStops.map((s) => ({ name: s.name.trim() || 'Stop', lat: s.lat, lng: s.lng }))
            );
            onClose();
        } catch (error) {
            console.error('Failed to update route:', error);
            Alert.alert('Error', 'Could not save your changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const mapCenter = points[0] ?? destination;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <View className="px-4 pt-2 pb-2 flex-row items-center justify-between">
                        <Text className="text-gray-900 dark:text-white text-xl font-bold">Edit Route</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View
                        style={{ height: 180 }}
                        className="mx-4 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                        <MapView
                            ref={mapRef}
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: mapCenter.lat,
                                longitude: mapCenter.lng,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }}
                            onLongPress={handleLongPress}
                        >
                            {points.map((point, index) => (
                                <Marker
                                    key={point.id}
                                    coordinate={{ latitude: point.lat, longitude: point.lng }}
                                    title={point.name || (index === 0 ? 'Destination' : `Stop ${index}`)}
                                    pinColor={index === 0 ? '#3b82f6' : undefined}
                                >
                                    {index > 0 && (
                                        <View className="w-7 h-7 rounded-full bg-orange-500 items-center justify-center border-2 border-white">
                                            <Text className="text-white font-bold text-xs">{index}</Text>
                                        </View>
                                    )}
                                </Marker>
                            ))}
                        </MapView>
                    </View>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs text-center mt-2 px-4">
                        Long-press the map, or search below, to add a stop
                    </Text>

                    <View className="px-4 pt-3">
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search for a stop"
                            placeholderTextColor={colors.placeholder}
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl border border-gray-200 dark:border-gray-700"
                            returnKeyType="search"
                        />
                        {suggestions.length > 0 && (
                            <View
                                className="mt-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                                style={{ maxHeight: 200 }}
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
                                                <Text
                                                    className="text-gray-900 dark:text-white font-semibold"
                                                    numberOfLines={1}
                                                >
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

                    <ScrollView className="flex-1 px-4 pt-3" keyboardShouldPersistTaps="handled">
                        <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1.5 tracking-[3px] ml-1">
                            {points.length > 1 ? 'Drag to reorder or set destination' : 'Destination'}
                        </Text>
                        <StopsDragList stops={points} onReorder={reorderPoints} onRemove={removePoint} firstIsDestination />
                    </ScrollView>

                    <View className="px-4 pb-4 pt-2">
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving || points.length === 0}
                            className={`p-5 rounded-2xl items-center flex-row justify-center ${isSaving || points.length === 0 ? 'bg-blue-600/30' : 'bg-blue-600 active:bg-blue-700'
                                }`}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                    <Text className="text-white font-bold ml-2 uppercase tracking-widest">
                                        Save Route
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}
