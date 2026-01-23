/**
 * Checklist Screen
 * 
 * Screen for managing compliance checklists with tab navigation.
 * Features Today, Upcoming, and Completed tabs with real-time Firestore updates.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    SectionList,
    RefreshControl,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FAB, ProgressBar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import ChecklistItem from '../components/checklist/ChecklistItem';
import AddChecklistItemModal from '../components/checklist/AddChecklistItemModal';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { setupRealtimeListener, updateDocument, queryDocuments } from '../services/firestore';
import { CHECKLIST_STATUS } from '../constants/constants';
import { MOCK_CHECKLIST_CATEGORIES } from '../utils/mockData';
import { syncTemplates, getCachedTemplates } from '../services/checklistTemplateSync';
import { setupInstancesListener, syncInstances, getCachedInstances } from '../services/checklistInstanceSync';

const TABS = {
    TODAY: 'today',
    UPCOMING: 'upcoming',
    COMPLETED: 'completed',
};

/**
 * Get start and end of today
 */
const getTodayRange = () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return { todayStart, todayEnd };
};

/**
 * Format date for section headers
 */
const formatSectionDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
        return 'Today';
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
};

/**
 * Group items by date
 */
const groupItemsByDate = (items) => {
    const grouped = {};
    items.forEach((item) => {
        if (!item.dueDate) return;
        const dateKey = new Date(item.dueDate).toDateString();
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(item);
    });

    return Object.keys(grouped)
        .sort()
        .map((dateKey) => ({
            title: formatSectionDate(grouped[dateKey][0].dueDate),
            data: grouped[dateKey],
        }));
};

const ChecklistScreen = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.TODAY);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Data states
    const [todayItems, setTodayItems] = useState([]);
    const [upcomingItems, setUpcomingItems] = useState([]);
    const [completedItems, setCompletedItems] = useState([]);

    // Filter states
    const [selectedPriority, setSelectedPriority] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Template sync states
    const [syncingTemplates, setSyncingTemplates] = useState(false);
    const [templatesLoaded, setTemplatesLoaded] = useState(false);

    // Calculate today's completion percentage
    const todayCompletionPercentage = useMemo(() => {
        if (todayItems.length === 0) return 100;
        const completed = todayItems.filter((item) => item.completed).length;
        return (completed / todayItems.length) * 100;
    }, [todayItems]);

    // Note: fetchTodayItems and fetchUpcomingItems are replaced by setupInstancesListener
    // which handles both today and upcoming items in a single listener

    /**
     * Fetch completed items
     */
    const fetchCompletedItems = useCallback(() => {
        if (!user?.uid) {
            setCompletedItems([]);
            return;
        }

        // Real Firestore query:
        // const completedQuery = query(
        //   collection(db, 'checklistItems'),
        //   where('userId', '==', user.uid),
        //   where('completed', '==', true),
        //   orderBy('completedAt', 'desc')
        // );

        const conditions = [
            { field: 'userId', operator: '==', value: user.uid },
            { field: 'completed', operator: '==', value: true },
        ];

        const options = {
            orderBy: { field: 'completedAt', direction: 'desc' },
        };

        const unsubscribe = setupRealtimeListener(
            'checklistItems',
            conditions,
            (data, error) => {
                if (error) {
                    console.error('Error fetching completed items:', error);
                    setCompletedItems([]);
                } else {
                    setCompletedItems(data);
                }
            },
            options
        );

        return unsubscribe;
    }, [user]);

    /**
     * Sync templates and generate instances
     */
    const syncTemplatesAndInstances = useCallback(async (forceRefresh = false) => {
        if (!user?.uid) return;

        setSyncingTemplates(true);
        try {
            // Try cache first if not forcing refresh
            let templates = [];
            if (!forceRefresh) {
                templates = await getCachedTemplates(user.uid);
            }

            // If no cache or forcing refresh, sync from Firestore
            if (templates.length === 0 || forceRefresh) {
                const syncResult = await syncTemplates(user.uid, forceRefresh);
                if (!syncResult.error) {
                    templates = syncResult.templates;
                } else {
                    console.error('Error syncing templates:', syncResult.error);
                }
            }

            // Generate instances from templates
            if (templates.length > 0) {
                await syncInstances(user.uid, templates);
            }

            setTemplatesLoaded(true);
        } catch (error) {
            console.error('Error syncing templates and instances:', error);
        } finally {
            setSyncingTemplates(false);
        }
    }, [user]);

    /**
     * Set up template sync on mount
     */
    useEffect(() => {
        if (user?.uid) {
            syncTemplatesAndInstances();
        }
    }, [user, syncTemplatesAndInstances]);

    /**
     * Set up all real-time listeners
     */
    useEffect(() => {
        const unsubscribes = [];

        if (user?.uid) {
            // Set up real-time listener for active checklist items (replaces fetchTodayItems and fetchUpcomingItems)
            const instancesUnsubscribe = setupInstancesListener(user.uid, (items) => {
                // Filter items by date for today/upcoming
                const { todayStart, todayEnd } = getTodayRange();
                const today = items.filter(item => {
                    if (!item.dueDate) return false;
                    const dueDate = new Date(item.dueDate);
                    return dueDate >= todayStart && dueDate <= todayEnd;
                });
                const upcoming = items.filter(item => {
                    if (!item.dueDate) return false;
                    const dueDate = new Date(item.dueDate);
                    return dueDate > todayEnd;
                });
                setTodayItems(today);
                setUpcomingItems(upcoming);
                setLoading(false);
                setRefreshing(false);
            });
            if (instancesUnsubscribe) {
                unsubscribes.push(instancesUnsubscribe);
            }

            // Keep existing listener for completed items
            unsubscribes.push(fetchCompletedItems());
        } else {
            setLoading(false);
        }

        return () => {
            unsubscribes.forEach((unsubscribe) => {
                if (unsubscribe) unsubscribe();
            });
        };
    }, [user, fetchCompletedItems]);

    /**
     * Handle pull to refresh
     */
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        // Sync templates and instances (real-time listeners will update automatically)
        await syncTemplatesAndInstances(true);
        // Note: fetchCompletedItems() is not called here to avoid duplicate listeners.
        // The existing useEffect real-time listener (line 246) continues to drive state updates.
        setRefreshing(false);
    }, [syncTemplatesAndInstances]);

    /**
     * Handle manual template sync
     */
    const handleSyncTemplates = useCallback(async () => {
        setSyncingTemplates(true);
        try {
            await syncTemplatesAndInstances(true);
            Alert.alert('Success', 'Templates synced successfully!');
        } catch (error) {
            console.error('Error syncing templates:', error);
            Alert.alert('Error', 'Failed to sync templates. Please try again.');
        } finally {
            setSyncingTemplates(false);
        }
    }, [syncTemplatesAndInstances]);

    /**
     * Handle mark as complete
     */
    const handleToggleComplete = useCallback(
        async (item) => {
            try {
                const updatedData = {
                    completed: !item.completed,
                    completedAt: item.completed ? null : new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                // Real Firestore:
                // await updateDocument('checklistItems', item.id, {
                //   completed: !item.completed,
                //   completedAt: item.completed ? null : serverTimestamp(),
                //   updatedAt: serverTimestamp(),
                // });

                const result = await updateDocument('checklistItems', item.id, updatedData);

                if (result.error) {
                    Alert.alert('Error', 'Failed to update checklist item. Please try again.');
                }
            } catch (error) {
                console.error('Error toggling complete:', error);
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        },
        []
    );

    /**
     * Handle snooze
     */
    const handleSnooze = useCallback(
        async (item) => {
            // Snooze for 1 day
            const newDueDate = new Date(item.dueDate);
            newDueDate.setDate(newDueDate.getDate() + 1);

            try {
                const result = await updateDocument('checklistItems', item.id, {
                    dueDate: newDueDate.toISOString(),
                    updatedAt: new Date().toISOString(),
                });

                if (result.error) {
                    Alert.alert('Error', 'Failed to snooze checklist item. Please try again.');
                } else {
                    Alert.alert('Success', 'Checklist item snoozed until tomorrow.');
                }
            } catch (error) {
                console.error('Error snoozing item:', error);
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        },
        []
    );

    /**
     * Handle view details
     */
    const handleViewDetails = useCallback((item) => {
        // TODO: Navigate to checklist item detail screen
        Alert.alert('Checklist Item Details', item.title, [
            { text: 'OK', style: 'default' },
        ]);
    }, []);

    /**
     * Handle add new item
     */
    const handleAddItem = useCallback(() => {
        setShowAddModal(true);
    }, []);

    /**
     * Handle modal close
     */
    const handleModalClose = useCallback(() => {
        setShowAddModal(false);
    }, []);

    /**
     * Handle successful item creation
     */
    const handleItemCreated = useCallback(() => {
        // Data will update automatically via real-time listeners
        // Optionally trigger a refresh
        handleRefresh();
    }, [handleRefresh]);

    /**
     * Apply filters to items
     */
    const getFilteredItems = useCallback(
        (items) => {
            let filtered = [...items];

            if (selectedPriority) {
                filtered = filtered.filter((item) => item.priority === selectedPriority);
            }

            if (selectedCategory) {
                filtered = filtered.filter((item) => item.category === selectedCategory);
            }

            return filtered;
        },
        [selectedPriority, selectedCategory]
    );

    /**
     * Get current tab items
     */
    const getCurrentTabItems = useCallback(() => {
        switch (activeTab) {
            case TABS.TODAY:
                return getFilteredItems(todayItems);
            case TABS.UPCOMING:
                return getFilteredItems(upcomingItems);
            case TABS.COMPLETED:
                return getFilteredItems(completedItems);
            default:
                return [];
        }
    }, [activeTab, todayItems, upcomingItems, completedItems, getFilteredItems]);

    // Memoize current items to prevent unnecessary recalculations
    const currentItems = useMemo(() => getCurrentTabItems(), [getCurrentTabItems]);
    
    // Memoize grouped items for upcoming tab
    const groupedUpcomingItems = useMemo(() => {
        return activeTab === TABS.UPCOMING ? groupItemsByDate(currentItems) : [];
    }, [activeTab, currentItems]);

    /**
     * Render tab button
     */
    const renderTabButton = (tabKey, label, icon) => {
        const isActive = activeTab === tabKey;
        return (
            <TouchableOpacity
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tabKey)}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={isActive ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    /**
     * Render filter chips
     */
    const renderFilterChips = () => {
        if (!showFilters) return null;

        const priorities = ['critical', 'high', 'medium', 'low'];
        const categories = MOCK_CHECKLIST_CATEGORIES;

        return (
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                    {/* Priority Filters */}
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Priority:</Text>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                !selectedPriority && styles.filterChipActive,
                            ]}
                            onPress={() => setSelectedPriority(null)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    !selectedPriority && styles.filterChipTextActive,
                                ]}
                            >
                                All
                            </Text>
                        </TouchableOpacity>
                        {priorities.map((priority) => (
                            <TouchableOpacity
                                key={priority}
                                style={[
                                    styles.filterChip,
                                    selectedPriority === priority && styles.filterChipActive,
                                ]}
                                onPress={() =>
                                    setSelectedPriority(
                                        selectedPriority === priority ? null : priority
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        selectedPriority === priority && styles.filterChipTextActive,
                                    ]}
                                >
                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Category Filters */}
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Category:</Text>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                !selectedCategory && styles.filterChipActive,
                            ]}
                            onPress={() => setSelectedCategory(null)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    !selectedCategory && styles.filterChipTextActive,
                                ]}
                            >
                                All
                            </Text>
                        </TouchableOpacity>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.filterChip,
                                    selectedCategory === category && styles.filterChipActive,
                                ]}
                                onPress={() =>
                                    setSelectedCategory(selectedCategory === category ? null : category)
                                }
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        selectedCategory === category && styles.filterChipTextActive,
                                    ]}
                                >
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    // Memoize render item function for all tabs
    const renderChecklistItem = useCallback(({ item }) => (
        <ChecklistItem
            item={item}
            onPress={handleViewDetails}
            onToggleComplete={handleToggleComplete}
            onSnooze={handleSnooze}
        />
    ), [handleViewDetails, handleToggleComplete, handleSnooze]);

    // Memoize section header render function
    const renderSectionHeader = useCallback(({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    ), []);

    /**
     * Render today tab content
     */
    const renderTodayTab = useCallback(() => {
        if (loading) {
            return <LoadingSkeleton type="list" count={3} />;
        }

        if (currentItems.length === 0) {
            return (
                <EmptyState
                    icon="check-circle-outline"
                    title="All caught up!"
                    message="You have no checklist items due today. Great job staying on top of your tasks!"
                />
            );
        }

        return (
            <FlatList
                data={currentItems}
                keyExtractor={(item) => item.id}
                renderItem={renderChecklistItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                // Performance optimizations
                windowSize={10}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
            />
        );
    }, [loading, currentItems, refreshing, handleRefresh, renderChecklistItem]);

    /**
     * Render upcoming tab content
     */
    const renderUpcomingTab = useCallback(() => {
        if (loading) {
            return <LoadingSkeleton type="list" count={3} />;
        }

        if (groupedUpcomingItems.length === 0) {
            return (
                <EmptyState
                    icon="calendar-outline"
                    title="No upcoming items"
                    message="You don't have any upcoming checklist items. Add new items to stay organized!"
                />
            );
        }

        return (
            <SectionList
                sections={groupedUpcomingItems}
                keyExtractor={(item) => item.id}
                renderItem={renderChecklistItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                // Performance optimizations
                windowSize={10}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
            />
        );
    }, [loading, groupedUpcomingItems, refreshing, handleRefresh, renderChecklistItem, renderSectionHeader]);

    // Memoize render item for completed tab (no snooze)
    const renderCompletedItem = useCallback(({ item }) => (
        <ChecklistItem
            item={item}
            onPress={handleViewDetails}
            onToggleComplete={handleToggleComplete}
        />
    ), [handleViewDetails, handleToggleComplete]);

    /**
     * Render completed tab content
     */
    const renderCompletedTab = useCallback(() => {
        if (loading) {
            return <LoadingSkeleton type="list" count={3} />;
        }

        if (currentItems.length === 0) {
            return (
                <EmptyState
                    icon="check-all"
                    title="No completed items"
                    message="Completed checklist items will appear here. Start checking off tasks to see your progress!"
                />
            );
        }

        return (
            <FlatList
                data={currentItems}
                keyExtractor={(item) => item.id}
                renderItem={renderCompletedItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                // Performance optimizations
                windowSize={10}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
            />
        );
    }, [loading, currentItems, refreshing, handleRefresh, renderCompletedItem]);

    /**
     * Render current tab content
     */
    const renderTabContent = () => {
        switch (activeTab) {
            case TABS.TODAY:
                return renderTodayTab();
            case TABS.UPCOMING:
                return renderUpcomingTab();
            case TABS.COMPLETED:
                return renderCompletedTab();
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header with Progress Bar (Today tab only) */}
            {activeTab === TABS.TODAY && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Today's Progress</Text>
                        <Text style={styles.progressPercentage}>
                            {Math.round(todayCompletionPercentage)}%
                        </Text>
                    </View>
                    <ProgressBar
                        progress={todayCompletionPercentage / 100}
                        color={COLORS.success}
                        style={styles.progressBar}
                    />
                    <Text style={styles.progressSubtext}>
                        {todayItems.filter((item) => item.completed).length} of {todayItems.length}{' '}
                        tasks completed
                    </Text>
                </View>
            )}

            {/* Tab Buttons */}
            <View style={styles.tabContainer}>
                {renderTabButton(TABS.TODAY, 'Today', 'calendar-today')}
                {renderTabButton(TABS.UPCOMING, 'Upcoming', 'calendar-clock')}
                {renderTabButton(TABS.COMPLETED, 'Completed', 'check-circle')}
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(!showFilters)}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons
                        name={showFilters ? 'filter' : 'filter-outline'}
                        size={20}
                        color={showFilters ? COLORS.primary : COLORS.textSecondary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.syncButton}
                    onPress={handleSyncTemplates}
                    activeOpacity={0.7}
                    disabled={syncingTemplates}
                >
                    <MaterialCommunityIcons
                        name={syncingTemplates ? 'sync' : 'sync-outline'}
                        size={20}
                        color={syncingTemplates ? COLORS.primary : COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            {renderFilterChips()}

            {/* Tab Content */}
            <View style={styles.content}>{renderTabContent()}</View>

            {/* Floating Action Button */}
            {activeTab !== TABS.COMPLETED && (
                <FAB
                    style={styles.fab}
                    icon="plus"
                    label="Add Item"
                    onPress={handleAddItem}
                    color={COLORS.textInverse}
                />
            )}

            {/* Add Checklist Item Modal */}
            <AddChecklistItemModal
                visible={showAddModal}
                onClose={handleModalClose}
                onSuccess={handleItemCreated}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    progressContainer: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    progressPercentage: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.backgroundSecondary,
        marginBottom: 4,
    },
    progressSubtext: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: COLORS.primary + '15',
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    tabButtonTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    filterButton: {
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    syncButton: {
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 12,
    },
    filtersScroll: {
        paddingHorizontal: 16,
    },
    filterGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        gap: 8,
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginRight: 4,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: COLORS.backgroundSecondary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    filterChipTextActive: {
        color: COLORS.textInverse,
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    sectionHeader: {
        backgroundColor: COLORS.background,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: COLORS.primary,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 6,
            },
        }),
    },
});

export default ChecklistScreen;
