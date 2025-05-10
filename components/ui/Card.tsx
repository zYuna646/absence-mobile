import React, { ReactNode } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface CardProps {
  title: string;
  children: ReactNode;
  style?: ViewStyle;
}

/**
 * Reusable Card component with title and content
 */
const Card: React.FC<CardProps> = ({ title, children, style }) => {
  const colorScheme = useColorScheme();
  const colors = useThemeColor();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colorScheme === "dark" ? "#2A2D2E" : "#F5F5F5" },
        style,
      ]}
    >
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
});

export default Card; 