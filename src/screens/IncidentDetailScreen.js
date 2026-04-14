import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { getIncidentById, updateIncident } from '../services/incidents';

const IncidentDetailScreen = () => {
  const route = useRoute();
  const { colors } = useTheme();
  const incidentId = route.params?.incidentId;
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState(null);
  const [error, setError] = useState('');

  const loadIncident = useCallback(async () => {
    if (!incidentId) {
      setError('Missing incident ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getIncidentById(incidentId);
    if (result.error || !result.data) {
      setError(result.error?.message || 'Incident not found.');
      setIncident(null);
    } else {
      setError('');
      setIncident(result.data);
    }
    setLoading(false);
  }, [incidentId]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  const handleStatusUpdate = async (status) => {
    const result = await updateIncident({ incidentId, updates: { status } });
    if (result.error) {
      Alert.alert('Update failed', result.error.message || 'Could not update incident.');
      return;
    }
    await loadIncident();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      {loading ? (
        <LoadingSkeleton type="card" count={2} />
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Incident unavailable" message={error} showAction actionLabel="Retry" onAction={loadIncident} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text?.primary || colors.text }]}>{incident?.title || 'Incident'}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary || colors.text?.secondary }]}>
            {incident?.type} · {incident?.severity} · {incident?.status}
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.text?.primary || colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.text?.primary || colors.text }]}>
            {incident?.description || 'No description provided.'}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text?.primary || colors.text }]}>Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.primary }]} onPress={() => handleStatusUpdate('in_progress')}>
              <Text style={[styles.actionText, { color: colors.primary }]}>Mark In Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.success }]} onPress={() => handleStatusUpdate('resolved')}>
              <Text style={[styles.actionText, { color: colors.success }]}>Mark Resolved</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 6, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', marginTop: 8 },
  actionButton: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginRight: 8,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
});

export default IncidentDetailScreen;
