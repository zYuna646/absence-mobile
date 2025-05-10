import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/constants/Colors";

interface StatItem {
  value: string | number;
  label: string;
}

interface StatisticRowProps {
  items: StatItem[];
}

/**
 * A row of statistics/metrics displaying value and label
 */
const StatisticRow: React.FC<StatisticRowProps> = ({ items }) => {
  const colors = useThemeColor();

  return (
    <View style={styles.statRow}>
      {items.map((item, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {item.value}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
});

export default StatisticRow; 