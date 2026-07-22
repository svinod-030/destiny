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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useJourneySync } from '../hooks/useJourneySync';
import { useAuthStore } from '../store/useAuthStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { useJourneyHistoryStore } from '../store/useJourneyHistoryStore';
import { useThemeColors } from '../utils/theme';

export default function JoinJourneyScreen({ navigation }: any) {
    const [codeInput, setCodeInput] = useState('');
    const { joinJourney, isLoading, error } = useJourneySync();
    const { uid, name } = useAuthStore();
    const setActiveJourney = useJourneyStore((state) => state.setActiveJourney);
    const addHistoryEntry = useJourneyHistoryStore((state) => state.addEntry);
    const colors = useThemeColors();

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const handleRequestPermission = async () => {
        if (permission?.granted) {
            setIsScanning(true);
            setScanned(false);
            return;
        }

        const result = await requestPermission();
        if (result.granted) {
            setIsScanning(true);
            setScanned(false);
        } else {
            setTimeout(() => {
                Alert.alert('Camera permission needed', 'Allow Destiny to access your camera to scan journey codes.');
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

    const handleJoin = async (codeToJoin?: string) => {
        const code = codeToJoin || codeInput;
        if (!code.trim()) return;
        if (!uid) {
            Alert.alert(
                'Not signed in yet',
                "We're still connecting you to Destiny. Please wait a moment and try again."
            );
            return;
        }

        const journey = await joinJourney(code.trim(), uid, name);
        if (journey) {
            setActiveJourney(journey.id, 'member');
            addHistoryEntry({
                id: journey.id,
                destinationName: journey.destination.name,
                role: 'member',
                status: 'active',
                startedAt: journey.createdAt,
            });
            navigation.navigate('JourneyMap');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['bottom', 'left', 'right']}>
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
                                    </View>
                                </View>
                            </Modal>
                        )}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scannerContainer: { flex: 1, backgroundColor: '#000' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    header: { position: 'absolute', top: 60, right: 20, zIndex: 10 },
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
