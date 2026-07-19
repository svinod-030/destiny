import "./global.css";
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import NameEntryScreen from './src/screens/NameEntryScreen';
import { useAuthStore } from './src/store/useAuthStore';

export default function App() {
  const isReady = useAuthStore((state) => state.isReady);
  const name = useAuthStore((state) => state.name);
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  if (!isReady) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!name) {
    return <NameEntryScreen />;
  }

  return <AppNavigator />;
}
