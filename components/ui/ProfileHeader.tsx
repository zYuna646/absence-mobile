import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
import { useThemeColor } from "@/constants/Colors";
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  name: string;
  welcomeText?: string;
  role?: string;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
}

/**
 * ProfileHeader component for displaying user welcome text and information
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  welcomeText = "Selamat datang,",
  role,
  onProfilePress,
  onNotificationPress,
  notificationCount = 0,
}) => {
  const colors = useThemeColor();

  return (
    <View style={styles.gradientContainer}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
            {notificationCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={50} color="white" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name}>
              {name}
            </Text>
            {role && (
              <Text style={styles.roleText}>
                {role}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#2F80ED',
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: 'white',
  },
  roleText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
});

export default ProfileHeader; 