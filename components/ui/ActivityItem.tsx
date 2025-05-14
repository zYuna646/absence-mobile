import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export interface ActivityItemProps {
  title: string | ReactNode;
  subtitle?: string;
  timestamp: string;
  showDivider?: boolean;
  status?: string;
  onPress?: () => void;
}

/**
 * ActivityItem component for displaying activity entries
 */
const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  subtitle,
  timestamp,
  showDivider = false,
  status,
  onPress,
}) => {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  
  // Use a divider color based on the theme
  const dividerColor = colorScheme === 'dark' ? '#444' : '#E5E5E5';

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "verified":
        return colors.success || "#28a745";
      case "unverified":
        return colors.warning || "#ffc107";
      case "incomplete":
        return colors.error || "#dc3545";
      default:
        return colors.icon || "#6c757d";
    }
  };

  const itemContent = (
    <>
      {typeof title === "string" ? (
        <Text style={[styles.activityText, { color: colors.text }]}>
          {title}
        </Text>
      ) : (
        title
      )}
      {subtitle && (
        <Text style={[styles.activitySubtext, { color: colors.icon }]}>
          {subtitle}
        </Text>
      )}
      <View style={styles.timestampContainer}>
        <Text style={[styles.activityTime, { color: colors.icon }]}>
          {timestamp}
        </Text>
        {status && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>
              {status === "verified" ? "Terverifikasi" : 
               status === "unverified" ? "Menunggu" : 
               status === "incomplete" ? "Belum Selesai" : status}
            </Text>
          </View>
        )}
      </View>
    </>
  );

  return (
    <>
      {onPress ? (
        <TouchableOpacity onPress={onPress} style={styles.activityItem}>
          {itemContent}
        </TouchableOpacity>
      ) : (
        <View style={styles.activityItem}>
          {itemContent}
        </View>
      )}
      {showDivider && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </>
  );
};

const styles = StyleSheet.create({
  activityItem: {
    paddingVertical: 8,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },
  activitySubtext: {
    fontSize: 12,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  timestampContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
  },
});

export default ActivityItem; 