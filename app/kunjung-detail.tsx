import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { api } from "@/services/api";

interface ActivityData {
  id: number;
  name: string;
  indicators?: string;
  advisor_clinic_name?: string;
  advisor_clinic_id?: number;
  location?: string;
  room?: string;
  is_lock: number;
  lock_date: string | null;
  unlock_date: string | null;
}
import { useLocalSearchParams, router } from "expo-router";
import Card from "@/components/ui/Card";
import PrimaryButton from "@/components/PrimaryButton";
import BottomSheetSelector from "@/components/ui/BottomSheetSelector";

interface Student {
  id: number;
  name: string;
  nim: string;
  group_name?: string;
}

interface Location {
  latitude: string;
  longitude: string;
}

interface CheckIn {
  id: number;
  time: string;
  photo: string;
  address: string;
  location: Location;
}

interface CheckOut {
  id: number;
  time: string;
  photo: string;
  address: string;
  location: Location;
  description?: string;
  notes?: string;
  score?: number;
}

interface Visit {
  date: string;
  student: {
    id: number;
    name: string;
    nim: string;
  };
  activity: {
    id: number;
    name: string;
  };
  check_in: CheckIn;
  check_out: CheckOut | null;
  status: string; // "in_progress", "completed", "scheduled"
}

export default function KunjungDetailScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { token, role } = useUser();
  const params = useLocalSearchParams();
  const studentId = params.studentId ? parseInt(params.studentId as string) : 0;
  const activityId = params.activityId
    ? parseInt(params.activityId as string)
    : 0;

  const [student, setStudent] = useState<Student | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoaded, setVisitsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reference for the ScrollView
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Detail modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [visitDetails, setVisitDetails] = useState<Visit | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load student and activity details
  useEffect(() => {
    loadStudentDetails();
    loadActivityDetails();
  }, [studentId, activityId]);

  // Load visits when activity is available - only once when activity changes
  useEffect(() => {
    console.log("Visits dependency changed:", {
      activityId: activity?.id,
      visitsLoaded,
      refreshing,
      shouldLoad: activity && activity.id && !visitsLoaded && !refreshing,
    });

    if (activity && activity.id && !visitsLoaded && !refreshing) {
      loadVisits();
    }
  }, [activity?.id, visitsLoaded, refreshing]); // Only reload when these dependencies change

  // Load visit details when selectedVisitId changes
  useEffect(() => {
    if (selectedVisitId && modalVisible) {
      loadVisitDetails(selectedVisitId);
    }
  }, [selectedVisitId, modalVisible]);

  useEffect(() => {
    if (visits.length > 0) {
      setSelectedVisitId(visits[0].check_in.id);

      // If there's an in-progress visit today, scroll to it after a short delay
      const inProgressVisit = getTodayInProgressVisit();
      if (inProgressVisit) {
        setTimeout(() => {
          // Find the index of the in-progress visit
          const index = visits.findIndex(
            (v) => v.check_in.id === inProgressVisit.check_in.id
          );

          if (index >= 0) {
            // Scroll to the visits section
            scrollViewRef.current?.scrollTo({
              y: 500 + index * 150, // Approximate position
              animated: true,
            });
          }
        }, 500);
      }
    }
  }, [visits]);

  // Function to refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    setVisitsLoaded(false); // Reset the loaded flag to force reload
    await Promise.all([loadStudentDetails(), loadActivityDetails()]);
    await loadVisits();
    setRefreshing(false);
  };

  // Function to load student details
  const loadStudentDetails = async () => {
    if (!token || !studentId) {
      return;
    }

    try {
      setLoading(true);

      // Simulate API call - in real app, replace with actual API call
      // For now, we'll use mock data
      setTimeout(() => {
        setStudent({
          id: studentId,
          name: (params.studentName as string) || "Student Name",
          nim: "1234567890",
          group_name: "Group A",
        });
      }, 500);
    } catch (error) {
      console.error("Error loading student details:", error);
      Alert.alert("Error", "Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  // State for activities data
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showActivitySelector, setShowActivitySelector] = useState(false);

  // Function to load activity details - always use first activity from list
  const loadActivityDetails = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setLoadingActivities(true);

      // Load all activities
      const response = await api.getActivities(token);

      if (response.success && response.data && response.data.length > 0) {
        setActivities(response.data);

        // Always select the first activity
        setActivity(response.data[0]);
      } else {
        // Use mock data if API fails or returns empty data
        const mockActivities = [
          {
            id: 1,
            name: "Kegiatan Praktek 1",
            indicators: "Indikator kegiatan praktek 1",
            advisor_clinic_name: "Dr. Pembimbing 1",
            is_lock: 0,
            lock_date: null,
            unlock_date: null,
          },
          {
            id: 2,
            name: "Kegiatan Praktek 2",
            indicators: "Indikator kegiatan praktek 2",
            advisor_clinic_name: "Dr. Pembimbing 2",
            is_lock: 1,
            lock_date: "2024-01-15",
            unlock_date: null,
          },
        ];

        setActivities(mockActivities);
        setActivity(mockActivities[0]);
      }
    } catch (error) {
      console.error("Error loading activity details:", error);
      // Use mock data if error
      const mockActivities = [
        {
          id: 1,
          name: "Kegiatan Praktek 1",
          indicators: "Indikator kegiatan praktek 1",
          advisor_clinic_name: "Dr. Pembimbing 1",
          is_lock: 0,
          lock_date: null,
          unlock_date: null,
        },
        {
          id: 2,
          name: "Kegiatan Praktek 2",
          indicators: "Indikator kegiatan praktek 2",
          advisor_clinic_name: "Dr. Pembimbing 2",
          is_lock: 1,
          lock_date: "2024-01-15",
          unlock_date: null,
        },
      ];

      setActivities(mockActivities);
      setActivity(mockActivities[0]);
    } finally {
      setLoading(false);
      setLoadingActivities(false);
    }
  };

  // Function to load visits for the student and selected activity
  const loadVisits = async () => {
    // Add a timestamp to track when this function is called
    console.log(`[${new Date().toISOString()}] loadVisits called with:`, {
      token: !!token,
      studentId,
      activityId: activity?.id,
      activityName: activity?.name,
      visitsLoaded,
    });

    if (!token || !studentId || !activity) {
      console.log("Missing required data for loadVisits:", {
        token: !!token,
        studentId,
        activityId: activity?.id,
      });
      return;
    }

    try {
      setLoading(true);

      // Use the new endpoint to get visits for this student and activity
      const response = await api.getVisitsByActivity(
        token,
        activity.id,
        studentId
      );

      console.log("Visits API response:", response);

      if (response.success && response.data) {
        // Update student data if available
        if (response.data.student) {
          const studentData: Student = {
            id: Number(response.data.student.id),
            name: response.data.student.name,
            nim: response.data.student.nim,
          };
          setStudent(studentData);
        }

        // Don't update activity data here to prevent circular dependencies
        // This was causing infinite API calls

        // Set visits data
        if (response.data.visits) {
          setVisits(response.data.visits);
        } else {
          setVisits([]);
        }

        // Mark visits as loaded to prevent continuous reloading
        setVisitsLoaded(true);
      } else {
        // If API fails, use mock data
        const today = new Date().toISOString().split("T")[0];
        const mockVisits: Visit[] = [
          {
            date: "2023-07-15T00:00:00.000000Z",
            student: {
              id: studentId,
              name: student?.name || "Student Name",
              nim: student?.nim || "1234567890",
            },
            activity: {
              id: activity.id,
              name: activity.name,
            },
            check_in: {
              id: 1,
              time: "09:30:00",
              photo: "https://picsum.photos/800/600",
              address: "PT. Teknologi Indonesia",
              location: {
                latitude: "0.5509502",
                longitude: "123.1296372",
              },
            },
            check_out: {
              id: 2,
              time: "16:30:00",
              photo: "https://picsum.photos/800/600",
              address: "PT. Teknologi Indonesia",
              location: {
                latitude: "0.5509502",
                longitude: "123.1296372",
              },
              description: "Kunjungan pembimbingan pertama",
              notes: "Catatan pembimbingan pertama",
              score: 85,
            },
            status: "completed",
          },
          {
            date: "2023-08-20T00:00:00.000000Z",
            student: {
              id: studentId,
              name: student?.name || "Student Name",
              nim: student?.nim || "1234567890",
            },
            activity: {
              id: activity.id,
              name: activity.name,
            },
            check_in: {
              id: 3,
              time: "13:45:00",
              photo: "https://picsum.photos/800/600",
              address: "PT. Teknologi Indonesia",
              location: {
                latitude: "0.5509502",
                longitude: "123.1296372",
              },
            },
            check_out: {
              id: 4,
              time: "17:15:00",
              photo: "https://picsum.photos/800/600",
              address: "PT. Teknologi Indonesia",
              location: {
                latitude: "0.5509502",
                longitude: "123.1296372",
              },
              description: "Kunjungan pembimbingan kedua",
              notes: "Catatan pembimbingan kedua",
              score: 90,
            },
            status: "completed",
          },
          {
            date: today + "T00:00:00.000000Z",
            student: {
              id: studentId,
              name: student?.name || "Student Name",
              nim: student?.nim || "1234567890",
            },
            activity: {
              id: activity.id,
              name: activity.name,
            },
            check_in: {
              id: 5,
              time: "10:00:00",
              photo: "https://picsum.photos/800/600",
              address: "PT. Teknologi Indonesia",
              location: {
                latitude: "0.5509502",
                longitude: "123.1296372",
              },
            },
            check_out: null,
            status: "in_progress",
          },
        ];
        setVisits(mockVisits);
        setVisitsLoaded(true);
      }
    } catch (error) {
      console.error("Error loading visits:", error);
      // Use mock data if error
      const today = new Date().toISOString().split("T")[0];
      const mockVisits: Visit[] = [
        {
          date: "2023-07-15T00:00:00.000000Z",
          student: {
            id: studentId,
            name: student?.name || "Student Name",
            nim: student?.nim || "1234567890",
          },
          activity: {
            id: activity?.id || 1,
            name: activity?.name || "Activity Name",
          },
          check_in: {
            id: 1,
            time: "09:30:00",
            photo: "https://picsum.photos/800/600",
            address: "PT. Teknologi Indonesia",
            location: {
              latitude: "0.5509502",
              longitude: "123.1296372",
            },
          },
          check_out: {
            id: 2,
            time: "16:30:00",
            photo: "https://picsum.photos/800/600",
            address: "PT. Teknologi Indonesia",
            location: {
              latitude: "0.5509502",
              longitude: "123.1296372",
            },
            description: "Kunjungan pembimbingan pertama",
            notes: "Catatan pembimbingan pertama",
            score: 85,
          },
          status: "completed",
        },
        {
          date: today + "T00:00:00.000000Z",
          student: {
            id: studentId,
            name: student?.name || "Student Name",
            nim: student?.nim || "1234567890",
          },
          activity: {
            id: activity?.id || 1,
            name: activity?.name || "Activity Name",
          },
          check_in: {
            id: 3,
            time: "10:00:00",
            photo: "https://picsum.photos/800/600",
            address: "PT. Teknologi Indonesia",
            location: {
              latitude: "0.5509502",
              longitude: "123.1296372",
            },
          },
          check_out: null,
          status: "in_progress",
        },
      ];
      setVisits(mockVisits);
      setVisitsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to load visit details
  const loadVisitDetails = async (visitId: number) => {
    try {
      setLoadingDetails(true);

      // Simulate API call - in real app, replace with actual API call
      setTimeout(() => {
        const visit = visits.find((v) => v.check_in.id === visitId);
        if (visit) {
          setVisitDetails(visit);
        } else {
          Alert.alert("Error", "Visit not found");
        }
        setLoadingDetails(false);
      }, 500);
    } catch (error) {
      console.error("Error loading visit details:", error);
      Alert.alert("Error", "Failed to load visit details");
      setLoadingDetails(false);
    }
  };

  // Open visit details
  const openVisitDetails = (visitId: number) => {
    setSelectedVisitId(visitId);
    setModalVisible(true);
  };

  // Close visit details
  const closeVisitDetails = () => {
    setModalVisible(false);
    setVisitDetails(null);
    setSelectedVisitId(null);
  };

  // Toggle activity selector
  const toggleActivitySelector = () => {
    setShowActivitySelector(!showActivitySelector);
  };

  // Handle activity selection
  const handleSelectActivity = (selectedActivity: ActivityData) => {
    setActivity(selectedActivity);
    setShowActivitySelector(false);
    // Reset visits loaded flag to trigger reload for the new activity
    setVisitsLoaded(false);
    // Show loading state
    setLoading(true);
  };

  // Check if there's already a visit in progress today
  const hasInProgressVisitToday = (): boolean => {
    if (!visits || visits.length === 0) return false;

    return visits.some(
      (visit) => isToday(visit.date) && visit.status === "in_progress"
    );
  };

  // Check if there's any visit today regardless of status
  const hasVisitToday = (): boolean => {
    if (!visits || visits.length === 0) return false;

    return visits.some((visit) => isToday(visit.date));
  };

  // Get today's in-progress visit if it exists
  const getTodayInProgressVisit = (): Visit | null => {
    if (!visits || visits.length === 0) return null;

    return (
      visits.find(
        (visit) => isToday(visit.date) && visit.status === "in_progress"
      ) || null
    );
  };

  // Get today's visit regardless of status
  const getTodayVisit = (): Visit | null => {
    if (!visits || visits.length === 0) return null;
    
    return visits.find((visit) => isToday(visit.date)) || null;
  };

  // Check if activity is locked
  const isActivityLocked = (): boolean => {
    if (!activity) return false;
    // Activity is locked if is_lock = 1 and lock_date is not null
    return activity.is_lock === 1 && activity.lock_date !== null;
  };

  // Check if activity is unlocked (available for use)
  const isActivityUnlocked = (): boolean => {
    if (!activity) return false;
    // Activity is unlocked if is_lock = 0
    return activity.is_lock === 0;
  };

  // Get activity status text
  const getActivityStatusText = (): string => {
    if (!activity) return "";
    
    if (isActivityUnlocked()) {
      return "Kegiatan terbuka";
    } else if (isActivityLocked()) {
      return "Kegiatan tertutup";
    }
   else {
      return "Status tidak diketahui";
    }
  };

  // Handle create visit button press - more general approach
  const handleCreateVisit = () => {
    if (!student || !activity) return;

    // Check if activity is locked
    if (activity?.is_lock === 1) {
      Alert.alert(
        "Kegiatan Tertutup",
        "Kegiatan ini sedang tertutup. Tidak dapat membuat kunjungan baru saat kegiatan tertutup."
      );
      return;
    }

    // Check if there's already any visit today
    if (hasVisitToday()) {
      Alert.alert(
        "Kunjungan Hari Ini",
        "Anda sudah memiliki kunjungan untuk hari ini. Tidak dapat membuat kunjungan baru pada hari yang sama."
      );
      return;
    }

    // Navigate to visit creation screen with student and activity details
    router.push({
      pathname: "/kunjungan-create",
      params: {
        studentId: student.id,
        studentName: student.name,
        activityId: activity.id,
        activityName: activity.name,
        mode: "checkin",
      },
    });
  };

  // Custom render for activity items
  const renderCustomActivityItem = (item: ActivityData, isSelected: boolean) => {
    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          isSelected && { backgroundColor: `${colors.tint}20` },
        ]}
        onPress={() => handleSelectActivity(item)}
      >
        <Text style={[styles.activityName, { color: colors.text }]}>
          {item.name}
        </Text>
        {item.advisor_clinic_name && (
          <Text style={[styles.activityDetail, { color: colors.icon }]}>
            Pembimbing: {item.advisor_clinic_name}
          </Text>
        )}
        {item.location && (
          <Text style={[styles.activityDetail, { color: colors.icon }]}>
            Lokasi: {item.location}{item.room ? `, Ruang ${item.room}` : ''}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Format time string (HH:MM:SS to HH:MM)
  const formatTime = (timeString: string): string => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  // Check if date is today
  const isToday = (dateString: string): boolean => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
     today.setDate(today.getDate() + 1); 
    const todayStr = today.toISOString().split("T")[0];

    // Extract date from the API date string (format: YYYY-MM-DDT00:00:00.000000Z)
    const checkDate = dateString.split("T")[0];

    return todayStr === checkDate;
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return colors.success || "#28a745";
      case "in_progress":
        return "#17a2b8"; // Info color
      case "scheduled":
        return colors.warning || "#ffc107";
      default:
        return colors.icon || "#6c757d";
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case "completed":
        return "Selesai";
      case "in_progress":
        return "Sedang Berlangsung";
      case "scheduled":
        return "Terjadwal";
      default:
        return "Tidak Diketahui";
    }
  };

  // Handle check-out for a visit
  const handleCheckOut = (visitId: number) => {
    if (!student || !activity) return;

    // Navigate to check-out screen with visit details and activity data
    router.push({
      pathname: "/kunjungan-create",
      params: {
        studentId: student.id,
        studentName: student.name,
        activityId: activity.id,
        activityName: activity.name,
        checkInId: visitId,
        mode: "checkout",
      },
    });
  };

  // Render visit item
  const renderVisitItem = ({ item }: { item: Visit }) => {
    // Show check-out button for in_progress visits when date is today
    const showCheckOutButton =
      item.status === "in_progress" && isToday(item.date);

    // Highlight today's visit with a special style
    const isTodaysVisit = isToday(item.date);

    // Add extra highlight for in-progress visits
    const isInProgress = item.status === "in_progress";
    
    // Add styles for completed visits
    const isCompleted = item.status === "completed";

    // Get icon based on status
    const getStatusIcon = () => {
      switch (item.status) {
        case "completed":
          return "checkmark-circle";
        case "in_progress":
          return "time";
        case "scheduled":
          return "calendar";
        default:
          return "help-circle";
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.visitItem,
          isTodaysVisit && { borderColor: colors.tint, borderWidth: 1.5 },
          isInProgress && { backgroundColor: `${colors.tint}10` },
          isCompleted && { backgroundColor: `${colors.success}10` },
        ]}
        onPress={() => openVisitDetails(item.check_in.id)}
        activeOpacity={0.7}
      >
        <View style={styles.visitHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons 
              name={getStatusIcon()} 
              size={16} 
              color={getStatusColor(item.status)} 
              style={{ marginRight: 8 }} 
            />
            <Text style={[styles.visitDate, { color: colors.text }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.visitDetails}>
          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.icon}
              style={styles.detailIcon}
            />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {formatTime(item.check_in.time)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.icon}
              style={styles.detailIcon}
            />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {item.check_in.address}
            </Text>
          </View>
        </View>

        {showCheckOutButton && (
          <View style={styles.checkOutContainer}>
            <Text style={[styles.checkOutNote, { color: colors.warning }]}>
              <Ionicons name="alert-circle" size={14} color={colors.warning} />{" "}
              Kunjungan sedang berlangsung
            </Text>
            <TouchableOpacity
              style={[styles.checkOutButton, { backgroundColor: colors.tint }]}
              onPress={() => handleCheckOut(item.check_in.id)}
            >
              <Ionicons
                name="exit-outline"
                size={18}
                color="white"
                style={styles.actionIcon}
              />
              <Text style={styles.actionButtonText}>Check-out Kunjungan</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render visit details modal
  const renderVisitDetailsModal = () => {
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVisitDetails}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Detail Kunjungan
              </Text>
              <TouchableOpacity
                onPress={closeVisitDetails}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Loading details...
                </Text>
              </View>
            ) : visitDetails ? (
              <ScrollView style={styles.detailsScrollView}>
                {/* Visit Info */}
                <Card title="Informasi Kunjungan">
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>
                      Tanggal:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatDate(visitDetails.date)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>
                      Status:
                    </Text>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        {
                          backgroundColor: getStatusColor(visitDetails.status),
                        },
                      ]}
                    >
                      <Text style={styles.statusTextSmall}>
                        {getStatusText(visitDetails.status)}
                      </Text>
                    </View>
                  </View>
                </Card>

                {/* Check-in Info */}
                <Card title="Check-in">
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>
                      Waktu:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatTime(visitDetails.check_in.time)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>
                      Lokasi:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {visitDetails.check_in.address}
                    </Text>
                  </View>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: visitDetails.check_in.photo }}
                      style={styles.detailPhoto}
                      resizeMode="cover"
                    />
                  </View>
                </Card>

                {/* Check-out Info if available */}
                {visitDetails.check_out && (
                  <Card title="Check-out">
                    <View style={styles.detailRow}>
                      <Text
                        style={[styles.detailLabel, { color: colors.text }]}
                      >
                        Waktu:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {formatTime(visitDetails.check_out.time)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text
                        style={[styles.detailLabel, { color: colors.text }]}
                      >
                        Lokasi:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {visitDetails.check_out.address}
                      </Text>
                    </View>
                    {visitDetails.check_out.description && (
                      <View>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: colors.text, marginTop: 8 },
                          ]}
                        >
                          Deskripsi:
                        </Text>
                        <Text
                          style={[
                            styles.descriptionText,
                            { color: colors.text },
                          ]}
                        >
                          {visitDetails.check_out.description}
                        </Text>
                      </View>
                    )}
                    {visitDetails.check_out.notes && (
                      <View>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: colors.text, marginTop: 8 },
                          ]}
                        >
                          Catatan:
                        </Text>
                        <Text
                          style={[
                            styles.descriptionText,
                            { color: colors.text },
                          ]}
                        >
                          {visitDetails.check_out.notes}
                        </Text>
                      </View>
                    )}
                    {visitDetails.check_out.score !== undefined && (
                      <View style={styles.detailRow}>
                        <Text
                          style={[styles.detailLabel, { color: colors.text }]}
                        >
                          Nilai:
                        </Text>
                        <Text
                          style={[styles.detailValue, { color: colors.text }]}
                        >
                          {visitDetails.check_out.score}
                        </Text>
                      </View>
                    )}
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: visitDetails.check_out.photo }}
                        style={styles.detailPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </Card>
                )}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Data tidak tersedia
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading details...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Kunjungan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
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
        {/* Student Details Card */}
        <Card title="Informasi Mahasiswa">
          {student && (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Nama:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {student.name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  NIM:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {student.nim}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Kelompok:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {student.group_name}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Activity Selector */}
        <Card title="Pilih Kegiatan">
          <TouchableOpacity
            style={[
              styles.activitySelector,
              {
                backgroundColor: colors.inputBackground || "#f0f0f0",
                borderColor: colors.inputBorder || "#e0e0e0",
              },
            ]}
            onPress={toggleActivitySelector}
          >
            <Text
              style={{
                color: activity ? colors.text : colors.icon,
                flex: 1,
              }}
            >
              {activity ? activity.name : "Pilih kegiatan"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.icon} />
          </TouchableOpacity>
        </Card>

        {/* Activity Details Card */}
        {activity && (
          <Card
            title={
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600" }}>
                  {activity.name}
                </Text>
                <TouchableOpacity
                  onPress={toggleActivitySelector}
                  style={{ padding: 4 }}
                >
                  <Text style={{ color: colors.tint, fontSize: 12 }}>
                    Ganti Kegiatan
                  </Text>
                </TouchableOpacity>
              </View>
            }
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Indikator:
            </Text>
            <Text style={[styles.indicatorText, { color: colors.text }]}>
              {activity.indicators || "No indicators available"}
            </Text>

            <View style={styles.advisorContainer}>
              <Ionicons name="person" size={16} color={colors.tint} />
              <Text style={[styles.advisorText, { color: colors.text }]}>
                Pembimbing: {activity.advisor_clinic_name || "Unknown"}
              </Text>
            </View>

            {/* Activity Status */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <Ionicons 
                name={activity?.is_lock === 0 ? "lock-open" : "lock-closed"} 
                size={16} 
                color={activity?.is_lock === 0 ? colors.success || "#28a745" : colors.error || "#dc3545"} 
              />
              <Text style={{
                fontSize: 14,
                fontWeight: "500",
                color: activity?.is_lock === 0 ? colors.success || "#28a745" : colors.error || "#dc3545",
                marginLeft: 8 
              }}>
                {activity?.is_lock === 0 ? "Kegiatan terbuka" : "Kegiatan tertutup"}
              </Text>
            </View>

            <View style={styles.actionButtonsContainer}>
              {hasInProgressVisitToday() ? (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.warning },
                  ]}
                  onPress={() => {
                    const todayVisit = getTodayInProgressVisit();
                    if (todayVisit) {
                      handleCheckOut(todayVisit.check_in.id);
                    }
                  }}
                >
                  <Ionicons
                    name="exit-outline"
                    size={18}
                    color="white"
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionButtonText}>
                    Check-out Kunjungan Hari Ini
                  </Text>
                </TouchableOpacity>
              ) : hasVisitToday() ? (
                <View
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.icon },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="white"
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionButtonText}>
                    {getTodayVisit()?.status === "completed" 
                      ? "Kunjungan Hari Ini Sudah Selesai" 
                      : "Sudah Ada Kunjungan Hari Ini"}
                  </Text>
                </View>
              ) : activity?.is_lock === 1 ? (
                <View style={{ alignItems: "center" }}>
                  <View
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.icon || "#6c757d", opacity: 0.6 },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="white"
                      style={styles.actionIcon}
                    />
                    <Text style={styles.actionButtonText}>
                      Check-in Tidak Tersedia
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 12,
                    marginTop: 8,
                    textAlign: "center",
                    fontWeight: "500",
                    color: colors.error || "#dc3545"
                  }}>
                    <Ionicons name="information-circle" size={14} color={colors.error || "#dc3545"} />
                    {" "}Kegiatan sedang tertutup
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: activity?.is_lock === 1 ? colors.icon || "#6c757d" : colors.tint,
                      opacity: activity?.is_lock === 1 ? 0.6 : 1
                    },
                  ]}
                  onPress={handleCreateVisit}
                  disabled={activity?.is_lock === 1}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color="white"
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionButtonText}>
                    Check-in Kunjungan
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* Visit History Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <View>
              <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
                Riwayat Kunjungan
              </Text>
              {activity && (
                <Text
                  style={[styles.sectionSubheaderText, { color: colors.icon }]}
                >
                  {activity.name}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={colors.tint}
                style={refreshing ? styles.refreshingIcon : null}
              />
            </TouchableOpacity>
          </View>

          {refreshing || (loading && !visitsLoaded) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading kunjungan...
              </Text>
            </View>
          ) : visits.length > 0 ? (
            <FlatList
              data={visits}
              renderItem={renderVisitItem}
              keyExtractor={(item) =>
                item.check_in?.id?.toString() || Math.random().toString()
              }
              scrollEnabled={false}
              style={styles.visitList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Belum ada kunjungan untuk {student?.name || "mahasiswa ini"}
              </Text>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  { borderColor: colors.tint, marginTop: 16 },
                ]}
                onPress={loadVisits}
                disabled={refreshing}
              >
                <Ionicons
                  name="refresh"
                  size={16}
                  color={colors.tint}
                  style={refreshing ? { opacity: 0.5 } : null}
                />
                <Text style={[styles.refreshText, { color: colors.tint }]}>
                  Muat Ulang Data
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      {renderVisitDetailsModal()}

      {/* Activity Selector Modal */}
      <BottomSheetSelector
        visible={showActivitySelector}
        title="Pilih Kegiatan"
        items={activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          subtitle: activity.advisor_clinic_name
        }))}
        selectedId={activity?.id}
        loading={loadingActivities}
        emptyText="Tidak ada kegiatan tersedia"
        onSelect={(item) => {
          const selectedActivity = activities.find(a => a.id === item.id);
          if (selectedActivity) {
            handleSelectActivity(selectedActivity);
          }
        }}
        onClose={toggleActivitySelector}
        renderItem={(item, isSelected) => {
          const activityData = activities.find(a => a.id === item.id);
          if (activityData) {
            return renderCustomActivityItem(activityData, isSelected);
          }
          return null;
        }}
      />
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 90,
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  indicatorText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  advisorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  advisorText: {
    fontSize: 14,
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.8,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionSubheaderText: {
    fontSize: 14,
    marginTop: 2,
  },
  visitList: {
    marginTop: 8,
  },
  visitItem: {
    backgroundColor: "#ffffff10",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#00000020",
  },
  visitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  visitDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusTextSmall: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  visitDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
  },
  detailLabel: {
    width: 90,
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
  refreshButton: {
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshText: {
    marginLeft: 6,
    fontWeight: "500",
  },
  refreshingIcon: {
    opacity: 0.5,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: "90%",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#00000020",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  detailsScrollView: {
    padding: 16,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  detailPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  // Activity selector styles
  activitySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  activityItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  activityName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  activityDetail: {
    fontSize: 14,
  },

  checkOutContainer: {
    marginTop: 12,
  },
  checkOutNote: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "500",
  },
  checkOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

});
