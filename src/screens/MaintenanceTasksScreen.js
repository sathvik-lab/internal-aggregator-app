import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/common/Header';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { createMaintenanceTask, listMaintenanceTasks } from '../services/maintenanceTasks';
import { ROUTES } from '../navigation/navigationConfig';

const STATUS_OPTIONS = ['open', 'in_progress', 'completed'];

const MaintenanceTasksScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('open');
  const [mediaFile, setMediaFile] = useState(null);

  const loadItems = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    const result = await listMaintenanceTasks({ limit: 100 });
    if (result.error) {
      setError(result.error.message || 'Unable to load tasks.');
      setItems([]);
    } else {
      setError('');
      setItems(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems({ showLoading: true });
  }, [loadItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems({ showLoading: false });
    setRefreshing(false);
  }, [loadItems]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow media access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setMediaFile({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize || 0,
        name: asset.fileName || `maintenance-${Date.now()}.jpg`,
      });
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a maintenance title.');
      return;
    }
    setSaving(true);
    const result = await createMaintenanceTask({
      title,
      description,
      dueDate: dueDate || null,
      status,
      mediaFile,
      mediaType: 'image',
    });
    setSaving(false);
    if (result.error) {
      Alert.alert('Create failed', result.error.message || 'Unable to create maintenance task.');
      return;
    }
    setCreateVisible(false);
    setTitle('');
    setDescription('');
    setDueDate('');
    setStatus('open');
    setMediaFile(null);
    await loadItems({ showLoading: false });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate(ROUTES.MAIN.MAINTENANCE, { screen: ROUTES.MAINTENANCE.DETAIL, params: { taskId: item.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Open maintenance task ${item.title || 'details'}`}
    >
      <Text style={[styles.itemTitle, { color: colors.text?.primary || colors.text }]}>{item.title || 'Untitled task'}</Text>
      <Text style={[styles.itemMeta, { color: colors.textSecondary || colors.text?.secondary }]}>
        {item.status || 'open'}{item.dueDate ? ` · due ${new Date(item.dueDate).toLocaleDateString()}` : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      <View style={styles.topActions}>
        <Text style={[styles.screenTitle, { color: colors.text?.primary || colors.text }]}>Maintenance</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}55` }]}
          onPress={() => setCreateVisible(true)}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.createButtonText, { color: colors.primary }]}>New Task</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSkeleton type="list" count={5} />
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Could not load maintenance tasks" message={error} showAction actionLabel="Retry" onAction={() => loadItems({ showLoading: true })} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="tools"
              title="No maintenance tasks"
              message="Create preventive maintenance tasks to stay inspection-ready."
            />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}

      <Modal visible={createVisible} transparent animationType="slide" onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text?.primary || colors.text }]}>Create Maintenance Task</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text?.primary || colors.text }]}
              placeholder="Title"
              placeholderTextColor={colors.textSecondary || colors.text?.secondary}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text?.primary || colors.text }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary || colors.text?.secondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text?.primary || colors.text }]}
              placeholder="Due date (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary || colors.text?.secondary}
              value={dueDate}
              onChangeText={setDueDate}
            />
            <View style={styles.optionRow}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionChip, { borderColor: status === option ? colors.primary : colors.border }]}
                  onPress={() => setStatus(option)}
                >
                  <Text style={{ color: status === option ? colors.primary : (colors.textSecondary || colors.text?.secondary), fontSize: 12 }}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.secondaryAction, { borderColor: colors.border }]} onPress={pickImage}>
              <MaterialCommunityIcons name="image-plus" size={18} color={colors.primary} />
              <Text style={[styles.secondaryActionText, { color: colors.primary }]}>
                {mediaFile ? 'Image attached' : 'Attach image (optional)'}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setCreateVisible(false)}>
                <Text style={{ color: colors.textSecondary || colors.text?.secondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} disabled={saving}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>{saving ? 'Saving...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topActions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: { fontSize: 22, fontWeight: '700' },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 38,
  },
  createButtonText: { marginLeft: 6, fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  itemCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  itemTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  itemMeta: { fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  textArea: { minHeight: 86, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  optionChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  secondaryActionText: { marginLeft: 8, fontWeight: '600' },
  modalActions: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' },
});

export default MaintenanceTasksScreen;
