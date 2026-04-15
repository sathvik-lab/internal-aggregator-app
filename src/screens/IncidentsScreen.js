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
import { useEffectiveRole } from '../hooks/useEffectiveRole';
import Header from '../components/common/Header';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { INCIDENT_SEVERITY, INCIDENT_TYPES } from '../constants/constants';
import { createIncident, listIncidents } from '../services/incidents';
import { ROUTES } from '../navigation/navigationConfig';

const TYPE_OPTIONS = Object.values(INCIDENT_TYPES);
const SEVERITY_OPTIONS = Object.values(INCIDENT_SEVERITY);

const IncidentsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { loading: roleLoading } = useEffectiveRole();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(INCIDENT_TYPES.OTHER);
  const [severity, setSeverity] = useState(INCIDENT_SEVERITY.MINOR);
  const [mediaFile, setMediaFile] = useState(null);

  const loadItems = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    const result = await listIncidents({ limit: 100 });
    if (result.error) {
      setError(result.error.message || 'Unable to load incidents.');
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
        name: asset.fileName || `incident-${Date.now()}.jpg`,
      });
    }
  };

  const resetCreateState = () => {
    setTitle('');
    setDescription('');
    setType(INCIDENT_TYPES.OTHER);
    setSeverity(INCIDENT_SEVERITY.MINOR);
    setMediaFile(null);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter an incident title.');
      return;
    }
    setSaving(true);
    const result = await createIncident({
      title,
      description,
      type,
      severity,
      mediaFile,
      mediaType: 'image',
    });
    setSaving(false);
    if (result.error) {
      Alert.alert('Create failed', result.error.message || 'Unable to create incident.');
      return;
    }
    setCreateVisible(false);
    resetCreateState();
    await loadItems({ showLoading: false });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate(ROUTES.MAIN.INCIDENTS, { screen: ROUTES.INCIDENTS.DETAIL, params: { incidentId: item.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Open incident ${item.title || 'details'}`}
    >
      <Text style={[styles.itemTitle, { color: colors.text?.primary || colors.text }]}>{item.title || 'Untitled incident'}</Text>
      <Text style={[styles.itemMeta, { color: colors.textSecondary || colors.text?.secondary }]}>
        {item.type || INCIDENT_TYPES.OTHER} · {item.severity || INCIDENT_SEVERITY.MINOR} · {item.status || 'open'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      <View style={styles.topActions}>
        <Text style={[styles.screenTitle, { color: colors.text?.primary || colors.text }]}>Incidents</Text>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}55` },
            roleLoading && styles.createButtonDisabled,
          ]}
          onPress={() => setCreateVisible(true)}
          disabled={roleLoading}
          accessibilityState={{ disabled: roleLoading }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.createButtonText, { color: colors.primary }]}>Report Incident</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSkeleton type="list" count={5} />
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Could not load incidents" message={error} showAction actionLabel="Retry" onAction={() => loadItems({ showLoading: true })} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="alert-outline"
              title="No incidents yet"
              message="Report incidents to track safety and equipment issues."
            />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}

      <Modal visible={createVisible} transparent animationType="slide" onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text?.primary || colors.text }]}>Create Incident</Text>
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
            <View style={styles.optionRow}>
              {TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionChip, { borderColor: type === option ? colors.primary : colors.border }]}
                  onPress={() => setType(option)}
                >
                  <Text style={{ color: type === option ? colors.primary : (colors.textSecondary || colors.text?.secondary), fontSize: 12 }}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.optionRow}>
              {SEVERITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionChip, { borderColor: severity === option ? colors.primary : colors.border }]}
                  onPress={() => setSeverity(option)}
                >
                  <Text style={{ color: severity === option ? colors.primary : (colors.textSecondary || colors.text?.secondary), fontSize: 12 }}>{option}</Text>
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
  createButtonDisabled: { opacity: 0.45 },
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

export default IncidentsScreen;
