/**
 * MediaLogScreen
 *
 * Screen for viewing daily/weekly/monthly media logs (photos/videos) with notes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchMediaLogs } from '../services/mediaLogs';
import AddMediaLogModal from '../components/media/AddMediaLogModal';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { COLORS } from '../constants/colors';
const RANGE_OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'all', label: 'All' },
];

const MediaLogScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, typography } = useTheme();

  const [rangeType, setRangeType] = useState('daily');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const nextRangeType = route.params?.initialRangeType;
    const shouldOpenComposer = route.params?.openComposer;

    if (nextRangeType && RANGE_OPTIONS.some((option) => option.key === nextRangeType)) {
      setRangeType(nextRangeType);
    }

    if (shouldOpenComposer && !modalVisible) {
      setModalVisible(true);
      navigation.setParams({ openComposer: undefined });
    }
  }, [modalVisible, navigation, route.params?.focusKey, route.params?.initialRangeType, route.params?.openComposer]);

  const loadLogs = useCallback(
    async (type, { showLoading = true } = {}) => {
      if (!user?.uid) {
        setLogs([]);
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      const { data, error } = await fetchMediaLogs(type, { userId: user?.uid });

      if (error) {
        console.error('Error fetching media logs:', error);
        setLogs([]);
      } else {
        setLogs(data || []);
      }

      setLoading(false);
    },
    [user]
  );

  useEffect(() => {
    loadLogs(rangeType, { showLoading: true });
  }, [rangeType, loadLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLogs(rangeType, { showLoading: false });
    setRefreshing(false);
  }, [loadLogs, rangeType]);

  const handleNewLogPress = () => {
    setModalVisible(true);
  };

  const handleLogCreated = () => {
    loadLogs(rangeType, { showLoading: false });
  };

  const renderRangeFilters = () => (
    <View style={styles.filtersRow}>
      {RANGE_OPTIONS.map((option) => (
        <Button
          key={option.key}
          title={option.label}
          variant={rangeType === option.key ? 'primary' : 'outline'}
          size="small"
          onPress={() => setRangeType(option.key)}
          style={styles.filterButton}
          accessible
          accessibilityLabel={`${option.label} media logs filter`}
          accessibilityRole="button"
        />
      ))}
    </View>
  );

  const formatTimestamp = (item) => {
    const iso =
      item.createdAt ||
      item.logDate ||
      null;

    if (!iso) {
      return '';
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleString();
  };

  const renderItem = ({ item }) => {
    const isPhoto = item.mediaType === 'photo';
    const timestamp = formatTimestamp(item);

    return (
      <View style={[styles.card, { backgroundColor: colors.surface?.surface || COLORS.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.mediaTypePill}>
            <Text style={[styles.mediaTypeText, { color: colors.textInverse }]}>
              {isPhoto ? 'Photo' : 'Video'}
            </Text>
          </View>
            <Text style={[styles.timestamp, { color: colors.textSecondary || COLORS.textSecondary }]}>
            {timestamp}
          </Text>
        </View>
        {item.note && (
          <Text
            style={[styles.noteText, { color: colors.text?.primary || COLORS.text }]}
            numberOfLines={3}
          >
            {item.note}
          </Text>
        )}
        {!item.note && (
          <Text
            style={[styles.notePlaceholder, { color: colors.textSecondary || colors.text?.secondary || COLORS.textSecondary }]}
          >
            No notes added
          </Text>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    return (
      <EmptyState
        icon="image-multiple-outline"
        title="No media logs yet"
        message="Capture a photo or video with notes to start your daily/weekly/monthly logs."
        showAction
        actionLabel="Add Media Log"
        onAction={handleNewLogPress}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background || COLORS.background }]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: colors.text?.primary || COLORS.text, ...typography.textStyles.h2 },
          ]}
        >
          Media Logs
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.text?.secondary || colors.textSecondary || COLORS.textSecondary, ...typography.textStyles.body },
          ]}
        >
          Capture photo & video logs with notes for your compliance records.
        </Text>
      </View>

      {renderRangeFilters()}

      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          logs.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={Platform.OS === 'android' ? 20 : 0}
            progressBackgroundColor={colors.surface?.surface || COLORS.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewLogPress}
        activeOpacity={0.8}
        accessible
        accessibilityLabel="Add new media log"
        accessibilityRole="button"
        accessibilityHint="Double tap to capture or upload a photo or video log"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddMediaLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreateSuccess={handleLogCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    minHeight: 44,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaTypePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  mediaTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  noteText: {
    fontSize: 14,
    marginTop: 4,
  },
  notePlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: Number(20),
    bottom: Number(20),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: Number(0), height: Number(4) },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabText: {
    fontSize: 28,
    color: COLORS.textInverse,
    marginTop: -2,
  },
});

export default MediaLogScreen;
