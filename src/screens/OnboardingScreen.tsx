import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polygon, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PIN_PATH =
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

const ORANGE = '#F97316';
const GREEN = '#10B981';
const PURPLE = '#8B5CF6';
const BLUE = '#2563EB';

function Pin({ x, y, scale, color }: { x: number; y: number; scale: number; color: string }) {
    return (
        <G transform={`translate(${x} ${y}) scale(${scale}) translate(-12 -12)`}>
            <Path d={PIN_PATH} fill={color} />
        </G>
    );
}

// Step 1: searching for a destination and dropping a pin on a map
function SearchIllustration() {
    return (
        <Svg width={220} height={220} viewBox="0 0 200 200">
            <Rect x="10" y="10" width="180" height="180" rx="28" fill="#EFF6FF" />
            <Line x1="10" y1="72" x2="190" y2="72" stroke="#DBEAFE" strokeWidth="2" />
            <Line x1="10" y1="134" x2="190" y2="134" stroke="#DBEAFE" strokeWidth="2" />
            <Line x1="72" y1="10" x2="72" y2="190" stroke="#DBEAFE" strokeWidth="2" />
            <Line x1="134" y1="10" x2="134" y2="190" stroke="#DBEAFE" strokeWidth="2" />
            <Circle cx="100" cy="152" r="16" fill="none" stroke="#93C5FD" strokeWidth="3" strokeDasharray="4 5" />
            <Pin x={100} y={110} scale={7.5} color={BLUE} />
            <Circle cx="152" cy="46" r="24" fill={BLUE} />
            <Circle cx="147" cy="41" r="8" fill="none" stroke="#ffffff" strokeWidth="3.5" />
            <Line x1="153" y1="47" x2="161" y2="55" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        </Svg>
    );
}

// Step 2: sharing a journey code / QR for others to join
function InviteIllustration() {
    const cell = 8;
    const onCells = [
        [0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2],
        [4, 0], [4, 2], [5, 1], [6, 0], [6, 2],
        [0, 4], [0, 6], [1, 5], [1, 6], [2, 4], [2, 6],
        [4, 4], [4, 5], [5, 4], [5, 6], [6, 5], [6, 6],
    ];
    const originX = 63;
    const originY = 48;
    return (
        <Svg width={220} height={220} viewBox="0 0 200 200">
            <Rect x="10" y="10" width="180" height="180" rx="28" fill="#FFF7ED" />
            <Rect x="55" y="40" width="90" height="90" rx="14" fill="#ffffff" stroke="#FDBA74" strokeWidth="2" />
            {onCells.map(([col, row], i) => (
                <Rect
                    key={i}
                    x={originX + col * cell}
                    y={originY + row * cell}
                    width={cell - 1.5}
                    height={cell - 1.5}
                    rx="1.5"
                    fill={ORANGE}
                />
            ))}
            <Circle cx="52" cy="162" r="17" fill={ORANGE} stroke="#ffffff" strokeWidth="3" />
            <Circle cx="100" cy="172" r="17" fill={GREEN} stroke="#ffffff" strokeWidth="3" />
            <Circle cx="148" cy="162" r="17" fill={PURPLE} stroke="#ffffff" strokeWidth="3" />
        </Svg>
    );
}

// Step 3: everyone's live location converging on the destination (rhombus motif, matches the app icon)
function TrackIllustration() {
    return (
        <Svg width={220} height={220} viewBox="0 0 200 200">
            <Rect x="10" y="10" width="180" height="180" rx="28" fill="#ECFDF5" />
            <Polygon
                points="100,38 152,100 100,162 48,100"
                fill="none"
                stroke="#A7F3D0"
                strokeWidth="4"
                strokeLinejoin="round"
            />
            <Pin x={100} y={38} scale={3.4} color={BLUE} />
            <Pin x={152} y={100} scale={3.4} color={ORANGE} />
            <Pin x={100} y={162} scale={3.4} color={GREEN} />
            <Pin x={48} y={100} scale={3.4} color={PURPLE} />
        </Svg>
    );
}

const STEPS = [
    {
        title: 'Start a Journey',
        description: 'Search for a destination or long-press the map to drop a pin.',
        Illustration: SearchIllustration,
    },
    {
        title: 'Invite Your Group',
        description: 'Share your journey code, or let friends scan the QR to join instantly.',
        Illustration: InviteIllustration,
    },
    {
        title: 'Track Everyone Live',
        description: "See the whole group on the map by name, with everyone's distance to the destination.",
        Illustration: TrackIllustration,
    },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
    const [index, setIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setIndex(newIndex);
    };

    const goNext = () => {
        if (index < STEPS.length - 1) {
            scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_WIDTH, animated: true });
            setIndex(index + 1);
        } else {
            onDone();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <View className="flex-row justify-end px-6 pt-2">
                <TouchableOpacity onPress={onDone} className="p-2">
                    <Text className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                        Skip
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                className="flex-1"
            >
                {STEPS.map((step, i) => (
                    <View key={i} style={{ width: SCREEN_WIDTH }} className="items-center justify-center px-10">
                        <step.Illustration />
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold text-center mt-8">
                            {step.title}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-center mt-3 text-base leading-6">
                            {step.description}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            <View className="flex-row justify-center gap-2 mb-6">
                {STEPS.map((_, i) => (
                    <View
                        key={i}
                        className={`h-2 rounded-full ${i === index ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-gray-700'
                            }`}
                    />
                ))}
            </View>

            <View className="px-8 pb-6">
                <TouchableOpacity
                    onPress={goNext}
                    className="bg-blue-600 p-5 rounded-2xl items-center active:bg-blue-700"
                >
                    <Text className="text-white font-bold uppercase tracking-widest">
                        {index === STEPS.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
