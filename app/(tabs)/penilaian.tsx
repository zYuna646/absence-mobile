import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/context/UserContext";
import { api } from "@/services/api";
import Card from "@/components/ui/Card";
import { router } from "expo-router";

// Interfaces for data types
interface Assessment {
  id: number;
  name: string;
  date: string;
  group_id: number;
  items_count: number;
}

interface AssessmentDetail {
  id: number;
  name: string;
  date: string;
  group_id: number;
  items: {
    id: number;
    student: {
      id: number;
      name: string;
    };
    sub_activity: {
      id: number;
      name: string;
      category: {
        id: number;
        name: string;
        percentage: number;
      };
    };
    score: number;
    note: string;
    scored_at: string;
  }[];
}

export default function PenilaianScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { token } = useUser();

  // State for data
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assessments
  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.getManualSubActivityScores(token);
      
      if (response.success && response.data) {
        setAssessments(response.data);
      } else {
        setError(response.message || "Gagal memuat data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [token]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Load assessment details
  const loadAssessmentDetails = async (assessmentId: number) => {
    if (!token) return;

    try {
      setDetailLoading(true);
      const response = await api.getManualSubActivityScoreDetail(token, assessmentId);

      if (response.success && response.data) {
        setSelectedAssessment(response.data);
        setModalVisible(true);
      } else {
        setError(response.message || "Gagal memuat detail penilaian");
      }
    } catch (err) {
      console.error("Error loading assessment details:", err);
      setError("Gagal memuat detail penilaian");
    } finally {
      setDetailLoading(false);
    }
  };

  // Delete assessment
  const deleteAssessment = async (id: number) => {
    Alert.alert(
      "Hapus Penilaian", 
      "Yakin ingin menghapus penilaian ini?", 
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            if (!token) return;
            
            try {
              const response = await api.deleteManualSubActivityScore(token, id);
              
              if (response.success) {
                setAssessments(prev => prev.filter(a => a.id !== id));
                Alert.alert("Berhasil", "Penilaian berhasil dihapus");
              } else {
                Alert.alert("Error", response.message || "Gagal menghapus penilaian");
              }
            } catch (err) {
              console.error("Error deleting assessment:", err);
              Alert.alert("Error", "Gagal menghapus penilaian");
            }
          }
        }
      ]
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Render assessment card
  const renderAssessmentCard = (assessment: Assessment) => (
    <TouchableOpacity
       key={assessment.id}
       style={styles.assessmentItem}
       activeOpacity={0.7}
       onPress={() => loadAssessmentDetails(assessment.id)}
     >
      <View style={styles.assessmentHeader}>
        <Text style={[styles.assessmentTitle, { color: colors.text }]}>
          {assessment.name}
        </Text>
        <View style={styles.assessmentActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={(e) => {
              e.stopPropagation();
              router.push({
                pathname: '/penilaian-create',
                params: { mode: 'edit', assessmentId: assessment.id.toString() }
              });
            }}
          >
            <Ionicons name="create" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF4D4D' }]}
            onPress={(e) => {
              e.stopPropagation();
              deleteAssessment(assessment.id);
            }}
          >
            <Ionicons name="trash" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.assessmentDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>
            Tanggal:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatDate(assessment.date)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>
            Jumlah Item:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {assessment.items_count}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group items by category
  const groupItemsByCategory = (items: AssessmentDetail['items']) => {
    const grouped: { [key: string]: typeof items } = {};
    items.forEach(item => {
      const categoryName = item.sub_activity.category.name;
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(item);
    });
    return grouped;
  };

  // Assessment Detail Modal
  const AssessmentDetailModal = () => (
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
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Memuat detail...
              </Text>
            </View>
          ) : selectedAssessment ? (
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedAssessment.name}
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
                  Tanggal
                </Text>
                <Text style={[styles.sectionContent, { color: colors.text }]}>
                  {formatDate(selectedAssessment.date)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Total Item: {selectedAssessment.items.length}
                </Text>
              </View>

              {Object.entries(groupItemsByCategory(selectedAssessment.items)).map(([categoryName, items]) => (
                <View key={categoryName} style={styles.categorySection}>
                  <Text style={[styles.categoryTitle, { color: colors.tint }]}>
                    {categoryName}
                  </Text>
                  {items.map((item) => (
                    <View key={item.id} style={[styles.itemCard, { borderColor: colors.border }]}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.studentName, { color: colors.text }]}>
                          {item.student.name}
                        </Text>
                        <View style={[styles.scoreBadge, { backgroundColor: colors.tint }]}>
                          <Text style={styles.scoreText}>{item.score}</Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.subActivityName, { color: colors.text }]}>
                        {item.sub_activity.name}
                      </Text>
                      
                      {item.note && (
                        <Text style={[styles.noteText, { color: colors.text }]}>
                          Catatan: {item.note}
                        </Text>
                      )}
                      
                      <Text style={[styles.scoredAt, { color: colors.icon }]}>
                        Dinilai: {formatDateTime(item.scored_at)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.errorText, { color: colors.text }]}>
              Gagal memuat detail penilaian
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render content
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Memuat penilaian...
          </Text>
        </View>
      );
    }

    return (
      <View>
        {assessments.length > 0 ? (
          assessments.map(renderAssessmentCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Belum ada penilaian
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Penilaian</Text>
        </View>

        {renderContent()}
      </ScrollView>

      <AssessmentDetailModal />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.tint }
        ]}
        onPress={() => router.push({
          pathname: '/penilaian-create',
          params: { mode: 'create' }
        })}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  assessmentItem: {
    backgroundColor: "#ffffff10",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#00000020",
  },
  assessmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  assessmentActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  assessmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
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
    flex: 1,
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
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subActivityName: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  noteText: {
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  scoredAt: {
    fontSize: 12,
    opacity: 0.6,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 20,
  },
});
