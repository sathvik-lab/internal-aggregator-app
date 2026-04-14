import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const shouldShowDocumentExpiryBanner = (
  { expiringCount = 0, expiredCount = 0 } = {},
  preferences = {}
) => {
  if (expiringCount <= 0 && expiredCount <= 0) return false;
  const dismissedAt = parseDate(preferences?.lastDismissed?.documentExpiry);
  if (!dismissedAt) return true;
  return Date.now() - dismissedAt.getTime() >= DAY_MS;
};

const DocumentExpiryBanner = ({
  expiringCount = 0,
  expiredCount = 0,
  onOpenDocuments = () => {},
  onDismiss = () => {},
}) => {
  const { colors } = useTheme();

  const hasExpired = expiredCount > 0;
  const accent = hasExpired ? colors.error : colors.warning;
  const title = hasExpired
    ? `${expiredCount} document${expiredCount === 1 ? '' : 's'} expired`
    : `${expiringCount} document${expiringCount === 1 ? '' : 's'} expiring soon`;
  const subtitle = hasExpired
    ? `Review expired docs now.${expiringCount > 0 ? ` ${expiringCount} more expiring soon.` : ''}`
    : 'Renew expiring documents within 30 days.';

  return (
    <View style={[styles.banner, { backgroundColor: `${accent}12`, borderColor: accent }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons name={hasExpired ? 'alert-circle' : 'calendar-alert'} size={20} color={accent} />
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: accent }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary || colors.text?.secondary }]}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: accent }]}
          onPress={onOpenDocuments}
          accessibilityRole="button"
          accessibilityLabel="Open documents to review expiring or expired files"
        >
          <Text style={[styles.actionText, { color: accent }]}>Review</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss document expiry banner for now"
        >
          <MaterialCommunityIcons name="close" size={18} color={accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    minHeight: 34,
    minWidth: 34,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DocumentExpiryBanner;
