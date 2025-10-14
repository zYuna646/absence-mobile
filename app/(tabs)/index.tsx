import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { useThemeColor } from "@/constants/Colors";
import { api } from "@/services/api";
import { API_URL, ENDPOINTS } from "@/constants/Config";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
  const [advisorStatistics, setAdvisorStatistics] = useState<AdvisorStatistics | null>(null);
  const router = useRouter();

  // Format date helper function
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      // Handle both ISO format and dd-mm-yyyy format
      let date;
      if (dateString.includes('-') && dateString.split('-').length === 3) {
        // Check if it's in dd-mm-yyyy format
        const parts = dateString.split('-');
        if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          // It's likely dd-mm-yyyy
          date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else {
          // Assume it's ISO format or similar
          date = new Date(dateString);
        }
      } else {
        // Default to standard parsing
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Fetch statistics and notifications when component mounts
  useEffect(() => {
    if (token) {
      if (role === "student") {
        fetchStudentStatistics();
      } else if (role === "advisor") {
        fetchAdvisorStatistics();
      } else {
        setLoading(false);
      }
      
      // Fetch notifications for all roles
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [role, token]);
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      if (!token) return;
      
      const response = await api.getNotifications(token);
      
      if (response.success && response.data) {
        // Convert API notification format to app notification format
        const formattedNotifications: Notification[] = response.data.map(notification => ({
          id: notification.id.toString(),
          title: notification.title,
          message: notification.body,
          time: formatNotificationDate(notification.created_at),
          read: notification.read_at !== null,
          type: notification.type as 'info' | 'warning' | 'success' | 'error',
          data: notification.data
        }));
        
        setNotifications(formattedNotifications);
      } else {
        console.error("Failed to fetch notifications:", response.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  
  // Format notification date
  const formatNotificationDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // If less than 24 hours ago, show relative time
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        if (diffHours < 1) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          return `${diffMinutes} menit yang lalu`;
        } else {
          return `${Math.floor(diffHours)} jam yang lalu`;
        }
      } else if (diffHours < 48) {
        return 'Kemarin';
      } else {
        // Format as date
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.error("Error formatting notification date:", error);
      return dateString;
    }
  };

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
  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.read && token) {
        // Mark as read in API using PATCH method
        const url = `${API_URL}${ENDPOINTS.NOTIFICATIONS}/${notification.id}/read`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          // Update local state
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notification.id ? { ...item, read: true } : item
            )
          );
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Empty function as mark all as read is not needed
  const handleMarkAllAsRead = () => {};


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
    if (token) {
      // Refresh notifications for all roles
      fetchNotifications();
      
      // Refresh role-specific data
      if (role === "student") {
        fetchStudentStatistics();
      } else if (role === "advisor") {
        fetchAdvisorStatistics();
      } else {
        setRefreshing(false);
      }
    } else {
      setRefreshing(false);
    }
  };

  // Render student group info
  const renderStudentGroupInfo = () => {
    if (role !== "student" || !userInfo) return null;


    return (
      <>
        <Card title="Informasi Kelompok">
          <View style={styles.groupInfoContainer}>
            <View style={styles.groupInfoRow}>
              <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Stase</Text>
              <Text style={[styles.groupInfoValue, { color: colors.text }]}>{userInfo.stace?.name || userInfo.stace_name || '-'}</Text>
            </View>
            <View style={styles.groupInfoRow}>
              <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Kelompok</Text>
              <Text style={[styles.groupInfoValue, { color: colors.text }]}>{userInfo.group?.name || userInfo.group_name || '-'}</Text>
            </View>
            <View style={styles.groupInfoRow}>
              <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Periode</Text>
              <Text style={[styles.groupInfoValue, { color: colors.text }]}>
                {userInfo.group_start_date && userInfo.group_end_date ? 
                  `${formatDate(userInfo.group_start_date)} - ${formatDate(userInfo.group_end_date)}` :
                  '-'
                }
              </Text>
            </View>
            <View style={styles.groupInfoRow}>
              <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Status</Text>
              <Text style={[styles.groupInfoValue, { color: userInfo.group_status === "running" ? colors.success : colors.error }]}>
                {userInfo.group_status === "running" ? "Aktif" : "Tidak Aktif"}
              </Text>
            </View>
            {userInfo.advisors && userInfo.advisors.length > 0 && userInfo.advisors.map((advisor) => {
              if (advisor.type === "academic") {
                return (
                  <View key={advisor.id} style={styles.groupInfoRow}>
                    <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Pembimbing Akademik</Text>
                    <Text style={[styles.groupInfoValue, { color: colors.text }]}>{advisor.name || '-'}</Text>
                  </View>
                );
              }
              return null;
            })}
            {userInfo.group_status !== "running" && (
              <View style={[styles.warningContainer, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <Text style={[styles.warningText, { color: colors.error }]}>
                  Periode sudah berakhir, silakan ganti kelompok
                </Text>
              </View>
            )}
          </View>
        </Card>
      </>
    );
  };

  // Render advisor group info
  const renderAdvisorGroupInfo = () => {
    if (role !== "advisor" || !userInfo) return null;

    return (
      <>
        <Card title="Informasi Kelompok">
          <View style={styles.groupInfoContainer}>
            <View style={styles.groupInfoRow}>
              <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Stase Aktif</Text>
              <Text style={[styles.groupInfoValue, { color: colors.text }]}>{userInfo.stace?.name || userInfo.stace_name || 'Belum ada stase'}</Text>
            </View>
            <View style={styles.groupInfoRow}>
              <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Kelompok Aktif</Text>
              <Text style={[styles.groupInfoValue, { color: colors.text }]}>{userInfo.group?.name || userInfo.group_name || 'Belum ada kelompok'}</Text>
            </View>
            <View style={styles.groupInfoRow}>
              <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Status Kelompok</Text>
              <Text style={[styles.groupInfoValue, { color: userInfo.group_status === "running" ? colors.success : colors.error }]}>
                {userInfo.group_status === "running" ? "Aktif" : "Tidak Aktif"}
              </Text>
            </View>
            <View style={styles.groupInfoRow}>
              <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Periode</Text>
              <Text style={[styles.groupInfoValue, { color: colors.text }]}>
                {userInfo.group_start_date && userInfo.group_end_date ? 
                  `${formatDate(userInfo.group_start_date)} - ${formatDate(userInfo.group_end_date)}` :
                  'Belum ditentukan'
                }
              </Text>
            </View>
          </View>
        </Card>
      </>
    );
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
            {renderAdvisorGroupInfo()}
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
      edges={['bottom', 'left', 'right']}
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
        nestedScrollEnabled={true}
      >
        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onNotificationPress={handleNotificationPress}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        )}

        {/* Show group info for students before calendar */}
        {role === "student" && userInfo && (
          <Card title="Informasi Kelompok">
            <View style={styles.groupInfoContainer}>
              <View style={styles.groupInfoRow}>
                <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Stase</Text>
                <Text style={[styles.groupInfoValue, { color: colors.text }]}>{userInfo.group?.name || '-'}</Text>
              </View>
              <View style={styles.groupInfoRow}>
                <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Kelompok</Text>
                <Text style={[styles.groupInfoValue, { color: colors.text }]}>{userInfo.stace?.name|| '-'}</Text>
              </View>
              <View style={styles.groupInfoRow}>
                <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Periode</Text>
                <Text style={[styles.groupInfoValue, { color: colors.text }]}>
                  {userInfo.group_start_date && userInfo.group_end_date ? 
                    `${formatDate(userInfo.group_start_date)} - ${formatDate(userInfo.group_end_date)}` :
                    '-'
                  }
                </Text>
              </View>
              <View style={styles.groupInfoRow}>
                <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Status</Text>
                <Text style={[styles.groupInfoValue, { color: userInfo.group_status === "running" ? colors.success : colors.error }]}>
                  {userInfo.group_status === "running" ? "Aktif" : "Tidak Aktif"}
                </Text>
              </View>
              {userInfo.advisors && userInfo.advisors.length > 0 && userInfo.advisors.map((advisor) => {
                if (advisor.type === "academic") {
                  return (
                    <View key={advisor.id} style={styles.groupInfoRow}>
                      <Text style={[styles.groupInfoLabel, { color: colors.text }]}>Pembimbing Akademik</Text>
                      <Text style={[styles.groupInfoValue, { color: colors.text }]}>{advisor.name || '-'}</Text>
                    </View>
                  );
                }
                return null;
              })}
              {userInfo.group_status !== "running" && (
                <View style={[styles.warningContainer, { backgroundColor: colors.error + '20' }]}>
                  <Ionicons name="warning" size={20} color={colors.error} />
                  <Text style={[styles.warningText, { color: colors.error }]}>
                    Periode sudah berakhir, silakan ganti kelompok
                  </Text>
                </View>
              )}
            </View>
          </Card>
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

// Notification function removed

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
  groupInfoContainer: {
    padding: 15,
  },
  groupInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupInfoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    fontWeight: '400',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
});
