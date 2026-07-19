import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../utils/firebase';

interface AuthStore {
    uid: string | null;
    name: string;
    isReady: boolean;
    setName: (name: string) => void;
    init: () => void;
}

let hasInitialized = false;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            uid: null,
            name: '',
            isReady: false,
            setName: (name) => set({ name: name.trim() }),
            init: () => {
                if (hasInitialized) return;
                hasInitialized = true;

                onAuthStateChanged(auth, (user) => {
                    if (user) {
                        set({ uid: user.uid, isReady: true });
                    } else {
                        signInAnonymously(auth).catch((error) => {
                            console.error('Anonymous sign-in failed:', error);
                            set({ isReady: true });
                        });
                    }
                });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ name: state.name }),
        }
    )
);
