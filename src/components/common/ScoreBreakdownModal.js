/**
 * Score Breakdown Modal Component
 *
 * Displays compliance score v2 details with breakdown of factors
 * and a disclaimer that score is not legal advice.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { GLASS } from '../../utils/glassmorphism';
import { getScoreDescription } from '../../utils/complianceScore';

const ScoreBreakdownModal = ({ visible, scoreData, onClose }) => {
  const { colors } = useTheme();
  const useGlass = colors.glassBackground != null;
  const glassColors = colors.glassBackground
    ? {
        background: colors.glassBackground,
        border: colors.glassBorder,
      }
    : GLASS;

  if (!scoreData) return null;

  const { score, factors, checklistCompletion, overduePenalty, expiryPenalty, mediaBonus } = scoreData;
  const description = getScoreDescription(score);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {useGlass && Platform.OS === 'ios' && (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: useGlass && Platform.OS === 'android' ? glassColors.background : COLORS.surface,
              borderColor: useGlass ? glassColors.border : COLORS.border,
              borderWidth: useGlass ? 1 : 0,
            },
          ]}
        >
          {useGlass && Platform.OS === 'ios' && (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: COLORS.text }]}>Compliance Score Breakdown</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Score Card */}
              <View style={[styles.scoreCard, { backgroundColor: `${description.color}18`, borderColor: description.color }]}>
                <View style={styles.scoreCardHeader}>
                  <View>
                    <Text style={[styles.scoreCardLabel, { color: description.color }]}>Your Score</Text>
                    <Text style={[styles.scoreCardValue, { color: description.color }]}>{score}/100</Text>
                  </View>
                  <View style={[styles.scoreIconWrap, { backgroundColor: description.color }]}>
                    <MaterialCommunityIcons name="shield-check" size={32} color={COLORS.textInverse} />
                  </View>
                </View>
                <Text style={[styles.scoreCardTitle, { color: COLORS.text }]}>{description.label}</Text>
                <Text style={[styles.scoreCardDescription, { color: COLORS.textSecondary }]}>{description.description}</Text>
              </View>

              {/* Factors */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Score Factors</Text>

                {/* Checklist Completion */}
                <View style={styles.factorRow}>
                  <View style={styles.factorLabel}>
                    <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={COLORS.primary} />
                    <View style={styles.factorLabelText}>
                      <Text style={[styles.factorName, { color: COLORS.text }]}>Checklist Completion</Text>
                      <Text style={[styles.factorDetail, { color: COLORS.textSecondary }]}>
                        {factors.completedChecklistItems} of {factors.totalChecklistItems} completed
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.factorValue, { color: COLORS.primary }]}>+{checklistCompletion}%</Text>
                </View>

                {/* Overdue Penalty */}
                {overduePenalty > 0 && (
                  <View style={styles.factorRow}>
                    <View style={styles.factorLabel}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.error} />
                      <View style={styles.factorLabelText}>
                        <Text style={[styles.factorName, { color: COLORS.text }]}>Overdue Items</Text>
                        <Text style={[styles.factorDetail, { color: COLORS.textSecondary }]}>
                          {factors.overdueCount} item{factors.overdueCount === 1 ? '' : 's'} past due
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.factorValue, { color: COLORS.error }]}>-{overduePenalty}%</Text>
                  </View>
                )}

                {/* Expiring/Expired Documents */}
                {expiryPenalty > 0 && (
                  <View style={styles.factorRow}>
                    <View style={styles.factorLabel}>
                      <MaterialCommunityIcons name="calendar-alert-outline" size={20} color={COLORS.warning} />
                      <View style={styles.factorLabelText}>
                        <Text style={[styles.factorName, { color: COLORS.text }]}>Document Expiry</Text>
                        <Text style={[styles.factorDetail, { color: COLORS.textSecondary }]}>
                          {factors.expiringCount} expiring, {factors.expiredCount} expired
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.factorValue, { color: COLORS.warning }]}>-{expiryPenalty}%</Text>
                  </View>
                )}

                {/* Media Activity Bonus */}
                {mediaBonus > 0 && (
                  <View style={styles.factorRow}>
                    <View style={styles.factorLabel}>
                      <MaterialCommunityIcons name="image-multiple-outline" size={20} color={COLORS.success} />
                      <View style={styles.factorLabelText}>
                        <Text style={[styles.factorName, { color: COLORS.text }]}>Recent Activity</Text>
                        <Text style={[styles.factorDetail, { color: COLORS.textSecondary }]}>
                          {factors.recentMediaLogsCount} photo/video log{factors.recentMediaLogsCount === 1 ? '' : 's'} (7 days)
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.factorValue, { color: COLORS.success }]}>+{mediaBonus}%</Text>
                  </View>
                )}
              </View>

              {/* Disclaimer */}
              <View style={[styles.disclaimerCard, { backgroundColor: `${COLORS.warning}12`, borderColor: `${COLORS.warning}40` }]}>
                <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.warning} style={styles.disclaimerIcon} />
                <View style={styles.disclaimerText}>
                  <Text style={[styles.disclaimerTitle, { color: COLORS.warning }]}>Important</Text>
                  <Text style={[styles.disclaimerContent, { color: COLORS.text }]}>
                    This score is a readiness indicator based on your compliance checklist and documentation. It is not legal advice and does not constitute actual regulatory compliance. Please consult with local health and safety authorities for definitive compliance requirements.
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity style={styles.closeActionButton} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeActionButtonText}>Got it</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  scoreCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scoreCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreCardValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreCardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  factorLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factorLabelText: {
    flex: 1,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  factorDetail: {
    fontSize: 12,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
  },
  disclaimerCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    flexDirection: 'row',
  },
  disclaimerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  disclaimerContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeActionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  closeActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
});

export default ScoreBreakdownModal;
