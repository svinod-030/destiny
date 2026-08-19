import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Destination } from '../types/journey';

interface RouteListProps {
    destination: Destination;
    stops: Destination[];
}

// Read-only numbered-stops + flagged-destination list, shared between the
// live journey map's "Route" tab and History's expandable journey cards.
export function RouteList({ destination, stops }: RouteListProps) {
    return (
        <View style={{ gap: 8 }}>
            {stops.map((stop, index) => (
                <View
                    key={`${stop.lat}-${stop.lng}-${index}`}
                    className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700"
                >
                    <View className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center">
                        <Text className="text-white font-bold">{index + 1}</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-base ml-3 flex-1" numberOfLines={1}>
                        {stop.name}
                    </Text>
                </View>
            ))}
            <View className="flex-row items-center bg-blue-600/10 border border-blue-600/30 px-4 py-3 rounded-2xl">
                <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
                    <Ionicons name="flag" size={18} color="#fff" />
                </View>
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-3 flex-1" numberOfLines={1}>
                    {destination.name}
                </Text>
            </View>
        </View>
    );
}
