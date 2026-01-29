/**
 * Documents Screen
 * 
 * Screen for managing compliance documents with search, filters, and sorting.
 * Integrates with Firestore for real-time document updates.
 * 
 * Firestore Query Patterns:
 * - Real-time listener: setupRealtimeListener('documents', conditions, callback)
 * - Search: Client-side filtering on document name (Firestore text search is limited)
 * - Filter: Client-side filtering by category
 * - Sort: Client-side sorting (Firestore supports one orderBy per query)
 * - Pagination: Use startAfter with limit for pagination
 * 
 * Example real Firestore query:
 * ```javascript
 * import { collection, query, where, orderBy, limit, onSnapshot, startAfter } from 'firebase/firestore';
 * import { db } from '../services/firebase';
 * 
 * const q = query(
 *   collection(db, 'documents'),
 *   where('userId', '==', currentUser.uid),
 *   orderBy('uploadDate', 'desc'),
 *   limit(20)
 * );
 * 
 * const unsubscribe = onSnapshot(q, (snapshot) => {
 *   const docs = snapshot.docs.map(doc => ({
 *     id: doc.id,
 *     ...doc.data()
 *   }));
 *   setDocuments(docs);
 * });
 * ```
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DocumentCard from '../components/documents/DocumentCard';
import SearchBar from '../components/documents/SearchBar';
import FilterChip from '../components/documents/FilterChip';
import SortDropdown from '../components/documents/SortDropdown';
import UploadDocumentModal from '../components/documents/UploadDocumentModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { COLORS } from '../constants/colors';
import { setupRealtimeListener } from '../services/firestore';
import { PAGINATION } from '../constants/constants';
import { ROUTES } from '../navigation/navigationConfig';

// Available document categories (extracted from mock data)
const DOCUMENT_CATEGORIES = [
    'All',
    'Certifications',
    'Policies',
    'Legal',
    'Safety Reports',
];

/**
 * Sort documents based on sort option
 * @param {Array} documents - Array of documents
 * @param {string} sortOption - Sort option value
 * @returns {Array} Sorted documents
 */
const sortDocuments = (documents, sortOption) => {
    const sorted = [...documents];

    switch (sortOption) {
        case 'date-desc':
            return sorted.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        case 'date-asc':
            return sorted.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'size-desc':
            return sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
        case 'size-asc':
            return sorted.sort((a, b) => (a.size || 0) - (b.size || 0));
        case 'type-asc':
            return sorted.sort((a, b) => (a.mimeType || '').localeCompare(b.mimeType || ''));
        default:
            return sorted;
    }
};

/**
 * Filter documents based on search query and category
 * @param {Array} documents - Array of documents
 * @param {string} searchQuery - Search query string
 * @param {string} selectedCategory - Selected category filter
 * @returns {Array} Filtered documents
 */
const filterDocuments = (documents, searchQuery, selectedCategory) => {
    let filtered = [...documents];

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
        filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    // Filter by search query (case-insensitive search on name)
    if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((doc) =>
            doc.name.toLowerCase().includes(query)
        );
    }

    return filtered;
};

const DocumentsScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { colors } = useTheme();

    // State management
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState('date-desc');
    const [lastDocument, setLastDocument] = useState(null); // For pagination
    const [hasMore, setHasMore] = useState(true);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);

    /**
     * Set up real-time listener for user's documents
     * 
     * Real Firestore implementation would look like:
     * ```javascript
     * const q = query(
     *   collection(db, 'documents'),
     *   where('userId', '==', user.uid),
     *   orderBy('uploadDate', 'desc'),
     *   limit(PAGINATION.DEFAULT_PAGE_SIZE)
     * );
     * 
     * const unsubscribe = onSnapshot(q, (snapshot) => {
     *   const docs = snapshot.docs.map(doc => ({
     *     id: doc.id,
     *     ...doc.data()
     *   }));
     *   setDocuments(docs);
     *   setLastDocument(snapshot.docs[snapshot.docs.length - 1]);
     *   setHasMore(snapshot.docs.length === PAGINATION.DEFAULT_PAGE_SIZE);
     * });
     * ```
     */
    const setupDocumentsListener = useCallback(() => {
        if (!user?.uid) {
            setLoading(false);
            return () => {};
        }

        setLoading(true);

        // Set up real-time listener for user's documents
        // Real Firestore: query(collection(db, 'documents'),
        //   where('userId', '==', user.uid),
        //   orderBy('uploadDate', 'desc'),
        //   limit(PAGINATION.DEFAULT_PAGE_SIZE))
        const unsubscribe = setupRealtimeListener(
            'documents',
            [{ field: 'userId', operator: '==', value: user.uid }],
            (docs, error) => {
                if (error) {
                    console.error('Error fetching documents:', error);
                    setDocuments([]);
                } else {
                    // For mock data, we get all documents, but in real Firestore,
                    // we'd get paginated results
                    setDocuments(docs || []);
                    // In real implementation, set lastDocument and hasMore based on snapshot
                    setLastDocument(null);
                    setHasMore(false); // Mock data doesn't support pagination
                }
                setLoading(false);
            },
            {
                orderBy: { field: 'uploadDate', direction: 'desc' },
                limit: PAGINATION.DEFAULT_PAGE_SIZE,
            }
        );

        return unsubscribe;
    }, [user]);

    // Set up listener on mount and when user changes
    useEffect(() => {
        const unsubscribe = setupDocumentsListener();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [setupDocumentsListener]);

    // Apply filters and sorting to documents
    const filteredAndSortedDocuments = useMemo(() => {
        const filtered = filterDocuments(documents, searchQuery, selectedCategory);
        return sortDocuments(filtered, sortOption);
    }, [documents, searchQuery, selectedCategory, sortOption]);

    // Pull-to-refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // In real implementation, this would refetch from Firestore
        // For now, just reset the listener
        const unsubscribe = setupDocumentsListener();
        setTimeout(() => {
            setRefreshing(false);
            if (unsubscribe) unsubscribe();
        }, 1000);
    }, [setupDocumentsListener]);

    // Load more documents (pagination)
    const loadMore = useCallback(() => {
        if (!hasMore || loading) return;

        // TODO: Implement pagination with Firestore startAfter
        // Real Firestore implementation:
        // ```javascript
        // const nextQuery = query(
        //   collection(db, 'documents'),
        //   where('userId', '==', user.uid),
        //   orderBy('uploadDate', 'desc'),
        //   startAfter(lastDocument),
        //   limit(PAGINATION.DEFAULT_PAGE_SIZE)
        // );
        // const snapshot = await getDocs(nextQuery);
        // const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // setDocuments([...documents, ...newDocs]);
        // setLastDocument(snapshot.docs[snapshot.docs.length - 1]);
        // setHasMore(snapshot.docs.length === PAGINATION.DEFAULT_PAGE_SIZE);
        // ```
    }, [hasMore, loading]);

    // Handlers
    const handleDocumentPress = (document) => {
        navigation.navigate(ROUTES.DOCUMENTS.DETAIL, { documentId: document.id });
    };

    const handleMenuPress = (document) => {
        Alert.alert(
            'Document Actions',
            `Actions for: ${document.name}`,
            [
                { text: 'Download', onPress: () => console.log('Download:', document.id) },
                { text: 'Share', onPress: () => console.log('Share:', document.id) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Delete Document',
                            'Are you sure you want to delete this document?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => {
                                        // TODO: Implement delete functionality
                                        console.log('Delete:', document.id);
                                    },
                                },
                            ]
                        );
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleUploadPress = () => {
        setUploadModalVisible(true);
    };

    const handleUploadSuccess = () => {
        // Refresh documents list after successful upload
        const unsubscribe = setupDocumentsListener();
        setTimeout(() => {
            if (unsubscribe) unsubscribe();
        }, 100);
    };

    const handleSearchClear = () => {
        setSearchQuery('');
    };

    // Memoize render functions to prevent re-creation on every render
    const renderDocument = useCallback(({ item }) => (
        <DocumentCard
            document={item}
            onPress={handleDocumentPress}
            onMenuPress={handleMenuPress}
        />
    ), [handleDocumentPress, handleMenuPress]);

    // Memoize header to prevent re-renders
    const renderHeader = useCallback(() => (
        <View style={styles.header}>
            {/* Search Bar */}
            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={handleSearchClear}
            />

            {/* Filter Chips */}
            <View style={styles.filtersContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={DOCUMENT_CATEGORIES}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <FilterChip
                            label={item}
                            selected={selectedCategory === item}
                            onPress={() => setSelectedCategory(item)}
                        />
                    )}
                    contentContainerStyle={styles.filtersList}
                />
            </View>

            {/* Sort Dropdown */}
            <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort:</Text>
                <SortDropdown value={sortOption} onChange={setSortOption} />
            </View>
        </View>
    ), [searchQuery, selectedCategory, sortOption, handleSearchClear, setSelectedCategory, setSortOption]);

    // Memoize empty state render
    const renderEmpty = useCallback(() => {
        if (loading) {
            return <LoadingSkeleton type="card" count={3} />;
        }

        if (searchQuery.trim().length > 0 || selectedCategory !== 'All') {
            return (
                <EmptyState
                    icon="file-search-outline"
                    title="No documents found"
                    message="Try adjusting your search or filter criteria."
                />
            );
        }

        return (
            <EmptyState
                icon="file-document-outline"
                title="No documents yet"
                message="Upload your first compliance document to get started."
                showAction
                actionLabel="Upload Document"
                onAction={handleUploadPress}
            />
        );
    }, [loading, searchQuery, selectedCategory, handleUploadPress]);

    // Use dark background for glassmorphism
    const backgroundColor = colors.zinc950 || colors.background;
    
    return (
        <View style={[styles.container, { backgroundColor }]}>
            <FlatList
                data={filteredAndSortedDocuments}
                renderItem={renderDocument}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={[
                    styles.listContent,
                    filteredAndSortedDocuments.length === 0 && styles.listContentEmpty,
                ]}
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
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                // Performance optimizations
                windowSize={10} // Render 10 screens worth of items (5 above, 5 below)
                initialNumToRender={10} // Render 10 items initially
                maxToRenderPerBatch={10} // Render 10 items per batch
                updateCellsBatchingPeriod={50} // Batch updates every 50ms
                removeClippedSubviews={true} // Remove off-screen views from native view hierarchy
                getItemLayout={(data, index) => ({
                    length: 200, // Approximate item height (card + margin)
                    offset: 200 * index,
                    index,
                })}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleUploadPress}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="plus" size={28} color={COLORS.textInverse} />
            </TouchableOpacity>

            {/* Upload Document Modal */}
            <UploadDocumentModal
                visible={uploadModalVisible}
                onClose={() => setUploadModalVisible(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100, // Space for FAB
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    header: {
        marginBottom: 20,
    },
    filtersContainer: {
        marginTop: 16,
        marginBottom: 16,
    },
    filtersList: {
        paddingRight: 20,
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    sortLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default DocumentsScreen;
