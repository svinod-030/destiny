import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeStore {
    preference: ThemePreference;
    setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            preference: 'system',
            setPreference: (preference) => {
                colorScheme.set(preference);
                set({ preference });
            },
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // NativeWind's own colorScheme state isn't tied to AsyncStorage and
            // resets to 'system' on every cold start - sync it the moment the
            // persisted preference finishes loading, rather than racing a
            // manually-invoked init() against rehydration timing.
            onRehydrateStorage: () => (state) => {
                if (state) colorScheme.set(state.preference);
            },
        }
    )
);
