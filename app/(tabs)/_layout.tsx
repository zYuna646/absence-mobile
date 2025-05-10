import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { useThemeColor } from "@/constants/Colors";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { verifySession, isLoggedIn, isLoading } = useUser();
  const pathname = usePathname();
  const colors = useThemeColor();

  // Verify session when the tab layout is loaded and when the route changes
  useEffect(() => {
    const checkSession = async () => {
      // Skip session check during initial loading
      if (isLoading) return;
      
      // Check if the user has a valid session
      const isSessionValid = await verifySession();
      
      if (!isSessionValid) {
        // If session is invalid, redirect to login
        router.replace("/login");
      }
    };

    checkSession();
  }, [pathname, isLoading]);

  // Don't render the tabs until the session check is complete
  if (!isLoggedIn && !isLoading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.tint,
          elevation: 0, // Remove shadow on Android
          borderTopWidth: 0, // Remove top border
          height: 60, // Set consistent height
          ...(Platform.OS === 'ios' ? { position: "absolute" } : {}),
        },
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarActiveBackgroundColor: colors.tabsSelectedBackground,
        tabBarInactiveBackgroundColor: colors.tabsBackground,
        tabBarItemStyle: {
          borderRadius: 100,
          margin: 5,
          height: 50,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          paddingBottom: 5,
        },
        // Disable the floating appearance
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="kunjungan"
        options={{
          title: "Kunjungan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="akun"
        options={{
          title: "Akun",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="verifikasi"
        options={{
          title: "Verifikasi",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
