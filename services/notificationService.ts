import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  private static expoPushToken: string | null = null;

  // Initialize notification service
  static async initialize(): Promise<string | null> {
    try {
      // Request permissions
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

      // Get push token for real device
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        this.expoPushToken = token.data;
        console.log('Expo Push Token:', token.data);
        return token.data;
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

      // Send push token to your backend using API service
      const response = await api.registerDeviceForNotifications(
        token,
        pushToken,
        userId,
        Platform.OS === "android" ? "android" : "ios"
      );

      return response.success;
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
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