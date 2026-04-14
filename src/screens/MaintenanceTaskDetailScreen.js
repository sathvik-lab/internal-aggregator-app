import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { getMaintenanceTaskById, updateMaintenanceTask } from '../services/maintenanceTasks';

const MaintenanceTaskDetailScreen = () => {
  const route = useRoute();
  const { colors } = useTheme();
  const taskId = route.params?.taskId;
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  const loadTask = useCallback(async () => {
    if (!taskId) {
      setError('Missing task ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getMaintenanceTaskById(taskId);
    if (result.error || !result.data) {
      setError(result.error?.message || 'Task not found.');
      setTask(null);
    } else {
      setError('');
      setTask(result.data);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleStatusUpdate = async (status) => {
    const result = await updateMaintenanceTask({ taskId, updates: { status } });
    if (result.error) {
      Alert.alert('Update failed', result.error.message || 'Could not update task.');
      return;
    }
    await loadTask();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      {loading ? (
        <LoadingSkeleton type="card" count={2} />
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Task unavailable" message={error} showAction actionLabel="Retry" onAction={loadTask} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text?.primary || colors.text }]}>{task?.title || 'Maintenance task'}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary || colors.text?.secondary }]}>
            {task?.status || 'open'}{task?.dueDate ? ` · due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.text?.primary || colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.text?.primary || colors.text }]}>
            {task?.description || 'No description provided.'}
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text?.primary || colors.text }]}>Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.primary }]} onPress={() => handleStatusUpdate('in_progress')}>
              <Text style={[styles.actionText, { color: colors.primary }]}>Mark In Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.success }]} onPress={() => handleStatusUpdate('completed')}>
              <Text style={[styles.actionText, { color: colors.success }]}>Mark Completed</Text>
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

export default MaintenanceTaskDetailScreen;
