import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/context/UserContext';
import { useThemeColor } from '@/constants/Colors';

// Import reusable components
import Card from '@/components/ui/Card';
import StatisticRow from '@/components/ui/StatisticRow';
import StatusBadge from '@/components/ui/StatusBadge';
import ActivityItem from '@/components/ui/ActivityItem';
import ProfileHeader from '@/components/ui/ProfileHeader';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const { role, userInfo } = useUser();

  // Get formatted role text
  const getRoleText = () => {
    switch (role) {
      case 'mahasiswa': return 'Mahasiswa';
      case 'dosen': return 'Dosen';
      case 'kaprodi': return 'Kepala Program Studi';
      default: return role;
    }
  };

  // Render content based on role
  const renderRoleContent = () => {
    switch (role) {
      case 'mahasiswa':
        return (
          <View style={styles.roleContent}>
            <Card title="Ringkasan Aktivitas">
              <StatisticRow 
                items={[
                  { value: 2, label: 'Kunjungan' },
                  { value: 1, label: 'Terverifikasi' },
                  { value: 1, label: 'Menunggu' },
                ]}
              />
            </Card>
            
            <Card title="Kunjungan Terdekat">
              <Text style={[styles.upcomingTitle, { color: colors.text }]}>
                PT. Teknologi Indonesia
              </Text>
              <Text style={[styles.upcomingDetails, { color: colors.icon }]}>
                Kamis, 20 Juli 2023 - 09:00 WIB
              </Text>
              <StatusBadge status="pending" />
            </Card>
          </View>
        );
      case 'dosen':
        return (
          <View style={styles.roleContent}>
            <Card title="Ringkasan Aktivitas">
              <StatisticRow 
                items={[
                  { value: 12, label: 'Mahasiswa' },
                  { value: 25, label: 'Kunjungan' },
                  { value: 5, label: 'Menunggu' },
                ]}
              />
            </Card>
            
            <Card title="Verifikasi Tertunda">
              <ActivityItem
                title="Ahmad Rizki - 190511001"
                subtitle="PT. Teknologi Indonesia"
                timestamp="20 Juli 2023"
                showDivider={true}
              />
              <ActivityItem
                title="Budi Santoso - 190511002"
                subtitle="PT. Maju Bersama"
                timestamp="22 Juli 2023"
              />
            </Card>
          </View>
        );
      case 'kaprodi':
        return (
          <View style={styles.roleContent}>
            <Card title="Statistik Program Studi">
              <StatisticRow 
                items={[
                  { value: 120, label: 'Mahasiswa' },
                  { value: 15, label: 'Dosen' },
                  { value: 42, label: 'Kunjungan' },
                ]}
              />
            </Card>
            
            <Card title="Aktivitas Terbaru">
              <ActivityItem
                title={
                  <Text style={{ color: colors.text }}>
                    <Text style={{ fontWeight: 'bold' }}>Dr. Ahmad Surya</Text> memverifikasi kunjungan mahasiswa
                  </Text>
                }
                timestamp="1 jam yang lalu"
                showDivider={true}
              />
              <ActivityItem
                title={
                  <Text style={{ color: colors.text }}>
                    <Text style={{ fontWeight: 'bold' }}>3 mahasiswa</Text> menambahkan kunjungan baru
                  </Text>
                }
                timestamp="3 jam yang lalu"
              />
            </Card>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ProfileHeader 
          name={userInfo?.name || 'User'} 
          role={getRoleText()} 
        />
        
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
  roleContent: {
    marginTop: 10,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  upcomingDetails: {
    fontSize: 12,
    marginBottom: 8,
  },
});
