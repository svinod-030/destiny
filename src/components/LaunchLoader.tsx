import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';

const WORD = 'RoadTrip';
const ENTRANCE_STAGGER_MS = 60;
const ENTRANCE_DURATION_MS = 420;
const BOB_STAGGER_MS = 90;
const BOB_DURATION_MS = 280;

export const LAUNCH_MIN_DISPLAY_MS = WORD.length * ENTRANCE_STAGGER_MS + ENTRANCE_DURATION_MS + 1200;

// Shown while auth/session state is still resolving on launch (see App.tsx's
// !isReady branch). Letters stagger in, then idle in a gentle left-to-right
// wave for as long as the wait lasts - reads as "working on it" without a
// generic spinner, and needs no new dependencies.
export default function LaunchLoader() {
    const entrance = useRef(WORD.split('').map(() => new Animated.Value(0))).current;
    const bob = useRef(WORD.split('').map(() => new Animated.Value(0))).current;

    useEffect(() => {
        const entranceAnims = entrance.map((val, i) =>
            Animated.sequence([
                Animated.delay(i * ENTRANCE_STAGGER_MS),
                Animated.timing(val, {
                    toValue: 1,
                    duration: ENTRANCE_DURATION_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ])
        );

        const bobAnims = bob.map((val, i) =>
            Animated.sequence([
                Animated.delay(WORD.length * ENTRANCE_STAGGER_MS + ENTRANCE_DURATION_MS + i * BOB_STAGGER_MS),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(val, {
                            toValue: 1,
                            duration: BOB_DURATION_MS,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(val, {
                            toValue: 0,
                            duration: BOB_DURATION_MS,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.delay((WORD.length - 1) * BOB_STAGGER_MS),
                    ])
                ),
            ])
        );

        Animated.parallel([...entranceAnims, ...bobAnims]).start();
    }, [entrance, bob]);

    return (
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#07284A' }}>
            <View style={{ flexDirection: 'row' }}>
                {WORD.split('').map((letter, i) => {
                    const translateY = entrance[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                    });
                    const opacity = entrance[i];
                    const bobTranslateY = bob[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6],
                    });
                    return (
                        <Animated.Text
                            key={`${letter}-${i}`}
                            style={{
                                color: '#F2F9FD',
                                fontSize: 34,
                                fontWeight: '800',
                                opacity,
                                transform: [{ translateY }, { translateY: bobTranslateY }],
                            }}
                        >
                            {letter}
                        </Animated.Text>
                    );
                })}
            </View>
        </View>
    );
}
