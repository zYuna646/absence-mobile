import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  ViewStyle,
  Text,
  View,
  TextStyle,
} from "react-native";
import { router, usePathname } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { useThemeColor } from "@/constants/Colors";

/**
 * Tab layout configuration for the main app
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { verifySession, isLoggedIn, isLoading, role } = useUser();
  const pathname = usePathname();
  const colors = useThemeColor();
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    // Update current role when role changes
    if (role) {
      console.log("Current role:", role);
      setCurrentRole(role);
    }
  }, [role]);

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

  // Create tabBarStyle based on platform
  const tabBarStyle: ViewStyle = {
    backgroundColor: colors.tint,
    elevation: 0, // Remove shadow on Android
    borderTopWidth: 0, // Remove top border
    height: 60, // Set consistent height
  };

  // Add position: absolute for iOS only
  if (Platform.OS === "ios") {
    tabBarStyle.position = "absolute";
  }

  // Common header style for tabs that display a header
  const commonHeaderOptions = {
    headerTitleAlign: "center" as "center", // Center the header title
    headerStyle: {
      backgroundColor: colors.tint,
    },
    headerTitleStyle: {
      color: "white",
    },
  };

  // Conditionally render tabs based on role
  if (role === "student") {
    return (
      <Tabs
        screenOptions={{
          headerShown: true, // Default to showing headers
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarActiveBackgroundColor: colors.tabsSelectedBackground,
          tabBarInactiveBackgroundColor: colors.tabsBackground,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          // Disable the floating appearance
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: true,
          tabBarAllowFontScaling: false,
          // Header options
          headerTitleAlign: commonHeaderOptions.headerTitleAlign,
          headerStyle: commonHeaderOptions.headerStyle,
          headerTitleStyle: commonHeaderOptions.headerTitleStyle,
        }}
      >
        <Tabs.Screen
          name="kunjungan"
          options={{
            title: "Kunjungan",
            href: null,

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paper-plane" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="kegiatan"
          options={{
            title: "Kegiatan",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="file-document-edit-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            headerShown: false, // Hide header only for dashboard
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="dashboard" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="panduan"
          options={{
            title: "Panduan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="verifikasi"
          options={{
            title: "Verifikasi",
            href: null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-circle" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  } else if (role === "advisor") {
    // Tabs for advisor role
    return (
      <Tabs
        screenOptions={{
          headerShown: true, // Default to showing headers
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarActiveBackgroundColor: colors.tabsSelectedBackground,
          tabBarInactiveBackgroundColor: colors.tabsBackground,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          // Disable the floating appearance
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: true,
          tabBarAllowFontScaling: false,
          // Header options
          headerTitleAlign: commonHeaderOptions.headerTitleAlign,
          headerStyle: commonHeaderOptions.headerStyle,
          headerTitleStyle: commonHeaderOptions.headerTitleStyle,
        }}
      >
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
          name="kunjungan"
          options={{
            title: "Kunjungan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paper-plane" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            headerShown: false, // Hide header for dashboard
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="dashboard" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="kegiatan"
          options={{
            title: "Kegiatan",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="file-document-edit-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="panduan"
          options={{
            href: null,
            title: "Panduan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }

  // Default tabs for unknown roles as fallback
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarActiveBackgroundColor: colors.tabsSelectedBackground,
        tabBarInactiveBackgroundColor: colors.tabsBackground,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarAllowFontScaling: false,
        headerTitleAlign: commonHeaderOptions.headerTitleAlign,
        headerStyle: commonHeaderOptions.headerStyle,
        headerTitleStyle: commonHeaderOptions.headerTitleStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    borderRadius: 100,
    margin: 5,
    height: 50,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
    paddingBottom: 5,
  },
});
