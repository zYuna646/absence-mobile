import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { api } from "@/services/api";
import { useLocalSearchParams, router } from "expo-router";
import Card from "@/components/ui/Card";
import BottomSheetSelector from "@/components/ui/BottomSheetSelector";

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

interface Score {
  score: number;
  note: string;
  scored_at: string;
  advisor_name: string;
}

interface LogbookListItem {
  check_in_id: number;
  check_in_date: string;
  check_in_time: string;
  check_out_id: number;
  check_out_date: string;
  check_out_time: string;
  status: 'complete' | 'incomplete';
  scores?: Score[];
}

export default function VerifikasiDetailScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { token } = useUser();
  const params = useLocalSearchParams();
  const studentId = params.studentId ? parseInt(params.studentId as string) : 0;
  const studentName = (params.studentName as string) || "";

  const [logbooks, setLogbooks] = useState<LogbookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Activity state
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [logbooksLoaded, setLogbooksLoaded] = useState(false);

  // Load activities on mount
  useEffect(() => {
    loadActivities();
  }, []);

  // Load logbooks when activity is selected
  useEffect(() => {
    if (selectedActivity && selectedActivity.id && !logbooksLoaded && !refreshing) {
      loadLogbookData();
    }
  }, [selectedActivity?.id, logbooksLoaded, refreshing]);

  // Function to refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    setLogbooksLoaded(false);
    await Promise.all([loadActivities(), loadLogbookData()]);
    setRefreshing(false);
  };

  // Function to load activities
  const loadActivities = async () => {
    if (!token) {
      return;
    }

    try {
      setLoadingActivities(true);

      const response = await api.getActivities(token);

      if (response.success && response.data && response.data.length > 0) {
        setActivities(response.data);
        // Auto-select first activity if none selected
        if (!selectedActivity) {
          setSelectedActivity(response.data[0]);
        }
      } else {
        // Use mock data if API fails
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
        ];
        setActivities(mockActivities);
        if (!selectedActivity) {
          setSelectedActivity(mockActivities[0]);
        }
      }
    } catch (error) {
      console.error("Error loading activities:", error);
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
      ];
      setActivities(mockActivities);
      if (!selectedActivity) {
        setSelectedActivity(mockActivities[0]);
      }
    } finally {
      setLoadingActivities(false);
    }
  };

  // Function to load logbook list
  const loadLogbookData = async () => {
    if (!token || !studentId || !selectedActivity) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Call the API to get logbook list
      const response = await api.getLogbook(token, studentId, selectedActivity.id);
      console.log(response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setLogbooks(response.data);
        setLogbooksLoaded(true);
      } else {
        console.log("API response:", response);
        // Set empty array if API fails or returns non-array data
        setLogbooks([]);
        setLogbooksLoaded(true);
      }
    } catch (error) {
      console.error("Error loading logbook data:", error);
      Alert.alert("Error", "Failed to load logbook data");

      // Set empty array if error occurs
      setLogbooks([]);
      setLogbooksLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Activity selection functions
  const toggleActivitySelector = () => {
    setShowActivitySelector(!showActivitySelector);
  };

  const handleSelectActivity = (selectedAct: ActivityData) => {
    setSelectedActivity(selectedAct);
    setShowActivitySelector(false);
    // Reset logbooks loaded flag to trigger reload for the new activity
    setLogbooksLoaded(false);
    setLoading(true);
  };

  // Custom render for activity items
  const renderCustomActivityItem = (item: ActivityData, isSelected: boolean) => {
    const isLocked = item.is_lock === 1;
    
    return (
      <TouchableOpacity
        style={[
          styles.activityItem,
          isSelected && { backgroundColor: `${colors.tint}20` }
        ]}
        onPress={() => handleSelectActivity(item)}
      >
        <View style={styles.activityHeader}>
          <Text style={[
            styles.activityName, 
            { color: colors.text }
          ]}>
            {item.name}
          </Text>
          <View style={styles.activityStatus}>
            <Ionicons 
              name={isLocked ? "lock-closed" : "lock-open"} 
              size={16} 
              color={isLocked ? colors.error || "#dc3545" : colors.success || "#28a745"} 
            />
            <Text style={{
              fontSize: 12,
              fontWeight: "500",
              color: isLocked ? colors.error || "#dc3545" : colors.success || "#28a745",
              marginLeft: 4
            }}>
              {isLocked ? "Tertutup" : "Terbuka"}
            </Text>
          </View>
        </View>
        
        {item.advisor_clinic_name && (
          <Text style={[
            styles.activityDetail, 
            { color: colors.text }
          ]}>
            Pembimbing: {item.advisor_clinic_name}
          </Text>
        )}
        
        {item.location && (
          <Text style={[
            styles.activityDetail, 
            { color: colors.text }
          ]}>
            Lokasi: {item.location}{item.room ? `, Ruang ${item.room}` : ''}
          </Text>
        )}
        
        {isLocked && (
          <Text style={[
            styles.lockedNote,
            { color: colors.warning || "#ffc107" }
          ]}>
            <Ionicons name="information-circle" size={12} color={colors.warning || "#ffc107"} />
            {" "}Kegiatan sedang tertutup
          </Text>
        )}
      </TouchableOpacity>
    );
  };



  // Navigate to verification detail page
  const handleLogbookPress = (checkInId: number) => {
    if (!selectedActivity) return;
    
    router.push(`/logbook-verification?checkInId=${checkInId}&studentId=${studentId}&studentName=${encodeURIComponent(studentName)}&activityId=${selectedActivity.id}&activityName=${encodeURIComponent(selectedActivity.name)}`);
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading...
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
        <Text style={styles.headerTitle}>
          Logbook {studentName}
        </Text>
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
                color: selectedActivity ? colors.text : colors.icon,
                flex: 1,
              }}
            >
              {selectedActivity ? selectedActivity.name : "Pilih kegiatan"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.icon} />
          </TouchableOpacity>


        </Card>

        {!selectedActivity ? (
          <Card title="Logbook">
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Pilih kegiatan terlebih dahulu
              </Text>
            </View>
          </Card>
        ) : !logbooks || logbooks.length === 0 ? (
          <Card title="Logbook">
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Belum ada data logbook
              </Text>
            </View>
          </Card>
        ) : (
          logbooks.map((logbook) => (
            <TouchableOpacity
              key={logbook.check_in_id}
              onPress={() => handleLogbookPress(logbook.check_in_id)}
              style={styles.logbookItem}
              activeOpacity={0.7}
            >
              <View style={styles.logbookHeader}>
                <Text style={[styles.logbookDate, { color: colors.text }]}>
                  {formatDate(logbook.check_in_date)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: logbook.status === 'complete'
                        ? colors.success
                        : colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {logbook.status === 'complete' ? 'Selesai' : 'Belum Selesai'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.logbookTimeContainer}>
                <View style={styles.timeSection}>
                  <Text style={[styles.timeSectionLabel, { color: colors.text }]}>
                    Check-in:
                  </Text>
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {formatTime(logbook.check_in_time)}
                  </Text>
                </View>
                
                <View style={styles.timeSection}>
                  <Text style={[styles.timeSectionLabel, { color: colors.text }]}>
                    Check-out:
                  </Text>
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {logbook.check_out_time ? formatTime(logbook.check_out_time) : "-"}
                  </Text>
                </View>
              </View>

              {/* Scores Information */}
              {logbook.scores && logbook.scores.length > 0 && (
                <View style={styles.scoresContainer}>
                  <View style={styles.scoresHeader}>
                    <Ionicons name="star" size={16} color={colors.warning} />
                    <Text style={[styles.scoresTitle, { color: colors.text }]}>
                      Penilaian ({logbook.scores.length})
                    </Text>
                  </View>
                  <View style={styles.scoresContent}>
                    {logbook.scores.map((score, index) => (
                      <View key={index} style={styles.scoreItem}>
                        <View style={styles.scoreInfo}>
                          <Text style={[styles.scoreName, { color: colors.text }]}>
                            {score.advisor_name}
                          </Text>
                          <Text style={[styles.scoreDate, { color: colors.icon }]}>
                            {formatDate(score.scored_at)}
                          </Text>
                        </View>
                        <View style={[styles.scoreValueBadge, { backgroundColor: colors.tint }]}>
                          <Text style={styles.scoreValueText}>{score.score}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Activity Selector Modal */}
      <BottomSheetSelector
        visible={showActivitySelector}
        title="Pilih Kegiatan"
        items={activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          subtitle: activity.advisor_clinic_name
        }))}
        selectedId={selectedActivity?.id}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row" as const,
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  scoresContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#00000010",
  },
  scoresHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scoresTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  scoresContent: {
    gap: 6,
  },
  scoreItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreName: {
    fontSize: 13,
    fontWeight: "500",
  },
  scoreDate: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  scoreValueText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  activityName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  activityDetail: {
    fontSize: 14,
  },

  // Activity item styles
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedNote: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
