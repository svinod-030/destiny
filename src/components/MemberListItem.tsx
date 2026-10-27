import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JourneyMember, Destination } from '../types/journey';
import { distanceInMeters, distanceViaStops, formatDistance, formatDuration, hasArrived, stopsAheadOf } from '../utils/geo';
import { getInitials } from '../utils/color';

interface MemberListItemProps {
    member: JourneyMember;
    destination: Destination;
    isSelf: boolean;
    // Journey stops, in visiting order. The distance shown follows the stops still ahead
    // of this member instead of cutting straight to the destination.
    stops?: Destination[];
    // The viewer's own road route (distance and time via the stops). Only the viewer has
    // one, so only their row uses it; everyone else gets the straight-line estimate.
    route?: { distanceMeters: number; durationSeconds: number } | null;
    onPress?: () => void;
    // When given, shows a directions button that opens this member's location in Maps.
    onNavigate?: () => void;
}

// A travel time is only believable while the member's phone is still reporting; after
// this long without an update (phone off, no signal) it's hidden rather than shown stale.
const ETA_FRESH_MS = 15 * 60_000;

export const MemberListItem: React.FC<MemberListItemProps> = ({ member, destination, isSelf, stops = [], route, onPress, onNavigate }) => {
    const hasLocation = member.lat != null && member.lng != null;
    const here = hasLocation ? { lat: member.lat as number, lng: member.lng as number } : null;
    // Arrival is about the destination itself, whatever the path to it.
    const directMeters = here ? distanceInMeters(here.lat, here.lng, destination.lat, destination.lng) : null;
    const arrived = directMeters != null && hasArrived(directMeters);

    let statusLabel = 'Waiting for location…';
    if (here && directMeters != null) {
        if (arrived) {
            statusLabel = 'Arrived';
        } else if (isSelf && route) {
            statusLabel = `${formatDistance(route.distanceMeters)} · ${formatDuration(route.durationSeconds)}`;
        } else {
            const stopsLeft = stopsAheadOf(here, stops, destination).length;
            const meters = stopsLeft > 0 ? distanceViaStops(here, stops, destination) : directMeters;
            const updatedMs = member.updatedAt ? new Date(member.updatedAt).getTime() : 0;
            const etaIsFresh = member.etaSeconds != null && Date.now() - updatedMs <= ETA_FRESH_MS;

            statusLabel = `~${formatDistance(meters)}`;
            if (etaIsFresh) {
                statusLabel += ` · ${formatDuration(member.etaSeconds as number)}`;
            } else if (stopsLeft > 0) {
                statusLabel += ' via stops';
            } else {
                statusLabel = formatDistance(meters);
            }
        }
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
            {onNavigate ? (
                <TouchableOpacity
                    onPress={onNavigate}
                    accessibilityRole="button"
                    accessibilityLabel={`Directions to ${member.name}`}
                    className="flex-row items-center bg-ocean-600 pl-2.5 pr-3 py-1.5 rounded-full active:bg-ocean-700 ml-2"
                >
                    <Ionicons name="navigate" size={14} color="#fff" />
                </TouchableOpacity>
            ) : (
                onPress && <Ionicons name="locate-outline" size={18} color="#9ca3af" />
            )}
        </Row>
    );
};
