import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/constants/Colors";

type Role = "mahasiswa" | "preseptor_akademik" | "preseptor_klinik" | "";

interface RoleSelectionProps {
  value: Role;
  onChange: (role: Role) => void;
}

/**
 * Role selection component for registration
 */
const RoleSelection: React.FC<RoleSelectionProps> = ({ value, onChange }) => {
  const colors = useThemeColor();

  const roles = [
    {
      id: "mahasiswa",
      title: "Mahasiswa",
      description: "Daftar sebagai mahasiswa yang akan melakukan kunjungan",
      icon: "school",
    },
    {
      id: "preseptor_akademik",
      title: "Preseptor Akademik",
      description: "Daftar sebagai dosen pembimbing yang akan memverifikasi kunjungan",
      icon: "person",
    },
    {
      id: "preseptor_klinik",
      title: "Preseptor Klinik",
      description: "Daftar sebagai dokter yang akan memverifikasi kunjungan",
      icon: "person",
    },

  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Daftar Sebagai
      </Text>
      
      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              { 
                backgroundColor: colors.inputBackground,
                borderColor: value === role.id ? colors.tint : colors.inputBorder 
              },
              value === role.id && styles.selectedRole,
            ]}
            onPress={() => onChange(role.id as Role)}
          >
            <View 
              style={[
                styles.iconContainer, 
                { backgroundColor: value === role.id ? colors.tint : colors.tabIconDefault }
              ]}
            >
              <Ionicons name={role.icon as any} size={24} color={value === role.id ? colors.tabIconDefault : colors.tabIconSelected} />
            </View>
            <Text style={[styles.roleTitle, { color: colors.text }]}>
              {role.title}
            </Text>
            <Text style={[styles.roleDescription, { color: colors.icon }]}>
              {role.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  rolesContainer: {
    width: "100%",
  },
  roleCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 2,
  },
  selectedRole: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default RoleSelection; 