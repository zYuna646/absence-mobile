import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { useThemeColor } from "@/constants/Colors";
import { api } from "@/services/api";

// Import reusable components
import Card from "@/components/ui/Card";
import StatisticRow from "@/components/ui/StatisticRow";
import StatusBadge from "@/components/ui/StatusBadge";
import ActivityItem from "@/components/ui/ActivityItem";
import ProfileHeader from "@/components/ui/ProfileHeader";
import NotificationPanel, {
  Notification,
} from "@/components/ui/NotificationPanel";
import ActivityCalendar, { Activity } from "@/components/ui/ActivityCalendar";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Define student statistics interface
interface StudentStatistics {
  student: {
    id: number;
    name: string;
  };
  range: {
    start: string;
    end: string;
  };
  logbooks: {
    list: LogbookItem[];
    statistics: {
      total: number;
      verified: number;
      unverified: number;
      incomplete: number;
    };
  };
  calendar: {
    [date: string]: {
      logbook: {
        [status: string]: {
          count: number;
          status: string;
          type: string;
        };
      };
    };
  };
}

interface LogbookItem {
  id: number;
  date: string;
  activity: {
    id: number;
    name: string;
  };
  type: string;
  status: string;
  location: string;
  note: string;
  check_in_time: string;
  check_out_time: string;
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const { role, userInfo, token, logout } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>(
    getSampleNotifications()
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
  const router = useRouter();

  // Fetch student statistics when component mounts
  useEffect(() => {
    if (role === "student" && token) {
      fetchStudentStatistics();
    } else {
      setLoading(false);
    }
  }, [role, token]);

  // Fetch student statistics from API
  const fetchStudentStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.getStudentStatistics(token!);
      
      if (response.success && response.data) {
        setStatistics(response.data);
        
        // Convert calendar data to activities
        const calendarActivities = convertToActivities(response.data);
        setActivities(calendarActivities);
      } else {
        console.error("Failed to fetch statistics:", response.message);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert API data to activities format
  const convertToActivities = (data: StudentStatistics): Activity[] => {
    const activities: Activity[] = [];
    
    // Add logbook entries to activities
    if (data.logbooks && data.logbooks.list) {
      data.logbooks.list.forEach(logbook => {
        // Format date to yyyy-mm-dd for calendar
        const dateParts = logbook.date.split('-');
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        
        activities.push({
          id: logbook.id.toString(),
          title: logbook.activity.name,
          date: formattedDate,
          type: "lainnya", // Use a valid ActivityType
          location: logbook.location,
          time: `${logbook.check_in_time.substring(0, 5)} - ${logbook.check_out_time.substring(0, 5)}`,
          status: logbook.status === "verified" ? "completed" : 
                 logbook.status === "unverified" ? "pending" : 
                 "pending", // Map to valid status values
        });
      });
    }
    
    return activities;
  };

  // Get formatted role text
  const getRoleText = () => {
    switch (role) {
      case "student":
        return "Mahasiswa";
      case "advisor":
        return "Pembimbing";
      default:
        return role;
    }
  };

  // Handle notification click
  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  // Handle notification icon press
  const handleNotificationIconPress = () => {
    setShowNotifications(!showNotifications);
  };

  // Handle profile icon press
  const handleProfilePress = () => {
    router.push("/profile");
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Get unread notification count
  const getUnreadCount = () => {
    return notifications.filter((notification) => !notification.read).length;
  };

  // Handle activity selection
  const handleActivitySelect = (activity: Activity) => {
    // Navigate to the activity detail page
    if (activity.id) {
      router.push({
        pathname: "/laporan",
        params: { 
          activityId: activity.id,
          activityName: activity.title
        }
      });
    }
  };

  // Navigate to logbook entry screen
  const navigateToLogbook = (logbookItem: LogbookItem) => {
    router.push({
      pathname: "/laporan",
      params: { activityId: logbookItem.activity.id, activityName: logbookItem.activity.name }
    });
  };

  // Render content based on role
  const renderRoleContent = () => {
    switch (role) {
      case "student":
        if (loading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading data...
              </Text>
            </View>
          );
        }
        
        if (!statistics) {
          return (
            <Card title="Ringkasan Aktivitas">
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Data tidak tersedia
              </Text>
            </Card>
          );
        }
        
        return (
          <View style={styles.roleContent}>
            <Card title="Ringkasan Aktivitas">
              <StatisticRow
                items={[
                  { value: statistics.logbooks.statistics.total, label: "Total" },
                  { value: statistics.logbooks.statistics.verified, label: "Terverifikasi" },
                  { value: statistics.logbooks.statistics.unverified, label: "Menunggu" },
                ]}
              />
            </Card>
            
            {statistics.logbooks.list.length > 0 && (
              <Card title="Kegiatan Terbaru">
                {statistics.logbooks.list.slice(0, 3).map((logbook, index) => (
                  <ActivityItem
                    key={logbook.id}
                    title={logbook.activity.name}
                    subtitle={logbook.location}
                    timestamp={logbook.date}
                    showDivider={index < statistics.logbooks.list.length - 1}
                    status={logbook.status}
                    onPress={() => navigateToLogbook(logbook)}
                  />
                ))}
              </Card>
            )}
          </View>
        );
      case "advisor":
        return (
          <View style={styles.roleContent}>
            <Card title="Ringkasan Aktivitas">
              <StatisticRow
                items={[
                  { value: 12, label: "Mahasiswa" },
                  { value: 25, label: "Kunjungan" },
                  { value: 5, label: "Menunggu" },
                ]}
              />
            </Card>

            <Card title="Verifikasi Tertunda">
              <ActivityItem
                title="Ahmad Rizki - 190511001"
                subtitle="PT. Teknologi Indonesia"
                timestamp="20 Juli 2023"
                showDivider={true}
              />
              <ActivityItem
                title="Budi Santoso - 190511002"
                subtitle="PT. Maju Bersama"
                timestamp="22 Juli 2023"
              />
            </Card>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <ProfileHeader
        name={userInfo?.name || "User"}
        role={getRoleText()}
        onNotificationPress={handleNotificationIconPress}
        onProfilePress={handleProfilePress}
        notificationCount={getUnreadCount()}
      />
      
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: colors.tint }]} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onNotificationPress={handleNotificationPress}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        )}

        <Card title="Kalender Aktivitas">
          {loading ? (
            <View style={styles.calendarLoading}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading calendar...
              </Text>
            </View>
          ) : (
            <ActivityCalendar
              activities={activities}
              onSelectActivity={handleActivitySelect}
            />
          )}
        </Card>

        {renderRoleContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Sample data for notifications
function getSampleNotifications(): Notification[] {
  return [
    {
      id: "1",
      title: "Kunjungan Diverifikasi",
      message: "Kunjungan Anda ke PT. Teknologi Indonesia telah diverifikasi.",
      time: "2 jam yang lalu",
      read: false,
      type: "success",
    },
    {
      id: "2",
      title: "Pengingat Kunjungan",
      message:
        "Anda memiliki kunjungan ke PT. Maju Bersama besok pukul 10:00 WIB.",
      time: "5 jam yang lalu",
      read: false,
      type: "info",
    },
    {
      id: "3",
      title: "Permintaan Revisi",
      message: "Dosen pembimbing meminta revisi laporan kunjungan Anda.",
      time: "Kemarin, 16:30",
      read: true,
      type: "warning",
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  roleContent: {
    marginTop: 10,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  upcomingDetails: {
    fontSize: 12,
    marginBottom: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  logoutText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    padding: 15,
    fontSize: 14,
  },
  calendarLoading: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
