import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import Card from "@/components/ui/Card";
import PrimaryButton from "@/components/PrimaryButton";
import BottomSheetSelector from "@/components/ui/BottomSheetSelector";
import AppModal from "@/components/ui/AppModal";

export default function PenilaianCreateScreen() {
  const colors = useThemeColor();
  const theme = useColorScheme() ?? 'light';
  const { token } = useUser();
  const params = useLocalSearchParams();
  const mode = params.mode as string || "create"; // "create" or "edit"
  const assessmentId = params.assessmentId ? parseInt(params.assessmentId as string) : 0;

  // State for data
  const [students, setStudents] = useState<any[]>([]);
  const [additionalCategories, setAdditionalCategories] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAdditional, setLoadingAdditional] = useState(true);

  // Form state
  const [assessmentName, setAssessmentName] = useState("");
  const [assessmentDate, setAssessmentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [selectedAdditionalActivities, setSelectedAdditionalActivities] = useState<{
    categoryId: number;
    subCategoryId: number;
  }[]>([]);
  const [studentScores, setStudentScores] = useState<{
    [studentId: number]: {
      [subActivityId: number]: {
        score: string;
        note: string;
      }
    }
  }>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  type ModalButton = { label: string; onPress: () => void; type?: "default" | "primary" | "destructive" };
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageModalTitle, setMessageModalTitle] = useState("");
  const [messageModalText, setMessageModalText] = useState("");
  const [messageModalButtons, setMessageModalButtons] = useState<ModalButton[]>([]);

  const openMessageModal = (title: string, text: string, buttons?: ModalButton[]) => {
    setMessageModalTitle(title);
    setMessageModalText(text);
    setMessageModalButtons(
      buttons && buttons.length > 0
        ? buttons
        : [{ label: "OK", onPress: () => setMessageModalVisible(false), type: "primary" }]
    );
    setMessageModalVisible(true);
  };
  const closeMessageModal = () => setMessageModalVisible(false);

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        // Fetch students
        const studentsResponse = await api.getStudents(token);
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
        }

        // Fetch additional activities (not from logbook)
        const additionalActivitiesResponse = await api.getAdditionalActivities(token, { is_logbook_activity: false });
        if (additionalActivitiesResponse.success && additionalActivitiesResponse.data) {
          setAdditionalCategories(additionalActivitiesResponse.data);
        }

        // If editing, fetch existing assessment details
        if (mode === "edit" && assessmentId) {
          try {
            const assessmentResponse = await api.getManualSubActivityScoreDetail(token, assessmentId);
            if (assessmentResponse.success && assessmentResponse.data) {
              const assessmentData = assessmentResponse.data;
              
              // Set assessment name and date
              setAssessmentName(assessmentData.name);
              setAssessmentDate(new Date(assessmentData.date));
              
              // Group items by sub_activity and student
              const groupedItems: { [key: string]: any } = {};
              const studentIds = new Set<number>();
              const subActivityIds = new Set<number>();
              
              assessmentData.items.forEach(item => {
                const key = `${item.student.id}-${item.sub_activity.id}`;
                groupedItems[key] = item;
                studentIds.add(item.student.id);
                subActivityIds.add(item.sub_activity.id);
              });
              
              // Set selected students
              const selectedStudentsList = Array.from(studentIds).map(studentId => {
                const studentItem = assessmentData.items.find(item => item.student.id === studentId);
                return studentItem ? studentItem.student : null;
              }).filter(Boolean);
              setSelectedStudents(selectedStudentsList);
              
              // Set selected additional activities
              const selectedActivitiesList = Array.from(subActivityIds).map(subActivityId => {
                const activityItem = assessmentData.items.find(item => item.sub_activity.id === subActivityId);
                if (activityItem) {
                  return {
                    categoryId: activityItem.sub_activity.category.id,
                    subCategoryId: activityItem.sub_activity.id
                  };
                }
                return null;
              }).filter(Boolean);
              setSelectedAdditionalActivities(selectedActivitiesList);
              
              // Set student scores
              const scoresData: typeof studentScores = {};
              Object.values(groupedItems).forEach((item: any) => {
                if (!scoresData[item.student.id]) {
                  scoresData[item.student.id] = {};
                }
                scoresData[item.student.id][item.sub_activity.id] = {
                  score: item.score.toString(),
                  note: item.note || ''
                };
              });
              setStudentScores(scoresData);
            }
          } catch (error) {
            console.error("Error fetching assessment details:", error);
            openMessageModal("Error", "Gagal memuat detail penilaian");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        openMessageModal("Error", "Gagal memuat data");
      } finally {
        setLoadingStudents(false);
        setLoadingAdditional(false);
      }
    };

    fetchData();
  }, [token, mode, assessmentId]);

  // Toggle student selection
  const toggleStudentSelection = (student: any) => {
    setSelectedStudents(prev => 
      prev.some(s => s.id === student.id)
        ? prev.filter(s => s.id !== student.id)
        : [...prev, student]
    );
  };

  // Select all students
  const selectAllStudents = () => {
    setSelectedStudents(students);
  };

  // Clear student selection
  const clearStudentSelection = () => {
    setSelectedStudents([]);
  };

  // Update student score
  const updateStudentScore = (studentId: number, subActivityId: number, field: 'score' | 'note', value: string) => {
    setStudentScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subActivityId]: {
          ...(prev[studentId]?.[subActivityId] || { score: '', note: '' }),
          [field]: value
        }
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate assessment name
    if (!assessmentName.trim()) {
      openMessageModal("Validasi", "Nama penilaian harus diisi");
      return;
    }

    // Validate additional activities
    if (selectedAdditionalActivities.length === 0) {
      openMessageModal("Validasi", "Pilih minimal satu aktivitas tambahan");
      return;
    }

    // Validate student selection
    if (selectedStudents.length === 0) {
      openMessageModal("Validasi", "Pilih minimal satu mahasiswa");
      return;
    }

    // Validate scores
    const hasInvalidScore = selectedStudents.some(student => 
      selectedAdditionalActivities.some(selection => {
        const score = studentScores[student.id]?.[selection.subCategoryId]?.score;
        return !score || isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100;
      })
    );

    if (hasInvalidScore) {
      openMessageModal("Validasi", "Pastikan semua nilai adalah angka antara 0-100");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare assessment data for API
      const assessmentData = {
        name: assessmentName,
        date: assessmentDate.toISOString().slice(0, 10),
        students: selectedStudents.map(student => ({
          student_id: student.id,
          scores: selectedAdditionalActivities.map(selection => ({
            sub_additional_activity_id: selection.subCategoryId,
            score: Number(studentScores[student.id][selection.subCategoryId].score),
            note: studentScores[student.id][selection.subCategoryId].note || ""
          }))
        }))
      };

      // Call API to create manual sub activity scores in bulk
      const response = await api.createManualSubActivityScoresBulk(token!, assessmentData);
      
      if (!response.success) {
        throw new Error(response.message || "Gagal menyimpan penilaian");
      }

      openMessageModal(
        "Berhasil",
        mode === "edit" ? "Penilaian berhasil diperbarui" : "Penilaian berhasil disimpan",
        [
          {
            label: "OK",
            type: "primary",
            onPress: () => {
              setMessageModalVisible(false);
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error submitting assessment:", error);
      openMessageModal("Error", "Gagal menyimpan penilaian");
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state
  if (submitting) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        
        <View style={[styles.header, { backgroundColor: colors.tint }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === "edit" ? "Edit Penilaian" : "Tambah Penilaian"}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Menyimpan penilaian...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "edit" ? "Edit Penilaian" : "Tambah Penilaian"}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Assessment Details */}
        <Card title="Detail Penilaian">
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nama Penilaian</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.inputBackground, 
                  color: colors.text, 
                  borderColor: colors.inputBorder 
                }
              ]}
              value={assessmentName}
              onChangeText={setAssessmentName}
              placeholder="Contoh: Penilaian Mingguan"
              placeholderTextColor={colors.icon}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Tanggal</Text>
            <TouchableOpacity
              style={[
                styles.input, 
                { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder,
                  justifyContent: 'center'
                }
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[{ color: colors.text }]}>
                {assessmentDate.toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={assessmentDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setAssessmentDate(selectedDate);
                  }
                }}
              />
            )}
          </View>
        </Card>

        {/* Additional Activities */}
        <Card title="Aktivitas">
          {loadingAdditional ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Memuat aktivitas tambahan...
              </Text>
            </View>
          ) : (
            <>
              {selectedAdditionalActivities.map((selection, index) => {
                // Filter categories with non-empty sub-categories
                const validCategories = additionalCategories.filter(
                  (cat) => Array.isArray(cat.sub_categories) && 
                           cat.sub_categories.some((s: any) => !s.is_logbook_activity)
                );

                // Get sub-categories for the selected category
                const selectedCategorySubCategories = 
                  selection.categoryId 
                    ? additionalCategories
                        .find((cat) => cat.id === selection.categoryId)
                        ?.sub_categories.filter((s: any) => !s.is_logbook_activity) 
                    : [];

                return (
                  <View key={`additional-activity-${index}`} style={styles.additionalActivityContainer}>
                    {/* Category Selector */}
                    <View style={styles.additionalActivityPickerGroup}>
                      <Text style={[styles.additionalActivityLabel, { color: colors.text }]}>
                        Kategori Aktivitas
                      </Text>
                      <View style={[styles.pickerWrapper, { borderColor: colors.inputBorder }]}>
                        <Picker
                          selectedValue={selection.categoryId}
                          onValueChange={(itemValue) => {
                            const newSelections = [...selectedAdditionalActivities];
                            newSelections[index] = { categoryId: itemValue, subCategoryId: 0 };
                            setSelectedAdditionalActivities(newSelections);
                          }}
                          style={{ color: colors.text }}
                        >
                          <Picker.Item label="Pilih Kategori Aktivitas" value={0} />
                          {validCategories.map((cat) => (
                            <Picker.Item 
                              key={`cat-${cat.id}`} 
                              label={cat.name} 
                              value={cat.id} 
                            />
                          ))}
                        </Picker>
                      </View>
                    </View>

                    {/* Sub-Category Selector */}
                    {selection.categoryId > 0 && (
                      <View style={styles.additionalActivityPickerGroup}>
                        <Text style={[styles.additionalActivityLabel, { color: colors.text }]}>
                          Aktivitas
                        </Text>
                        <View style={[styles.pickerWrapper, { borderColor: colors.inputBorder }]}>
                          <Picker
                            selectedValue={selection.subCategoryId}
                            onValueChange={(itemValue) => {
                              const newSelections = [...selectedAdditionalActivities];
                              newSelections[index] = { ...newSelections[index], subCategoryId: itemValue };
                              setSelectedAdditionalActivities(newSelections);
                            }}
                            style={{ color: colors.text }}
                          >
                            <Picker.Item label="Pilih Aktivitas" value={0} />
                            {selectedCategorySubCategories?.map((sub: any) => (
                              <Picker.Item 
                                key={`sub-${sub.id}`} 
                                label={sub.name} 
                                value={sub.id} 
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    )}

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={[styles.deleteActivityButton, { backgroundColor: 'red' }]}
                      onPress={() => {
                        const newSelections = selectedAdditionalActivities.filter((_, i) => i !== index);
                        setSelectedAdditionalActivities(newSelections);
                      }}
                    >
                      <Ionicons name="trash" size={16} color="white" style={styles.deleteActivityButtonIcon} />
                      <Text style={styles.deleteActivityButtonText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Add Activity Button */}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.tint }]}
                onPress={() => {
                  setSelectedAdditionalActivities((prev) => [...prev, { categoryId: 0, subCategoryId: 0 }]);
                }}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addButtonText}>Tambah Aktivitas</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* Student Selection */}
        <Card title="Pilih Mahasiswa">
          {loadingStudents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Memuat daftar mahasiswa...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.studentSelectionHeader}>
                <Text style={[styles.label, { color: colors.text, flex: 1 }]}>Pilih Mahasiswa</Text>
                <View style={styles.studentSelectionActions}>
                  <TouchableOpacity
                    style={[styles.selectionButton, { backgroundColor: colors.tint }]}
                    onPress={selectAllStudents}
                  >
                    <Text style={styles.selectionButtonText}>Pilih Semua</Text>
                  </TouchableOpacity>
                  {selectedStudents.length > 0 && (
                    <TouchableOpacity
                      style={[styles.selectionButton, { backgroundColor: '#FF4D4D' }]}
                      onPress={clearStudentSelection}
                    >
                      <Text style={styles.selectionButtonText}>Hapus Pilihan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {students.map(student => (
                <TouchableOpacity
                  key={student.id}
                  style={[
                    styles.studentSelectionRow,
                    {
                      backgroundColor: selectedStudents.some(s => s.id === student.id) 
                        ? colors.tint + "1A" 
                        : "transparent",
                    }
                  ]}
                  onPress={() => toggleStudentSelection(student)}
                >
                  <Ionicons
                    name={
                      selectedStudents.some(s => s.id === student.id)
                        ? "checkmark-circle" 
                        : "checkbox-outline"
                    }
                    size={20}
                    color={
                      selectedStudents.some(s => s.id === student.id)
                        ? colors.tint 
                        : colors.icon
                    }
                    style={{ marginRight: 8 }}
                  />
                  <View>
                    <Text style={[styles.studentName, { color: colors.text }]}>
                      {student.name}
                    </Text>
                    <Text style={[styles.studentId, { color: colors.icon }]}>
                      {student.student_id}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </Card>

        {/* Student Scoring */}
        {selectedAdditionalActivities.length > 0 && selectedStudents.length > 0 && (
          <Card title="Penilaian Mahasiswa">
            {selectedStudents.map(student => (
              <View key={student.id} style={styles.studentBlock}>
                <Text style={[styles.studentTitle, { color: colors.text }]}>
                  {student.name} • {student.student_id}
                </Text>
                {selectedAdditionalActivities.map(selection => {
                  const subActivity = additionalCategories
                    .find(cat => cat.id === selection.categoryId)
                    ?.sub_categories.find((sub: any) => sub.id === selection.subCategoryId);
                  
                  if (!subActivity) return null;

                  return (
                    <View key={`${student.id}-${selection.subCategoryId}`} style={styles.studentSubActivityScoreContainer}>
                      <View style={styles.studentSubActivityHeader}>
                        <Text style={[styles.studentSubActivityName, { color: colors.text }]}>
                          {subActivity.name}
                        </Text>
                        {subActivity.description && (
                          <Text style={[styles.studentSubActivityDescription, { color: colors.icon }]}>
                            {subActivity.description}
                          </Text>
                        )}
                      </View>

                      <View style={styles.studentSubActivityScoreInputGroup}>
                        <View style={styles.studentSubActivityScoreInput}>
                          <Text style={[styles.studentSubActivityInputLabel, { color: colors.text }]}>
                            Nilai (1-100)
                          </Text>
                          <TextInput
                            style={[
                              styles.scoreInputVertical, 
                              { 
                                borderColor: colors.inputBorder, 
                                color: colors.text,
                                backgroundColor: colors.inputBackground 
                              }
                            ]}
                            keyboardType="numeric"
                            value={studentScores[student.id]?.[selection.subCategoryId]?.score || ""}
                            onChangeText={(text) => 
                              updateStudentScore(student.id, selection.subCategoryId, 'score', text)
                            }
                            placeholder="0-100"
                            placeholderTextColor={colors.icon}
                          />
                        </View>

                        <View style={styles.studentSubActivityNoteInput}>
                          <Text style={[styles.studentSubActivityInputLabel, { color: colors.text }]}>
                            Catatan
                          </Text>
                          <TextInput
                            style={[
                              styles.noteInputVertical, 
                              { 
                                borderColor: colors.inputBorder, 
                                color: colors.text,
                                backgroundColor: colors.inputBackground 
                              }
                            ]}
                            multiline
                            numberOfLines={3}
                            value={studentScores[student.id]?.[selection.subCategoryId]?.note || ""}
                            onChangeText={(text) => 
                              updateStudentScore(student.id, selection.subCategoryId, 'note', text)
                            }
                            placeholder="Tambahkan catatan penilaian"
                            placeholderTextColor={colors.icon}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </Card>
        )}

        {/* Submit Button */}
        <PrimaryButton
          label={mode === "edit" ? "Simpan Perubahan" : "Simpan Penilaian"}
          onPress={handleSubmit}
          loading={submitting}
          disabled={
            submitting || 
            !assessmentName || 
            selectedAdditionalActivities.length === 0 || 
            selectedStudents.length === 0
          }
          style={styles.submitButton}
        />
      </ScrollView>
      
      <AppModal
        visible={messageModalVisible}
        title={messageModalTitle}
        onClose={closeMessageModal}
      >
        <Text style={{ color: colors.text, fontSize: 15 }}>{messageModalText}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          {messageModalButtons.map((btn, idx) => {
            const bg =
              btn.type === "destructive"
                ? (colors.error || "#dc3545")
                : btn.type === "primary"
                ? colors.tint
                : "#6c757d";
            return (
              <TouchableOpacity
                key={`${btn.label}-${idx}`}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: bg }}
                onPress={btn.onPress}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>{btn.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </AppModal>
    </View>
  );
}

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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  additionalActivityContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  additionalActivityPickerGroup: {
    marginBottom: 12,
  },
  additionalActivityLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  pickerWrapper: {
    borderWidth: 0.5,
    borderRadius: 8,
  },
  deleteActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: '#FF4D4D',
  },
  deleteActivityButtonIcon: {
    marginRight: 8,
  },
  deleteActivityButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  addButtonText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "600",
  },
  studentSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentSelectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  studentSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  studentId: {
    fontSize: 12,
    marginTop: 2,
  },
  studentBlock: {
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  studentTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  studentSubActivityScoreContainer: {
    marginBottom: 12,
  },
  studentSubActivityHeader: {
    marginBottom: 4,
  },
  studentSubActivityName: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentSubActivityDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  studentSubActivityScoreInputGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  studentSubActivityScoreInput: {
    flex: 1,
  },
  studentSubActivityNoteInput: {
    flex: 1,
  },
  studentSubActivityInputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  scoreInputVertical: {
    width: '100%',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  noteInputVertical: {
    width: '100%',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  submitButton: {
    marginTop: 24,
  },
});
