import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/context/UserContext';

export default function VerifikasiScreen() {
  const colorScheme = useColorScheme();
  const { role, userInfo } = useUser();
  const theme = Colors[colorScheme ?? 'light'];

  // Render content based on role
  const renderRoleContent = () => {
    switch (role) {
      case 'student':
        return (
          <View style={styles.roleContent}>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
              Status verifikasi kunjungan Anda
            </Text>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>PT. Teknologi Indonesia</Text>
              <Text style={[styles.cardContent, { color: theme.icon }]}>Kamis, 20 Juli 2023</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: '#f59e0b' }]} />
                <Text style={[styles.cardStatus, { color: theme.text }]}>Menunggu Verifikasi Dosen</Text>
              </View>
            </View>
            
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>PT. Maju Bersama</Text>
              <Text style={[styles.cardContent, { color: theme.icon }]}>Selasa, 15 Juli 2023</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: '#10b981' }]} />
                <Text style={[styles.cardStatus, { color: theme.text }]}>Terverifikasi</Text>
              </View>
            </View>
          </View>
        );
      case 'dosen':
        return (
          <View style={styles.roleContent}>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
              Verifikasi kunjungan mahasiswa bimbingan
            </Text>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Ahmad Rizki - 190511001</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>PT. Teknologi Indonesia</Text>
              <Text style={[styles.cardContent, { color: theme.icon }]}>Kamis, 20 Juli 2023</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.verifyButton, { backgroundColor: theme.tint }]}>
                  <Text style={styles.buttonText}>Verifikasi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.rejectButton, { borderColor: '#ef4444' }]}>
                  <Text style={[styles.rejectText, { color: '#ef4444' }]}>Tolak</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case 'kaprodi':
        return (
          <View style={styles.roleContent}>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
              Daftar kunjungan mahasiswa yang memerlukan persetujuan
            </Text>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Kunjungan Memerlukan Persetujuan</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>Total: 3 kunjungan</Text>
              <TouchableOpacity style={[styles.viewAllButton, { borderColor: theme.tint }]}>
                <Text style={[styles.viewAllText, { color: theme.tint }]}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2D2E' : '#F5F5F5' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Status Verifikasi</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>Terverifikasi: 35</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>Ditolak: 7</Text>
              <Text style={[styles.cardContent, { color: theme.text }]}>Menunggu: 3</Text>
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
          <Text style={[styles.title, { color: theme.text }]}>Verifikasi</Text>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  cardStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  verifyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  rejectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectText: {
    fontWeight: '500',
  },
  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  viewAllText: {
    fontWeight: '500',
  },
}); 