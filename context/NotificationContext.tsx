import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import { NotificationService, NotificationData } from '@/services/notificationService';
import { useUser } from './UserContext';
import { api } from '@/services/api';
import messaging from '@react-native-firebase/messaging';

interface NotificationContextType {
  pushToken: string | null;
  showNotification: (data: NotificationData) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  isInitialized: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { userInfo, token: authToken } = useUser();

  // Open file manager to file location
  const openFileManager = async (filePath: string) => {
    try {
      // Extract directory path from file path
      const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));
      
      // For Android, open file manager to Documents directory
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: 'content://com.android.externalstorage.documents/document/primary%3ADocuments',
        type: 'vnd.android.document/directory',
      });
    } catch (error) {
      console.log('Could not open file manager:', error);
      try {
        // Fallback: try to open generic file manager
        await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
          category: 'android.intent.category.APP_FILES',
        });
      } catch (fallbackError) {
        console.log('Could not open file manager fallback:', fallbackError);
        // Final fallback: show alert with file path
        alert(`File berhasil diunduh!\nLokasi: ${filePath}\n\nBuka File Manager untuk melihat file.`);
      }
    }
  };

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const obtainedPushToken = await NotificationService.initialize();
        setPushToken(obtainedPushToken);
        setIsInitialized(true);

        // Register device if user is logged in
        if (userInfo && authToken && obtainedPushToken) {
          await NotificationService.registerDevice(authToken, userInfo.id.toString());
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setIsInitialized(true);
      }
    };

    initializeNotifications();
  }, []);

  // Register device when user logs in
  useEffect(() => {
    const registerDevice = async () => {
      if (userInfo && authToken && pushToken) {
        await NotificationService.registerDevice(authToken, userInfo.id.toString());
      }
    };

    registerDevice();
  }, [userInfo, authToken, pushToken]);
  
  // Listen for FCM token changes
  useEffect(() => {
    const fcmTokenListener = messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      
      // Re-register device with new FCM token if user is logged in
      try {
        if (userInfo && authToken && pushToken && newToken) {
          // Register with notification service (for backward compatibility)
          await NotificationService.registerDevice(authToken, userInfo.id.toString());
          
          // Register with new endpoint if token is valid
          if (newToken) {
            await api.registerDevice(
              authToken,
              newToken,
              Platform.OS === "android" ? "android" : "ios"
            );
          }
        }
      } catch (e) {
        console.error('Failed to register refreshed FCM token:', e);
      }
    });
    
    return () => fcmTokenListener();
  }, [userInfo, authToken, pushToken]);

  // Handle notification received while app is in foreground
  useEffect(() => {
    const subscription = NotificationService.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      // You can customize how notifications are handled when app is in foreground
    });

    return () => subscription.remove();
  }, []);

  // Handle notification tapped
  useEffect(() => {
    const subscription = NotificationService.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const { data } = response.notification.request.content;
      
      // Handle different types of notifications based on data
      if (data?.type === 'file_download' && data?.filePath) {
        if (Platform.OS !== 'android') {
          console.log('File manager open is only supported on Android in this context');
          return;
        }
        // Handle file download notification tap
        openFileManager(data.filePath);
      } else if (data?.type === 'attendance_reminder') {
        // Navigate to attendance screen
      } else if (data?.type === 'verification_request') {
        // Navigate to verification screen
      }
      // Add more notification types as needed
    });

    return () => subscription.remove();
  }, []);

  const showNotification = async (data: NotificationData): Promise<void> => {
    await NotificationService.showLocalNotification(data);
  };

  const clearAllNotifications = async (): Promise<void> => {
    await NotificationService.clearAllNotifications();
  };

  const setBadgeCount = async (count: number): Promise<void> => {
    await NotificationService.setBadgeCount(count);
  };

  const value: NotificationContextType = {
    pushToken,
    showNotification,
    clearAllNotifications,
    setBadgeCount,
    isInitialized,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
