import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { api, AttendanceListItem, AttendanceDetail } from '@/services/api';
import Card from '@/components/ui/Card';
import { router } from 'expo-router';

export default function AbsensiScreen() {
  const colors = useThemeColor();
  const theme = useColorScheme() ?? 'light';
  const { token } = useUser();
  const [attendances, setAttendances] = useState<AttendanceListItem[]>([]);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load attendances data
  const loadAttendances = async () => {
    if (!token) return;

    try {
      setError(null);
      const response = await api.getAttendances(token);

      if (response.success && response.data) {
        const attendanceList: AttendanceListItem[] = response.data;
        setAttendances(attendanceList);
      } else {
        setError(response.message || 'Failed to load attendances');
      }
    } catch (err) {
      console.error('Error loading attendances:', err);
      setError('Failed to load attendances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load attendance details
  const loadAttendanceDetails = async (checkInId: number) => {
    if (!token) return;

    try {
      setDetailLoading(true);
      const response = await api.getAttendanceDetail(token, checkInId);

      if (response.success && response.data) {
        setSelectedAttendance(response.data);
        setModalVisible(true);
      } else {
        setError('Failed to load attendance details');
      }
    } catch (err) {
      console.error('Error loading attendance details:', err);
      setError('Failed to load attendance details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadAttendances();
  }, [token]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadAttendances();
  };

  // Format time (HH:MM)
  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5);
  };

  // Format date (DD MMMM YYYY)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Check if a date is today
  const isToday = (dateString: string): boolean => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if there's an attendance for today
  const hasTodayAttendance = (): boolean => {
    return attendances.some(attendance => isToday(attendance.check_in_date));
  };

  // Handle check-out
  const handleCheckOut = (checkInId: number) => {
    router.push({
      pathname: '/absensi-create',
      params: { mode: 'checkout', checkInId: checkInId.toString() }
    });
  };

  const AttendanceDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {detailLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : selectedAttendance ? (
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Detail Absensi
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Aktivitas
                </Text>
                <Text style={[styles.sectionContent, { color: colors.text }]}>
                  {selectedAttendance.activity.name}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Pembimbing
                </Text>
                <Text style={[styles.sectionContent, { color: colors.text }]}>
                  {selectedAttendance.advisor.name}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Lokasi
                </Text>
                <Text style={[styles.sectionContent, { color: colors.text }]}>
                  {selectedAttendance.check_in.address}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Waktu Check-in
                </Text>
                <Text style={[styles.sectionContent, { color: colors.text }]}>
                  {`${formatDate(selectedAttendance.check_in.date)} ${formatTime(selectedAttendance.check_in.check_time)}`}
                </Text>
              </View>

              {selectedAttendance.check_out && (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Waktu Check-out
                  </Text>
                  <Text style={[styles.sectionContent, { color: colors.text }]}>
                    {formatTime(selectedAttendance.check_out.check_time)}
                  </Text>
                </View>
              )}

              {selectedAttendance.check_in.photo && (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Foto Check-in
                  </Text>
                  <Image
                    source={{ uri: selectedAttendance.check_in.photo }}
                    style={styles.detailPhoto}
                    resizeMode="cover"
                  />
                </View>
              )}

              {selectedAttendance.check_out?.photo && (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Foto Check-out
                  </Text>
                  <Image
                    source={{ uri: selectedAttendance.check_out.photo }}
                    style={styles.detailPhoto}
                    resizeMode="cover"
                  />
                </View>
              )}
            </ScrollView>
          ) : (
            <Text style={[styles.errorText, { color: colors.error }]}>
              Failed to load attendance details
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading attendances...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
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
        {error ? (
          <Card title="Error">
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.tint }]}
                onPress={loadAttendances}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : attendances.length === 0 ? (
          <Card title="Absensi">
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Belum ada data absensi
              </Text>
            </View>
          </Card>
        ) : (
          attendances.map((attendance) => {
            const isIncompleteToday = isToday(attendance.check_in_date) && attendance.status === 'incomplete';
            
            return (
              <TouchableOpacity
                key={attendance.check_in_id}
                onPress={() => loadAttendanceDetails(attendance.check_in_id)}
                style={styles.attendanceItem}
                activeOpacity={0.7}
              >
                <View style={styles.attendanceHeader}>
                  <Text style={[styles.attendanceDate, { color: colors.text }]}>
                    {formatDate(attendance.check_in_date)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: attendance.status === 'complete'
                          ? colors.success
                          : colors.warning,
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {attendance.status === 'complete' ? 'Selesai' : 'Check-in'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.attendanceTimeContainer}>
                  <View style={styles.timeSection}>
                    <Text style={[styles.timeSectionLabel, { color: colors.text }]}>
                      Check-in:
                    </Text>
                    <Text style={[styles.timeValue, { color: colors.text }]}>
                      {formatTime(attendance.check_in_time)}
                    </Text>
                  </View>
                  
                  <View style={styles.timeSection}>
                    <Text style={[styles.timeSectionLabel, { color: colors.text }]}>
                      Check-out:
                    </Text>
                    <Text style={[styles.timeValue, { color: colors.text }]}>
                      {attendance.check_out_time ? formatTime(attendance.check_out_time) : "-"}
                    </Text>
                  </View>
                </View>

                {isIncompleteToday && (
                  <TouchableOpacity
                    style={[styles.checkoutButton, { backgroundColor: colors.tint }]}
                    onPress={() => handleCheckOut(attendance.check_in_id)}
                  >
                    <Ionicons name="log-out-outline" size={18} color="white" />
                    <Text style={styles.checkoutButtonText}>Check-out</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <AttendanceDetailModal />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: hasTodayAttendance() ? colors.disabled : colors.tint,
          },
        ]}
        onPress={() => {
          if (!hasTodayAttendance()) {
            router.push({
              pathname: '/absensi-create',
              params: { mode: 'checkin' }
            });
          }
        }}
        disabled={hasTodayAttendance()}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  attendanceItem: {
    backgroundColor: "#ffffff10",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#00000020",
  },
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  attendanceDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  attendanceTimeContainer: {
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
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.8,
  },
  sectionContent: {
    fontSize: 16,
    fontWeight: '400',
  },
  detailPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});