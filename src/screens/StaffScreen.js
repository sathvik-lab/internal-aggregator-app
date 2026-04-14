import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/colors';
import { createInviteCode, getBusinessContext, listBusinessMembers } from '../services/businessMembers';
import { useEffectiveRole } from '../hooks/useEffectiveRole';

const StaffScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isOwner } = useEffectiveRole();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [business, setBusiness] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const loadData = useCallback(async () => {
    if (!user?.uid || !isOwner) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const contextResult = await getBusinessContext(user.uid);
    if (contextResult.error) {
      setBusiness(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setBusiness(contextResult.data.business || null);
    const membersResult = await listBusinessMembers({
      userId: user.uid,
      businessId: contextResult.data.businessId,
    });
    if (membersResult.error) {
      setMembers([]);
    } else {
      setMembers(membersResult.data || []);
    }

    setLoading(false);
  }, [isOwner, user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleGenerateInviteCode = async () => {
    if (!user?.uid) return;
    setInviteLoading(true);
    const result = await createInviteCode({ userId: user.uid, role: 'staff', ttlHours: 72 });
    setInviteLoading(false);

    if (result.error) {
      Alert.alert('Invite Error', result.error.message || 'Could not generate invite code.');
      return;
    }

    setInviteData(result.data);
  };

  const handleCopyInviteCode = async () => {
    if (!inviteData?.code) return;
    await Clipboard.setStringAsync(inviteData.code);
    Alert.alert('Copied', 'Invite code copied to clipboard.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          accessible
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text?.primary || colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text?.primary || colors.text }]}>
          Team Management
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!isOwner ? (
            <View style={[styles.infoCard, { backgroundColor: `${COLORS.warning}10`, borderColor: `${COLORS.warning}30` }]}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={COLORS.warning} />
              <Text style={[styles.infoText, { color: colors.text?.primary || colors.text }]}>
                Team management is available for owners only. Contact your owner/admin for access changes.
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.card, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text?.primary || colors.text }]}>
                  {business?.name || 'Business Team'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary || colors.text?.secondary }]}>
                  {members.length} member{members.length === 1 ? '' : 's'}
                </Text>
                <TouchableOpacity
                  style={[styles.inviteButton, { backgroundColor: `${COLORS.primary}14`, borderColor: `${COLORS.primary}40` }]}
                  onPress={() => setInviteVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Invite teammate"
                >
                  <MaterialCommunityIcons name="account-plus-outline" size={18} color={COLORS.primary} />
                  <Text style={[styles.inviteButtonText, { color: COLORS.primary }]}>Invite teammate</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.membersCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.membersTitle, { color: colors.text?.primary || colors.text }]}>Team Members</Text>
                {loading ? (
                  <Text style={[styles.memberMeta, { color: colors.textSecondary || colors.text?.secondary }]}>Loading members...</Text>
                ) : members.length === 0 ? (
                  <Text style={[styles.memberMeta, { color: colors.textSecondary || colors.text?.secondary }]}>No members yet.</Text>
                ) : (
                  members.map((member) => (
                    <View key={member.id} style={[styles.memberRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.memberLeft}>
                        <MaterialCommunityIcons
                          name={member.role === 'owner' ? 'shield-crown-outline' : 'account-outline'}
                          size={18}
                          color={member.role === 'owner' ? COLORS.primary : (colors.textSecondary || colors.text?.secondary)}
                        />
                        <View style={styles.memberTextBlock}>
                          <Text style={[styles.memberName, { color: colors.text?.primary || colors.text }]}>
                            {member.userId || member.id}
                          </Text>
                          <Text style={[styles.memberMeta, { color: colors.textSecondary || colors.text?.secondary }]}>
                            {member.role || 'staff'} • {member.status || 'active'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
                <Button mode="text" onPress={onRefresh} disabled={refreshing || loading}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={inviteVisible} transparent animationType="fade" onRequestClose={() => setInviteVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface?.surface || colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text?.primary || colors.text }]}>Invite teammate</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary || colors.text?.secondary }]}>
              Full email/deep-link invites are coming soon. For now, generate a temporary invite code and share it manually.
            </Text>

            {inviteData?.code ? (
              <View style={[styles.codeCard, { borderColor: colors.border }]}>
                <Text style={[styles.codeLabel, { color: colors.textSecondary || colors.text?.secondary }]}>Invite Code</Text>
                <Text style={[styles.codeValue, { color: colors.text?.primary || colors.text }]}>{inviteData.code}</Text>
                <Text style={[styles.codeMeta, { color: colors.textSecondary || colors.text?.secondary }]}>
                  Expires: {inviteData.expiresAt ? new Date(inviteData.expiresAt).toLocaleString() : 'N/A'}
                </Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Button onPress={() => setInviteVisible(false)}>Close</Button>
              <Button onPress={handleGenerateInviteCode} loading={inviteLoading} disabled={inviteLoading}>
                Generate Code
              </Button>
              <Button onPress={handleCopyInviteCode} disabled={!inviteData?.code}>
                Copy
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  membersCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  memberRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberTextBlock: {
    marginLeft: 10,
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  codeCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 12,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    marginVertical: 4,
  },
  codeMeta: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
});

export default StaffScreen;
