import "./global.css";
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import NameEntryScreen from './src/screens/NameEntryScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { useAuthStore } from './src/store/useAuthStore';
import { useOnboardingStore } from './src/store/useOnboardingStore';

export default function App() {
  const isReady = useAuthStore((state) => state.isReady);
  const name = useAuthStore((state) => state.name);
  const init = useAuthStore((state) => state.init);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const markOnboardingSeen = useOnboardingStore((state) => state.markSeen);

  useEffect(() => {
    init();
  }, [init]);

  if (!isReady) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return <OnboardingScreen onDone={markOnboardingSeen} />;
  }

  if (!name) {
    return <NameEntryScreen />;
  }

  return <AppNavigator />;
}
