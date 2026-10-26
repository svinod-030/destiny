import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

// Map marker artwork drawn as vectors with fixed pixel sizes. react-native-maps
// snapshots a marker's children into a bitmap, and icon-font glyphs (Ionicons) don't
// survive that consistently - their size, position and even whether they've loaded
// by snapshot time vary by device, which showed up as clipped or oddly shaped pins.
// Shapes carry no font and no system scaling, so they render the same everywhere.

const PIN_PATH =
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

const PAD = 4;

// Where each shape's pointer sits inside its box, as a fraction - pass to a Marker's
// `anchor` so the tip / pole base lands exactly on the coordinate.
export const PIN_SIZE = { width: 32, height: 44 };
export const PIN_BOX = { width: PIN_SIZE.width + PAD * 2, height: PIN_SIZE.height + PAD * 2 };
export const PIN_ANCHOR = { x: 0.5, y: (PAD + PIN_SIZE.height * (21 / 22)) / PIN_BOX.height };

export const FLAG_SIZE = 36;
export const FLAG_BOX = FLAG_SIZE + PAD * 2;
export const FLAG_ANCHOR = {
    x: (PAD + FLAG_SIZE * (6 / 24)) / FLAG_BOX,
    y: (PAD + FLAG_SIZE * (21 / 24)) / FLAG_BOX,
};

export const MemberPin = ({ color }: { color: string }) => (
    <View style={{ width: PIN_BOX.width, height: PIN_BOX.height, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={PIN_SIZE.width} height={PIN_SIZE.height} viewBox="4 1 16 22">
            <Path d={PIN_PATH} fill={color} stroke="#ffffff" strokeWidth={1.2} strokeLinejoin="round" />
        </Svg>
    </View>
);

export const DestinationFlag = ({ color = '#EF4444' }: { color?: string }) => (
    <View style={{ width: FLAG_BOX, height: FLAG_BOX, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={FLAG_SIZE} height={FLAG_SIZE} viewBox="0 0 24 24">
            <Rect x={5} y={2.5} width={2} height={19} rx={1} fill="#374151" stroke="#ffffff" strokeWidth={1.2} />
            <Polygon
                points="6.5,3.5 19.5,8.5 6.5,13.5"
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.4}
                strokeLinejoin="round"
            />
        </Svg>
    </View>
);
