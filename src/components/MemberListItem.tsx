import React from 'react';
import { View, Text } from 'react-native';
import { JourneyMember, Destination } from '../types/journey';
import { distanceInMeters, formatDistance } from '../utils/geo';

interface MemberListItemProps {
    member: JourneyMember;
    destination: Destination;
    isSelf: boolean;
}

export const MemberListItem: React.FC<MemberListItemProps> = ({ member, destination, isSelf }) => {
    const hasLocation = member.lat != null && member.lng != null;
    const distanceLabel = hasLocation
        ? formatDistance(
              distanceInMeters(member.lat as number, member.lng as number, destination.lat, destination.lng)
          )
        : 'Waiting for location…';

    return (
        <View className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700">
            <View
                style={{ backgroundColor: member.color }}
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
            >
                <Text className="text-white font-bold">{member.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-bold text-base">
                    {member.name}
                    {isSelf ? ' (You)' : ''}
                    {member.isCreator ? ' · Creator' : ''}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">{distanceLabel}</Text>
            </View>
        </View>
    );
};
