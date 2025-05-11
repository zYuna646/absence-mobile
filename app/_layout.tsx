import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, router, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProvider, useUser } from '@/context/UserContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Auth component to handle session state and routing
function AuthStateListener({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useUser();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = pathname === '/login' || pathname === '/register';
    
    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to login if not logged in and not already on login screen
      router.replace('/login');
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect to tabs if logged in and on login screen
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading, pathname]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthStateListener>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </AuthStateListener>
      </ThemeProvider>
    </UserProvider>
  );
}
