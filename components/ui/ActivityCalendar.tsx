import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useThemeColor } from '@/constants/Colors';

// Define types for activities
export type ActivityType = 'kunjungan' | 'verifikasi' | 'lainnya' | 'logbook';

export type Activity = {
  id: string;
  title: string;
  date: string; // Format: 'YYYY-MM-DD'
  type: ActivityType;
  location?: string;
  time?: string;
  status?: 'pending' | 'completed' | 'cancelled';
};

type ActivityCalendarProps = {
  activities: Activity[];
  onSelectDate?: (date: string) => void;
  onSelectActivity?: (activity: Activity) => void;
};

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  activities,
  onSelectDate,
  onSelectActivity,
}) => {
  const colors = useThemeColor();
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Create marked dates object for calendar
  const getMarkedDates = () => {
    const markedDates: any = {};
    
    activities.forEach(activity => {
      // Define dot color based on activity type
      const dotColor = activity.type === 'kunjungan' 
        ? colors.tint 
        : activity.type === 'verifikasi'
        ? colors.success
        : colors.warning;
      
      if (markedDates[activity.date]) {
        // Add another dot if date already exists
        markedDates[activity.date].dots.push({
          key: activity.id,
          color: dotColor,
        });
      } else {
        // Create new entry
        markedDates[activity.date] = {
          dots: [{
            key: activity.id,
            color: dotColor,
          }],
        };
      }
      
      // Add selected state
      if (activity.date === selectedDate) {
        markedDates[activity.date] = {
          ...markedDates[activity.date],
          selected: true,
          selectedColor: colors.tint + '40', // Add transparency
        };
      }
    });
    
    return markedDates;
  };
  
  // Get activities for selected date
  const getActivitiesForDate = (date: string) => {
    return activities.filter(activity => activity.date === date);
  };
  
  // Handle date selection
  const handleDateSelect = (day: any) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
    if (onSelectDate) {
      onSelectDate(dateString);
    }
  };
  
  // Get status style
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: colors.success + '20', borderColor: colors.success };
      case 'cancelled':
        return { backgroundColor: colors.error + '20', borderColor: colors.error };
      case 'pending':
      default:
        return { backgroundColor: colors.warning + '20', borderColor: colors.warning };
    }
  };
  
  // Get text for time of activity
  const getActivityTimeText = (activity: Activity) => {
    if (!activity.time) return '';
    return activity.time;
  };
  
  return (
    <View style={styles.container}>
      <Calendar
        markedDates={getMarkedDates()}
        onDayPress={handleDateSelect}
        markingType={'multi-dot'}
        theme={{
          calendarBackground: colors.background,
          textSectionTitleColor: colors.text,
          selectedDayBackgroundColor: colors.tint,
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.tint,
          dayTextColor: colors.text,
          textDisabledColor: colors.tabIconDefault,
          dotColor: colors.tint,
          monthTextColor: colors.text,
          arrowColor: colors.tint,
          indicatorColor: colors.tint,
        }}
      />
      
      {selectedDate && (
        <View style={styles.activitiesContainer}>
          <Text style={[styles.dateTitle, { color: colors.text }]}>
            Aktivitas pada {selectedDate}
          </Text>
          <ScrollView style={styles.activitiesList}>
            {getActivitiesForDate(selectedDate).length > 0 ? (
              getActivitiesForDate(selectedDate).map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    getStatusStyle(activity.status),
                    { borderWidth: 1 }
                  ]}
                  onPress={() => onSelectActivity && onSelectActivity(activity)}
                >
                  <Text style={[styles.activityTitle, { color: colors.text }]}>
                    {activity.title}
                  </Text>
                  
                  {activity.location && (
                    <Text style={[styles.activityDetails, { color: colors.icon }]}>
                      📍 {activity.location}
                    </Text>
                  )}
                  
                  {activity.time && (
                    <Text style={[styles.activityDetails, { color: colors.icon }]}>
                      🕒 {getActivityTimeText(activity)}
                    </Text>
                  )}
                  
                  {activity.status && (
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusStyle(activity.status).borderColor }
                    ]}>
                      <Text style={styles.statusText}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noActivities, { color: colors.icon }]}>
                Tidak ada aktivitas pada tanggal ini
              </Text>
            )}
          </ScrollView>
        </View>
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
  activitiesContainer: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  activitiesList: {
    maxHeight: 250,
  },
  activityItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  noActivities: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default ActivityCalendar; 