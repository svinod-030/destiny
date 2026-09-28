import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JourneyMember, Destination } from '../types/journey';
import { distanceInMeters, formatDistance, hasArrived } from '../utils/geo';
import { getInitials } from '../utils/color';

interface MemberListItemProps {
    member: JourneyMember;
    destination: Destination;
    isSelf: boolean;
    onPress?: () => void;
}

export const MemberListItem: React.FC<MemberListItemProps> = ({ member, destination, isSelf, onPress }) => {
    const hasLocation = member.lat != null && member.lng != null;
    const distanceMeters = hasLocation
        ? distanceInMeters(member.lat as number, member.lng as number, destination.lat, destination.lng)
        : null;
    const arrived = distanceMeters != null && hasArrived(distanceMeters);

    let statusLabel = 'Waiting for location…';
    if (distanceMeters != null) {
        statusLabel = arrived ? 'Arrived' : formatDistance(distanceMeters);
    }

    const Row = onPress ? TouchableOpacity : View;

    return (
        <Row
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : undefined}
            className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700"
        >
            <View
                style={{ backgroundColor: member.color }}
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
            >
                <Text className="text-white font-bold">{getInitials(member.name)}</Text>
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-bold text-base">
                    {member.name}
                    {isSelf ? ' (You)' : ''}
                    {member.isCreator ? ' · Creator' : ''}
                </Text>
                <Text
                    className={
                        arrived
                            ? 'text-green-600 dark:text-green-400 text-sm font-bold'
                            : 'text-gray-500 dark:text-gray-400 text-sm'
                    }
                >
                    {statusLabel}
                </Text>
            </View>
            {onPress && <Ionicons name="locate-outline" size={18} color="#9ca3af" />}
        </Row>
    );
};
