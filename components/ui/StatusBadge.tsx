import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/constants/Colors";

type StatusType = "pending" | "verified" | "rejected" | "draft";

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
}

/**
 * Status badge component to show verification status
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
}) => {
  const colors = useThemeColor();

  // Define status properties based on status type
  const getStatusStyle = () => {
    switch (status) {
      case "verified":
        return {
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          textColor: "#28a745",
          defaultText: "Terverifikasi",
        };
      case "rejected":
        return {
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          textColor: "#dc3545",
          defaultText: "Ditolak",
        };
      case "draft":
        return {
          backgroundColor: "rgba(108, 117, 125, 0.1)",
          textColor: "#6c757d",
          defaultText: "Draft",
        };
      case "pending":
      default:
        return {
          backgroundColor: "rgba(10, 126, 164, 0.1)",
          textColor: colors.tint,
          defaultText: "Menunggu Verifikasi",
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: statusStyle.backgroundColor },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          { color: statusStyle.textColor },
        ]}
      >
        {text || statusStyle.defaultText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBadge: {
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default StatusBadge; 