import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/context/UserContext';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const { role, userInfo } = useUser();
  const theme = Colors[colorScheme ?? 'light'];

  // Render content based on role
  const renderRoleContent = () => {
    switch (role) {
      case 'mahasiswa':
        return (
          <View style={styles.roleContent}>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Ringkasan Aktivitas</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>2</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Kunjungan</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>1</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Terverifikasi</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>1</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Menunggu</Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Kunjungan Terdekat</Text>
              <Text style={[styles.upcomingTitle, { color: theme.text }]}>PT. Teknologi Indonesia</Text>
              <Text style={[styles.upcomingDetails, { color: theme.icon }]}>Kamis, 20 Juli 2023 - 09:00 WIB</Text>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(10, 126, 164, 0.1)' }]}>
                <Text style={[styles.statusText, { color: theme.tint }]}>Menunggu Verifikasi</Text>
              </View>
            </View>
          </View>
        );
      case 'dosen':
        return (
          <View style={styles.roleContent}>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Ringkasan Aktivitas</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>12</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Mahasiswa</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>25</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Kunjungan</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>5</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Menunggu</Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Verifikasi Tertunda</Text>
              <View style={styles.pendingItem}>
                <Text style={[styles.pendingName, { color: theme.text }]}>Ahmad Rizki - 190511001</Text>
                <Text style={[styles.pendingDetails, { color: theme.icon }]}>PT. Teknologi Indonesia</Text>
                <Text style={[styles.pendingDate, { color: theme.icon }]}>20 Juli 2023</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.pendingItem}>
                <Text style={[styles.pendingName, { color: theme.text }]}>Budi Santoso - 190511002</Text>
                <Text style={[styles.pendingDetails, { color: theme.icon }]}>PT. Maju Bersama</Text>
                <Text style={[styles.pendingDate, { color: theme.icon }]}>22 Juli 2023</Text>
              </View>
            </View>
          </View>
        );
      case 'kaprodi':
        return (
          <View style={styles.roleContent}>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Statistik Program Studi</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>120</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Mahasiswa</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>15</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Dosen</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>42</Text>
                  <Text style={[styles.statLabel, { color: theme.icon }]}>Kunjungan</Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Aktivitas Terbaru</Text>
              <View style={styles.activityItem}>
                <Text style={[styles.activityText, { color: theme.text }]}>
                  <Text style={{ fontWeight: 'bold' }}>Dr. Ahmad Surya</Text> memverifikasi kunjungan mahasiswa
                </Text>
                <Text style={[styles.activityTime, { color: theme.icon }]}>1 jam yang lalu</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.activityItem}>
                <Text style={[styles.activityText, { color: theme.text }]}>
                  <Text style={{ fontWeight: 'bold' }}>3 mahasiswa</Text> menambahkan kunjungan baru
                </Text>
                <Text style={[styles.activityTime, { color: theme.icon }]}>3 jam yang lalu</Text>
              </View>
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
          <Text style={[styles.welcome, { color: theme.icon }]}>
            Selamat datang,
          </Text>
          <Text style={[styles.name, { color: theme.text }]}>
            {userInfo?.name || 'User'}
          </Text>
          <Text style={[styles.roleText, { color: theme.tint }]}>
            {role === 'mahasiswa' ? 'Mahasiswa' : role === 'dosen' ? 'Dosen' : 'Kepala Program Studi'}
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
  welcome: {
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    marginTop: 4,
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
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  upcomingDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingItem: {
    marginBottom: 12,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: '500',
  },
  pendingDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  pendingDate: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginVertical: 12,
  },
  activityItem: {
    marginBottom: 4,
  },
  activityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
});
