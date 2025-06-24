import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

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
    const [downloading, setDownloading] = useState<number | null>(null);
  
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

  // Download and share a file
  const handleDownload = async (id: number, fileName: string) => {
    try {
      setDownloading(id);
      
      // Get download URL from API
      const downloadUrl = api.getFileDownloadUrl(id);
      
      // Create local file path with proper extension and sanitized name
      const fileExt = fileName.split('.').pop() || 'pdf';
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const localUri = FileSystem.documentDirectory + sanitizedFileName;
      
      // Make POST request to download file
      console.log(downloadUrl);
      
      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

             if (response.ok) {
         // Get the response as array buffer for proper binary handling
         const arrayBuffer = await response.arrayBuffer();
         
         // Convert array buffer to base64
         const bytes = new Uint8Array(arrayBuffer);
         let binary = '';
         for (let i = 0; i < bytes.byteLength; i++) {
           binary += String.fromCharCode(bytes[i]);
         }
         const base64 = btoa(binary);
         
                  // Write file to local storage
         await FileSystem.writeAsStringAsync(localUri, base64, {
           encoding: FileSystem.EncodingType.Base64,
         });
         
         // Show notification with file location
         await showNotification({
           title: 'Download Selesai',
           message: `File "${fileName}" berhasil diunduh. Tap untuk buka lokasi file.`,
           data: { 
             type: 'file_download',
             filePath: localUri 
           },
         });
       } else {
         throw new Error(`Download failed with status: ${response.status}`);
       }
     } catch (err) {
       console.error('Error downloading file:', err);
       alert('Failed to download file. Please try again later.');
     } finally {
       setDownloading(null);
     }
  };

  // Get MIME type based on file extension
  const getMimeType = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'txt':
        return 'text/plain';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
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
              onPress={() => handleDownload(file.id, file.name)}
              disabled={downloading === file.id}
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
                    Ditambahkan pada {formatDate(file.created_at)}
                  </Text>
                </View>
                {downloading === file.id ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <TouchableOpacity 
                    style={[styles.downloadButton, { backgroundColor: colors.tint }]}
                    onPress={() => handleDownload(file.id, file.name)}
                  >
                    <Ionicons name="download-outline" size={18} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        
        {/* <Card title="Tentang Dokumen">
          <Text style={[styles.aboutText, { color: colors.text }]}>
            Dokumen panduan disediakan untuk membantu pengguna memahami proses dan prosedur dalam aplikasi. 
            Silakan unduh dokumen yang diperlukan dengan menekan tombol unduh.
          </Text>
          <Text style={[styles.aboutText, { color: colors.text, marginTop: 10 }]}>
            Jika Anda memerlukan bantuan lebih lanjut, hubungi administrator.
          </Text>
        </Card> */}
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
  downloadButton: {
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
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 