import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import PrimaryButton from "@/components/PrimaryButton";
import AppModal from "@/components/ui/AppModal";

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
  id: number;
  score: number;
  note: string;
  scored_at: string;
  advisor: {
    id: number;
    name: string;
    type: string;
  };
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
  sub_activity_scores_grouped?: {
    category: {
      id: number;
      name: string;
      description: string;
      percentage: number;
    };
    sub_activities: {
      id: number;
      name: string;
      description: string;
      scores: Score[];
      average_score: number | null;
      total_scores: number;
      has_score: boolean;
    }[];
    category_average_score: number | null;
    total_scores_in_category: number;
    total_sub_activities: number;
    scored_sub_activities: number;
    category_completion_percentage: number;
  }[];
  total_sub_activity_score: number | null;
  total_scored_sub_activities: number;
  total_selected_sub_activities: number;
  current_advisor_has_scored?: boolean;
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
  const activityId = params.activityId
    ? parseInt(params.activityId as string)
    : 0;
  const activityName = (params.activityName as string) || "";

  const [logbook, setLogbook] = useState<LogbookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [subActivityScores, setSubActivityScores] = useState<{
    [subActivityId: number]: {
      score: string;
      note: string;
    };
  }>({});
  const [submitting, setSubmitting] = useState(false);

  type ModalButton = { label: string; onPress?: () => void };
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageModalTitle, setMessageModalTitle] = useState("");
  const [messageModalText, setMessageModalText] = useState("");
  const [messageModalButtons, setMessageModalButtons] = useState<ModalButton[]>([]);
  const openMessageModal = (title: string, text: string, buttons?: ModalButton[]) => {
    setMessageModalTitle(title);
    setMessageModalText(text);
    setMessageModalButtons(buttons && buttons.length > 0 ? buttons : [{ label: "OK" }]);
    setMessageModalVisible(true);
  };
  const closeMessageModal = () => setMessageModalVisible(false);

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
        openMessageModal("Error", "Failed to load logbook details");
      }
    } catch (error) {
      console.error("Error loading logbook details:", error);
      openMessageModal("Error", "Failed to load logbook details");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle verification
  const handleVerify = async () => {
    if (!token || !logbook?.check_out?.id) {
      openMessageModal("Error", "Data tidak lengkap");
      return;
    }

    try {
      setSubmitting(true);

      // Validate scores
      const scores = Object.entries(subActivityScores).map(
        ([subActivityId, scoreData]) => {
          const scoreValue = parseInt(scoreData.score);
          if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
            throw new Error(
              `Nilai untuk sub aktivitas ${subActivityId} harus berupa angka antara 0-100`
            );
          }

          return {
            sub_additional_activity_id: parseInt(subActivityId),
            score: scoreValue,
            note: scoreData.note || "",
          };
        }
      );

      // Call the API to verify logbook
      const response = await api.verifyLogbook(token, logbook.check_out.id, {
        scores,
      });

      if (response.success) {
        openMessageModal("Berhasil", "Logbook berhasil diverifikasi", [
          {
            label: "OK",
            onPress: () => {
              setShowVerifyModal(false);
              setSubActivityScores({});
              loadLogbookDetails();
            },
          },
        ]);
      } else {
        openMessageModal("Error", response.message || "Gagal memverifikasi logbook");
      }
    } catch (error) {
      console.error("Error verifying logbook:", error);
      openMessageModal(
        "Error",
        error instanceof Error ? error.message : "Gagal memverifikasi logbook"
      );
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
    if (!logbook?.check_out) {
      return "Belum Selesai";
    }
    if (logbook.check_out.current_advisor_has_scored) {
      return "Sudah Diverifikasi";
    }
    return "Belum Diverifikasi";
  };

  // Get verification status color
  const getVerificationStatusColor = (): string => {
    if (!logbook?.check_out) {
      return colors.error || "#ef4444";
    }
    if (logbook.check_out.current_advisor_has_scored) {
      return colors.success || "#10b981";
    }
    return colors.warning || "#f59e0b";
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
                {logbook?.check_out?.sub_activity_scores_grouped &&
                  logbook.check_out.sub_activity_scores_grouped.length > 0 && (
                    <View style={styles.subActivityScoresContainer}>
                      {logbook.check_out.sub_activity_scores_grouped.map(
                        (categoryScore, index) => (
                          <View
                            key={`category-${index}`}
                            style={styles.subActivityCategoryContainer}
                          >
                            <View style={styles.subActivityCategoryHeader}>
                              <Text
                                style={[
                                  styles.subActivityCategoryName,
                                  { color: colors.text },
                                ]}
                              >
                                {categoryScore.category.name}
                              </Text>
                              <Text
                                style={[
                                  styles.subActivityCategoryPercentage,
                                  { color: colors.text },
                                ]}
                              >
                                {categoryScore.category.percentage}%
                              </Text>
                            </View>
                            {categoryScore.sub_activities.map(
                              (subActivity, subIndex) => (
                                <View
                                  key={`sub-activity-${subIndex}`}
                                  style={styles.subActivityItemContainer}
                                >
                                  <Text
                                    style={[
                                      styles.subActivityItemName,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {subActivity.name}
                                  </Text>
                                  {subActivity.description && (
                                    <Text
                                      style={[
                                        styles.subActivityItemDescription,
                                        { color: colors.text },
                                      ]}
                                    >
                                      {subActivity.description}
                                    </Text>
                                  )}
                                  <View style={styles.scoreInputContainer}>
                                    <Text
                                      style={[
                                        styles.modalLabel,
                                        { color: colors.text },
                                      ]}
                                    >
                                      Nilai (0-100)
                                    </Text>
                                    <TextInput
                                      style={[
                                        styles.scoreInput,
                                        {
                                          backgroundColor:
                                            colors.inputBackground,
                                          color: colors.text,
                                          borderColor: "#e0e0e0",
                                        },
                                      ]}
                                      placeholder="Masukkan nilai"
                                      placeholderTextColor={colors.icon}
                                      keyboardType="numeric"
                                      value={
                                        subActivityScores[subActivity.id]
                                          ?.score || ""
                                      }
                                      onChangeText={(text) => {
                                        const numValue = parseInt(text);
                                        if (
                                          text === "" ||
                                          (numValue >= 0 && numValue <= 100)
                                        ) {
                                          setSubActivityScores((prev) => ({
                                            ...prev,
                                            [subActivity.id]: {
                                              ...prev[subActivity.id],
                                              score: text,
                                            },
                                          }));
                                        }
                                      }}
                                    />
                                  </View>
                                  <View style={styles.noteInputContainer}>
                                    <Text
                                      style={[
                                        styles.modalLabel,
                                        { color: colors.text },
                                      ]}
                                    >
                                      Catatan Verifikasi
                                    </Text>
                                    <TextInput
                                      style={[
                                        styles.noteInput,
                                        {
                                          backgroundColor:
                                            colors.inputBackground,
                                          color: colors.text,
                                          borderColor: "#e0e0e0",
                                        },
                                      ]}
                                      placeholder="Tambahkan catatan (opsional)"
                                      placeholderTextColor={colors.icon}
                                      multiline
                                      numberOfLines={4}
                                      textAlignVertical="top"
                                      value={
                                        subActivityScores[subActivity.id]
                                          ?.note || ""
                                      }
                                      onChangeText={(text) => {
                                        setSubActivityScores((prev) => ({
                                          ...prev,
                                          [subActivity.id]: {
                                            ...prev[subActivity.id],
                                            note: text,
                                          },
                                        }));
                                      }}
                                    />
                                  </View>
                                  {subActivity.scores && subActivity.scores.length > 0 && (
                                    <View style={styles.modalSection}>
                                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                                        Penilaian Sebelumnya
                                      </Text>
                                      {subActivity.scores.map((score, scoreIndex) => (
                                        <View key={scoreIndex} style={[styles.modalInfoCard, { backgroundColor: colors.inputBackground }]}>
                                          <View style={styles.modalInfoRow}>
                                            <Text style={[styles.modalInfoLabel, { color: colors.text }]}>Skor:</Text>
                                            <Text style={[styles.modalInfoValue, { color: colors.text }]}>{score.score}</Text>
                                          </View>
                                          <View style={styles.modalInfoRow}>
                                            <Text style={[styles.modalInfoLabel, { color: colors.text }]}>Penasihat:</Text>
                                            <Text style={[styles.modalInfoValue, { color: colors.text }]}>{score.advisor.name} ({score.advisor.type === 'academic' ? 'Akademik' : 'Klinik'})</Text>
                                          </View>
                                          <View style={styles.modalInfoRow}>
                                            <Text style={[styles.modalInfoLabel, { color: colors.text }]}>Catatan:</Text>
                                            <Text style={[styles.modalInfoValue, { color: colors.text }]}>{score.note || 'Tidak ada catatan'}</Text>
                                          </View>
                                          <View style={styles.modalInfoRow}>
                                            <Text style={[styles.modalInfoLabel, { color: colors.text }]}>Tanggal:</Text>
                                            <Text style={[styles.modalInfoValue, { color: colors.text }]}>{formatDate(score.scored_at)}</Text>
                                          </View>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                </View>
                              )
                            )}
                            <View style={styles.subActivityCategorySummary}>
                              <Text
                                style={[
                                  styles.subActivityCategorySummaryText,
                                  { color: colors.text },
                                ]}
                              >
                                Total Sub Aktivitas:{" "}
                                {categoryScore.total_sub_activities}
                              </Text>
                              <Text
                                style={[
                                  styles.subActivityCategorySummaryText,
                                  { color: colors.text },
                                ]}
                              >
                                Skor Kategori:{" "}
                                {categoryScore.category_average_score !== null
                                  ? categoryScore.category_average_score.toFixed(
                                      2
                                    )
                                  : "Belum dinilai"}
                              </Text>
                            </View>
                          </View>
                        )
                      )}


                    </View>
                  )}
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Detail Logbook</Text>
          <View style={styles.headerStatusContainer}>
            <Ionicons 
              name={logbook?.check_out?.current_advisor_has_scored ? "checkmark-circle" : "time-outline"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.headerStatusText}>
              {logbook?.check_out?.current_advisor_has_scored ? "Sudah Dinilai" : "Belum Dinilai"}
            </Text>
          </View>
        </View>
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
                    {logbook.check_out?.check_time ? formatTime(logbook.check_out.check_time) : "-"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>
                    Lokasi:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {logbook.check_out?.address || "-"}
                  </Text>
                </View>
                {logbook.check_out?.description && (
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
                {logbook.check_out?.photo && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: logbook.check_out.photo }}
                      style={styles.detailPhoto}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Sub-Activity Scores */}
                {logbook.check_out?.sub_activity_scores_grouped &&
                  logbook.check_out.sub_activity_scores_grouped.length > 0 && (
                    <View style={styles.subActivityScoresContainer}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.text, marginTop: 16 },
                        ]}
                      >
                        Aktivitas Tambahan
                      </Text>
                      {logbook.check_out.sub_activity_scores_grouped.map(
                        (categoryScore, index) => (
                          <View
                            key={`category-${index}`}
                            style={styles.subActivityCategoryContainer}
                          >
                            <View style={styles.subActivityCategoryHeader}>
                              <Text
                                style={[
                                  styles.subActivityCategoryName,
                                  { color: colors.text },
                                ]}
                              >
                                {categoryScore.category.name}
                              </Text>
                              <Text
                                style={[
                                  styles.subActivityCategoryPercentage,
                                  { color: colors.text },
                                ]}
                              >
                                {categoryScore.category.percentage}%
                              </Text>
                            </View>
                            {categoryScore.sub_activities.map(
                              (subActivity, subIndex) => (
                                <View
                                  key={`sub-activity-${subIndex}`}
                                  style={styles.subActivityItemContainer}
                                >
                                  <Text
                                    style={[
                                      styles.subActivityItemName,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {subActivity.name}
                                  </Text>
                                  {subActivity.description && (
                                    <Text
                                      style={[
                                        styles.subActivityItemDescription,
                                        { color: colors.text },
                                      ]}
                                    >
                                      {subActivity.description}
                                    </Text>
                                  )}
                                  <View>
                                    <View style={styles.subActivityScoreRow}>
                                      <Ionicons
                                        name={subActivity.average_score !== null ? "checkmark-circle" : "ellipse-outline"}
                                        size={16}
                                        color={subActivity.average_score !== null ? colors.success || "#10b981" : colors.icon}
                                        style={styles.scoreIcon}
                                      />
                                      <Text
                                        style={[
                                          styles.subActivityItemScore,
                                          { 
                                            color: subActivity.average_score !== null ? colors.success || "#10b981" : colors.text,
                                            fontWeight: subActivity.average_score !== null ? "600" : "normal"
                                          },
                                        ]}
                                      >
                                        {subActivity.average_score !== null
                                          ? `Skor: ${subActivity.average_score.toFixed(2)}`
                                          : "Belum dinilai"}
                                      </Text>
                                    </View>
                                    {subActivity.scores && subActivity.scores.length > 0 && (
                                      <View style={styles.scoreDetailsContainer}>
                                        {subActivity.scores.map((score, scoreIndex) => (
                                          <View key={scoreIndex} style={styles.scoreDetailContainer}>
                                            <Text style={[styles.scoreDetailText, { color: colors.text }]}>
                                              • {score.advisor.name} ({score.advisor.type === 'academic' ? 'Akademik' : 'Klinik'}): {score.score}
                                            </Text>
                                            {score.note && (
                                              <Text style={[styles.scoreNoteText, { color: colors.text }]}>
                                                Catatan: {score.note}
                                              </Text>
                                            )}
                                            <Text style={[styles.scoreDateText, { color: colors.text }]}>
                                              {formatDate(score.scored_at)}
                                            </Text>
                                          </View>
                                        ))}
                                      </View>
                                    )}
                                  </View>
                                </View>
                              )
                            )}
                            <View style={styles.subActivityCategorySummary}>
                              <Text
                                style={[
                                  styles.subActivityCategorySummaryText,
                                  { color: colors.text },
                                ]}
                              >
                                Total Sub Aktivitas:{" "}
                                {categoryScore.total_sub_activities}
                              </Text>
                              <Text
                                style={[
                                  styles.subActivityCategorySummaryText,
                                  { color: colors.text },
                                ]}
                              >
                                Skor Kategori:{" "}
                                {categoryScore.category_average_score !== null
                                  ? categoryScore.category_average_score.toFixed(
                                      2
                                    )
                                  : "Belum dinilai"}
                              </Text>
                            </View>
                          </View>
                        )
                      )}


                    </View>
                  )}
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
                              style={[
                                styles.detailLabel,
                                { color: colors.text },
                              ]}
                            >
                              Verifikasi ke-
                              {(logbook.check_out.scores || []).length - index}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text
                              style={[
                                styles.detailLabel,
                                { color: colors.text },
                              ]}
                            >
                              Nilai:
                            </Text>
                            <Text
                              style={[
                                styles.detailValue,
                                { color: colors.text },
                              ]}
                            >
                              {score.score}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text
                              style={[
                                styles.detailLabel,
                                { color: colors.text },
                              ]}
                            >
                              Catatan:
                            </Text>
                            <Text
                              style={[
                                styles.detailValue,
                                { color: colors.text },
                              ]}
                            >
                              {score.note || "-"}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text
                              style={[
                                styles.detailLabel,
                                { color: colors.text },
                              ]}
                            >
                              Diverifikasi oleh:
                            </Text>
                            <Text
                              style={[
                                styles.detailValue,
                                { color: colors.text },
                              ]}
                            >
                              {score.advisor.name} ({score.advisor.type === 'academic' ? 'Akademik' : 'Klinik'})
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text
                              style={[
                                styles.detailLabel,
                                { color: colors.text },
                              ]}
                            >
                              Tanggal:
                            </Text>
                            <Text
                              style={[
                                styles.detailValue,
                                { color: colors.text },
                              ]}
                            >
                              {formatDate(score.scored_at)}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </>
                ) : (
                  <View style={styles.emptyVerification}>
                    {/* <Text style={[styles.emptyText, { color: colors.icon }]}>
                      Belum ada verifikasi
                    </Text> */}
                  </View>
                )}

                {/* Verification Status */}
                {/* {logbook?.check_out?.current_advisor_has_scored && (
                  <View style={[
                    styles.statusContainer,
                    { backgroundColor: colors.success || "#10b981" }
                  ]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="white"
                      style={styles.actionIcon}
                    />
                    <Text style={[styles.statusText, { color: "white" }]}>
                      Telah Diverifikasi
                    </Text>
                  </View>
                )} */}

                {/* Verification Button - show for advisor role */}
                {role === "advisor" && (
                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      {
                        backgroundColor: logbook?.check_out?.current_advisor_has_scored || !logbook?.check_out
                          ? "#9ca3af"
                          : colors.tint,
                      },
                    ]}
                    onPress={() => setShowVerifyModal(true)}
                    disabled={logbook?.check_out?.current_advisor_has_scored || !logbook?.check_out}
                  >
                    <Ionicons
                      name={logbook?.check_out?.current_advisor_has_scored 
                        ? "checkmark-circle" 
                        : !logbook?.check_out 
                          ? "time-outline" 
                          : "checkmark-circle-outline"}
                      size={18}
                      color="white"
                      style={styles.actionIcon}
                    />
                    <Text style={styles.verifyButtonText}>
                      {logbook?.check_out?.current_advisor_has_scored 
                        ? "Sudah Diverifikasi" 
                        : !logbook?.check_out 
                          ? "Belum Selesai" 
                          : "Verifikasi"}
                    </Text>
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
      
      <AppModal
        visible={messageModalVisible}
        title={messageModalTitle}
        onClose={closeMessageModal}
      >
        <Text style={{ color: colors.text, fontSize: 14, marginBottom: 16 }}>
          {messageModalText}
        </Text>
        {messageModalButtons.map((btn, idx) => (
          <View key={idx} style={{ marginTop: idx === 0 ? 0 : 8 }}>
            <PrimaryButton
              label={btn.label}
              onPress={() => {
                if (btn.onPress) {
                  btn.onPress();
                }
                closeMessageModal();
              }}
            />
          </View>
        ))}
      </AppModal>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  headerStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  headerStatusText: {
    fontSize: 12,
    color: "white",
    marginLeft: 4,
    opacity: 0.9,
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
  subActivityScoresContainer: {
    marginTop: 16,
  },
  subActivityCategoryContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  subActivityCategoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subActivityCategoryName: {
    fontSize: 16,
    fontWeight: "600",
  },
  subActivityCategoryPercentage: {
    fontSize: 14,
    fontWeight: "500",
  },
  subActivityItemContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subActivityItemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  subActivityItemDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  subActivityItemScore: {
    fontSize: 14,
    color: "#555",
  },
  subActivityScoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreIcon: {
    marginRight: 6,
  },
  subActivityCategorySummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  subActivityCategorySummaryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  scoreDetailsContainer: {
    marginTop: 8,
    paddingLeft: 16,
  },
  scoreDetailContainer: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  scoreDetailText: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  scoreNoteText: {
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 2,
    paddingLeft: 8,
  },
  scoreDateText: {
    fontSize: 10,
    opacity: 0.7,
    paddingLeft: 8,
  },

});
