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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import QuickActions from '../components/common/QuickActions';
import ScoreBreakdownModal from '../components/common/ScoreBreakdownModal';
import ReminderBanner from '../components/common/ReminderBanner';
import DocumentExpiryBanner, { shouldShowDocumentExpiryBanner } from '../components/common/DocumentExpiryBanner';
import ChecklistItem from '../components/checklist/ChecklistItem';
import DocumentItem from '../components/documents/DocumentItem';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { fetchDashboardSnapshot } from '../services/dashboard';
import { fetchUserPreferences, dismissReminder } from '../services/userPreferences';
import { calculateComplianceScore } from '../utils/complianceScore';
import { ROUTES } from '../navigation/navigationConfig';
import { PADDING, SPACING, moderateScale } from '../utils/responsive';
import { getFirestoreLoadUserMessage } from '../utils/firestoreUiErrors';
import { useEffectiveRole } from '../hooks/useEffectiveRole';

const formatDateLabel = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatRelativeExpiry = (value) => {
  if (!value) return 'No expiration date';
  const now = new Date();
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 'Unknown expiration date';

  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'Expires tomorrow';
  return `Expires in ${diffDays} days`;
};

const formatLogTimestamp = (log) => {
  const value = log.createdAt || log.logDate;
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString();
};

const SectionHeader = ({ title, count, actionLabel, onAction, colors }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}>
      <Text
        style={[styles.sectionTitle, { color: colors.text?.primary || colors.text }]}
        accessibilityRole="header"
        accessibilityLevel={2}
      >
        {title}
      </Text>
      {typeof count === 'number' ? (
        <View style={[styles.countBadge, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.countBadgeText, { color: colors.primary }]}>{count}</Text>
        </View>
      ) : null}
    </View>
    {actionLabel && onAction ? (
      <TouchableOpacity
        style={styles.sectionActionButton}
        onPress={onAction}
        activeOpacity={0.7}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel} for ${title}`}
      >
        <Text style={[styles.sectionAction, { color: colors.primary }]}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const ReadinessSummaryCard = ({
  readiness,
  counts,
  hasRequiredDocumentsState = false,
  onChecklistPress,
  onDocumentsPress,
  onScorePress,
  colors,
}) => {
  const toneColors = {
    good: colors.success,
    warning: colors.warning,
    critical: colors.error,
  };

  const accent = toneColors[readiness.tone] || colors.primary;

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
      <View style={styles.summaryHeader}>
        <View
          style={[styles.summaryIconWrap, { backgroundColor: `${accent}18` }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MaterialCommunityIcons name="shield-check-outline" size={24} color={accent} />
        </View>
        <View style={styles.summaryHeaderText}>
          <Text
            style={[styles.summaryEyebrow, { color: accent }]}
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            Readiness Summary
          </Text>
          <Text style={[styles.summaryTitle, { color: colors.text?.primary || colors.text }]}>
            {readiness.title}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.summaryScorePill, { borderColor: `${accent}50` }]}
          onPress={onScorePress}
          accessible
          accessibilityLabel={`Compliance score ${readiness.score} percent, double tap to view breakdown`}
          accessibilityRole="button"
        >
          <Text style={[styles.summaryScoreValue, { color: accent }]}>{readiness.score}%</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.summaryMessage, { color: colors.text?.primary || colors.text }]}>
        {readiness.message}
      </Text>
      <Text style={[styles.summaryNextAction, { color: colors.textSecondary || colors.text?.secondary }]}>
        {readiness.nextAction}
      </Text>
      {hasRequiredDocumentsState && counts?.missingRequiredDocuments > 0 ? (
        <Text
          style={[styles.missingRequiredText, { color: colors.text?.primary || colors.text }]}
          accessibilityRole="alert"
        >
          Missing required documents: {counts.missingRequiredDocuments}
        </Text>
      ) : null}

      <View style={styles.summaryStatsRow}>
        <View style={styles.summaryStat}>
          <Text style={[styles.summaryStatValue, { color: colors.text?.primary || colors.text }]}>{counts.overdue}</Text>
          <Text style={[styles.summaryStatLabel, { color: colors.textSecondary || colors.text?.secondary }]}>Overdue</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={[styles.summaryStatValue, { color: colors.text?.primary || colors.text }]}>{counts.dueToday}</Text>
          <Text style={[styles.summaryStatLabel, { color: colors.textSecondary || colors.text?.secondary }]}>Due Today</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={[styles.summaryStatValue, { color: colors.text?.primary || colors.text }]}>{counts.expiringDocuments}</Text>
          <Text style={[styles.summaryStatLabel, { color: colors.textSecondary || colors.text?.secondary }]}>Expiring Docs</Text>
        </View>
      </View>

      <View style={styles.summaryActions}>
        <TouchableOpacity
          style={[styles.summaryActionButton, { backgroundColor: `${colors.primary}12` }]}
          onPress={onChecklistPress}
          activeOpacity={0.8}
          accessible
          accessibilityLabel="Open checklist"
          accessibilityRole="button"
        >
          <Text style={[styles.summaryActionText, { color: colors.primary }]}>Open Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryActionButton, { backgroundColor: `${colors.info}12` }]}
          onPress={onDocumentsPress}
          activeOpacity={0.8}
          accessible
          accessibilityLabel="Review documents"
          accessibilityRole="button"
        >
          <Text style={[styles.summaryActionText, { color: colors.info }]}>Review Documents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MediaLogPreviewCard = ({ log, colors, onPress }) => {
  const mediaTypeLabel = log.mediaType === 'video' ? 'Video log' : 'Photo log';

  return (
    <TouchableOpacity
      style={[styles.mediaCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${mediaTypeLabel} from ${formatLogTimestamp(log)}`}
      accessibilityHint="Opens media logs"
    >
      <View style={styles.mediaCardHeader}>
        <View style={[styles.mediaPill, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.mediaPillText, { color: colors.primary }]}>{mediaTypeLabel}</Text>
        </View>
        <Text style={[styles.mediaTimestamp, { color: colors.textSecondary || colors.text?.secondary }]}>
          {formatLogTimestamp(log)}
        </Text>
      </View>
      <Text style={[styles.mediaNote, { color: colors.text?.primary || colors.text }]} numberOfLines={3}>
        {log.note || 'No notes added yet. Open media logs to review this entry.'}
      </Text>
    </TouchableOpacity>
  );
};

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isOwner, loading: roleLoading } = useEffectiveRole();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scoreBreakdownVisible, setScoreBreakdownVisible] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    readiness: {
      score: 0,
      tone: 'warning',
      title: 'Loading readiness',
      message: '',
      nextAction: '',
    },
    dueTodayItems: [],
    overdueItems: [],
    expiringDocuments: [],
    expiredDocuments: [],
    recentMediaLogs: [],
    incidents: [],
    maintenanceTasks: [],
    counts: {
      documents: 0,
      dueToday: 0,
      overdue: 0,
      expiringDocuments: 0,
      expiredDocuments: 0,
      recentMediaLogs: 0,
      incidents: 0,
      maintenanceTasks: 0,
    },
    allChecklistItems: [],
  });

  const loadDashboard = useCallback(async ({ showLoading = true } = {}) => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setLoadError('');

    try {
      const result = await fetchDashboardSnapshot(user.uid);

      if (result.error) {
        console.error('Error loading dashboard:', result.error);
        const message = getFirestoreLoadUserMessage(result.error, { staleDataHint: true });
        setLoadError(message);
        return { errorMessage: message };
      } else if (result.data) {
        setDashboardData(result.data);
        
        // Calculate v2 score
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

      // Load user preferences for reminders
      const prefsResult = await fetchUserPreferences(user.uid);
      if (prefsResult.data) {
        setUserPreferences(prefsResult.data);
      }
    } catch (error) {
      console.error('Unexpected error loading dashboard:', error);
      const message = getFirestoreLoadUserMessage(error, { staleDataHint: true });
      setLoadError(message);
      return { errorMessage: message };
    } finally {
      setLoading(false);
    }
    return { errorMessage: null };
  }, [user?.uid]);

  useEffect(() => {
    loadDashboard({ showLoading: true });
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const refreshResult = await loadDashboard({ showLoading: false });
    setRefreshing(false);
    if (refreshResult?.errorMessage) {
      Alert.alert('Refresh failed', refreshResult.errorMessage, [
        { text: 'Dismiss', style: 'cancel' },
        { text: 'Retry', onPress: () => { loadDashboard({ showLoading: false }); } },
      ]);
    }
  }, [loadDashboard]);

  const notificationCount = dashboardData.counts.overdue + dashboardData.counts.dueToday;

  const createFocusKey = useCallback(() => Date.now().toString(), []);

  const handleNotificationPress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.CHECKLIST, {
      initialTab: 'today',
      focusKey: createFocusKey(),
    });
  }, [createFocusKey, navigation]);

  const handleProfilePress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.PROFILE);
  }, [navigation]);

  const handleDocumentsPress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.DOCUMENTS, {
      initialSortOption: 'date-asc',
      highlightExpiring: true,
      focusKey: createFocusKey(),
    });
  }, [createFocusKey, navigation]);

  const handleChecklistPress = useCallback((initialTab = 'today') => {
    navigation.navigate(ROUTES.MAIN.CHECKLIST, {
      initialTab,
      focusKey: createFocusKey(),
    });
  }, [createFocusKey, navigation]);

  const handleMediaLogsPress = useCallback((params = {}) => {
    navigation.navigate(ROUTES.MAIN.MEDIA_LOGS, {
      initialRangeType: 'all',
      focusKey: createFocusKey(),
      ...params,
    });
  }, [createFocusKey, navigation]);

  const handleUploadPress = useCallback(() => {
    if (roleLoading) {
      return;
    }
    if (!isOwner) {
      Alert.alert(
        'Owner only',
        'Only the business owner can upload documents for this workspace. Ask an owner to upload or adjust your role.',
      );
      return;
    }
    navigation.navigate(ROUTES.MAIN.DOCUMENTS, {
      openUploadModal: true,
      focusKey: createFocusKey(),
    });
  }, [createFocusKey, navigation, isOwner, roleLoading]);

  const handleReportsPress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.PROFILE);
  }, [navigation]);

  const handleIncidentsPress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.INCIDENTS, { screen: ROUTES.INCIDENTS.LIST });
  }, [navigation]);

  const handleMaintenancePress = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.MAINTENANCE, { screen: ROUTES.MAINTENANCE.LIST });
  }, [navigation]);

  const handleReminderDismiss = useCallback(
    async (reminderId) => {
      if (user?.uid) {
        await dismissReminder(user.uid, reminderId);
        setUserPreferences((prev) => ({
          ...(prev || {}),
          lastDismissed: {
            ...(prev?.lastDismissed || {}),
            [reminderId]: new Date().toISOString(),
          },
        }));
      }
    },
    [user?.uid]
  );

  const handleReminderNavigate = useCallback(
    (action) => {
      switch (action) {
        case 'dueToday':
          handleChecklistPress('today');
          break;
        case 'overdue':
          handleChecklistPress('today');
          break;
        case 'expiring':
          handleDocumentsPress();
          break;
        default:
          break;
      }
    },
    [handleChecklistPress, handleDocumentsPress]
  );

  const handleChecklistItemPress = useCallback((item) => {
    const dueDate = item?.dueDate ? new Date(item.dueDate) : null;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const initialTab =
      dueDate && !Number.isNaN(dueDate.getTime()) && dueDate > today ? 'upcoming' : 'today';

    navigation.navigate(ROUTES.MAIN.CHECKLIST, {
      initialTab,
      focusKey: createFocusKey(),
    });
  }, [createFocusKey, navigation]);

  const handleToggleComplete = useCallback((item) => {
    handleChecklistItemPress(item);
  }, [handleChecklistItemPress]);

  const backgroundColor = colors.zinc950 || colors.background;

  const expiringDocumentsPreview = useMemo(
    () => dashboardData.expiringDocuments.slice(0, 3),
    [dashboardData.expiringDocuments]
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Header
        notificationCount={notificationCount}
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      />

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
              {loadError ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: `${colors.warning}12`,
                      borderColor: `${colors.warning}40`,
                    },
                  ]}
                >
                  <View style={styles.errorBannerTextWrap}>
                    <Text style={[styles.errorBannerTitle, { color: colors.warning }]}>
                      Could not load dashboard
                    </Text>
                    <Text style={[styles.errorBannerText, { color: colors.text?.primary || colors.text }]}>
                      {loadError}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.errorBannerRetry, { borderColor: colors.warning }]}
                    onPress={() => loadDashboard({ showLoading: false })}
                    accessibilityRole="button"
                    accessibilityLabel="Retry dashboard refresh"
                  >
                    <Text style={[styles.errorBannerRetryText, { color: colors.warning }]}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <ReminderBanner
                dueTodayCount={dashboardData.counts.dueToday}
                overdueCount={dashboardData.counts.overdue}
                expiringCount={dashboardData.counts.expiringDocuments}
                preferences={userPreferences}
                onDismiss={handleReminderDismiss}
                onNavigate={handleReminderNavigate}
              />
              {shouldShowDocumentExpiryBanner(
                {
                  expiringCount: dashboardData.counts.expiringDocuments,
                  expiredCount: dashboardData.counts.expiredDocuments,
                },
                userPreferences
              ) && (
                <DocumentExpiryBanner
                  expiringCount={dashboardData.counts.expiringDocuments}
                  expiredCount={dashboardData.counts.expiredDocuments}
                  onOpenDocuments={handleDocumentsPress}
                  onDismiss={() => handleReminderDismiss('documentExpiry')}
                />
              )}

              <ReadinessSummaryCard
                readiness={dashboardData.readiness}
                counts={dashboardData.counts}
                hasRequiredDocumentsState={dashboardData.hasRequiredDocumentsState}
                onChecklistPress={() => handleChecklistPress('today')}
                onDocumentsPress={handleDocumentsPress}
                onScorePress={() => setScoreBreakdownVisible(true)}
                colors={colors}
              />

              <QuickActions
                onUploadPress={handleUploadPress}
                onChecklistPress={handleChecklistPress}
                onDocumentsPress={handleDocumentsPress}
                onReportsPress={handleReportsPress}
                uploadDisabled={roleLoading || !isOwner}
              />

              <View style={styles.section}>
                <SectionHeader
                  title="Operations"
                  count={(dashboardData.counts.incidents || 0) + (dashboardData.counts.maintenanceTasks || 0)}
                  actionLabel="Open"
                  onAction={handleIncidentsPress}
                  colors={colors}
                />
                <View style={styles.summaryActions}>
                  <TouchableOpacity
                    style={[styles.summaryActionButton, { backgroundColor: `${colors.error}12` }]}
                    onPress={handleIncidentsPress}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Open incidents, ${dashboardData.counts.incidents || 0} total`}
                  >
                    <Text style={[styles.summaryActionText, { color: colors.error }]}>Incidents ({dashboardData.counts.incidents || 0})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.summaryActionButton, { backgroundColor: `${colors.warning}12` }]}
                    onPress={handleMaintenancePress}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Open maintenance, ${dashboardData.counts.maintenanceTasks || 0} total`}
                  >
                    <Text style={[styles.summaryActionText, { color: colors.warning }]}>Maintenance ({dashboardData.counts.maintenanceTasks || 0})</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <SectionHeader
                  title="Due Today"
                  count={dashboardData.counts.dueToday}
                  actionLabel="Open Checklist"
                  onAction={() => handleChecklistPress('today')}
                  colors={colors}
                />
                {dashboardData.dueTodayItems.length > 0 ? (
                  dashboardData.dueTodayItems.map((item) => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      onPress={() => handleChecklistItemPress(item)}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon="calendar-check-outline"
                    title="Nothing due today"
                    message="You’re clear for today. Open the checklist to review upcoming work before it becomes urgent."
                    showAction
                    actionLabel="Review Checklist"
                    onAction={() => handleChecklistPress('today')}
                  />
                )}
              </View>

              <View style={styles.section}>
                <SectionHeader
                  title="Overdue"
                  count={dashboardData.counts.overdue}
                  actionLabel="Resolve Now"
                  onAction={() => handleChecklistPress('today')}
                  colors={colors}
                />
                {dashboardData.overdueItems.length > 0 ? (
                  dashboardData.overdueItems.map((item) => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      onPress={() => handleChecklistItemPress(item)}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon="check-decagram-outline"
                    title="No overdue checklist items"
                    message="Your checklist backlog is under control. Keep it that way by checking tomorrow’s tasks before they roll over."
                    showAction
                    actionLabel="View Checklist"
                    onAction={() => handleChecklistPress('upcoming')}
                  />
                )}
              </View>

              <View style={styles.section}>
                <SectionHeader
                  title="Expiring Documents"
                  count={dashboardData.counts.expiringDocuments}
                  actionLabel="View Documents"
                  onAction={handleDocumentsPress}
                  colors={colors}
                />
                {expiringDocumentsPreview.length > 0 ? (
                  expiringDocumentsPreview.map((document) => (
                    <View key={document.id} style={styles.expiringDocumentWrap}>
                      <DocumentItem
                        document={document}
                        onPress={() => {
                          navigation.navigate(ROUTES.MAIN.DOCUMENTS, {
                            screen: ROUTES.DOCUMENTS.DETAIL,
                            params: { documentId: document.id },
                          });
                        }}
                      />
                      <Text style={[styles.expiryMeta, { color: colors.textSecondary || colors.text?.secondary }]}>
                        {formatRelativeExpiry(document.expiryDate)} · {formatDateLabel(document.expiryDate)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <EmptyState
                    icon="file-clock-outline"
                    title="No documents expiring soon"
                    message="Nothing expires in the next 30 days. Review your document list anyway if you want to verify renewal dates."
                    showAction
                    actionLabel="Open Documents"
                    onAction={handleDocumentsPress}
                  />
                )}
              </View>

              <View style={styles.section}>
                <SectionHeader
                  title="Recent Media Logs"
                  count={dashboardData.counts.recentMediaLogs}
                  actionLabel="Open Logs"
                  onAction={handleMediaLogsPress}
                  colors={colors}
                />
                {dashboardData.recentMediaLogs.length > 0 ? (
                  dashboardData.recentMediaLogs.map((log) => (
                    <MediaLogPreviewCard
                      key={log.id}
                      log={log}
                      colors={colors}
                      onPress={() => handleMediaLogsPress({ initialRangeType: 'all' })}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon="image-plus-outline"
                    title="No recent media logs"
                    message="Add a quick photo or video log so your dashboard includes fresh field evidence alongside checklist work."
                    showAction
                    actionLabel="Add Media Log"
                    onAction={() => handleMediaLogsPress({ openComposer: true })}
                  />
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <ScoreBreakdownModal
        visible={scoreBreakdownVisible}
        scoreData={scoreData}
        onClose={() => setScoreBreakdownVisible(false)}
      />
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
    paddingHorizontal: PADDING.SCREEN_HORIZONTAL,
    paddingVertical: PADDING.SCREEN_VERTICAL,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginTop: SPACING.SM,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
  },
  summaryScorePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryScoreValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  summaryNextAction: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  missingRequiredText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryStat: {
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
  },
  summaryActions: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  summaryActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: SPACING.XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionActionButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  expiringDocumentWrap: {
    marginBottom: 4,
  },
  expiryMeta: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 8,
    marginTop: -4,
  },
  mediaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  mediaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  mediaPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mediaPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mediaTimestamp: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
  },
  mediaNote: {
    fontSize: 14,
    lineHeight: 21,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorBannerTextWrap: {
    flex: 1,
  },
  errorBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorBannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorBannerRetry: {
    minHeight: 36,
    minWidth: 64,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  errorBannerRetryText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default DashboardScreen;
