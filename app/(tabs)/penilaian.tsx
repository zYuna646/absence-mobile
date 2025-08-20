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
  sub_activities: number[];
  student_scores: {
    student_id: number;
    scores: {
      sub_activity_id: number;
      score: number;
      note?: string;
    }[];
  }[];
}

export default function PenilaianScreen() {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  const { token } = useUser();

  // State for data
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assessments
  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API for fetching assessments
      // For now, using dummy data
      setAssessments([]);
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

  // Delete assessment
  const deleteAssessment = (id: number) => {
    Alert.alert(
      "Hapus Penilaian", 
      "Yakin ingin menghapus penilaian ini?", 
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: () => setAssessments(prev => prev.filter(a => a.id !== id)) 
        }
      ]
    );
  };

  // Render assessment card
  const renderAssessmentCard = (assessment: Assessment) => (
    <Card key={assessment.id} title={assessment.name}>
      <Text style={{ color: colors.text, marginBottom: 8 }}>
        Tanggal: {assessment.date}
      </Text>
      <View style={styles.rowGap}>
        <TouchableOpacity
          style={[styles.smallButton, { borderColor: colors.tint }]}
          onPress={() => router.push({
            pathname: '/penilaian-create',
            params: { mode: 'edit', assessmentId: assessment.id.toString() }
          })}
        >
          <Ionicons name="create-outline" size={16} color={colors.tint} />
          <Text style={[styles.smallButtonText, { color: colors.tint }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, { borderColor: "#FF4D4D" }]}
          onPress={() => deleteAssessment(assessment.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF4D4D" />
          <Text style={[styles.smallButtonText, { color: "#FF4D4D" }]}>
            Hapus
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
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
            <Ionicons name="clipboard-outline" size={64} color={colors.icon} />
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
  rowGap: { flexDirection: "row", gap: 8 },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallButtonText: { marginLeft: 6, fontWeight: "600" },
  loadingContainer: {
    borderWidth: 0.5,
    borderRadius: 8,
    padding: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
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
});
