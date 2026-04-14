/**
 * Reminder Banner Component
 *
 * Displays in-app reminders for due today, overdue, and expiring documents.
 * Uses user preferences to show/hide; dismissible.
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/colors';

const ReminderBanner = ({
  dueTodayCount = 0,
  overdueCount = 0,
  expiringCount = 0,
  preferences = {},
  onDismiss = () => {},
  onNavigate = () => {},
}) => {
  const { colors } = useTheme();

  // Determine which reminders are active and enabled
  const activeReminders = useMemo(() => {
    const reminders = [];

    const {
      reminders: {
        dueTodayEnabled = true,
        overdueEnabled = true,
        expiringDocumentsEnabled = true,
      } = {},
    } = preferences;

    if (overdueCount > 0 && overdueEnabled) {
      reminders.push({
        id: 'overdue',
        severity: 'critical',
        icon: 'alert-circle',
        title: `${overdueCount} Overdue Item${overdueCount === 1 ? '' : 's'}`,
        message: 'Requires immediate attention',
        color: COLORS.error,
        action: 'overdue',
      });
    }

    if (expiringCount > 0 && expiringDocumentsEnabled) {
      reminders.push({
        id: 'expiring',
        severity: 'warning',
        icon: 'calendar-alert',
        title: `${expiringCount} Document${expiringCount === 1 ? '' : 's'} Expiring Soon`,
        message: 'Renew within 30 days',
        color: COLORS.warning,
        action: 'expiring',
      });
    }

    if (dueTodayCount > 0 && dueTodayEnabled) {
      reminders.push({
        id: 'dueToday',
        severity: 'info',
        icon: 'checkbox-marked-circle-outline',
        title: `${dueTodayCount} Due Today`,
        message: 'Complete your compliance tasks',
        color: COLORS.primary,
        action: 'dueToday',
      });
    }

    return reminders;
  }, [dueTodayCount, overdueCount, expiringCount, preferences]);

  const handleDismiss = useCallback(
    (reminderId) => {
      onDismiss(reminderId);
    },
    [onDismiss]
  );

  const handleNavigate = useCallback(
    (action) => {
      onNavigate(action);
    },
    [onNavigate]
  );

  if (activeReminders.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {activeReminders.map((reminder) => (
          <TouchableOpacity
            key={reminder.id}
            style={[
              styles.banner,
              {
                backgroundColor: `${reminder.color}12`,
                borderColor: reminder.color,
                borderLeftColor: reminder.color,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => handleNavigate(reminder.action)}
            accessible
            accessibilityLabel={`Reminder: ${reminder.title}`}
            accessibilityRole="button"
            accessibilityHint={reminder.message}
          >
            <View style={styles.bannerContent}>
              <View style={[styles.iconWrap, { backgroundColor: `${reminder.color}20` }]}>
                <MaterialCommunityIcons name={reminder.icon} size={20} color={reminder.color} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.bannerTitle, { color: reminder.color }]}>
                  {reminder.title}
                </Text>
                <Text style={[styles.bannerMessage, { color: colors.textSecondary || colors.text?.secondary }]}>
                  {reminder.message}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => handleDismiss(reminder.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible
              accessibilityLabel={`Dismiss ${reminder.title}`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="close" size={18} color={reminder.color} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  banner: {
    minWidth: 320,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerMessage: {
    fontSize: 12,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ReminderBanner;
