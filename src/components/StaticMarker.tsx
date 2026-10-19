import React, { useEffect, useState } from 'react';
import { Marker, MapMarkerProps } from 'react-native-maps';

type Props = MapMarkerProps & {
    // Anything that changes how the marker looks (colour, number). A change re-enables
    // tracking briefly so the new look is captured, then it freezes again.
    appearanceKey: string;
};

const SETTLE_MS = 800;

// react-native-maps turns a custom marker's children into a bitmap. With
// tracksViewChanges left on (the default) it re-captures that bitmap continuously,
// which on real devices shows up as the pins flickering - worst with live location
// updates re-rendering the map every few seconds. Tracking is only needed long
// enough for the first capture (icon fonts load asynchronously, so not zero), then
// it's switched off. Position updates don't need it: `coordinate` moves natively.
export const StaticMarker = React.forwardRef<React.ElementRef<typeof Marker>, Props>(
    ({ appearanceKey, ...props }, ref) => {
        const [tracksViewChanges, setTracksViewChanges] = useState(true);

        useEffect(() => {
            setTracksViewChanges(true);
            const timer = setTimeout(() => setTracksViewChanges(false), SETTLE_MS);
            return () => clearTimeout(timer);
        }, [appearanceKey]);

        return <Marker ref={ref} tracksViewChanges={tracksViewChanges} {...props} />;
    }
);
StaticMarker.displayName = 'StaticMarker';
