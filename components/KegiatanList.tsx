import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Card from "@/components/ui/Card";
import { ActivityData } from "@/services/api";

interface KegiatanListProps {
  activities: ActivityData[];
  role: "student" | "advisor" | string;
  onToggleActivity: (activity: ActivityData, action: "unlock" | "lock") => void;
  onOpenDetail: (activity: ActivityData) => void;
  onReportPress: (activity: ActivityData) => void;
}

const KegiatanList: React.FC<KegiatanListProps> = ({
  activities,
  role,
  onToggleActivity,
  onOpenDetail,
  onReportPress,
}) => {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();

  const canUnlock = (activity: ActivityData): boolean => {
    return activity.is_lock === 1 && activity.lock_date === null;
  };

  const isLocked = (activity: ActivityData): boolean => {
    return activity.is_lock === 1 && activity.lock_date !== null;
  };

  const isUnlocked = (activity: ActivityData): boolean => {
    return activity.is_lock === 0;
  };

  const getActivityStatus = (activity: ActivityData) => {
    if (isUnlocked(activity)) {
      return { text: "Terbuka", color: colors.success || "#28a745" };
    } else if (isLocked(activity)) {
      return { text: "Tertutup", color: colors.error || "#dc3545" };
    } else if (canUnlock(activity)) {
      return { text: "Tertutup", color: colors.error || "#dc3545" };
    } else {
      return { text: "Tidak Diketahui", color: colors.icon || "#6c757d" };
    }
  };

  const renderTitle = (activity: ActivityData) => {
    return (
      <View style={styles.titleRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{activity.name}</Text>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => onOpenDetail(activity)}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
          <Text style={[styles.detailText, { color: colors.tint }]}>Detail</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View>
      {activities.map((activity) => {
        const status = getActivityStatus(activity);
        const showOpen = role === "advisor" && (canUnlock(activity) || isLocked(activity));
        const showClose = role === "advisor" && isUnlocked(activity);

        return (
          <Card key={activity.id} title={renderTitle(activity)}>
            <Text style={[styles.advisorInfo, { color: colors.tint }]}>
              <Ionicons name="person" size={14} color={colors.tint} style={{ marginRight: 4 }} />
              Pembimbing: {activity.advisor_clinic_name || "Unknown Advisor"}
            </Text>

            {activity.location && (
              <Text style={[styles.locationText, { color: colors.icon }]}>
                <Ionicons name="location" size={14} color={colors.icon} style={{ marginRight: 4 }} />
                {activity.location}
                {activity.room ? `, Ruang ${activity.room}` : ""}
              </Text>
            )}

            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.text }]}>Status: </Text>
              <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                <Text style={styles.statusText}>{status.text}</Text>
              </View>
            </View>

            {activity.created_at && (
              <Text style={styles.date}>
                Created: {new Date(activity.created_at).toLocaleDateString()}
              </Text>
            )}

            <View style={styles.buttonGroup}>
              {role === "student" && (
                <TouchableOpacity
                  style={[styles.reportButton, { backgroundColor: colors.tint }]}
                  onPress={() => onReportPress(activity)}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="white"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.reportText}>Laporan</Text>
                </TouchableOpacity>
              )}

              {showOpen && (
              <TouchableOpacity
                style={[
                  styles.fullWidthActionButton,
                  { backgroundColor: colors.success || "#28a745" },
                ]}
                onPress={() => onToggleActivity(activity, "unlock")}
              >
                <Ionicons
                  name="lock-open-outline"
                  size={18}
                  color="white"
                  style={styles.buttonIcon}
                />
                <Text style={styles.fullWidthActionText}>Buka</Text>
              </TouchableOpacity>
              )}

              {showClose && (
                <TouchableOpacity
                  style={[
                    styles.fullWidthActionButton,
                    { backgroundColor: colors.warning || "#ffc107" },
                  ]}
                  onPress={() => onToggleActivity(activity, "lock")}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="white"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.fullWidthActionText}>Tutup</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        );
      })}
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
  advisorInfo: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  locationText: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "white",
  },
  date: {
    fontSize: 12,
    color: "#888",
  },
  buttonGroup: {
    marginTop: 12,
    gap: 8,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  reportText: {
    fontSize: 14,
    fontWeight: "500",
    color: "white",
  },
  fullWidthActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
  },
  fullWidthActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});

export default KegiatanList;
