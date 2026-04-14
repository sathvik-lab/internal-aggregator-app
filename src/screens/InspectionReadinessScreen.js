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
  Alert,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchDashboardSnapshot } from '../services/dashboard';
import { calculateComplianceScore, getScoreDescription } from '../utils/complianceScore';
import { exportReadinessSummaryPdf, shareReadinessSummary } from '../utils/readinessExport';
import { generateShareableReportLink, revokeShareableReportLink } from '../services/reportLinks';
import { logAnalyticsEvent } from '../services/analytics';
import Header from '../components/common/Header';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { ROUTES } from '../navigation/navigationConfig';
import { COLORS } from '../constants/colors';
import { getDocumentTypeOption } from '../utils/documentTypes';

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
  const [inspectionModeEnabled, setInspectionModeEnabled] = useState(false);
  const [rangePreset, setRangePreset] = useState('90d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [shareableReport, setShareableReport] = useState(null);

  const getStartDateForPreset = useCallback((preset) => {
    if (preset === 'all') {
      return null;
    }

    const daysMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = daysMap[preset] || 90;
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }, []);

  const rangeOptions = useMemo(() => {
    if (rangePreset === 'custom') {
      return {
        startDate: customStartDate || null,
        endDate: customEndDate || null,
      };
    }

    return {
      startDate: getStartDateForPreset(rangePreset),
      endDate: null,
    };
  }, [customEndDate, customStartDate, getStartDateForPreset, rangePreset]);

  const loadReadiness = useCallback(async ({ showLoading = true } = {}) => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    const result = await fetchDashboardSnapshot(user.uid, rangeOptions);

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
        incidents: result.data.incidents || [],
        maintenanceTasks: result.data.maintenanceTasks || [],
      });
      setScoreData(scoreResult);
    }

    setLoading(false);
  }, [rangeOptions, user?.uid]);

  useEffect(() => {
    loadReadiness({ showLoading: true });
  }, [loadReadiness]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReadiness({ showLoading: false });
    setRefreshing(false);
  }, [loadReadiness]);

  const handlePresetChange = useCallback((preset) => {
    setRangePreset(preset);
  }, []);

  const handleApplyCustomRange = useCallback(() => {
    if (!customStartDate || !customEndDate) {
      Alert.alert('Date Range', 'Enter both start and end dates in YYYY-MM-DD format.');
      return;
    }

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const startValid = !Number.isNaN(start.getTime());
    const endValid = !Number.isNaN(end.getTime());

    if (!startValid || !endValid) {
      Alert.alert('Date Range', 'Invalid date format. Use YYYY-MM-DD.');
      return;
    }

    if (start > end) {
      Alert.alert('Date Range', 'Start date must be on or before end date.');
      return;
    }

    setRangePreset('custom');
  }, [customEndDate, customStartDate]);

  const issues = useMemo(() => {
    if (!dashboardData || !scoreData) return [];

    const issueList = [];
    const criticalOverdueItems = (dashboardData.overdueItems || []).filter((item) => item?.priority === 'critical');

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

    if (criticalOverdueItems.length > 0) {
      issueList.push({
        severity: 'critical',
        title: `${criticalOverdueItems.length} Critical Overdue Item${criticalOverdueItems.length === 1 ? '' : 's'}`,
        description: `Critical-priority checklist blocker${criticalOverdueItems.length === 1 ? '' : 's'} detected. Resolve these first.`,
      });
    }

    if ((scoreData?.factors?.openHighSeverityIncidentCount || 0) > 0) {
      const incidentCount = scoreData.factors.openHighSeverityIncidentCount;
      issueList.push({
        severity: 'critical',
        title: `${incidentCount} Open Severe Incident${incidentCount === 1 ? '' : 's'}`,
        description: `Severe incident${incidentCount === 1 ? '' : 's'} remain open. Resolve or document mitigation immediately.`,
      });
    }

    if ((scoreData?.factors?.overdueMaintenanceCount || 0) > 0) {
      const overdueMaintenanceCount = scoreData.factors.overdueMaintenanceCount;
      issueList.push({
        severity: 'warning',
        title: `${overdueMaintenanceCount} Overdue Maintenance Task${overdueMaintenanceCount === 1 ? '' : 's'}`,
        description: `Maintenance backlog is overdue and can escalate readiness risk.`,
      });
    }

    const missingRequiredTypes = dashboardData?.missingRequiredDocumentTypes || [];
    if (dashboardData?.hasRequiredDocumentsState && missingRequiredTypes.length > 0) {
      const labels = missingRequiredTypes
        .map((type) => getDocumentTypeOption(type).label)
        .join(', ');
      issueList.push({
        severity: 'warning',
        title: `Missing Required: ${missingRequiredTypes.length}`,
        description: `Required document types missing for ${dashboardData.requiredDocumentsState}: ${labels}.`,
      });
    } else if (!dashboardData?.hasRequiredDocumentsState) {
      issueList.push({
        severity: 'info',
        title: 'Set business state for required docs',
        description: 'Add your business state in profile to enable state-specific required document checks.',
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

    const severityRank = { critical: 0, warning: 1, info: 2 };
    return [...issueList].sort((a, b) => (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99));
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

  const handleIncidentsPress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.INCIDENTS, { screen: ROUTES.INCIDENTS.LIST });
  }, [navigation]);

  const handleMaintenancePress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.MAINTENANCE, { screen: ROUTES.MAINTENANCE.LIST });
  }, [navigation]);

  const exportBusinessProfile = useMemo(() => ({
    business_name: dashboardData?.businessProfile?.business_name || 'Food Truck',
    state: dashboardData?.businessProfile?.state || '',
  }), [dashboardData?.businessProfile?.business_name, dashboardData?.businessProfile?.state]);

  const handleTextSharePress = useCallback(async () => {
    if (!dashboardData || !scoreData) {
      Alert.alert('Export', 'Readiness data not available. Please try again.');
      return;
    }

    try {
      await shareReadinessSummary(dashboardData, scoreData, exportBusinessProfile);
      logAnalyticsEvent('readiness_share', {
        format: 'text',
        source: 'inspection_readiness',
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        Alert.alert('Share Error', 'Could not share readiness summary. Please try again.');
      }
    }
  }, [dashboardData, exportBusinessProfile, scoreData]);

  const handlePdfExportPress = useCallback(async () => {
    if (!dashboardData || !scoreData) {
      Alert.alert('Export', 'Readiness data not available. Please try again.');
      return;
    }

    try {
      await exportReadinessSummaryPdf(dashboardData, scoreData, exportBusinessProfile);
      logAnalyticsEvent('readiness_share', {
        format: 'pdf',
        source: 'inspection_readiness',
      });
    } catch (error) {
      if (error?.message !== 'User did not share') {
        Alert.alert('PDF Export Error', 'Could not create or share PDF. Please try again.');
      }
    }
  }, [dashboardData, exportBusinessProfile, scoreData]);

  const handleExportPress = useCallback(() => {
    Alert.alert(
      'Share Compliance Data?',
      'This export may include sensitive business compliance details (documents, readiness score, and checklist status). Continue only with trusted recipients.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share Text', onPress: () => { handleTextSharePress(); } },
        { text: 'Export PDF', onPress: () => { handlePdfExportPress(); } },
      ],
    );
  }, [handlePdfExportPress, handleTextSharePress]);

  const handleGenerateShareableLink = useCallback(() => {
    Alert.alert(
      'Generate Shareable Link?',
      'This creates a temporary link containing sensitive compliance summary data. Share only with trusted recipients.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate Link',
          onPress: async () => {
            setLinkLoading(true);
            const result = await generateShareableReportLink({
              startDate: rangeOptions.startDate,
              endDate: rangeOptions.endDate,
              format: 'pdf',
              ttlHours: 48,
            });
            setLinkLoading(false);

            if (result.error) {
              Alert.alert('Link Error', result.error.message || 'Could not generate shareable link.');
              return;
            }

            setShareableReport({
              url: result.data?.signedUrl || null,
              expiresAt: result.data?.expiresAt || null,
              reportId: result.data?.reportId || null,
            });
          },
        },
      ],
    );
  }, [rangeOptions.endDate, rangeOptions.startDate]);

  const handleCopyShareableLink = useCallback(async () => {
    if (!shareableReport?.url) {
      return;
    }
    await Clipboard.setStringAsync(shareableReport.url);
    Alert.alert('Copied', 'Shareable link copied to clipboard.');
  }, [shareableReport?.url]);

  const handleRevokeShareableLink = useCallback(() => {
    if (!shareableReport?.reportId) {
      Alert.alert('Revoke', 'No active report link to revoke.');
      return;
    }

    Alert.alert(
      'Revoke Link?',
      'Anyone with this link will lose access immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setRevokeLoading(true);
            const result = await revokeShareableReportLink(shareableReport.reportId);
            setRevokeLoading(false);
            if (result.error) {
              Alert.alert('Revoke Error', result.error.message || 'Could not revoke link.');
              return;
            }
            setShareableReport(null);
            Alert.alert('Revoked', 'Shareable link has been revoked.');
          },
        },
      ],
    );
  }, [shareableReport?.reportId]);

  const scoreDescription = scoreData ? getScoreDescription(scoreData.score) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!inspectionModeEnabled && <Header />}

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
              <View style={[styles.modeToggleCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
                <View style={styles.modeToggleTextWrap}>
                  <Text style={[styles.modeToggleTitle, { color: colors.text?.primary || colors.text }]}>Inspection mode</Text>
                  <Text style={[styles.modeToggleSubtitle, { color: colors.textSecondary || colors.text?.secondary }]}>
                    Focus on key readiness metrics and shortcuts
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    {
                      backgroundColor: inspectionModeEnabled ? `${colors.primary}20` : 'transparent',
                      borderColor: inspectionModeEnabled ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setInspectionModeEnabled((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={`Inspection mode ${inspectionModeEnabled ? 'on' : 'off'}`}
                  accessibilityState={{ selected: inspectionModeEnabled }}
                >
                  <Text
                    style={[
                      styles.modeToggleButtonText,
                      { color: inspectionModeEnabled ? colors.primary : (colors.textSecondary || colors.text?.secondary) },
                    ]}
                  >
                    {inspectionModeEnabled ? 'On' : 'Off'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Score Summary Card */}
              <View style={[styles.rangeCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.rangeTitle, { color: colors.text?.primary || colors.text }]}>Activity Range</Text>
                <View style={styles.rangePresetRow}>
                  {[
                    { key: '7d', label: 'Last 7' },
                    { key: '30d', label: 'Last 30' },
                    { key: '90d', label: 'Last 90' },
                  ].map((preset) => {
                    const active = rangePreset === preset.key;
                    return (
                      <TouchableOpacity
                        key={preset.key}
                        style={[
                          styles.rangePresetButton,
                          {
                            backgroundColor: active ? `${colors.primary}20` : 'transparent',
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => handlePresetChange(preset.key)}
                        accessibilityRole="button"
                        accessibilityLabel={`${preset.label} days`}
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.rangePresetText, { color: active ? colors.primary : (colors.textSecondary || colors.text?.secondary) }]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.customRangeLabel, { color: colors.textSecondary || colors.text?.secondary }]}>
                  Custom range (YYYY-MM-DD)
                </Text>
                <View style={styles.customRangeRow}>
                  <TextInput
                    style={[
                      styles.customRangeInput,
                      {
                        color: colors.text?.primary || colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    value={customStartDate}
                    onChangeText={setCustomStartDate}
                    placeholder="Start"
                    placeholderTextColor={colors.textSecondary || colors.text?.secondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={[
                      styles.customRangeInput,
                      {
                        color: colors.text?.primary || colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    value={customEndDate}
                    onChangeText={setCustomEndDate}
                    placeholder="End"
                    placeholderTextColor={colors.textSecondary || colors.text?.secondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.applyRangeButton, { backgroundColor: colors.primary }]}
                    onPress={handleApplyCustomRange}
                    accessibilityRole="button"
                    accessibilityLabel="Apply custom date range"
                  >
                    <Text style={[styles.applyRangeButtonText, { color: colors.textInverse || '#FFFFFF' }]}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.scoreCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
                <View style={styles.scoreCardHeader}>
                  <View>
                    <Text style={[styles.scoreEyebrow, { color: scoreDescription?.color }]}>Inspection Readiness</Text>
                    <View style={styles.scoreValueRow}>
                      <Text style={[styles.scoreValue, inspectionModeEnabled && styles.scoreValueInspectionMode, { color: scoreDescription?.color }]}>
                        {scoreData?.score || 0}%
                      </Text>
                      <Text style={[styles.scoreLabel, inspectionModeEnabled && styles.scoreLabelInspectionMode, { color: scoreDescription?.color }]}>
                        {scoreDescription?.label}
                      </Text>
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
              <View style={[styles.statsGrid, inspectionModeEnabled && styles.statsGridInspectionMode]}>
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
                <StatBlock
                  icon="alert-circle-outline"
                  label="Incidents"
                  value={dashboardData?.counts?.incidents || 0}
                  color={COLORS.error}
                  colors={colors}
                />
                <StatBlock
                  icon="tools"
                  label="Maintenance"
                  value={dashboardData?.counts?.maintenanceTasks || 0}
                  color={COLORS.warning}
                  colors={colors}
                />
              </View>

              {/* Issues Section */}
              {!inspectionModeEnabled && (
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
                      No critical issues detected. You&apos;re in good shape for inspection.
                    </Text>
                  </View>
                )}
              </View>
              )}

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, inspectionModeEnabled && styles.sectionTitleInspectionMode, { color: colors.text?.primary || colors.text }]}>
                  Quick Actions
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${COLORS.secondary}12` }]}
                  onPress={handleGenerateShareableLink}
                  activeOpacity={0.8}
                  accessible
                  accessibilityLabel="Generate shareable link"
                  accessibilityRole="button"
                  accessibilityHint="Creates a temporary secure report link"
                  disabled={linkLoading}
                >
                  <MaterialCommunityIcons name="link-variant" size={20} color={COLORS.secondary} />
                  <Text style={[styles.actionButtonText, { color: COLORS.secondary }]}>
                    {linkLoading ? 'Generating link...' : 'Generate Shareable Link'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.secondary} />
                </TouchableOpacity>

                {shareableReport?.url && (
                  <View style={[styles.linkCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.linkCardTitle, { color: colors.text?.primary || colors.text }]}>Active Shareable Link</Text>
                    <Text
                      style={[styles.linkValue, { color: colors.textSecondary || colors.text?.secondary }]}
                      numberOfLines={2}
                    >
                      {shareableReport.url}
                    </Text>
                    <Text style={[styles.linkMeta, { color: colors.textSecondary || colors.text?.secondary }]}>
                      Expires: {shareableReport.expiresAt ? new Date(shareableReport.expiresAt).toLocaleString() : 'N/A'}
                    </Text>
                    <View style={styles.linkActionRow}>
                      <TouchableOpacity
                        style={[styles.linkActionButton, { borderColor: colors.primary }]}
                        onPress={handleCopyShareableLink}
                        accessibilityRole="button"
                        accessibilityLabel="Copy shareable link"
                      >
                        <Text style={[styles.linkActionText, { color: colors.primary }]}>Copy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.linkActionButton, { borderColor: colors.error }]}
                        onPress={handleRevokeShareableLink}
                        accessibilityRole="button"
                        accessibilityLabel="Revoke shareable link"
                        disabled={revokeLoading}
                      >
                        <Text style={[styles.linkActionText, { color: colors.error }]}>
                          {revokeLoading ? 'Revoking...' : 'Revoke'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

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
                  style={[styles.actionButton, { backgroundColor: `${COLORS.error}12` }]}
                  onPress={handleIncidentsPress}
                  activeOpacity={0.8}
                  accessibilityLabel="Open incidents"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.error} />
                  <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Incidents ({dashboardData?.counts?.incidents || 0})</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.error} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${COLORS.warning}12` }]}
                  onPress={handleMaintenancePress}
                  activeOpacity={0.8}
                  accessibilityLabel="Open maintenance tasks"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="tools" size={20} color={COLORS.warning} />
                  <Text style={[styles.actionButtonText, { color: COLORS.warning }]}>Maintenance ({dashboardData?.counts?.maintenanceTasks || 0})</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.warning} />
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
              {!inspectionModeEnabled && (
                <View style={[styles.disclaimerCard, { backgroundColor: `${COLORS.warning}08`, borderColor: `${COLORS.warning}30` }]}>
                <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.warning} />
                <Text style={[styles.disclaimerText, { color: colors.textSecondary || colors.text?.secondary }]}>
                  This readiness assessment is not a legal compliance guarantee. Consult local health and safety authorities for definitive requirements.
                </Text>
              </View>
              )}
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
  modeToggleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeToggleTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  modeToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modeToggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modeToggleButton: {
    borderWidth: 1,
    borderRadius: 10,
    minWidth: 56,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  modeToggleButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rangeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  rangeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  rangePresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  rangePresetButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rangePresetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customRangeLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  customRangeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customRangeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 40,
  },
  applyRangeButton: {
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  applyRangeButtonText: {
    fontSize: 12,
    fontWeight: '700',
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
  scoreValueInspectionMode: {
    fontSize: 52,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreLabelInspectionMode: {
    fontSize: 18,
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
  statsGridInspectionMode: {
    marginBottom: 16,
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
  sectionTitleInspectionMode: {
    fontSize: 20,
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
  linkCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  linkCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  linkValue: {
    fontSize: 12,
    marginBottom: 6,
  },
  linkMeta: {
    fontSize: 12,
    marginBottom: 10,
  },
  linkActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  linkActionButton: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkActionText: {
    fontSize: 12,
    fontWeight: '700',
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
