// Pre-rendered marker artwork (assets/markers, 1x/2x/3x). react-native-maps draws an
// `image` straight from the file, whereas a marker built from views is photographed at
// one moment and frozen - on slower phones that photo can land before it has finished
// drawing, which showed up as clipped or half-drawn pins. Keys are the member palette
// colours (src/utils/color.ts); metro needs every require() spelled out statically.
const PIN_IMAGES: Record<string, number> = {
    '#ef4444': require('../../assets/markers/pin-ef4444.png'),
    '#f97316': require('../../assets/markers/pin-f97316.png'),
    '#f59e0b': require('../../assets/markers/pin-f59e0b.png'),
    '#84cc16': require('../../assets/markers/pin-84cc16.png'),
    '#10b981': require('../../assets/markers/pin-10b981.png'),
    '#14b8a6': require('../../assets/markers/pin-14b8a6.png'),
    '#06b6d4': require('../../assets/markers/pin-06b6d4.png'),
    '#3b82f6': require('../../assets/markers/pin-3b82f6.png'),
    '#6366f1': require('../../assets/markers/pin-6366f1.png'),
    '#8b5cf6': require('../../assets/markers/pin-8b5cf6.png'),
    '#a855f7': require('../../assets/markers/pin-a855f7.png'),
    '#d946ef': require('../../assets/markers/pin-d946ef.png'),
    '#ec4899': require('../../assets/markers/pin-ec4899.png'),
    '#f43f5e': require('../../assets/markers/pin-f43f5e.png'),
};

export const memberPinImage = (color: string): number | undefined => PIN_IMAGES[color.toLowerCase()];

export const destinationFlagImage: number = require('../../assets/markers/flag.png');
