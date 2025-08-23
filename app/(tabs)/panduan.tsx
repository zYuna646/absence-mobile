import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { API_FILE_URL } from '@/constants/Config';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/constants/Colors';
import Card from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { api, FileData } from '@/services/api';
import { useUser } from '@/context/UserContext';
import { useNotification } from '@/context/NotificationContext';

export default function PanduanScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const { token } = useUser();
  const { showNotification } = useNotification();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch guide files from API
  const fetchFiles = async () => {
    try {
      setError(null);
      
      const response = await api.getFiles(token || undefined);
      
      if (response.success && response.data) {
        setFiles(response.data);
      } else {
        setError(response.message || 'Failed to fetch guide files');
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('An error occurred while fetching guide files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchFiles();
  }, [token]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  // Handle retry button click
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchFiles();
  };

  // View PDF file
  const handleViewFile = async (file: FileData) => {
    try {
      // Navigate to PDF viewer screen
      router.push({
        pathname: '/panduan-view',
        params: {
          filePath: file.file,
          fileName: file.name,
        },
      });
      
      // Show notification that viewing has started
      await showNotification({
        title: 'Membuka File',
        message: `Membuka "${file.name}"`,
      });
    } catch (err) {
      console.error('Error viewing file:', err);
      alert('Failed to open file. Please try again later.');
    }
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Memuat panduan...
            </Text>
          </View>
        ) : error ? (
          <Card title="Error">
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.text }]}>
                {error}
              </Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.tint }]}
                onPress={handleRetry}
              >
                <Text style={[styles.retryButtonText, { color: colors.tabIconSelected }]}>
                  Coba Lagi
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : files.length === 0 ? (
          <Card title="Tidak Ada Dokumen">
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Belum ada dokumen panduan
              </Text>
            </View>
          </Card>
        ) : (
          files.map((file) => (
            <TouchableOpacity
              key={file.id}
              style={[styles.fileItem, { backgroundColor: colors.background }]}
              onPress={() => handleViewFile(file)}
            >
              <View style={styles.fileContent}>
                <View style={[styles.fileIconContainer, { backgroundColor: colors.tint + '20' }]}>
                  <MaterialIcons name="picture-as-pdf" size={24} color={colors.tint} />
                </View>
                <View style={styles.fileTextContent}>
                  <Text style={[styles.fileName, { color: colors.text }]}>
                    {file.name}
                  </Text>
                  <Text style={[styles.fileDate, { color: colors.icon }]}>
                    {file.stace.name}
                  </Text>
                  <Text style={[styles.fileDate, { color: colors.icon }]}>
                    Ditambahkan pada {formatDate(file.created_at)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.viewButton, { backgroundColor: colors.tint }]}
                  onPress={() => handleViewFile(file)}
                >
                  <Ionicons name="document-text-outline" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 0,
  },
  fileItem: {
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileTextContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileDate: {
    fontSize: 12,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
}); 