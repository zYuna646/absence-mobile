import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  ViewStyle,
  Text,
  View,
  TextStyle,
  TouchableOpacity,
  InteractionManager,
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
  const { verifySession, isLoggedIn, isLoading, role, userInfo } = useUser();
  const pathname = usePathname();
  const colors = useThemeColor();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const setShowMenuSafely = (visible: boolean) => {
    InteractionManager.runAfterInteractions(() => setShowMenu(visible));
  };

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

      try {
        // Check if the user has a valid session
        const isSessionValid = await verifySession();

        if (!isSessionValid) {
          // If session is invalid, redirect to login
          router.replace("/login");
        }
      } catch (e) {
        console.error("Session verification failed:", e);
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

  // Custom single central dashboard button as tab bar
  const CustomTabBar = () => {
    const itemsByRole: {
      label: string;
      route: string;
      icon:
        | keyof typeof Ionicons.glyphMap
        | keyof typeof MaterialIcons.glyphMap
        | keyof typeof MaterialCommunityIcons.glyphMap;
      lib: "ion" | "mat" | "mci";
    }[] =
      role === "student"
        ? [
            {
              label: "Kunjungan",
              route: "/kunjungan",
              icon: "paper-plane",
              lib: "ion",
            },
            {
              label: "Ruangan",
              route: "/kegiatan",
              icon: "file-document-edit-outline",
              lib: "mci",
            },
            {
              label: "Panduan",
              route: "/panduan",
              icon: "document-outline",
              lib: "ion",
            },
            {
              label: "Verifikasi",
              route: "/verifikasi",
              icon: "checkmark-circle",
              lib: "ion",
            },
            {
              label: "Absensi",
              route: "/absensi",
              icon: "calendar-clock",
              lib: "mci",
            },
          ]
        : [
            {
              label: "Verifikasi",
              route: "/verifikasi",
              icon: "checkmark-circle",
              lib: "ion",
            },
            {
              label: "Kunjungan",
              route: "/kunjungan",
              icon: "paper-plane",
              lib: "ion",
            },
            {
              label: "Ruangan",
              route: "/kegiatan",
              icon: "file-document-edit-outline",
              lib: "mci",
            },
            {
              label: "Panduan",
              route: "/panduan",
              icon: "document-outline",
              lib: "ion",
            },
            {
              label: "Absensi",
              route: "/absensi",
              icon: "calendar-clock",
              lib: "mci",
            },
            {
              label: "Penilaian",
              route: "/penilaian",
              icon: "clipboard-list",
              lib: "mci",
            },
          ];

    return (
      <View style={[styles.customTabBarContainer]}>
        {/* Overlay menu */}
        {showMenu && (
          <View style={styles.menuOverlay}>
            <View
              style={[
                styles.menuPanel,
                { backgroundColor: colors.tabsBackground },
              ]}
            >
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                Menu
              </Text>
              <View style={styles.menuGrid}>
                {itemsByRole.map((item) => (
                  <TouchableOpacity
                    key={item.route}
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenuSafely(false);
                      InteractionManager.runAfterInteractions(() => {
                        router.push(item.route as any);
                      });
                    }}
                  >
                    {item.lib === "ion" ? (
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={colors.tint}
                      />
                    ) : item.lib === "mat" ? (
                      <MaterialIcons
                        name={item.icon as any}
                        size={22}
                        color={colors.tint}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={22}
                        color={colors.tint}
                      />
                    )}
                    <Text
                      style={[styles.menuItemLabel, { color: colors.text }]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.menuClose}
                onPress={() => setShowMenuSafely(false)}
              >
                <Text style={[styles.menuCloseText, { color: colors.text }]}>
                  Tutup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Floating central dashboard button */}
        <View style={styles.tabBarShadow} />
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.replace("/kegiatan")}
          onLongPress={() => setShowMenuSafely(true)}
          style={[styles.fab, { backgroundColor: colors.tint }]}
        >
          <MaterialIcons name="dashboard" size={28} color="white" />
          <Text style={styles.fabLabel}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Common tab screen options
  const commonTabScreenOptions = {
    headerShown: true,
    headerTitleAlign: commonHeaderOptions.headerTitleAlign,
    headerStyle: commonHeaderOptions.headerStyle,
    headerTitleStyle: commonHeaderOptions.headerTitleStyle,
    // Replace default tab bar with custom single button
    tabBar: () => <CustomTabBar />,
  } as const;

  // Render student tabs
  if (role === "student") {
    return (
      <Tabs screenOptions={commonTabScreenOptions}>
        <Tabs.Screen 
          name="kunjungan" 
          options={{ 
            href: null,
            title: "Kunjungan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paper-plane" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="kegiatan" 
          options={{ 
            title: "Ruangan",
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
            headerShown: false,
            title: "Dashboard",
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
            href: null,
            title: "Verifikasi",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-circle" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="absensi" 
          options={{ 
            href: null,
            title: "Absensi",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="calendar-clock"
                size={size}
                color={color}
              />
            ),
          }} 
        />
        <Tabs.Screen 
          name="penilaian" 
          options={{ 
            href: null,
            title: "Penilaian",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="clipboard-list"
                size={size}
                color={color}
              />
            ),
          }} 
        />
      </Tabs>
    );
  } else if (role === "advisor") {
    // Check if advisor is clinic type
    const isClinicAdvisor = userInfo?.type === "clinic";

    if (isClinicAdvisor) {
      // Render clinic advisor tabs
      return (
        <Tabs screenOptions={commonTabScreenOptions}>
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
              href: null,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="paper-plane" size={size} color={color} />
              ),
            }}
          />
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
          <Tabs.Screen
            name="kegiatan"
            options={{
              title: "Ruangan",
              href: null,
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
              title: "Panduan",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="document-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="absensi"
            options={{
              title: "Absensi",
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="penilaian"
            options={{
              title: "Penilaian",
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons
                  name="clipboard-list"
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>
      );
    }

    // Render regular advisor tabs
    return (
      <Tabs screenOptions={commonTabScreenOptions}>
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
            href: null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paper-plane" size={size} color={color} />
            ),
          }}
        />
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
        <Tabs.Screen
          name="kegiatan"
          options={{
            title: "Ruangan",
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
            title: "Panduan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="absensi"
          options={{
            title: "Absensi",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="calendar-clock"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="penilaian"
          options={{
            title: "Penilaian",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="clipboard-list"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    );
  }

  // Default tabs for unknown roles
  return (
    <Tabs screenOptions={commonTabScreenOptions}>
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
  // Custom single-button tab bar styles
  customTabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  fabLabel: {
    position: "absolute",
    bottom: -18,
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  tabBarShadow: {
    position: "absolute",
    bottom: 10,
    width: 120,
    height: 50,
    backgroundColor: "#00000020",
    borderRadius: 25,
    filter: Platform.OS === "web" ? ("blur(10px)" as any) : undefined,
  },
  menuOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  menuPanel: {
    width: "90%",
    borderRadius: 16,
    padding: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  menuItem: {
    width: "25%",
    alignItems: "center",
    marginBottom: 16,
  },
  menuItemLabel: {
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },
  menuClose: {
    marginTop: 8,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00000020",
  },
  menuCloseText: {
    fontWeight: "600",
  },
});
