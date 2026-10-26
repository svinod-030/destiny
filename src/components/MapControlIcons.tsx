import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

// Vector versions of the two icons on the map's floating buttons. The same icon-font
// glyphs were drawn clipped / half-formed on some phones (their size and metrics
// depend on the device's font settings); fixed-size shapes have no font involved.

export const ShareIcon = ({ size = 20, color = '#0B74B1' }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Line x1="8.2" y1="10.9" x2="15.8" y2="6.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Line x1="8.2" y1="13.1" x2="15.8" y2="17.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx="6" cy="12" r="2.8" stroke={color} strokeWidth={1.8} />
        <Circle cx="18" cy="5.5" r="2.8" stroke={color} strokeWidth={1.8} />
        <Circle cx="18" cy="18.5" r="2.8" stroke={color} strokeWidth={1.8} />
    </Svg>
);

export const LocateIcon = ({ size = 22, color = '#0B74B1' }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="6.2" stroke={color} strokeWidth={1.9} />
        <Circle cx="12" cy="12" r="2.1" fill={color} />
        <Path d="M12 2v3.4M12 18.6V22M2 12h3.4M18.6 12H22" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
);
