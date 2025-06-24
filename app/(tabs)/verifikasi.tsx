import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { api } from "@/services/api";
import { router } from "expo-router";
import Card from "@/components/ui/Card";

// Define student data interface
interface Student {
  id: number;
  name: string;
  student_id: string;
  group_name: string;
}

// Define visit data interface
interface Visit {
  id: number;
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
  status: string; // "pending", "verified", "rejected"
  location: string;
}

// Define meta data interface
interface MetaData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function VerifikasiScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const { role, userInfo, token } = useUser();

  // State for data
  const [students, setStudents] = useState<Student[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);

  // Load students data for advisor role
  const loadStudents = async (search: string = "") => {
    if (!token) return;

    try {
      setLoading(true);

      const params: { per_page?: number; search?: string } = {
        per_page: 10,
      };

      if (search) {
        params.search = search;
      }

      const response = await api.getStudents(token, params);

      if (response.success && response.data) {
        setStudents(response.data);
        setFilteredStudents(response.data);
        if (response.meta) {
          setMeta(response.meta);
        } else if (response.data.meta) {
          // Handle case where meta is nested in data
          setMeta(response.data.meta);
        }
      } else {
        Alert.alert("Error", response.message || "Failed to load students");
      }
    } catch (error) {
      console.error("Error loading students:", error);
      Alert.alert("Error", "Failed to load students");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load visits data for student role
  const loadVisits = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Mock data for now - replace with actual API call
      setTimeout(() => {
        const mockVisits: Visit[] = [
          {
            id: 1,
            date: "2023-07-20T00:00:00.000000Z",
            student: {
              id: 1,
              name: "Student Name",
              nim: "1234567890",
            },
            activity: {
              id: 1,
              name: "PT. Teknologi Indonesia",
            },
            status: "pending",
            location: "PT. Teknologi Indonesia",
          },
          {
            id: 2,
            date: "2023-07-15T00:00:00.000000Z",
            student: {
              id: 1,
              name: "Student Name",
              nim: "1234567890",
            },
            activity: {
              id: 2,
              name: "PT. Maju Bersama",
            },
            status: "verified",
            location: "PT. Maju Bersama",
          },
        ];
        setVisits(mockVisits);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading visits:", error);
      Alert.alert("Error", "Failed to load visits");
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount based on role
  useEffect(() => {
    if (token) {
      if (role === "advisor") {
        loadStudents();
      } else if (role === "student") {
        loadVisits();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [role, token]);

  // Filter students when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(lowercaseQuery) ||
          student.student_id.toLowerCase().includes(lowercaseQuery) ||
          (student.group_name && student.group_name.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    if (role === "advisor") {
      loadStudents();
    } else if (role === "student") {
      loadVisits();
    } else {
      setRefreshing(false);
    }
  };

  // Handle search submit
  const handleSearch = () => {
    if (role === "advisor") {
      loadStudents(searchQuery);
    }
  };

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowVisitModal(true);
  };

  // Handle view student verification details
  const handleViewVerification = () => {
    if (!selectedStudent) {
      Alert.alert("Validasi", "Pilih mahasiswa terlebih dahulu");
      return;
    }
    
    // Navigate to verification details screen
    router.push({
      pathname: "/verifikasi-detail",
      params: { 
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
      },
    });
    
    // Close modal
    setShowVisitModal(false);
  };

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "verified":
        return colors.success || "#10b981";
      case "pending":
        return colors.warning || "#f59e0b";
      case "rejected":
        return colors.error || "#ef4444";
      default:
        return colors.icon || "#6c757d";
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case "verified":
        return "Terverifikasi";
      case "pending":
        return "Menunggu Verifikasi";
      case "rejected":
        return "Ditolak";
      default:
        return "Status Tidak Diketahui";
    }
  };

  // Render student item
  const renderStudentItem = (student: Student) => {
    return (
      <TouchableOpacity
        key={student.id}
        style={[styles.studentItem]}
        onPress={() => handleSelectStudent(student)}
      >
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.text }]}>
            {student.name}
          </Text>
          <Text style={[styles.studentNim, { color: colors.icon }]}>
            {student.student_id}
          </Text>
          {student.group_name && (
            <Text style={[styles.studentGroup, { color: colors.icon }]}>
              {student.group_name}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  };

  // Render visit item for student role
  const renderVisitItem = (visit: Visit) => {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colorScheme === "dark" ? "#2A2D2E" : "#F5F5F5",
          },
        ]}
        key={visit.id}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {visit.activity.name}
        </Text>
        <Text style={[styles.cardContent, { color: colors.icon }]}>
          {formatDate(visit.date)}
        </Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(visit.status) },
            ]}
          />
          <Text style={[styles.cardStatus, { color: colors.text }]}>
            {getStatusText(visit.status)}
          </Text>
        </View>
      </View>
    );
  };

  // Render content based on role
  const renderRoleContent = () => {
    switch (role) {
      case "student":
        if (loading && !refreshing) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading verifikasi...
              </Text>
            </View>
          );
        }

        return (
          <View style={styles.roleContent}>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Status verifikasi kunjungan Anda
            </Text>
            {visits.length > 0 ? (
              visits.map(renderVisitItem)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={64}
                  color={colors.icon}
                />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Belum ada kunjungan yang perlu diverifikasi
                </Text>
              </View>
            )}
          </View>
        );
      case "advisor":
        if (loading && !refreshing) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading students...
              </Text>
            </View>
          );
        }

        return (
          <View style={styles.roleContent}>
            <Text style={[styles.header, { color: colors.icon }]}>
              Verifikasi Logbook mahasiswa bimbingan
            </Text>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: colors.inputBackground || "#f0f0f0",
                    borderColor: colors.inputBorder || "#e0e0e0",
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.icon}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Cari mahasiswa..."
                  placeholderTextColor={colors.icon}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Students list */}
            {filteredStudents.length > 0 ? (
              <Card title="Daftar Mahasiswa">
                {filteredStudents.map(renderStudentItem)}

                {/* Pagination info */}
                {meta && (
                  <Text style={[styles.paginationInfo, { color: colors.icon }]}>
                    Menampilkan {filteredStudents.length} dari {meta.total}{" "}
                    mahasiswa
                  </Text>
                )}
              </Card>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={colors.icon} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {searchQuery.length > 0
                    ? "Tidak ada mahasiswa yang cocok dengan pencarian"
                    : "Tidak ada mahasiswa yang ditemukan"}
                </Text>
              </View>
            )}
          </View>
        );
      default:
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Anda tidak memiliki akses ke halaman ini
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
        {renderRoleContent()}
      </ScrollView>

      {/* Verification Modal */}
      <Modal
        visible={showVisitModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVisitModal(false)}
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
                Detail Verifikasi
              </Text>
              <TouchableOpacity onPress={() => setShowVisitModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedStudent && (
                <>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>
                    Mahasiswa:
                  </Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedStudent.name}
                  </Text>

                  <Text style={[styles.modalLabel, { color: colors.text }]}>
                    NIM:
                  </Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedStudent.student_id}
                  </Text>

                  {selectedStudent.group_name && (
                    <>
                      <Text style={[styles.modalLabel, { color: colors.text }]}>
                        Kelompok:
                      </Text>
                      <Text style={[styles.modalValue, { color: colors.text }]}>
                        {selectedStudent.group_name}
                      </Text>
                    </>
                  )}

                  <Text style={[styles.modalDescription, { color: colors.text }]}>
                    Anda akan melihat detail verifikasi kunjungan untuk mahasiswa ini
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      { 
                        backgroundColor: colors.tint,
                      },
                    ]}
                    onPress={handleViewVerification}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="white"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.verifyButtonText}>
                      Lihat detail verifikasi
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 0,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  welcome: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  roleContent: {
    marginTop: 10,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  cardStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 44,
  },
  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  studentNim: {
    fontSize: 14,
    marginBottom: 2,
  },
  studentGroup: {
    fontSize: 14,
  },
  paginationInfo: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    marginVertical: 16,
    textAlign: "center",
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
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 16,
  },
  rejectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectText: {
    fontWeight: "500",
  },
}); 