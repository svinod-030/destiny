import "./global.css";
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import NameEntryScreen from './src/screens/NameEntryScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import UpdateModal from './src/components/UpdateModal';
import LaunchLoader, { LAUNCH_MIN_DISPLAY_MS } from './src/components/LaunchLoader';
import { useAuthStore } from './src/store/useAuthStore';
import { useOnboardingStore } from './src/store/useOnboardingStore';
import { useAdConfigStore } from './src/store/useAdConfigStore';
import { useJourneyHistoryStore } from './src/store/useJourneyHistoryStore';
import { checkVersion } from './src/utils/versionCheckService';
import { setupAppCheck } from './src/utils/appCheck';
import { featureConfigService } from './src/services/featureConfigService';
import { journeyHistoryService } from './src/services/journeyHistoryService';
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
  const uid = useAuthStore((state) => state.uid);
  const name = useAuthStore((state) => state.name);
  const init = useAuthStore((state) => state.init);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const markOnboardingSeen = useOnboardingStore((state) => state.markSeen);

  const [storeVersion, setStoreVersion] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [minDisplayElapsed, setMinDisplayElapsed] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const timer = setTimeout(() => setMinDisplayElapsed(true), LAUNCH_MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    if (!isReady || !uid) return;
    const unsubscribe = journeyHistoryService.subscribeToEntries(
      uid,
      (entries) => {
        entries.forEach((entry) => useJourneyHistoryStore.getState().addEntry(entry));
      },
      (error) => {
        console.error('Failed to subscribe to journey history:', error);
      }
    );
    return unsubscribe;
  }, [isReady, uid]);

  if (!isReady || !minDisplayElapsed) {
    return <LaunchLoader />;
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
