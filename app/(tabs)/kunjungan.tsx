import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/context/UserContext';

export default function KunjunganScreen() {
  const colorScheme = useColorScheme();
  const { role, userInfo } = useUser();
  const theme = Colors[colorScheme ?? 'light'];

  // Render content based on role
  const renderRoleContent = () => {
    switch (role) {
      case 'mahasiswa':
        return (
          <View style={styles.roleContent}>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
              Mahasiswa dapat melihat jadwal kunjungan ke perusahaan/institusi
            </Text>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Kunjungan Terjadwal</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>PT. Teknologi Indonesia</Text>
              <Text style={[styles.cardContent, { color: theme.icon }]}>Kamis, 20 Juli 2023 - 09:00 WIB</Text>
              <Text style={[styles.cardStatus, { color: theme.tint }]}>Belum Diverifikasi</Text>
            </View>
          </View>
        );
      case 'dosen':
        return (
          <View style={styles.roleContent}>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
              Dosen dapat mengelola kunjungan mahasiswa dan melakukan verifikasi
            </Text>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Kunjungan Mahasiswa Bimbingan</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>Ahmad Rizki - 190511001</Text>
              <Text style={[styles.cardContent, { color: theme.icon }]}>PT. Teknologi Indonesia</Text>
              <Text style={[styles.cardContent, { color: theme.icon }]}>Kamis, 20 Juli 2023 - 09:00 WIB</Text>
              <Text style={[styles.cardStatus, { color: '#f59e0b' }]}>Menunggu Verifikasi</Text>
            </View>
          </View>
        );
      case 'kaprodi':
        return (
          <View style={styles.roleContent}>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
              Kaprodi dapat memonitor semua kunjungan dan melihat laporan
            </Text>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Statistik Kunjungan</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>Total Kunjungan: 42</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>Terverifikasi: 35</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>Menunggu Verifikasi: 7</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Kunjungan</Text>
          <Text style={[styles.welcome, { color: theme.icon }]}>
            Halo, {userInfo?.name || ''}
          </Text>
        </View>
        {renderRoleContent()}
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
  welcome: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  roleContent: {
    marginTop: 10,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});