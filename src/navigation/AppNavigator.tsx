import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import JoinJourneyScreen from '../screens/JoinJourneyScreen';
import JourneyHistoryScreen from '../screens/JourneyHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import JourneyMapScreen from '../screens/JourneyMapScreen';
import { useJourneyStore } from '../store/useJourneyStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const LogoTitle = React.memo(() => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image
            style={{ width: 36, height: 36, borderRadius: 18 }}
            source={require('../../assets/icon.png')}
            resizeMode="contain"
        />
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Destiny</Text>
    </View>
));

const DEFAULT_STACK_OPTIONS = {
    headerStyle: { backgroundColor: '#111827' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' as const },
    headerTitle: (props: any) => <LogoTitle {...props} />,
    contentStyle: { backgroundColor: '#111827' },
};

function HomeTabs() {
    return (
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
            <View style={{ flex: 1, backgroundColor: '#1F2937' }}>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarStyle: {
                            backgroundColor: '#1F2937',
                            borderTopColor: '#374151',
                            elevation: 0,
                            paddingTop: 5,
                        },
                        tabBarActiveTintColor: '#3B82F6',
                        tabBarInactiveTintColor: '#9CA3AF',
                        tabBarIcon: ({ focused, color, size }) => {
                            let iconName: keyof typeof Ionicons.glyphMap = 'navigate-outline';
                            if (route.name === 'Start') iconName = focused ? 'navigate' : 'navigate-outline';
                            else if (route.name === 'Join') iconName = focused ? 'people' : 'people-outline';
                            else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
                            else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
                            return <Ionicons name={iconName} size={size} color={color} />;
                        },
                    })}
                >
                    <Tab.Screen name="Start" component={HomeScreen} />
                    <Tab.Screen name="Join" component={JoinJourneyScreen} />
                    <Tab.Screen name="History" component={JourneyHistoryScreen} />
                    <Tab.Screen name="Settings" component={SettingsScreen} />
                </Tab.Navigator>
            </View>
        </SafeAreaView>
    );
}

export default function AppNavigator() {
    // If a journey was active when the app last closed, jump straight back into it.
    // (Best-effort: if AsyncStorage hasn't finished rehydrating yet, this falls back to HomeTabs.)
    const journeyId = useJourneyStore((state) => state.journeyId);

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={DEFAULT_STACK_OPTIONS}
                initialRouteName={journeyId ? 'JourneyMap' : 'HomeTabs'}
            >
                <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ title: '' }} />
                <Stack.Screen name="JourneyMap" component={JourneyMapScreen} options={{ title: 'Journey' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
