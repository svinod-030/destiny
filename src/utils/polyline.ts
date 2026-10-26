export interface LatLng {
    latitude: number;
    longitude: number;
}

// Decodes Google's encoded polyline format (precision 5), as returned by the Routes API.
export const decodePolyline = (encoded: string): LatLng[] => {
    const points: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    const readValue = (): number => {
        let result = 0;
        let shift = 0;
        let byte: number;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20 && index < encoded.length + 1);
        return result & 1 ? ~(result >> 1) : result >> 1;
    };

    while (index < encoded.length) {
        lat += readValue();
        lng += readValue();
        points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
};
