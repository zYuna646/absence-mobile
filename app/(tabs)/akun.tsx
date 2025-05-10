import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useThemeColor } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/context/UserContext';

export default function AkunScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const { role, userInfo, logout } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Render role-specific profile info
  const renderProfileInfo = () => {
    switch (role) {
      case 'mahasiswa':
        return (
          <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Informasi Mahasiswa</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Nama</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo?.name || 'Nama Mahasiswa'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>NIM</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>190511001</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Program Studi</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Teknik Informatika</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Dosen Pembimbing</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Dr. Ahmad Surya</Text>
            </View>
          </View>
        );
      case 'dosen':
        return (
          <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Informasi Dosen</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Nama</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo?.name || 'Nama Dosen'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>NIP</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>198505152010121002</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Program Studi</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Teknik Informatika</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Jumlah Mahasiswa Bimbingan</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>12 Mahasiswa</Text>
            </View>
          </View>
        );
      case 'kaprodi':
        return (
          <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Informasi Kaprodi</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Nama</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo?.name || 'Nama Kaprodi'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>NIP</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>197012251995122001</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Program Studi</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Teknik Informatika</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Jabatan</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Kepala Program Studi</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // Render role-specific menu options
  const renderMenuOptions = () => {
    const menuOptions = [
      { title: 'Edit Profil', icon: '🖋️' },
      { title: 'Ubah Password', icon: '🔑' },
    ];

    // Add role-specific menu options
    if (role === 'mahasiswa') {
      menuOptions.push({ title: 'Riwayat Kunjungan', icon: '📋' });
    } else if (role === 'dosen') {
      menuOptions.push({ title: 'Daftar Mahasiswa Bimbingan', icon: '👥' });
    } else if (role === 'kaprodi') {
      menuOptions.push({ title: 'Kelola Dosen', icon: '👨‍🏫' });
      menuOptions.push({ title: 'Statistik Program Studi', icon: '📊' });
    }

    // Add common menu option
    menuOptions.push({ title: 'Bantuan', icon: '❓' });

    return (
      <View style={[styles.menuCard, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Menu</Text>
        {menuOptions.map((option, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{option.icon}</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>{option.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Akun</Text>
        </View>
        
        {renderProfileInfo()}
        {renderMenuOptions()}
        
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.error }]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 