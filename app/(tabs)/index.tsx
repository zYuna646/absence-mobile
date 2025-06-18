import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
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

// Define advisor statistics interface
interface AdvisorStatistics {
  advisor: {
    id: number;
    name: string;
    type: string;
  };
  range: {
    start: string;
    end: string;
  };
  logbooks: {
    list: AdvisorLogbookItem[];
    statistics: {
      total: number;
      verified: number;
      unverified: number;
      incomplete: number;
    };
  };
  advisor_visits?: {
    list: any[];
    statistics: {
      total_visits: number;
      completed_visits: number;
      in_progress_visits: number;
      unique_students_visited: number;
      unique_activities_visited: number;
    };
  };
  advisor_attendances?: {
    list: any[];
    statistics: {
      total_days: number;
      present_days: number;
      absent_days: number;
      complete_attendances: number;
      incomplete_attendances: number;
    };
  };
  calendar: {
    [date: string]: {
      logbook: {
        [status: string]: {
          count: number;
          status: string;
          type: string;
          color: string;
          students: string[];
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

interface AdvisorLogbookItem {
  id: number;
  date: string;
  student: {
    id: number;
    name: string;
  };
  activity: {
    id: number;
    name: string;
  };
  type: string;
  status: string;
  location: string;
  note: string | null;
  check_in_time: string;
  check_out_time: string | null;
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
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
  const [advisorStatistics, setAdvisorStatistics] = useState<AdvisorStatistics | null>(null);
  const router = useRouter();

  // Fetch statistics when component mounts
  useEffect(() => {
    if (role === "student" && token) {
      fetchStudentStatistics();
    } else if (role === "advisor" && token) {
      fetchAdvisorStatistics();
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
      setRefreshing(false);
    }
  };

  // Fetch advisor statistics from API
  const fetchAdvisorStatistics = async () => {
    try {
      setLoading(true);
      
      // Get current date for default range
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Format dates as DD-MM-YYYY
      const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };
      
      const startDate = formatDate(firstDay);
      const endDate = formatDate(lastDay);
      
      // Call API with date range
      const response = await api.getAdvisorStatistics(token!, {
        start_date: startDate,
        end_date: endDate
      });

      if (response.success && response.data) {
        setAdvisorStatistics(response.data);

        // Convert calendar data to activities
        const calendarActivities = convertToAdvisorActivities(response.data);
        setActivities(calendarActivities);
      } else {
        console.error("Failed to fetch advisor statistics:", response.message);
      }
    } catch (error) {
      console.error("Error fetching advisor statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Convert API data to activities format for student
  const convertToActivities = (data: StudentStatistics): Activity[] => {
    const activities: Activity[] = [];

    // Add logbook entries to activities
    if (data.logbooks && data.logbooks.list) {
      data.logbooks.list.forEach((logbook) => {
        // Format date to yyyy-mm-dd for calendar
        const dateParts = logbook.date.split("-");
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

        activities.push({
          id: logbook.id.toString(),
          title: logbook.activity.name,
          date: formattedDate,
          type: "lainnya", // Use a valid ActivityType
          location: logbook.location,
          time: `${logbook.check_in_time.substring(
            0,
            5
          )} - ${logbook.check_out_time ? logbook.check_out_time.substring(0, 5) : "--:--"}`,
          status:
            logbook.status === "verified"
              ? "completed"
              : logbook.status === "unverified"
              ? "pending"
              : "pending", // Map to valid status values
        });
      });
    }

    return activities;
  };

  // Convert API data to activities format for advisor
  const convertToAdvisorActivities = (data: AdvisorStatistics): Activity[] => {
    const activities: Activity[] = [];

    // Add logbook entries to activities
    if (data.logbooks && data.logbooks.list) {
      data.logbooks.list.forEach((logbook) => {
        // Format date to yyyy-mm-dd for calendar
        const dateParts = logbook.date.split("-");
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

        activities.push({
          id: logbook.id.toString(),
          title: `${logbook.student.name} - ${logbook.activity.name}`,
          date: formattedDate,
          type: "lainnya", // Use a valid ActivityType
          location: logbook.location,
          time: `${logbook.check_in_time.substring(
            0,
            5
          )} - ${logbook.check_out_time ? logbook.check_out_time.substring(0, 5) : "--:--"}`,
          status:
            logbook.status === "verified"
              ? "completed"
              : logbook.status === "unverified"
              ? "pending"
              : "cancelled", // Map to valid status values
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
        if (userInfo?.advisor_type === "academic") {
          return "Pembimbing Akademik";
        } else if (userInfo?.advisor_type === "industry") {
          return "Pembimbing Industri";
        } else if (userInfo?.advisor_type === "clinic") {
          return "Pembimbing Klinik";
        }
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
    // if (activity.id) {
    //   router.push({
    //     pathname: "/laporan",
    //     params: { 
    //       activityId: activity.id,
    //       activityName: activity.title
    //     }
    //   });
    // }
  };

  // Navigate to logbook entry screen
  const navigateToLogbook = (logbookItem: LogbookItem) => {
    router.push({
      pathname: "/laporan",
      params: {
        activityId: logbookItem.activity.id,
        activityName: logbookItem.activity.name,
      },
    });
  };

  // Navigate to advisor logbook verification screen
  const navigateToVerification = (logbookItem: AdvisorLogbookItem) => {
    router.push({
      pathname: "/verifikasi",
      params: {
        logbookId: logbookItem.id,
        studentName: logbookItem.student.name,
        activityName: logbookItem.activity.name,
      },
    });
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    if (role === "student" && token) {
      fetchStudentStatistics();
    } else if (role === "advisor" && token) {
      fetchAdvisorStatistics();
    } else {
      setRefreshing(false);
    }
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
                  {
                    value: statistics.logbooks.statistics.total,
                    label: "Total",
                  },
                  {
                    value: statistics.logbooks.statistics.verified,
                    label: "Terverifikasi",
                  },
                  {
                    value: statistics.logbooks.statistics.unverified,
                    label: "Menunggu",
                  },
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

        if (!advisorStatistics) {
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
                  {
                    value: advisorStatistics.logbooks.statistics.total,
                    label: "Total",
                  },
                  {
                    value: advisorStatistics.logbooks.statistics.verified,
                    label: "Terverifikasi",
                  },
                  {
                    value: advisorStatistics.logbooks.statistics.incomplete,
                    label: "Belum Lengkap",
                  },
                ]}
              />
            </Card>

            {advisorStatistics.logbooks.list.length > 0 && (
              <Card title="Verifikasi Tertunda">
                {advisorStatistics.logbooks.list
                  .filter(logbook => logbook.status === "unverified" || logbook.status === "incomplete")
                  .slice(0, 3)
                  .map((logbook, index, filteredArray) => (
                    <ActivityItem
                      key={logbook.id}
                      title={`${logbook.student.name} - ${logbook.activity.name}`}
                      subtitle={logbook.location}
                      timestamp={logbook.date}
                      showDivider={index < filteredArray.length - 1}
                      status={logbook.status}
                      onPress={() => navigateToVerification(logbook)}
                    />
                  ))}
                {!advisorStatistics.logbooks.list.some(logbook => 
                  logbook.status === "unverified" || logbook.status === "incomplete"
                ) && (
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    Tidak ada verifikasi tertunda
                  </Text>
                )}
              </Card>
            )}
            
            {/* Show different statistics based on advisor type */}
            {advisorStatistics.advisor.type !== "clinic" && advisorStatistics.advisor_visits ? (
              <Card title="Statistik Kunjungan">
                <StatisticRow
                  items={[
                    {
                      value: advisorStatistics.advisor_visits.statistics.total_visits,
                      label: "Total",
                    },
                    {
                      value: advisorStatistics.advisor_visits.statistics.completed_visits,
                      label: "Selesai",
                    },
                    {
                      value: advisorStatistics.advisor_visits.statistics.in_progress_visits,
                      label: "Proses",
                    },
                  ]}
                />
              </Card>
            ) : advisorStatistics.advisor_attendances ? (
              <Card title="Statistik Kehadiran">
                <StatisticRow
                  items={[
                    {
                      value: advisorStatistics.advisor_attendances.statistics.total_days,
                      label: "Total Hari",
                    },
                    {
                      value: advisorStatistics.advisor_attendances.statistics.present_days,
                      label: "Hadir",
                    },
                    {
                      value: advisorStatistics.advisor_attendances.statistics.absent_days,
                      label: "Tidak Hadir",
                    },
                  ]}
                />
              </Card>
            ) : null}
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
        onLogout={handleLogout}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
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
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    padding: 15,
    fontSize: 14,
  },
  calendarLoading: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
  },
});
