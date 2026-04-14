/**
 * Staff Management Screen (Placeholder)
 *
 * Future home for staff invite, role assignment, and team oversight.
 * Currently shows "Coming soon" placeholder.
 * Only visible to owner-level users.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/common/Header';
import { COLORS } from '../constants/colors';

const StaffScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          accessible
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text?.primary || colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text?.primary || colors.text }]}>
          Team Management
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: `${COLORS.primary}18` }]}>
              <MaterialCommunityIcons name="account-multiple-plus-outline" size={48} color={COLORS.primary} />
            </View>

            <Text style={[styles.title, { color: colors.text?.primary || colors.text }]}>
              Staff Management
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary || colors.text?.secondary }]}>
              Coming Soon
            </Text>

            <Text style={[styles.description, { color: colors.text?.primary || colors.text }]}>
              Invite team members to your compliance operations, assign roles, and manage permissions all from one place.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color={colors.textSecondary || colors.text?.secondary}
                  style={{ marginRight: 10, opacity: 0.5 }}
                />
                <Text style={[styles.featureText, { color: colors.textSecondary || colors.text?.secondary, opacity: 0.7 }]}>
                  Send staff invites via email link
                </Text>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color={colors.textSecondary || colors.text?.secondary}
                  style={{ marginRight: 10, opacity: 0.5 }}
                />
                <Text style={[styles.featureText, { color: colors.textSecondary || colors.text?.secondary, opacity: 0.7 }]}>
                  Assign roles (Owner, Staff, Viewer)
                </Text>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color={colors.textSecondary || colors.text?.secondary}
                  style={{ marginRight: 10, opacity: 0.5 }}
                />
                <Text style={[styles.featureText, { color: colors.textSecondary || colors.text?.secondary, opacity: 0.7 }]}>
                  View team activity and assignments
                </Text>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color={colors.textSecondary || colors.text?.secondary}
                  style={{ marginRight: 10, opacity: 0.5 }}
                />
                <Text style={[styles.featureText, { color: colors.textSecondary || colors.text?.secondary, opacity: 0.7 }]}>
                  Remove or suspend team members
                </Text>
              </View>
            </View>

            <View style={[styles.banner, { backgroundColor: `${COLORS.info}12`, borderColor: `${COLORS.info}30` }]}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={COLORS.info} />
              <Text style={[styles.bannerText, { color: colors.text?.primary || colors.text }]}>
                This feature is in development. Currently, only you can use this app. Future updates will enable team collaboration.
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: `${COLORS.success}08`, borderColor: `${COLORS.success}30` }]}>
            <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.success} />
            <Text style={[styles.infoText, { color: colors.text?.primary || colors.text }]}>
              In the meantime, you can manage your compliance checklist and documents independently. Staff access will be enabled in a future update.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});

export default StaffScreen;
