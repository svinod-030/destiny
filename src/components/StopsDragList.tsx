import React, { useRef, useState } from 'react';
import { Animated, LayoutAnimation, PanResponder, Platform, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';

export interface DraggableStop {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

interface StopsDragListProps {
    stops: DraggableStop[];
    onReorder: (stops: DraggableStop[]) => void;
    onRemove: (id: string) => void;
    // When set, index 0 is styled and labeled as the destination rather than
    // "Stop 1" - dragging any other row into that slot promotes it (array
    // position is what determines the destination, so reordering is enough).
    firstIsDestination?: boolean;
}

// Fixed row height (including the gap below it) so the drag gesture's pixel
// offset can be converted into "how many rows has this moved" without needing
// to measure layout on every frame.
const ROW_HEIGHT = 52;
const ROW_STEP = ROW_HEIGHT + 8;

if (Platform.OS === 'android' && (UIManager as any).setLayoutAnimationEnabled) {
    (UIManager as any).setLayoutAnimationEnabled(true);
}

export function StopsDragList({ stops, onReorder, onRemove, firstIsDestination }: StopsDragListProps) {
    const colors = useThemeColors();
    const stopsRef = useRef(stops);
    stopsRef.current = stops;

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const dragY = useRef(new Animated.Value(0)).current;
    const dragStartIndex = useRef(0);
    const currentIndex = useRef(0);

    const panRespondersRef = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});

    const getResponder = (id: string) => {
        if (!panRespondersRef.current[id]) {
            panRespondersRef.current[id] = PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
                onPanResponderGrant: () => {
                    const index = stopsRef.current.findIndex((s) => s.id === id);
                    dragStartIndex.current = index;
                    currentIndex.current = index;
                    dragY.setValue(0);
                    setDraggingId(id);
                },
                onPanResponderMove: (_, gesture) => {
                    const rawOffset = Math.round(gesture.dy / ROW_STEP);
                    const targetIndex = Math.min(
                        stopsRef.current.length - 1,
                        Math.max(0, dragStartIndex.current + rawOffset)
                    );

                    if (targetIndex !== currentIndex.current) {
                        const updated = [...stopsRef.current];
                        const [moved] = updated.splice(currentIndex.current, 1);
                        updated.splice(targetIndex, 0, moved);
                        currentIndex.current = targetIndex;
                        stopsRef.current = updated;
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        onReorder(updated);
                    }

                    const settledOffset = (currentIndex.current - dragStartIndex.current) * ROW_STEP;
                    dragY.setValue(gesture.dy - settledOffset);
                },
                onPanResponderRelease: () => {
                    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
                    setDraggingId(null);
                },
                onPanResponderTerminate: () => {
                    dragY.setValue(0);
                    setDraggingId(null);
                },
            });
        }
        return panRespondersRef.current[id];
    };

    return (
        <View className="gap-2">
            {stops.map((stop, index) => {
                const isDragging = stop.id === draggingId;
                const isDestination = !!firstIsDestination && index === 0;
                return (
                    <Animated.View
                        key={stop.id}
                        style={{
                            height: ROW_HEIGHT,
                            transform: [{ translateY: isDragging ? dragY : 0 }],
                            zIndex: isDragging ? 10 : 0,
                            elevation: isDragging ? 6 : 0,
                            shadowColor: '#000',
                            shadowOpacity: isDragging ? 0.25 : 0,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 3 },
                        }}
                        className={`flex-row items-center rounded-2xl pl-3 pr-1 border ${isDestination
                                ? 'bg-blue-600/10 border-blue-600/30'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        <View
                            className={`w-7 h-7 rounded-full items-center justify-center ${isDestination ? 'bg-blue-600' : 'bg-orange-500'
                                }`}
                        >
                            {isDestination ? (
                                <Ionicons name="flag" size={14} color="#fff" />
                            ) : (
                                <Text className="text-white font-bold text-xs">
                                    {firstIsDestination ? index : index + 1}
                                </Text>
                            )}
                        </View>
                        <Text
                            className="text-gray-900 dark:text-white ml-3 text-base font-medium flex-1"
                            numberOfLines={1}
                        >
                            {stop.name.trim() ||
                                (isDestination ? 'Destination' : `Stop ${firstIsDestination ? index : index + 1}`)}
                        </Text>
                        <TouchableOpacity onPress={() => onRemove(stop.id)} className="p-1.5">
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <View {...getResponder(stop.id).panHandlers} className="p-1.5" hitSlop={8}>
                            <Ionicons name="reorder-three" size={22} color={colors.textSecondary} />
                        </View>
                    </Animated.View>
                );
            })}
        </View>
    );
}
