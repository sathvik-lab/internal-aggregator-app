/**
 * Inspection Readiness Screen
 *
 * Aggregates inspection readiness status with:
 * - Checklist completion summary
 * - Overdue items count
 * - Document expiry blockers
 * - Recent evidence count
 * - Severity-ordered issue list
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchDashboardSnapshot } from '../services/dashboard';
import { calculateComplianceScore, getScoreDescription } from '../utils/complianceScore';
import { shareReadinessSummary } from '../utils/readinessExport';
import Header from '../components/common/Header';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { ROUTES } from '../navigation/navigationConfig';
import { COLORS } from '../constants/colors';

const IssueCard = ({ issue, colors }) => {
  const severityColors = {
    critical: { bg: `${COLORS.error}12`, border: COLORS.error, text: COLORS.error, icon: 'alert-circle' },
    warning: { bg: `${COLORS.warning}12`, border: COLORS.warning, text: COLORS.warning, icon: 'alert' },
    info: { bg: `${COLORS.info}12`, border: COLORS.info, text: COLORS.info, icon: 'information' },
  };

  const severity = severityColors[issue.severity] || severityColors.info;

  return (
    <View style={[styles.issueCard, { backgroundColor: severity.bg, borderColor: severity.border, borderLeftWidth: 4 }]}>
      <View style={styles.issueHeader}>
        <MaterialCommunityIcons name={severity.icon} size={20} color={severity.text} />
        <Text style={[styles.issueSeverity, { color: severity.text }]}>{issue.severity.toUpperCase()}</Text>
      </View>
      <Text style={[styles.issueTitle, { color: colors.text?.primary || colors.text }]}>{issue.title}</Text>
      <Text style={[styles.issueDescription, { color: colors.textSecondary || colors.text?.secondary }]}>
        {issue.description}
      </Text>
    </View>
  );
};

const StatBlock = ({ icon, label, value, color, colors }) => (
  <View style={[styles.statBlock, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
    <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={[styles.statLabel, { color: colors.textSecondary || colors.text?.secondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text?.primary || colors.text }]}>{value}</Text>
    </View>
  </View>
);

const InspectionReadinessScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [scoreData, setScoreData] = useState(null);

  const loadReadiness = useCallback(async ({ showLoading = true } = {}) => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    const result = await fetchDashboardSnapshot(user.uid);

    if (result.error) {
      console.error('Error loading readiness:', result.error);
    } else if (result.data) {
      setDashboardData(result.data);

      const allChecklistItems = result.data.allChecklistItems || [];
      const scoreResult = calculateComplianceScore({
        checklistItems: allChecklistItems,
        overdueItems: result.data.overdueItems || [],
        expiringDocuments: result.data.expiringDocuments || [],
        expiredDocuments: result.data.expiredDocuments || [],
        mediaLogs: result.data.recentMediaLogs || [],
      });
      setScoreData(scoreResult);
    }

    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    loadReadiness({ showLoading: true });
  }, [loadReadiness]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReadiness({ showLoading: false });
    setRefreshing(false);
  }, [loadReadiness]);

  const issues = useMemo(() => {
    if (!dashboardData || !scoreData) return [];

    const issueList = [];

    // Critical: Expired documents
    if (dashboardData.expiredDocuments && dashboardData.expiredDocuments.length > 0) {
      issueList.push({
        severity: 'critical',
        title: `${dashboardData.expiredDocuments.length} Expired Document${dashboardData.expiredDocuments.length === 1 ? '' : 's'}`,
        description: `${dashboardData.expiredDocuments.length} compliance document${dashboardData.expiredDocuments.length === 1 ? ' has' : 's have'} expired. Renew immediately.`,
      });
    }

    // Critical: Overdue checklist items
    if (dashboardData.overdueItems && dashboardData.overdueItems.length > 0) {
      issueList.push({
        severity: 'critical',
        title: `${dashboardData.overdueItems.length} Overdue Checklist Item${dashboardData.overdueItems.length === 1 ? '' : 's'}`,
        description: `${dashboardData.overdueItems.length} item${dashboardData.overdueItems.length === 1 ? ' is' : 's are'} past due. Complete now to maintain readiness.`,
      });
    }

    // Warning: Expiring documents
    if (dashboardData.expiringDocuments && dashboardData.expiringDocuments.length > 0) {
      issueList.push({
        severity: 'warning',
        title: `${dashboardData.expiringDocuments.length} Document Expiring Soon`,
        description: `${dashboardData.expiringDocuments.length} document${dashboardData.expiringDocuments.length === 1 ? ' is' : 's are'} expiring within 30 days. Schedule renewal.`,
      });
    }

    // Warning: No documents
    if (!dashboardData.counts || dashboardData.counts.documents === 0) {
      issueList.push({
        severity: 'warning',
        title: 'No Compliance Documents',
        description: 'Upload required permits, licenses, and certifications to demonstrate readiness.',
      });
    }

    // Info: No recent media logs
    if (!dashboardData.recentMediaLogs || dashboardData.recentMediaLogs.length === 0) {
      issueList.push({
        severity: 'info',
        title: 'No Recent Evidence',
        description: 'Add a photo or video log to document recent compliance activity.',
      });
    }

    // Info: Low checklist completion
    if (scoreData && scoreData.factors && scoreData.factors.totalChecklistItems > 0) {
      const completionPct = Math.round((scoreData.factors.completedChecklistItems / scoreData.factors.totalChecklistItems) * 100);
      if (completionPct < 50) {
        issueList.push({
          severity: 'info',
          title: `${completionPct}% Checklists Complete`,
          description: 'Increase checklist completion to improve readiness score and demonstrate compliance effort.',
        });
      }
    }

    return issueList;
  }, [dashboardData, scoreData]);

  const handleChecklistPress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.CHECKLIST, { initialTab: 'today' });
  }, [navigation]);

  const handleDocumentsPress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.DOCUMENTS, { highlightExpiring: true });
  }, [navigation]);

  const handleMediaLogsPress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.MEDIA_LOGS, { initialRangeType: 'all' });
  }, [navigation]);

  const handleExportPress = useCallback(async () => {
    if (!dashboardData || !scoreData) {
      Alert.alert('Export', 'Readiness data not available. Please try again.');
      return;
    }

    try {
      await shareReadinessSummary(dashboardData, scoreData, {
        business_name: dashboardData.businessProfile?.business_name || 'Food Truck',
        state: dashboardData.businessProfile?.state || '',
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        Alert.alert('Export Error', 'Could not export readiness summary. Please try again.');
      }
    }
  }, [dashboardData, scoreData]);

  const scoreDescription = scoreData ? getScoreDescription(scoreData.score) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={Platform.OS === 'android' ? 20 : 0}
            progressBackgroundColor={colors.surface?.surface || colors.surface}
          />
        }
      >
        <View style={styles.content}>
          {loading ? (
            <>
              <LoadingSkeleton type="card" count={1} />
              <LoadingSkeleton type="list" count={4} />
            </>
          ) : (
            <>
              {/* Score Summary Card */}
              <View style={[styles.scoreCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
                <View style={styles.scoreCardHeader}>
                  <View>
                    <Text style={[styles.scoreEyebrow, { color: scoreDescription?.color }]}>Inspection Readiness</Text>
                    <View style={styles.scoreValueRow}>
                      <Text style={[styles.scoreValue, { color: scoreDescription?.color }]}>
                        {scoreData?.score || 0}%
                      </Text>
                      <Text style={[styles.scoreLabel, { color: scoreDescription?.color }]}>{scoreDescription?.label}</Text>
                    </View>
                  </View>
                  <View style={[styles.scoreIconWrap, { backgroundColor: `${scoreDescription?.color}18` }]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={32} color={scoreDescription?.color} />
                  </View>
                </View>
                <Text style={[styles.scoreDescription, { color: colors.text?.primary || colors.text }]}>
                  {scoreDescription?.description}
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <StatBlock
                  icon="checkbox-marked-circle-outline"
                  label="Completion"
                  value={`${scoreData?.checklistCompletion || 0}%`}
                  color={COLORS.primary}
                  colors={colors}
                />
                <StatBlock
                  icon="alert-circle-outline"
                  label="Overdue"
                  value={dashboardData?.counts?.overdue || 0}
                  color={COLORS.error}
                  colors={colors}
                />
                <StatBlock
                  icon="calendar-alert-outline"
                  label="Expiring Docs"
                  value={dashboardData?.counts?.expiringDocuments || 0}
                  color={COLORS.warning}
                  colors={colors}
                />
                <StatBlock
                  icon="image-multiple-outline"
                  label="Evidence"
                  value={dashboardData?.counts?.recentMediaLogs || 0}
                  color={COLORS.success}
                  colors={colors}
                />
              </View>

              {/* Issues Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text?.primary || colors.text }]}>
                  Readiness Blockers & Reminders
                </Text>
                {issues.length > 0 ? (
                  <>
                    {issues.map((issue, index) => (
                      <IssueCard key={index} issue={issue} colors={colors} />
                    ))}
                  </>
                ) : (
                  <View style={[styles.successCard, { backgroundColor: `${COLORS.success}12`, borderColor: COLORS.success }]}>
                    <MaterialCommunityIcons name="check-circle" size={32} color={COLORS.success} />
                    <Text style={[styles.successTitle, { color: COLORS.success }]}>All Clear</Text>
                    <Text style={[styles.successText, { color: colors.text?.primary || colors.text }]}>
                      No critical issues detected. You're in good shape for inspection.
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text?.primary || colors.text }]}>Quick Actions</Text>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${COLORS.primary}12` }]}
                  onPress={handleChecklistPress}
                  activeOpacity={0.8}
                  accessible
                  accessibilityLabel="Open checklist"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>Complete Checklist</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${COLORS.warning}12` }]}
                  onPress={handleDocumentsPress}
                  activeOpacity={0.8}
                  accessible
                  accessibilityLabel="Review documents"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.warning} />
                  <Text style={[styles.actionButtonText, { color: COLORS.warning }]}>Review Documents</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.warning} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${COLORS.success}12` }]}
                  onPress={handleMediaLogsPress}
                  activeOpacity={0.8}
                  accessible
                  accessibilityLabel="Add evidence"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="image-multiple-outline" size={20} color={COLORS.success} />
                  <Text style={[styles.actionButtonText, { color: COLORS.success }]}>Add Evidence</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.success} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${COLORS.info}12` }]}
                  onPress={handleExportPress}
                  activeOpacity={0.8}
                  accessible
                  accessibilityLabel="Export readiness summary"
                  accessibilityRole="button"
                  accessibilityHint="Share or save readiness summary"
                >
                  <MaterialCommunityIcons name="share-outline" size={20} color={COLORS.info} />
                  <Text style={[styles.actionButtonText, { color: COLORS.info }]}>Export Summary</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.info} />
                </TouchableOpacity>
              </View>

              {/* Disclaimer */}
              <View style={[styles.disclaimerCard, { backgroundColor: `${COLORS.warning}08`, borderColor: `${COLORS.warning}30` }]}>
                <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.warning} />
                <Text style={[styles.disclaimerText, { color: colors.textSecondary || colors.text?.secondary }]}>
                  This readiness assessment is not a legal compliance guarantee. Consult local health and safety authorities for definitive requirements.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  scoreEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBlock: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  issueCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  issueSeverity: {
    fontSize: 10,
    fontWeight: '700',
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  issueDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  successCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 8,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  disclaimerCard: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});

export default InspectionReadinessScreen;
