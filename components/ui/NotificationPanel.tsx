import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useThemeColor } from '@/constants/Colors';

export type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'info' | 'warning' | 'success' | 'error';
};

type NotificationPanelProps = {
  notifications: Notification[];
  onNotificationPress?: (notification: Notification) => void;
  onMarkAllAsRead?: () => void;
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onNotificationPress,
  onMarkAllAsRead,
}) => {
  const colors = useThemeColor();
  
  // Get icon based on notification type
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };
  
  // Get unread count
  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Notifikasi</Text>
        {getUnreadCount() > 0 && (
          <TouchableOpacity 
            style={[styles.markAllButton, { borderColor: colors.tint }]} 
            onPress={onMarkAllAsRead}
          >
            <Text style={[styles.markAllText, { color: colors.tint }]}>
              Tandai Semua Dibaca
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            Tidak ada notifikasi
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.notificationList}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                { backgroundColor: notification.read ? colors.background : colors.tint + '10' },
              ]}
              onPress={() => onNotificationPress && onNotificationPress(notification)}
            >
              <View style={styles.notificationContent}>
                <Text style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </Text>
                <View style={styles.notificationTextContent}>
                  <Text style={[styles.notificationTitle, { color: colors.text }]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationMessage, { color: colors.icon }]}>
                    {notification.message}
                  </Text>
                  <Text style={[styles.notificationTime, { color: colors.icon }]}>
                    {notification.time}
                  </Text>
                </View>
                {!notification.read && (
                  <View style={[styles.unreadIndicator, { backgroundColor: colors.tint }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  markAllButton: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  notificationList: {
    maxHeight: 300,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  notificationTextContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
});

export default NotificationPanel; 