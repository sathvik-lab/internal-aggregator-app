/**
 * Dashboard Screen
 * 
 * Main dashboard screen showing overview of compliance status,
 * recent documents, and quick actions.
 * 
 * This screen demonstrates Firestore query patterns:
 * - Query documents count: query(collection(db, 'documents'), where('userId', '==', userId))
 * - Query checklists: query(collection(db, 'checklistItems'), where('userId', '==', userId), where('completed', '==', false))
 * - Real-time listener: setupRealtimeListener('checklistItems', conditions, callback)
 * - Recent documents: query(collection(db, 'documents'), where('userId', '==', userId), orderBy('uploadDate', 'desc'), limit(3))
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import StatCard from '../components/common/StatCard';
import QuickActions from '../components/common/QuickActions';
import ChecklistItem from '../components/checklist/ChecklistItem';
import DocumentItem from '../components/documents/DocumentItem';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { COLORS } from '../constants/colors';
import { queryDocuments, setupRealtimeListener } from '../services/firestore';
import { CHECKLIST_STATUS } from '../constants/constants';
import { PADDING, SPACING, moderateScale, getGridColumns, isTablet, isLandscape } from '../utils/responsive';
import { ROUTES } from '../navigation/navigationConfig';

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    // State management
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalDocuments: 0,
        pendingChecklists: 0,
        dueToday: 0,
        complianceScore: 0,
        recentActivity: 0,
    });
    const [todayTasks, setTodayTasks] = useState([]);
    const [recentDocuments, setRecentDocuments] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [documentsLoading, setDocumentsLoading] = useState(true);

    /**
     * Fetch dashboard statistics from Firestore
     * 
     * Real Firestore implementation would look like:
     * ```javascript
     * import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
     * import { db } from '../services/firebase';
     * 
     * // Get documents count
     * const docsQuery = query(
     *   collection(db, 'documents'),
     *   where('userId', '==', user.uid)
     * );
     * const docsSnapshot = await getCountFromServer(docsQuery);
     * const totalDocuments = docsSnapshot.data().count;
     * 
     * // Get pending checklists count
     * const checklistsQuery = query(
     *   collection(db, 'checklistItems'),
     *   where('userId', '==', user.uid),
     *   where('completed', '==', false)
     * );
     * const checklistsSnapshot = await getCountFromServer(checklistsQuery);
     * const pendingChecklists = checklistsSnapshot.data().count;
     * ```
     */
    const fetchDashboardStats = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        try {
            // Query 1: Get user's documents count
            // Real Firestore: query(collection(db, 'documents'), where('userId', '==', user.uid))
            const documentsResult = await queryDocuments('documents', [
                { field: 'userId', operator: '==', value: user.uid },
            ]);
            const totalDocuments = documentsResult.data?.length || 0;

            // Query 2: Get user's checklist items
            // Real Firestore: query(collection(db, 'checklistItems'), where('userId', '==', user.uid))
            const checklistsResult = await queryDocuments('checklistItems', [
                { field: 'userId', operator: '==', value: user.uid },
            ]);
            const checklistItems = checklistsResult.data || [];

            // Count pending checklists (not completed)
            const pendingChecklists = checklistItems.filter(
                (item) => !item.completed && item.status === CHECKLIST_STATUS.PENDING
            ).length;

            // Count checklists due today
            const today = new Date().toISOString().split('T')[0];
            const dueToday = checklistItems.filter(
                (item) => !item.completed && item.dueDate?.split('T')[0] === today
            ).length;

            // Calculate compliance score
            // Based on: completed checklists, active documents, no overdue items
            const totalChecklists = checklistItems.length;
            const completedChecklists = checklistItems.filter((item) => item.completed).length;
            const completionRate = totalChecklists > 0 ? (completedChecklists / totalChecklists) * 100 : 100;
            const complianceScore = Math.round(completionRate * 0.7 + (totalDocuments > 0 ? 30 : 0));

            // Recent activity (items updated in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentActivity = [
                ...(documentsResult.data || []).filter((doc) => new Date(doc.uploadDate) > sevenDaysAgo),
                ...checklistItems.filter(
                    (item) => item.completedAt && new Date(item.completedAt) > sevenDaysAgo
                ),
            ].length;

            setStats({
                totalDocuments,
                pendingChecklists,
                dueToday,
                complianceScore,
                recentActivity,
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Set up real-time listener for today's checklist items
     * 
     * Real Firestore implementation would look like:
     * ```javascript
     * import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
     * import { db } from '../services/firebase';
     * 
     * const today = new Date();
     * today.setHours(0, 0, 0, 0);
     * const tomorrow = new Date(today);
     * tomorrow.setDate(tomorrow.getDate() + 1);
     * 
     * const q = query(
     *   collection(db, 'checklistItems'),
     *   where('userId', '==', user.uid),
     *   where('completed', '==', false),
     *   where('dueDate', '>=', Timestamp.fromDate(today)),
     *   where('dueDate', '<', Timestamp.fromDate(tomorrow)),
     *   orderBy('dueDate', 'asc'),
     *   limit(3)
     * );
     * 
     * const unsubscribe = onSnapshot(q, (snapshot) => {
     *   const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
     *   setTodayTasks(items);
     * });
     * ```
     */
    const setupTodayTasksListener = useCallback(() => {
        if (!user?.uid) {
            setTasksLoading(false);
            return;
        }

        setTasksLoading(true);

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Set up real-time listener for today's incomplete checklist items
        // Real Firestore: query(collection(db, 'checklistItems'), 
        //   where('userId', '==', user.uid),
        //   where('completed', '==', false),
        //   where('dueDate', '>=', today),
        //   orderBy('dueDate', 'asc'),
        //   limit(3))
        const unsubscribe = setupRealtimeListener(
            'checklistItems',
            [
                { field: 'userId', operator: '==', value: user.uid },
                { field: 'completed', operator: '==', value: false },
            ],
            (items, error) => {
                if (error) {
                    console.error('Error fetching today\'s tasks:', error);
                    setTodayTasks([]);
                } else {
                    // Filter for today's items and sort by due date
                    const todayItems = items
                        .filter((item) => {
                            if (!item.dueDate) return false;
                            const itemDate = item.dueDate.split('T')[0];
                            return itemDate === todayStr;
                        })
                        .sort((a, b) => {
                            const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
                            const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
                            return dateA - dateB;
                        })
                        .slice(0, 3); // Limit to 3 items
                    setTodayTasks(todayItems);
                }
                setTasksLoading(false);
            },
            {
                orderBy: { field: 'dueDate', direction: 'asc' },
                limit: 10, // Fetch more to filter, then slice
            }
        );

        return unsubscribe;
    }, [user]);

    /**
     * Fetch recent documents from Firestore
     * 
     * Real Firestore implementation would look like:
     * ```javascript
     * import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
     * import { db } from '../services/firebase';
     * 
     * const q = query(
     *   collection(db, 'documents'),
     *   where('userId', '==', user.uid),
     *   orderBy('uploadDate', 'desc'),
     *   limit(3)
     * );
     * 
     * const snapshot = await getDocs(q);
     * const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
     * setRecentDocuments(documents);
     * ```
     */
    const fetchRecentDocuments = useCallback(async () => {
        if (!user?.uid) {
            setDocumentsLoading(false);
            return;
        }

        try {
            setDocumentsLoading(true);

            // Query recent documents ordered by upload date
            // Real Firestore: query(collection(db, 'documents'),
            //   where('userId', '==', user.uid),
            //   orderBy('uploadDate', 'desc'),
            //   limit(3))
            const result = await queryDocuments(
                'documents',
                [{ field: 'userId', operator: '==', value: user.uid }],
                {
                    orderBy: { field: 'uploadDate', direction: 'desc' },
                    limit: 3,
                }
            );

            if (result.error) {
                console.error('Error fetching recent documents:', result.error);
                setRecentDocuments([]);
            } else {
                setRecentDocuments(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching recent documents:', error);
            setRecentDocuments([]);
        } finally {
            setDocumentsLoading(false);
        }
    }, [user]);

    // Initial data fetch
    useEffect(() => {
        fetchDashboardStats();
        fetchRecentDocuments();
        const unsubscribe = setupTodayTasksListener();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [fetchDashboardStats, fetchRecentDocuments, setupTodayTasksListener]);

    // Pull-to-refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchDashboardStats(), fetchRecentDocuments()]);
        setRefreshing(false);
    }, [fetchDashboardStats, fetchRecentDocuments]);

    // Notification count
    const notificationCount = stats.pendingChecklists + stats.dueToday;

    // Handlers
    const handleNotificationPress = () => {
        Alert.alert(
            'Notifications',
            `You have ${notificationCount} unread notifications`,
            [{ text: 'OK' }]
        );
    };

    const handleProfilePress = () => {
        navigation.navigate(ROUTES.MAIN.PROFILE);
    };

    const handleDocumentsPress = () => {
        navigation.navigate(ROUTES.MAIN.DOCUMENTS);
    };

    const handleChecklistPress = () => {
        navigation.navigate(ROUTES.MAIN.CHECKLIST);
    };

    const handleUploadPress = () => {
        navigation.navigate(ROUTES.MAIN.DOCUMENTS);
        // TODO: Open upload modal when Documents screen supports it
    };

    const handleTodayChecklistPress = () => {
        navigation.navigate(ROUTES.MAIN.CHECKLIST);
        // TODO: Filter to show only today's items when Checklist screen supports it
    };

    const handleRecentDocumentsPress = () => {
        navigation.navigate(ROUTES.MAIN.DOCUMENTS);
        // TODO: Filter to show recent documents when Documents screen supports it
    };

    const handleReportsPress = () => {
        Alert.alert(
            'Reports',
            'Reports feature will be available soon. This will show compliance analytics and insights.',
            [{ text: 'OK' }]
        );
    };

    // Memoize handlers to prevent re-renders
    const handleChecklistItemPress = useCallback((item) => {
        navigation.navigate(ROUTES.MAIN.CHECKLIST);
        // TODO: Pass item as parameter when detail screen is implemented
    }, [navigation]);

    const handleToggleComplete = useCallback((item) => {
        Alert.alert(
            'Mark Complete',
            `Mark "${item.title}" as complete?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete',
                    onPress: () => {
                        // TODO: Update item completion status in Firestore
                        console.log('Marking item as complete:', item.id);
                    },
                },
            ]
        );
    };

    const handleViewAllChecklist = useCallback(() => {
        navigation.navigate(ROUTES.MAIN.CHECKLIST);
    }, [navigation]);

    const handleDocumentPress = useCallback((document) => {
        navigation.navigate(ROUTES.MAIN.DOCUMENTS, {
            screen: ROUTES.DOCUMENTS.DETAIL,
            params: { documentId: document.id },
        });
    }, [navigation]);

    const handleViewAllDocuments = useCallback(() => {
        navigation.navigate(ROUTES.MAIN.DOCUMENTS);
    }, [navigation]);

    return (
        <View style={styles.container}>
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
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                        progressViewOffset={Platform.OS === 'android' ? 20 : 0}
                        progressBackgroundColor={COLORS.surface}
                    />
                }
            >
                <View style={styles.content}>
                    {/* Summary Cards Grid - 2x2 */}
                    {loading ? (
                        <LoadingSkeleton type="stat" count={4} />
                    ) : (
                        <View style={styles.statsGrid}>
                            {/* Total Documents */}
                            <View style={styles.statCardWrapper}>
                                <StatCard
                                    icon="file-document-multiple"
                                    value={stats.totalDocuments}
                                    label="Total Documents"
                                    subtitle="All compliance docs"
                                    onPress={handleDocumentsPress}
                                    color={COLORS.info}
                                />
                            </View>

                            {/* Pending Checklists */}
                            <View style={styles.statCardWrapper}>
                                <StatCard
                                    icon="clipboard-check-outline"
                                    value={stats.pendingChecklists}
                                    label="Pending Checklists"
                                    subtitle={stats.dueToday > 0 ? `${stats.dueToday} due today` : 'All up to date'}
                                    onPress={handleChecklistPress}
                                    color={stats.dueToday > 0 ? COLORS.warning : COLORS.success}
                                />
                            </View>

                            {/* Compliance Score */}
                            <View style={styles.statCardWrapper}>
                                <StatCard
                                    icon="shield-check"
                                    value={`${stats.complianceScore}%`}
                                    label="Compliance Score"
                                    subtitle={stats.complianceScore >= 80 ? 'Good' : stats.complianceScore >= 60 ? 'At Risk' : 'Needs Attention'}
                                    color={stats.complianceScore >= 80 ? COLORS.success : stats.complianceScore >= 60 ? COLORS.warning : COLORS.error}
                                />
                            </View>

                            {/* Recent Activity */}
                            <View style={styles.statCardWrapper}>
                                <StatCard
                                    icon="clock-outline"
                                    value={stats.recentActivity}
                                    label="Recent Activity"
                                    subtitle="Last 7 days"
                                    color={COLORS.accent}
                                />
                            </View>
                        </View>
                    )}

                    {/* Quick Actions */}
                    <QuickActions
                        onUploadPress={handleUploadPress}
                        onChecklistPress={handleTodayChecklistPress}
                        onDocumentsPress={handleRecentDocumentsPress}
                        onReportsPress={handleReportsPress}
                    />

                    {/* Today's Tasks Section */}
                    <View style={styles.section} accessibilityRole="region" accessibilityLabel="Today's Tasks section">
                        <View style={styles.sectionHeader}>
                            <Text 
                                style={styles.sectionTitle}
                                accessibilityRole="header"
                                accessibilityLevel={2}
                            >
                                Today's Tasks
                            </Text>
                            {todayTasks.length > 0 && (
                                <TouchableOpacity
                                    onPress={handleViewAllChecklist}
                                    activeOpacity={0.7}
                                    accessibilityLabel="View all checklist items"
                                    accessibilityHint="Double tap to view all checklist items"
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.viewAllText}>View All</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {tasksLoading ? (
                            <LoadingSkeleton type="list" count={3} />
                        ) : todayTasks.length > 0 ? (
                            todayTasks.map((item) => (
                                <ChecklistItem
                                    key={item.id}
                                    item={item}
                                    onPress={handleChecklistItemPress}
                                    onToggleComplete={handleToggleComplete}
                                />
                            ))
                        ) : (
                            <EmptyState
                                icon="clipboard-check-outline"
                                title="No tasks for today"
                                message="You're all caught up! No checklist items due today."
                            />
                        )}
                    </View>

                    {/* Recent Documents Section */}
                    <View style={styles.section} accessibilityRole="region" accessibilityLabel="Recent Documents section">
                        <View style={styles.sectionHeader}>
                            <Text 
                                style={styles.sectionTitle}
                                accessibilityRole="header"
                                accessibilityLevel={2}
                            >
                                Recent Documents
                            </Text>
                            {recentDocuments.length > 0 && (
                                <TouchableOpacity
                                    onPress={handleViewAllDocuments}
                                    activeOpacity={0.7}
                                    accessibilityLabel="View all documents"
                                    accessibilityHint="Double tap to view all documents"
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.viewAllText}>View All</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {documentsLoading ? (
                            <LoadingSkeleton type="list" count={3} />
                        ) : recentDocuments.length > 0 ? (
                            recentDocuments.map((document) => (
                                <DocumentItem
                                    key={document.id}
                                    document={document}
                                    onPress={handleDocumentPress}
                                />
                            ))
                        ) : (
                            <EmptyState
                                icon="file-document-outline"
                                title="No documents yet"
                                message="Upload your first compliance document to get started."
                            />
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: PADDING.SCREEN_HORIZONTAL,
        paddingVertical: PADDING.SCREEN_VERTICAL,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: SPACING.SM,
    },
    statCardWrapper: {
        width: isTablet && isLandscape ? '23%' : isTablet ? '48%' : '48%',
        marginBottom: SPACING.MD,
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
    sectionTitle: {
        fontSize: moderateScale(18),
        fontWeight: 'bold',
        color: COLORS.text,
    },
    viewAllText: {
        fontSize: moderateScale(14),
        color: COLORS.primary,
        fontWeight: '600',
    },
});

export default DashboardScreen;
