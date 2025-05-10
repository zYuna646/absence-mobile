import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeColor } from "@/constants/Colors";

interface ProfileHeaderProps {
  name: string;
  welcomeText?: string;
  role?: string;
}

/**
 * ProfileHeader component for displaying user welcome text and information
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  welcomeText = "Selamat datang,",
  role,
}) => {
  const colors = useThemeColor();

  return (
    <View style={styles.header}>
      <Text style={[styles.welcome, { color: colors.icon }]}>
        {welcomeText}
      </Text>
      <Text style={[styles.name, { color: colors.text }]}>
        {name}
      </Text>
      {role && (
        <Text style={[styles.roleText, { color: colors.tint }]}>
          {role}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  welcome: {
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default ProfileHeader; 