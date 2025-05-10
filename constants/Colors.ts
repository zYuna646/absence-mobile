/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2F80ED';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: 'black',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: 'white',
    tabIconSelected: tintColorLight,
    tabsBackground: tintColorLight,
    tabsSelectedBackground: 'white',
    inputBackground: '#F5F5F5',
    inputBorder: tintColorLight,
    cardBackground: tintColorLight,

    error: '#e11d48',
    success: '#10b981',
    warning: '#f59e0b',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    tabsBackground: tintColorDark,
    tabsSelectedBackground: '#2A2D2E',
    inputBackground: '#2A2D2E',
    inputBorder: '#3E4144',
    cardBackground: '#2A2D2E',
    error: '#f43f5e',
    success: '#34d399',
    warning: '#fbbf24',
  },
};

// A utility function to get the current theme's colors
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
}

// Generic type for all available color keys
export type ColorName = keyof typeof Colors.light;
