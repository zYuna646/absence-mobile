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
import { api, ActivityData } from "@/services/api";
import { useLocalSearchParams, router } from "expo-router";
import Card from "@/components/ui/Card";
import PrimaryButton from "@/components/PrimaryButton";

interface LogbookEntry {
  check_in_id: number;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string | null;
  check_out_time: string | null;
  status: string;
}

interface LogbookDetails {
  student: {
    id: number;
    name: string;
    nim: string;
    group_name: string;
  };
  activity: {
    id: number;
    name: string;
  };
  check_in: {
    id: number;
    address: string;
    latitude: string;
    longitude: string;
    photo: string;
    check_time: string;
    date: string;
  };
  check_out?: {
    id: number;
    address: string;
    latitude: string;
    longitude: string;
    photo: string;
    description: string;
    check_time: string;
    scores: any[];
  };
}

export default function LaporanScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { token, role } = useUser();
  const params = useLocalSearchParams();
  const activityId = params.activityId
    ? parseInt(params.activityId as string)
    : 0;
  
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
  const [loadingLogbooks, setLoadingLogbooks] = useState(false);
  const [hasCheckInToday, setHasCheckInToday] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Detail modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLogbookId, setSelectedLogbookId] = useState<number | null>(null);
  const [logbookDetails, setLogbookDetails] = useState<LogbookDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load activity details
  useEffect(() => {
    loadActivityDetails();
    loadLogbooks();
  }, [activityId]);

  // Load logbook details when selectedLogbookId changes
  useEffect(() => {
    if (selectedLogbookId && modalVisible) {
      loadLogbookDetails(selectedLogbookId);
    }
  }, [selectedLogbookId, modalVisible]);

  // Function to refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogbooks();
    setRefreshing(false);
  };

  // Function to load activity details
  const loadActivityDetails = async () => {
    if (!token || !activityId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // For now, we'll use the getActivities API and filter for the specific activity
      // TODO: Replace with a dedicated API call to get a single activity when available
      const response = await api.getActivities(token);
      
      if (response.success && response.data) {
        const activityDetail = response.data.find((a) => a.id === activityId);
        if (activityDetail) {
          setActivity(activityDetail);
        } else {
          Alert.alert("Error", "Activity not found");
          router.back();
        }
      } else {
        Alert.alert("Error", response.message || "Failed to load activity");
        router.back();
      }
    } catch (error) {
      console.error("Error loading activity details:", error);
      Alert.alert("Error", "Failed to load activity details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Function to load logbook entries
  const loadLogbooks = async () => {
    if (!token || !activityId) return;

    try {
      setLoadingLogbooks(true);
      
      const response = await api.getStudentLogbooks(token);
      
      if (response.success && response.data) {
        setLogbooks(response.data);
        
        const formatter = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Makassar",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        const parts = formatter.formatToParts(new Date());
        const day = parts.find((p) => p.type === "day")?.value;
        const month = parts.find((p) => p.type === "month")?.value;
        const year = parts.find((p) => p.type === "year")?.value;

        const today = `${year}-${month}-${day}`;
        
        const todayCheckIn = response.data.find((entry: LogbookEntry) => {
          const checkInDate = entry.check_in_date.split("T")[0];
          return checkInDate === today;
        });

        setHasCheckInToday(!!todayCheckIn);
      } else {
        console.error("Failed to load logbooks:", response.message);
      }
    } catch (error) {
      console.error("Error loading logbooks:", error);
    } finally {
      setLoadingLogbooks(false);
    }
  };

  // Function to load logbook details
  const loadLogbookDetails = async (checkInId: number) => {
    if (!token) return;

    try {
      setLoadingDetails(true);
      
      const response = await api.getLogbookDetails(token, checkInId);
      
      if (response.success && response.data) {
        setLogbookDetails(response.data);
      } else {
        console.error("Failed to load logbook details:", response.message);
        Alert.alert("Error", "Failed to load logbook details");
      }
    } catch (error) {
      console.error("Error loading logbook details:", error);
      Alert.alert("Error", "Failed to load logbook details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open logbook details
  const openLogbookDetails = (logbookId: number) => {
    setSelectedLogbookId(logbookId);
    setModalVisible(true);
  };

  // Close logbook details
  const closeLogbookDetails = () => {
    setModalVisible(false);
    setLogbookDetails(null);
    setSelectedLogbookId(null);
  };

  // Handle create logbook button press
  const handleCreateLogbook = () => {
    if (!activity) return;
    
    // Navigate to logbook creation screen with activity details
    router.push({
      pathname: "/logbook",
      params: { 
        activityId: activity.id,
        activityName: activity.name,
      },
    });
  };

  // Handle check-out button press
  const handleCheckOut = (checkInId: number) => {
    if (!activity) return;
    
    // Navigate to check-out screen with required params
    router.push({
      pathname: "/logbook",
      params: { 
        checkInId: checkInId,
        activityId: activity.id,
        activityName: activity.name,
        mode: "checkout",
      },
    });
  };

  // Handle lock activity button press
  const handleLockActivity = () => {
    Alert.alert(
      "Kunci Kegiatan",
      "Setelah mengunci kegiatan, Anda tidak dapat menambah logbook baru. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Kunci", 
          style: "destructive",
          onPress: () => {
            // TODO: Call API to lock the activity
            console.log("Lock activity:", activityId);
          },
        },
      ]
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
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const parts = formatter.formatToParts(new Date());
    const day = parts?.find((p) => p.type === "day")?.value;
    const month = parts?.find((p) => p.type === "month")?.value;
    const year = parts?.find((p) => p.type === "year")?.value;

    const today = `${year}-${month}-${day}`;
    const checkDate = dateString.split("T")[0];

    return today === checkDate;
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "complete":
        return colors.success || "#28a745";
      case "incomplete":
        return colors.warning || "#ffc107";
      default:
        return colors.icon || "#6c757d";
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case "complete":
        return "Selesai";
      case "incomplete":
        return "Belum Check-out";
      default:
        return "Tidak Diketahui";
    }
  };

  // Render logbook item
  const renderLogbookItem = ({ item }: { item: LogbookEntry }) => {
    const showCheckOutButton =
      item.status === "incomplete" && isToday(item.check_in_date);

    return (
      <TouchableOpacity 
        style={styles.logbookItem}
        onPress={() => openLogbookDetails(item.check_in_id)}
        activeOpacity={0.7}
      >
        <View style={styles.logbookHeader}>
          <Text style={[styles.logbookDate, { color: colors.text }]}>
            {formatDate(item.check_in_date)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <View style={styles.logbookTimeContainer}>
          <View style={styles.timeSection}>
            <Text style={[styles.timeSectionLabel, { color: colors.text }]}>
              Check-in:
            </Text>
            <Text style={[styles.timeValue, { color: colors.text }]}>
              {formatTime(item.check_in_time)}
            </Text>
          </View>
          
          <View style={styles.timeSection}>
            <Text style={[styles.timeSectionLabel, { color: colors.text }]}>
              Check-out:
            </Text>
            <Text style={[styles.timeValue, { color: colors.text }]}>
              {item.check_out_time ? formatTime(item.check_out_time) : "-"}
            </Text>
          </View>
        </View>
        
        {showCheckOutButton && (
          <TouchableOpacity
            style={[styles.checkOutButton, { backgroundColor: colors.tint }]}
            onPress={() => handleCheckOut(item.check_in_id)}
          >
            <Ionicons
              name="exit-outline"
              size={18}
              color="white"
              style={styles.actionIcon}
            />
            <Text style={styles.actionButtonText}>Absen Pulang</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Render logbook details modal
  const renderLogbookDetailsModal = () => {
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeLogbookDetails}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Detail Logbook
              </Text>
              <TouchableOpacity onPress={closeLogbookDetails} style={styles.closeButton}>
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
            ) : logbookDetails ? (
              <ScrollView style={styles.detailsScrollView}>
                {/* Student and Activity Info */}
                <Card title="Informasi Kegiatan">
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>Mahasiswa:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {logbookDetails.student.name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>NIM:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {logbookDetails.student.nim}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>Kelompok:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {logbookDetails.student.group_name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>Kegiatan:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {logbookDetails.activity.name}
                    </Text>
                  </View>
                </Card>

                {/* Check-in Info */}
                <Card title="Check-in">
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>Tanggal:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatDate(logbookDetails.check_in.date)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>Waktu:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatTime(logbookDetails.check_in.check_time)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>Lokasi:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {logbookDetails.check_in.address}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>Koordinat:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {logbookDetails.check_in.latitude}, {logbookDetails.check_in.longitude}
                    </Text>
                  </View>
                  
                  <Text style={[styles.photoLabel, { color: colors.text, marginTop: 12 }]}>
                    Foto Check-in:
                  </Text>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: logbookDetails.check_in.photo }}
                      style={styles.detailPhoto}
                      resizeMode="cover"
                    />
                  </View>
                </Card>

                {/* Check-out Info (if available) */}
                {logbookDetails.check_out && (
                  <Card title="Check-out">
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.text }]}>Waktu:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatTime(logbookDetails.check_out.check_time)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.text }]}>Lokasi:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {logbookDetails.check_out.address}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.text }]}>Koordinat:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {logbookDetails.check_out.latitude}, {logbookDetails.check_out.longitude}
                      </Text>
                    </View>
                    
                    <Text style={[styles.photoLabel, { color: colors.text, marginTop: 12 }]}>
                      Deskripsi:
                    </Text>
                    <Text style={[styles.descriptionText, { color: colors.text }]}>
                      {logbookDetails.check_out.description}
                    </Text>
                    
                    <Text style={[styles.photoLabel, { color: colors.text, marginTop: 12 }]}>
                      Foto Check-out:
                    </Text>
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: logbookDetails.check_out.photo }}
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
            Loading activity details...
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
        <Text style={styles.headerTitle}>Laporan Kegiatan</Text>
        <View style={{ width: 24 }} />
      </View>
      
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
        {/* Activity Details Card */}
        <Card title={activity?.name || "Activity"}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Indikator:
          </Text>
          <Text style={[styles.indicatorText, { color: colors.text }]}>
            {activity?.indicators || "No indicators available"}
          </Text>
          
          <View style={styles.advisorContainer}>
            <Ionicons name="person" size={16} color={colors.tint} />
            <Text style={[styles.advisorText, { color: colors.text }]}>
              Pembimbing: {activity?.advisor_clinic_name || "Unknown"}
            </Text>
          </View>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: colors.tint,
                  opacity: hasCheckInToday ? 0.5 : 1,
                },
              ]}
              onPress={handleCreateLogbook}
              disabled={hasCheckInToday}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color="white"
                style={styles.actionIcon}
              />
              <Text style={styles.actionButtonText}>Buat Logbook</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton,
                { backgroundColor: colors.warning || "#ffc107" },
              ]}
              onPress={handleLockActivity}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="white"
                style={styles.actionIcon}
              />
              <Text style={styles.actionButtonText}>Kunci Kegiatan</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Logbook History Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
              Riwayat Kegiatan
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={loadingLogbooks || refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={colors.tint} 
                style={
                  loadingLogbooks || refreshing ? styles.refreshingIcon : null
                }
              />
            </TouchableOpacity>
          </View>
          
          {loadingLogbooks || refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading logbooks...
              </Text>
            </View>
          ) : logbooks.length > 0 ? (
            <FlatList
              data={logbooks}
              renderItem={renderLogbookItem}
              keyExtractor={(item) => item.check_in_id.toString()}
              scrollEnabled={false}
              style={styles.logbookList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.icon}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Belum ada entri logbook
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      {renderLogbookDetailsModal()}
    </View>
  );
}

const { width } = Dimensions.get('window');

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
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
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
  logbookList: {
    marginTop: 8,
  },
  logbookItem: {
    backgroundColor: "#ffffff10",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#00000020",
  },
  logbookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logbookDate: {
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
  logbookTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  timeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeSectionLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  checkOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
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
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
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
  photoLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
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
});
