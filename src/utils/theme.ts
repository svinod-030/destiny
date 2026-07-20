import { useColorScheme } from 'nativewind';

export interface ThemeColors {
    background: string;
    surface: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    placeholder: string;
    headerBackground: string;
    headerTint: string;
    tabBarBackground: string;
    tabBarBorder: string;
    tabActive: string;
    tabInactive: string;
}

const LIGHT: ThemeColors = {
    background: '#f9fafb',
    surface: '#ffffff',
    border: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    placeholder: '#9ca3af',
    headerBackground: '#ffffff',
    headerTint: '#111827',
    tabBarBackground: '#ffffff',
    tabBarBorder: '#e5e7eb',
    tabActive: '#3b82f6',
    tabInactive: '#9ca3af',
};

const DARK: ThemeColors = {
    background: '#111827',
    surface: '#1f2937',
    border: '#374151',
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
    placeholder: '#4b5563',
    headerBackground: '#111827',
    headerTint: '#ffffff',
    tabBarBackground: '#1f2937',
    tabBarBorder: '#374151',
    tabActive: '#3b82f6',
    tabInactive: '#9ca3af',
};

// For the handful of spots that can't use NativeWind `dark:` classNames -
// Ionicons `color` props, `placeholderTextColor`, and React Navigation's
// header/tab-bar style objects.
export const useThemeColors = (): ThemeColors => {
    const { colorScheme } = useColorScheme();
    return colorScheme === 'light' ? LIGHT : DARK;
};
