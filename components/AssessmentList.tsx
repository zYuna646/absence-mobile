import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Card from "@/components/ui/Card";

interface AssessmentItem {
  id: number;
  name: string;
  date: string;
  group_id: number;
  items_count: number;
}

interface AssessmentListProps {
  assessments: AssessmentItem[];
  onOpenDetail: (assessment: AssessmentItem) => void;
  onEdit: (assessment: AssessmentItem) => void;
  onDelete: (assessment: AssessmentItem) => void;
}

const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  onOpenDetail,
  onEdit,
  onDelete,
}) => {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderTitle = (assessment: AssessmentItem) => {
    return (
      <View style={styles.titleRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{assessment.name}</Text>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => onOpenDetail(assessment)}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
          <Text style={[styles.detailText, { color: colors.tint }]}>Detail</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View>
      {assessments.map((assessment) => (
        <Card key={assessment.id} title={renderTitle(assessment)}>
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Tanggal:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(assessment.date)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Jumlah Item:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {assessment.items_count}
              </Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.fullWidthActionButton, { backgroundColor: colors.tint }]}
              onPress={() => onEdit(assessment)}
            >
              <Ionicons name="create" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.fullWidthActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fullWidthActionButton,
                { backgroundColor: colors.error || "#dc3545" },
              ]}
              onPress={() => onDelete(assessment)}
            >
              <Ionicons name="trash" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.fullWidthActionText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  details: {
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
  buttonGroup: {
    marginTop: 12,
    gap: 8,
  },
  fullWidthActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
  },
  buttonIcon: {
    marginRight: 6,
  },
  fullWidthActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});

export default AssessmentList;
