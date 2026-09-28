import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Destination } from '../types/journey';

interface RouteListProps {
    destination: Destination;
    stops: Destination[];
    // `key` identifies which map marker to highlight: 'destination' or `stop-${index}`.
    onSelect?: (point: Destination, key: string) => void;
}

// Read-only numbered-stops + flagged-destination list, shared between the
// live journey map's "Route" tab and History's expandable journey cards.
// `onSelect` is only passed by the live map (to focus that point), so
// History's rows stay plain, non-interactive views.
export function RouteList({ destination, stops, onSelect }: RouteListProps) {
    const Row = onSelect ? TouchableOpacity : View;

    return (
        <View style={{ gap: 8 }}>
            {stops.map((stop, index) => (
                <Row
                    key={`${stop.lat}-${stop.lng}-${index}`}
                    onPress={onSelect ? () => onSelect(stop, `stop-${index}`) : undefined}
                    activeOpacity={onSelect ? 0.7 : undefined}
                    className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700"
                >
                    <View className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center">
                        <Text className="text-white font-bold">{index + 1}</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-base ml-3 flex-1" numberOfLines={1}>
                        {stop.name}
                    </Text>
                    {onSelect && <Ionicons name="locate-outline" size={18} color="#9ca3af" />}
                </Row>
            ))}
            <Row
                onPress={onSelect ? () => onSelect(destination, 'destination') : undefined}
                activeOpacity={onSelect ? 0.7 : undefined}
                className="flex-row items-center bg-ocean-600/10 border border-ocean-600/30 px-4 py-3 rounded-2xl"
            >
                <View className="w-10 h-10 rounded-full bg-ocean-600 items-center justify-center">
                    <Ionicons name="flag" size={18} color="#fff" />
                </View>
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-3 flex-1" numberOfLines={1}>
                    {destination.name}
                </Text>
                {onSelect && <Ionicons name="locate-outline" size={18} color="#0B74B1" />}
            </Row>
        </View>
    );
}
