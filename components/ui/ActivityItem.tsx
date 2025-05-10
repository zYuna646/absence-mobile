import React, { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ActivityItemProps {
  title: string | ReactNode;
  subtitle?: string;
  timestamp: string;
  showDivider?: boolean;
}

/**
 * ActivityItem component for displaying activity entries
 */
const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  subtitle,
  timestamp,
  showDivider = false,
}) => {
  const colors = useThemeColor();
  const colorScheme = useColorScheme();
  
  // Use a divider color based on the theme
  const dividerColor = colorScheme === 'dark' ? '#444' : '#E5E5E5';

  return (
    <>
      <View style={styles.activityItem}>
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
        <Text style={[styles.activityTime, { color: colors.icon }]}>
          {timestamp}
        </Text>
      </View>
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
});

export default ActivityItem; 