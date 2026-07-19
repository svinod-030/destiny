// Mock Firebase
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
    initializeAuth: jest.fn(() => ({})),
    getReactNativePersistence: jest.fn(() => ({})),
    signInAnonymously: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
    onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    initializeFirestore: jest.fn(() => ({})),
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    deleteField: jest.fn(() => 'DELETE_FIELD_SENTINEL'),
    onSnapshot: jest.fn(() => jest.fn()), // Returns unsubscribe mock
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(() => Promise.resolve(null)),
        setItem: jest.fn(() => Promise.resolve()),
        removeItem: jest.fn(() => Promise.resolve()),
        clear: jest.fn(() => Promise.resolve()),
    },
}));

// Mock Expo modules
jest.mock('expo-asset', () => ({
    Asset: {
        fromModule: jest.fn(() => ({ uri: 'mocked-asset' })),
        loadAsync: jest.fn(),
    },
}));

jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
    isLoaded: jest.fn(() => true),
}));

jest.mock('expo-location', () => ({
    Accuracy: { Balanced: 3 },
    requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getCurrentPositionAsync: jest.fn(() =>
        Promise.resolve({ coords: { latitude: 0, longitude: 0, heading: null } })
    ),
    watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
    const SafeAreaView = Object.assign(jest.fn(({ children }) => children), { displayName: 'SafeAreaView' });
    const SafeAreaProvider = Object.assign(jest.fn(({ children }) => children), { displayName: 'SafeAreaProvider' });
    const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 });

    return {
        __esModule: true,
        default: { SafeAreaView, SafeAreaProvider, useSafeAreaInsets },
        SafeAreaView,
        SafeAreaProvider,
        useSafeAreaInsets,
    };
});

// Mock react-native-maps (native view, not meaningful in a jest/node environment)
jest.mock('react-native-maps', () => {
    const MapView = jest.fn(() => null);
    MapView.displayName = 'MapView';
    const Marker = jest.fn(() => null);
    Marker.displayName = 'Marker';
    return { __esModule: true, default: MapView, Marker };
});

// Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => jest.fn(() => null));

// Suppress console errors and warnings during tests
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};
