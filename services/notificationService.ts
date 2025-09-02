import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { FCM_CONFIG } from '../constants/Config';
import messaging from '@react-native-firebase/messaging';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Create Android notification channel for FCM
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync(FCM_CONFIG.androidChannelId, {
    name: FCM_CONFIG.androidChannelName,
    description: FCM_CONFIG.androidChannelDescription,
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });  
}

export interface NotificationData {
  title: string;
  message: string;
  data?: any;
}

// Firebase initialization is handled by @react-native-firebase/messaging
// No need to initialize Firebase web SDK

export class NotificationService {
  private static expoPushToken: string | null = null;
  private static fcmToken: string | null = null;

  // Initialize notification service
  static async initialize(): Promise<string | null> {
    try {
      // Request permissions for Expo notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return null;
      }

      // Request permissions for Firebase Cloud Messaging
      if (Platform.OS === 'ios') {
        // iOS requires additional permission for FCM
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('FCM permissions not granted on iOS');
        }
      }

      // Set up Android notification channel for FCM
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(FCM_CONFIG.androidChannelId, {
          name: FCM_CONFIG.androidChannelName,
          description: FCM_CONFIG.androidChannelDescription,
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Get push tokens for real device
      if (Device.isDevice) {
        // Get Expo Push Token
        const expoToken = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        this.expoPushToken = expoToken.data;
        console.log('Expo Push Token:', expoToken.data);

        // Get FCM Token
        try {
          const fcmToken = await messaging().getToken();
          if (fcmToken) {
            this.fcmToken = fcmToken;
            console.log('FCM Token:', fcmToken);
          }
        } catch (fcmError) {
          console.error('Error getting FCM token:', fcmError);
        }

        // Return Expo token for backward compatibility
        return this.expoPushToken;
      } else {
        console.log('Must use physical device for Push Notifications');
        return null;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  // Get current push token
  static getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Get current FCM token
  static getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Show local notification
  static async showLocalNotification(data: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: data.data || {},
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  // Register device for push notifications
  static async registerDevice(token: string, userId: string): Promise<boolean> {
    try {
      const pushToken = await this.initialize();
      if (!pushToken) {
        return false;
      }

      // Set up FCM message handlers
      this.setupFCMListeners();

      // Send push token to your backend using API service
      const response = await api.registerDeviceForNotifications(
        token,
        pushToken,
        userId,
        Platform.OS === "android" ? "android" : "ios",
        this.fcmToken // Send FCM token as well if available
      );

      return response.success;
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
  }

  // Set up Firebase Cloud Messaging listeners
  private static setupFCMListeners() {
    // Handle FCM messages when app is in foreground
    messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);
      
      // Convert FCM message to local notification
      if (remoteMessage.notification) {
        await this.showLocalNotification({
          title: remoteMessage.notification.title || 'New Notification',
          message: remoteMessage.notification.body || '',
          data: remoteMessage.data
        });
      }
    });

    // Set background message handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('FCM Message handled in the background:', remoteMessage);
      return Promise.resolve();
    });

    // Handle notification open events
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('FCM Notification opened app from background state:', remoteMessage);
    });

    // Check if app was opened from a notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('FCM Notification opened app from quit state:', remoteMessage);
      }
    });
  }

  // Handle notification received while app is in foreground
  static addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Handle notification tapped
  static addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Clear all notifications
  static async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Set notification badge count
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Utility function for web integration testing
  static async sendTestNotificationFromWeb(
    adminToken: string,
    title: string,
    message: string,
    userId?: string,
    notificationType: string = 'test'
  ): Promise<boolean> {
    try {
      const response = await api.sendNotification(adminToken, {
        title,
        message,
        user_id: userId,
        data: {
          type: notificationType,
          sent_from: 'mobile_app_test',
          timestamp: new Date().toISOString()
        }
      });

      return response.success;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  // Get notification history for debugging
  static async getNotificationHistory(token: string, userId?: string): Promise<any> {
    try {
      const response = await api.getNotificationHistory(token, userId);
      return response.data;
    } catch (error) {
      console.error('Error getting notification history:', error);
      return null;
    }
  }
}