import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    StyleSheet,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useJourneySync } from '../hooks/useJourneySync';
import { journeyHistoryService } from '../services/journeyHistoryService';
import { useAuthStore } from '../store/useAuthStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { useJourneyHistoryStore } from '../store/useJourneyHistoryStore';
import { useThemeColors } from '../utils/theme';
import AdBanner from '../components/AdBanner';
import { PermissionDisclosureModal } from '../components/PermissionDisclosureModal';

export default function JoinJourneyScreen({ navigation }: any) {
    const [codeInput, setCodeInput] = useState('');
    const { joinJourney, isLoading, error } = useJourneySync();
    const { uid, name } = useAuthStore();
    const activeJourneyId = useJourneyStore((state) => state.journeyId);
    const setActiveJourney = useJourneyStore((state) => state.setActiveJourney);
    const addHistoryEntry = useJourneyHistoryStore((state) => state.addEntry);
    const colors = useThemeColors();

    const [permission, requestPermission] = useCameraPermissions();
    const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();
    const [scanned, setScanned] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isReadingImage, setIsReadingImage] = useState(false);
    const [showCameraDisclosure, setShowCameraDisclosure] = useState(false);
    const [showPhotosDisclosure, setShowPhotosDisclosure] = useState(false);

    // Prominent-disclosure requirement: the OS permission dialog must be
    // immediately preceded by an in-app explanation - so tapping "Scan QR"
    // shows the disclosure first (if not already granted), and only the
    // disclosure's own "Allow" button actually triggers the OS request.
    const handleRequestPermission = () => {
        if (permission?.granted) {
            setIsScanning(true);
            setScanned(false);
            return;
        }
        setShowCameraDisclosure(true);
    };

    const confirmCameraPermission = async () => {
        setShowCameraDisclosure(false);
        const result = await requestPermission();
        if (result.granted) {
            setIsScanning(true);
            setScanned(false);
        } else {
            setTimeout(() => {
                Alert.alert('Camera permission needed', 'Allow ConvoyMates to access your camera to scan journey codes.');
            }, 300);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        setScanned(true);
        setIsScanning(false);
        setCodeInput(data);
        if (data && data.length >= 4) {
            handleJoin(data);
        }
    };

    // Lets someone join from a QR code they already have as a photo (e.g. a
    // screenshot sent in chat) instead of needing to point the camera at it live.
    const handlePickFromGallery = () => {
        if (mediaPermission?.granted) {
            pickFromGallery();
            return;
        }
        setShowPhotosDisclosure(true);
    };

    const confirmPhotosPermission = async () => {
        setShowPhotosDisclosure(false);
        const permissionResult = await requestMediaPermission();
        if (!permissionResult.granted) {
            Alert.alert('Photos permission needed', 'Allow ConvoyMates to access your photos to upload a QR code.');
            return;
        }
        pickFromGallery();
    };

    const pickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
            if (result.canceled || !result.assets?.[0]) return;

            setIsReadingImage(true);
            const results = await scanFromURLAsync(result.assets[0].uri, ['qr']);
            if (results.length === 0) {
                Alert.alert('No QR code found', "We couldn't find a QR code in that image. Try a clearer photo.");
                return;
            }

            handleBarCodeScanned({ data: results[0].data });
        } catch (error) {
            console.error('Failed to read QR code from image:', error);
            Alert.alert('Error', 'Could not read that image. Please try again.');
        } finally {
            setIsReadingImage(false);
        }
    };

    const handleJoin = async (codeToJoin?: string) => {
        const code = codeToJoin || codeInput;
        if (!code.trim()) return;
        if (!uid) {
            Alert.alert(
                'Not signed in yet',
                "We're still connecting you to ConvoyMates. Please wait a moment and try again."
            );
            return;
        }

        const journey = await joinJourney(code.trim(), uid, name);
        if (journey) {
            setActiveJourney(journey.id, 'member');
            const historyEntry = {
                id: journey.id,
                destination: journey.destination,
                stops: journey.stops ?? [],
                role: 'member' as const,
                status: 'active' as const,
                startedAt: journey.createdAt,
            };
            addHistoryEntry(historyEntry);
            journeyHistoryService.recordEntry(uid, historyEntry).catch((error) => {
                console.error('Failed to record journey history:', error);
            });
            navigation.navigate('JourneyMap');
        }
    };

    // Only one journey can be active at a time - joining another here would
    // silently orphan the current one's live tracking (Firestore doc left
    // running with no one updating it). Send them back to it instead.
    if (activeJourneyId) {
        return (
            <SafeAreaView
                className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-8"
                edges={['left', 'right']}
            >
                <View className="bg-blue-600/20 p-6 rounded-full mb-6">
                    <Ionicons name="navigate" size={60} color="#3b82f6" />
                </View>
                <Text className="text-gray-900 dark:text-white text-2xl font-bold text-center">
                    Journey in progress
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center mt-3 text-base leading-6">
                    You already have an active journey. Leave or end it before joining another.
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('JourneyMap')}
                    className="mt-8 bg-blue-600 px-8 py-5 rounded-2xl flex-row items-center active:bg-blue-700"
                >
                    <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                    <Text className="text-white font-bold ml-2 uppercase tracking-widest">
                        Return to Journey
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
                        <View className="items-center mt-10 mb-10">
                            <View className="bg-blue-600/20 p-6 rounded-full mb-6">
                                <Ionicons name="people" size={60} color="#3b82f6" />
                            </View>
                            <Text className="text-gray-900 dark:text-white text-3xl font-bold text-center">
                                Join a Journey
                            </Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-center mt-3 text-base leading-6 px-4">
                                Enter the journey code your friend shared, or scan their QR code.
                            </Text>
                        </View>

                        <View className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 mb-6">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-4 tracking-[4px] ml-1">
                                Journey Code
                            </Text>
                            <TextInput
                                value={codeInput}
                                onChangeText={setCodeInput}
                                placeholder="e.g. AB12CD"
                                placeholderTextColor={colors.placeholder}
                                className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-5 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-2xl mb-6 tracking-widest"
                                autoCapitalize="characters"
                                autoCorrect={false}
                                selectionColor="#3b82f6"
                            />

                            <View className="gap-3">
                                <TouchableOpacity
                                    onPress={() => handleJoin()}
                                    disabled={isLoading || !codeInput.trim()}
                                    className={`p-5 rounded-2xl items-center flex-row justify-center ${isLoading || !codeInput.trim() ? 'bg-blue-600/30' : 'bg-blue-600 active:bg-blue-700'
                                        }`}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="play" size={20} color="#fff" />
                                            <Text className="text-white font-bold ml-3 uppercase tracking-widest">
                                                Join
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleRequestPermission}
                                    className="p-5 rounded-2xl items-center flex-row justify-center border border-dashed border-gray-300 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-700"
                                >
                                    <Ionicons name="qr-code-outline" size={20} color="#3b82f6" />
                                    <Text className="text-blue-500 font-bold ml-3 uppercase tracking-widest">
                                        Scan QR
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {error && (
                                <View className="mt-6 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex-row items-center justify-center">
                                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                                    <Text className="text-red-500 font-bold ml-2 text-sm">{error}</Text>
                                </View>
                            )}
                        </View>

                        <AdBanner />

                        {isScanning && (
                            <Modal
                                animationType="slide"
                                transparent={false}
                                visible={isScanning}
                                onRequestClose={() => setIsScanning(false)}
                            >
                                <View style={styles.scannerContainer}>
                                    <CameraView
                                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                        style={StyleSheet.absoluteFillObject}
                                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                                    />
                                    <View style={styles.overlay}>
                                        <View style={styles.header}>
                                            <TouchableOpacity
                                                onPress={handlePickFromGallery}
                                                disabled={isReadingImage}
                                                className="p-4 rounded-full bg-black/40 mr-3"
                                            >
                                                {isReadingImage ? (
                                                    <ActivityIndicator color="#fff" size="small" />
                                                ) : (
                                                    <Ionicons name="image-outline" size={26} color="#fff" />
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setIsScanning(false)}
                                                className="p-4 rounded-full bg-black/40"
                                            >
                                                <Ionicons name="close" size={30} color="#fff" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.scanFrame}>
                                            <View style={styles.cornerTopLeft} />
                                            <View style={styles.cornerTopRight} />
                                            <View style={styles.cornerBottomLeft} />
                                            <View style={styles.cornerBottomRight} />
                                        </View>

                                        <Text style={styles.scanText}>Scan QR Code</Text>
                                        <Text style={styles.scanSubText}>Align the QR code within the frame</Text>
                                        <Text style={styles.scanSubText}>or tap the image icon to upload one</Text>
                                    </View>
                                </View>
                            </Modal>
                        )}

                        <PermissionDisclosureModal
                            visible={showCameraDisclosure}
                            icon="camera"
                            iconColor="#3b82f6"
                            title="Camera Access"
                            message="ConvoyMates uses your camera only to scan a journey's QR code so you can join instantly. Nothing is recorded, saved, or sent anywhere."
                            confirmLabel="Allow"
                            onAllow={confirmCameraPermission}
                            onDeny={() => setShowCameraDisclosure(false)}
                        />

                        <PermissionDisclosureModal
                            visible={showPhotosDisclosure}
                            icon="image"
                            iconColor="#3b82f6"
                            title="Photos Access"
                            message="ConvoyMates only reads the one photo you pick, to scan a journey's QR code from it. Nothing else in your library is accessed, saved, or sent anywhere."
                            confirmLabel="Allow"
                            onAllow={confirmPhotosPermission}
                            onDeny={() => setShowPhotosDisclosure(false)}
                        />
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scannerContainer: { flex: 1, backgroundColor: '#000' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    header: { position: 'absolute', top: 60, right: 20, zIndex: 10, flexDirection: 'row' },
    scanFrame: { width: 280, height: 280, backgroundColor: 'transparent' },
    cornerTopLeft: {
        position: 'absolute', top: 0, left: 0, width: 40, height: 40,
        borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#3b82f6', borderTopLeftRadius: 20,
    },
    cornerTopRight: {
        position: 'absolute', top: 0, right: 0, width: 40, height: 40,
        borderTopWidth: 4, borderRightWidth: 4, borderColor: '#3b82f6', borderTopRightRadius: 20,
    },
    cornerBottomLeft: {
        position: 'absolute', bottom: 0, left: 0, width: 40, height: 40,
        borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#3b82f6', borderBottomLeftRadius: 20,
    },
    cornerBottomRight: {
        position: 'absolute', bottom: 0, right: 0, width: 40, height: 40,
        borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#3b82f6', borderBottomRightRadius: 20,
    },
    scanText: {
        color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 60,
        textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2,
    },
    scanSubText: { color: '#9ca3af', fontSize: 14, marginTop: 10, textAlign: 'center', fontWeight: 'bold' },
});
