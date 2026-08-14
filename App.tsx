import "./global.css";
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import NameEntryScreen from './src/screens/NameEntryScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import UpdateModal from './src/components/UpdateModal';
import { useAuthStore } from './src/store/useAuthStore';
import { useOnboardingStore } from './src/store/useOnboardingStore';
import { useAdConfigStore } from './src/store/useAdConfigStore';
import { checkVersion } from './src/utils/versionCheckService';
import { setupAppCheck } from './src/utils/appCheck';
import { featureConfigService } from './src/services/featureConfigService';
import './src/tasks/locationTask';

// Ensures the "journey in progress" notification stays visible even if the
// user briefly reopens the app while background tracking is active.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// As early as possible, before any Firestore/Functions calls fire, so every
// request in the app carries an App Check token from the start.
setupAppCheck();

export default function App() {
  const isReady = useAuthStore((state) => state.isReady);
  const name = useAuthStore((state) => state.name);
  const init = useAuthStore((state) => state.init);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const markOnboardingSeen = useOnboardingStore((state) => state.markSeen);

  const [storeVersion, setStoreVersion] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isReady) return;
    checkVersion().then((result) => {
      if (result.isUpdateAvailable) {
        setStoreVersion(result.storeVersion);
        setShowUpdateModal(true);
      }
    });
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    const unsubscribe = featureConfigService.subscribeToFeatureConfig(
      (config) => {
        useAdConfigStore.getState().setAdsEnabled(config.adsEnabled);
      },
      (error) => {
        console.error('Failed to subscribe to feature config:', error);
      }
    );
    return unsubscribe;
  }, [isReady]);

  if (!isReady) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      {!hasSeenOnboarding ? (
        <OnboardingScreen onDone={markOnboardingSeen} />
      ) : !name ? (
        <NameEntryScreen />
      ) : (
        <AppNavigator />
      )}
      <UpdateModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        storeVersion={storeVersion}
      />
    </>
  );
}
