import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { useThemeColor } from "@/constants/Colors";

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

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const { role, userInfo } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>(
    getSampleNotifications()
  );
  const [activities, setActivities] = useState<Activity[]>(
    getSampleActivities()
  );
  const [showNotifications, setShowNotifications] = useState(false);

  // Get formatted role text
  const getRoleText = () => {
    switch (role) {
      case "student":
        return "Mahasiswa";
      case "dosen":
        return "Dosen";
      case "kaprodi":
        return "Kepala Program Studi";
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
    console.log("Profile icon pressed");
  };

  // Get unread notification count
  const getUnreadCount = () => {
    return notifications.filter((notification) => !notification.read).length;
  };

  // Handle activity selection
  const handleActivitySelect = (activity: Activity) => {
    // Handle activity selection
    console.log("Selected activity:", activity);
  };

  // Render content based on role
  const renderRoleContent = () => {
    switch (role) {
      case "student":
        return (
          <View style={styles.roleContent}>
            <Card title="Ringkasan Aktivitas">
              <StatisticRow
                items={[
                  { value: 2, label: "Kunjungan" },
                  { value: 1, label: "Terverifikasi" },
                  { value: 1, label: "Menunggu" },
                ]}
              />
            </Card>
          </View>
        );
      case "dosen":
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
      case "kaprodi":
        return (
          <View style={styles.roleContent}>
            <Card title="Statistik Program Studi">
              <StatisticRow
                items={[
                  { value: 120, label: "Mahasiswa" },
                  { value: 15, label: "Dosen" },
                  { value: 42, label: "Kunjungan" },
                ]}
              />
            </Card>

            <Card title="Aktivitas Terbaru">
              <ActivityItem
                title={
                  <Text style={{ color: colors.text }}>
                    <Text style={{ fontWeight: "bold" }}>Dr. Ahmad Surya</Text>{" "}
                    memverifikasi kunjungan mahasiswa
                  </Text>
                }
                timestamp="1 jam yang lalu"
                showDivider={true}
              />
              <ActivityItem
                title={
                  <Text style={{ color: colors.text }}>
                    <Text style={{ fontWeight: "bold" }}>3 mahasiswa</Text>{" "}
                    menambahkan kunjungan baru
                  </Text>
                }
                timestamp="3 jam yang lalu"
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
        name={userInfo?.name || "Rangga Saputra"}
        role={getRoleText()}
        onNotificationPress={handleNotificationIconPress}
        onProfilePress={handleProfilePress}
        notificationCount={getUnreadCount()}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onNotificationPress={handleNotificationPress}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        )}

        <Card title="Kalender Aktivitas">
          <ActivityCalendar
            activities={activities}
            onSelectActivity={handleActivitySelect}
          />
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

// Sample data for activities
function getSampleActivities(): Activity[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return [
    {
      id: "1",
      title: "PT. Teknologi Indonesia",
      date: formatDate(today),
      type: "kunjungan",
      location: "Jl. Teknologi No. 123",
      time: "09:00 - 12:00 WIB",
      status: "completed",
    },
    {
      id: "2",
      title: "PT. Maju Bersama",
      date: formatDate(tomorrow),
      type: "kunjungan",
      location: "Jl. Industri No. 45",
      time: "10:00 - 13:00 WIB",
      status: "pending",
    },
    {
      id: "3",
      title: "Verifikasi Laporan",
      date: formatDate(today),
      type: "verifikasi",
      time: "15:00 WIB",
      status: "pending",
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
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
});
