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
  Modal,
  Image,
  Dimensions,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { api } from "@/services/api";
import { useLocalSearchParams, router } from "expo-router";
import Card from "@/components/ui/Card";

interface Student {
  id: number;
  name: string;
  nim: string;
  group_name?: string;
}

interface Activity {
  id: number;
  name: string;
}

interface CheckIn {
  id: number;
  address: string;
  latitude: string;
  longitude: string;
  photo: string;
  check_time: string;
  date: string;
}

interface Score {
  score: number;
  note: string;
  scored_at: string;
  advisor_name: string;
}

interface CheckOut {
  id: number;
  address: string;
  latitude: string;
  longitude: string;
  photo: string;
  description?: string;
  check_time: string;
  scores?: Score[];
}

interface LogbookDetail {
  student: Student;
  activity: Activity;
  check_in: CheckIn;
  check_out: CheckOut;
}

export default function LogbookVerificationScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { token, role } = useUser();
  const params = useLocalSearchParams();
  const checkInId = params.checkInId ? parseInt(params.checkInId as string) : 0;
  const studentId = params.studentId ? parseInt(params.studentId as string) : 0;
  const studentName = (params.studentName as string) || "";
  const activityId = params.activityId ? parseInt(params.activityId as string) : 0;
  const activityName = (params.activityName as string) || "";

  const [logbook, setLogbook] = useState<LogbookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [score, setScore] = useState<string>("0");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Load logbook details on mount
  useEffect(() => {
    loadLogbookDetails();
  }, [checkInId]);

  // Function to refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogbookDetails();
    setRefreshing(false);
  };

  // Function to load logbook details
  const loadLogbookDetails = async () => {
    if (!token || !checkInId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Call the API to get logbook details
      const response = await api.getLogbookDetails(token, checkInId);

      if (response.success && response.data) {
        setLogbook(response.data);
      } else {
        Alert.alert("Error", "Failed to load logbook details");
      }
    } catch (error) {
      console.error("Error loading logbook details:", error);
      Alert.alert("Error", "Failed to load logbook details");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle verification
  const handleVerify = async () => {
    if (!token || !logbook?.check_out?.id) {
      Alert.alert("Error", "Data tidak lengkap");
      return;
    }

    try {
      setSubmitting(true);

      // Parse score to number
      const scoreValue = parseInt(score);
      if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
        Alert.alert("Error", "Nilai harus berupa angka antara 0-100");
        setSubmitting(false);
        return;
      }

      // Call the API to verify logbook
      const response = await api.verifyLogbook(token, logbook.check_out.id, {
        status: "verified",
        notes: note,
      });

      if (response.success) {
        Alert.alert("Berhasil", "Logbook berhasil diverifikasi", [
          {
            text: "OK",
            onPress: () => {
              setShowVerifyModal(false);
              setScore("0"); // Reset score
              setNote(""); // Reset note
              // Reload details to get updated verification data
              loadLogbookDetails();
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.message || "Gagal memverifikasi logbook");
      }
    } catch (error) {
      console.error("Error verifying logbook:", error);
      Alert.alert("Error", "Gagal memverifikasi logbook");
    } finally {
      setSubmitting(false);
    }
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

  // Get verification status text
  const getVerificationStatus = (): string => {
    if (!logbook?.check_out?.scores || logbook.check_out.scores.length === 0) {
      return "Belum Diverifikasi";
    }
    return `Diverifikasi ${logbook.check_out.scores.length} kali`;
  };

  // Get verification status color
  const getVerificationStatusColor = (): string => {
    if (!logbook?.check_out?.scores || logbook.check_out.scores.length === 0) {
      return colors.warning || "#f59e0b";
    }
    return colors.success || "#10b981";
  };

  // Render verification modal
  const renderVerificationModal = () => {
    return (
      <Modal
        visible={showVerifyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
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
                Verifikasi Logbook
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVerifyModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Student Info */}
              <View style={styles.modalSection}>
                <Text
                  style={[styles.modalSectionTitle, { color: colors.text }]}
                >
                  Informasi Mahasiswa
                </Text>
                <View
                  style={[
                    styles.modalInfoCard,
                    { backgroundColor: colors.inputBackground },
                  ]}
                >
                  <View style={styles.modalInfoRow}>
                    <Text
                      style={[styles.modalInfoLabel, { color: colors.text }]}
                    >
                      Nama
                    </Text>
                    <Text
                      style={[styles.modalInfoValue, { color: colors.text }]}
                    >
                      {logbook?.student?.name || "-"}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text
                      style={[styles.modalInfoLabel, { color: colors.text }]}
                    >
                      NIM
                    </Text>
                    <Text
                      style={[styles.modalInfoValue, { color: colors.text }]}
                    >
                      {logbook?.student?.nim || "-"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Score Input */}
              <View style={styles.modalSection}>
                <Text
                  style={[styles.modalSectionTitle, { color: colors.text }]}
                >
                  Penilaian
                </Text>
                <View style={styles.scoreInputContainer}>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>
                    Nilai (0-100)
                  </Text>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: "#e0e0e0",
                      },
                    ]}
                    placeholder="Masukkan nilai"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                    value={score}
                    onChangeText={(text) => {
                      const numValue = parseInt(text);
                      if (text === "" || (numValue >= 0 && numValue <= 100)) {
                        setScore(text);
                      }
                    }}
                  />
                </View>

                <View style={styles.noteInputContainer}>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>
                    Catatan Verifikasi
                  </Text>
                  <TextInput
                    style={[
                      styles.noteInput,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: "#e0e0e0",
                      },
                    ]}
                    placeholder="Tambahkan catatan (opsional)"
                    placeholderTextColor={colors.icon}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={note}
                    onChangeText={setNote}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: "#e0e0e0" }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: "#e0e0e0" }]}
                onPress={() => setShowVerifyModal(false)}
                disabled={submitting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.tint },
                  submitting && { opacity: 0.7 },
                ]}
                onPress={handleVerify}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Verifikasi</Text>
                )}
              </TouchableOpacity>
            </View>
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
        <Text style={styles.headerTitle}>Detail Logbook</Text>
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
        {logbook ? (
          <>
            {/* Student Details Card */}
            <Card title="Informasi Mahasiswa">
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Nama:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {logbook.student.name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  NIM:
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {logbook.student.nim}
                </Text>
              </View>
              {logbook.student.group_name && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Kelompok:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {logbook.student.group_name}
                  </Text>
                </View>
              )}
            </Card>

            {/* Logbook Details Card */}
            <Card title="Detail Logbook">
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getVerificationStatusColor() },
                  ]}
                />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {getVerificationStatus()}
                </Text>
              </View>

              {/* Check-in Info */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Check-in:
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>
                    Tanggal:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(logbook.check_in.date)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>
                    Waktu:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatTime(logbook.check_in.check_time)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>
                    Lokasi:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {logbook.check_in.address}
                  </Text>
                </View>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: logbook.check_in.photo }}
                    style={styles.detailPhoto}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Check-out Info */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Check-out:
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>
                    Waktu:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatTime(logbook.check_out.check_time)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>
                    Lokasi:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {logbook.check_out.address}
                  </Text>
                </View>
                {logbook.check_out.description && (
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
                      style={[styles.descriptionText, { color: colors.text }]}
                    >
                      {logbook.check_out.description}
                    </Text>
                  </View>
                )}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: logbook.check_out.photo }}
                    style={styles.detailPhoto}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Verification Info */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Verifikasi:
                </Text>
                {logbook?.check_out?.scores &&
                logbook.check_out.scores.length > 0 ? (
                  <>
                    {/* Sort scores by date and show newest first */}
                    {[...(logbook.check_out.scores || [])]
                      .sort(
                        (a, b) =>
                          new Date(b.scored_at).getTime() -
                          new Date(a.scored_at).getTime()
                      )
                      .map((score, index) => (
                        <View key={index} style={styles.scoreContainer}>
                          <View style={styles.detailRow}>
                            <Text
                              style={[styles.detailLabel, { color: colors.text }]}
                            >
                              Verifikasi ke-
                              {(logbook.check_out.scores || []).length - index}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text
                              style={[styles.detailLabel, { color: colors.text }]}
                            >
                              Nilai:
                            </Text>
                            <Text
                              style={[styles.detailValue, { color: colors.text }]}
                            >
                              {score.score}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text
                              style={[styles.detailLabel, { color: colors.text }]}
                            >
                              Catatan:
                            </Text>
                            <Text
                              style={[styles.detailValue, { color: colors.text }]}
                            >
                              {score.note || "-"}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text
                              style={[styles.detailLabel, { color: colors.text }]}
                            >
                              Diverifikasi oleh:
                            </Text>
                            <Text
                              style={[styles.detailValue, { color: colors.text }]}
                            >
                              {score.advisor_name}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text
                              style={[styles.detailLabel, { color: colors.text }]}
                            >
                              Tanggal:
                            </Text>
                            <Text
                              style={[styles.detailValue, { color: colors.text }]}
                            >
                              {formatDate(score.scored_at)}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </>
                ) : (
                  <View style={styles.emptyVerification}>
                    <Text style={[styles.emptyText, { color: colors.icon }]}>
                      Belum ada verifikasi
                    </Text>
                  </View>
                )}

                {/* Verification Button - show for advisor role always */}
                {role === "advisor" && (
                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      { backgroundColor: colors.tint },
                    ]}
                    onPress={() => setShowVerifyModal(true)}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="white"
                      style={styles.actionIcon}
                    />
                    <Text style={styles.verifyButtonText}>Verifikasi</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </>
        ) : (
          <Card title="Error">
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Gagal memuat detail logbook
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Verification Modal */}
      {renderVerificationModal()}
    </View>
  );
}

const { width } = Dimensions.get("window");

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
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
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
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  detailPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  scoreContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  emptyVerification: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  verifyButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  actionIcon: {
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalInfoCard: {
    borderRadius: 12,
    padding: 16,
  },
  modalInfoRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalInfoValue: {
    fontSize: 14,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  scoreInputContainer: {
    marginBottom: 16,
  },
  scoreInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  noteInputContainer: {
    marginBottom: 16,
  },
  noteInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    height: 48,
    marginLeft: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
}); 