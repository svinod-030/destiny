import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import HomeScreen from '../screens/HomeScreen';
import JoinJourneyScreen from '../screens/JoinJourneyScreen';
import JourneyHistoryScreen from '../screens/JourneyHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import JourneyMapScreen from '../screens/JourneyMapScreen';
import { useJourneyStore } from '../store/useJourneyStore';
import { useThemeColors } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const LogoTitle = React.memo(({ tint }: { tint: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image
            style={{ width: 36, height: 36, borderRadius: 18 }}
            source={require('../../assets/icon.png')}
            resizeMode="contain"
        />
        <Text style={{ color: tint, fontWeight: 'bold', fontSize: 20 }}>Destiny</Text>
    </View>
));

function HomeTabs() {
    const colors = useThemeColors();

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
            <View style={{ flex: 1, backgroundColor: colors.tabBarBackground }}>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarStyle: {
                            backgroundColor: colors.tabBarBackground,
                            borderTopColor: colors.tabBarBorder,
                            elevation: 0,
                            paddingTop: 5,
                        },
                        tabBarActiveTintColor: colors.tabActive,
                        tabBarInactiveTintColor: colors.tabInactive,
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
    const colors = useThemeColors();
    const { colorScheme } = useColorScheme();

    const stackOptions = {
        headerStyle: { backgroundColor: colors.headerBackground },
        headerTintColor: colors.headerTint,
        headerTitleStyle: { fontWeight: 'bold' as const },
        headerTitle: () => <LogoTitle tint={colors.headerTint} />,
        contentStyle: { backgroundColor: colors.background },
    };

    const navigationTheme = {
        ...(colorScheme === 'light' ? DefaultTheme : DarkTheme),
        colors: {
            ...(colorScheme === 'light' ? DefaultTheme.colors : DarkTheme.colors),
            background: colors.background,
            card: colors.headerBackground,
            border: colors.border,
        },
    };

    return (
        <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
                screenOptions={stackOptions}
                initialRouteName={journeyId ? 'JourneyMap' : 'HomeTabs'}
            >
                <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ title: '' }} />
                <Stack.Screen name="JourneyMap" component={JourneyMapScreen} options={{ title: 'Journey' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
