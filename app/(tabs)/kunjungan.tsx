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
import { api, ActivityData } from "@/services/api";
import { router } from "expo-router";
import Card from "@/components/ui/Card";

// Define student data interface
interface Student {
  id: number;
  name: string;
  group_name: string;
}

// Define meta data interface
interface MetaData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function KunjunganScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const { role, userInfo, token } = useUser();

  // State for students data
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);

  // Load students data
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



  // Load students on mount if advisor role
  useEffect(() => {
    if (role === "advisor" && token) {
      loadStudents();
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
          student.group_name.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  // Handle search submit
  const handleSearch = () => {
    loadStudents(searchQuery);
  };

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowVisitModal(true);
  };



  // Handle student selection to view details
  const handleViewStudentDetails = () => {
    if (!selectedStudent) {
      Alert.alert("Validasi", "Pilih mahasiswa terlebih dahulu");
      return;
    }
    
    // Navigate to student visit details screen
    router.push({
      pathname: "/kunjung-detail",
      params: { 
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
      },
    });
    
    // Close modal
    setShowVisitModal(false);
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
          <Text style={[styles.studentGroup, { color: colors.icon }]}>
            {student.group_name}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  };



  // Render content based on role
  const renderRoleContent = () => {
    switch (role) {
      case "student":
        return (
          <View style={styles.roleContent}>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Mahasiswa dapat melihat jadwal kunjungan ke perusahaan/institusi
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2A2D2E" : "#F5F5F5",
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Kunjungan Terjadwal
              </Text>
              <Text style={[styles.cardContent, { color: colors.text }]}>
                PT. Teknologi Indonesia
              </Text>
              <Text style={[styles.cardContent, { color: colors.icon }]}>
                Kamis, 20 Juli 2023 - 09:00 WIB
              </Text>
              <Text style={[styles.cardStatus, { color: colors.tint }]}>
                Belum Diverifikasi
              </Text>
            </View>
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
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Pilih mahasiswa untuk dikunjungi
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
        return null;
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

      {/* Visit Modal */}
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
                Detail Kunjungan
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
                    Kelompok:
                  </Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {selectedStudent.group_name}
                  </Text>

                  <Text style={[styles.modalDescription, { color: colors.text }]}>
                    Anda akan melihat detail kunjungan untuk mahasiswa ini
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.visitButton,
                      { 
                        backgroundColor: colors.tint,
                      },
                    ]}
                    onPress={handleViewStudentDetails}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={20}
                      color="white"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.visitButtonText}>
                      Lihat detail kunjungan
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
  },
  header: {
    marginBottom: 24,
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
  cardStatus: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
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
  visitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  visitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },

});
