import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Dialog,
  Portal,
  Checkbox,
  Surface,
} from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { GLASS } from '../../utils/glassmorphism';
import {
  getUserProfileDocument,
  normalizeBusinessProfile,
  saveBusinessProfile,
} from '../../services/userProfile';
import { clearTemplateCache, syncTemplates } from '../../services/checklistTemplateSync';
import { syncInstances } from '../../services/checklistInstanceSync';
import {
  TRUCK_TYPES,
  FOOD_TYPES,
  BUSINESS_TYPES,
  COMPLIANCE_AREAS,
  US_STATES,
  TRUCK_TYPE_LABELS,
  FOOD_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  COMPLIANCE_AREA_LABELS,
} from '../../constants/checklistConstants';
import { COLORS } from '../../constants/colors';

const OwnerOnboardingScreen = () => {
  const { user, refreshUserProfile } = useAuth();
  const { colors } = useTheme();
  const useGlass = colors.glassBackground != null;
  const glassColors = colors.glassBackground
    ? {
        background: colors.glassBackground,
        border: colors.glassBorder,
      }
    : GLASS;

  const [truckType, setTruckType] = useState(null);
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [foodTypes, setFoodTypes] = useState([]);
  const [businessType, setBusinessType] = useState(null);
  const [complianceAreas, setComplianceAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [showTruckTypeDialog, setShowTruckTypeDialog] = useState(false);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [showBusinessTypeDialog, setShowBusinessTypeDialog] = useState(false);
  const [showFoodTypesDialog, setShowFoodTypesDialog] = useState(false);
  const [showComplianceAreasDialog, setShowComplianceAreasDialog] = useState(false);
  const lastSubmitRef = useRef({
    payloadHash: '',
    timestamp: 0,
  });

  const loadProfile = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');

    const result = await getUserProfileDocument(user.uid);

    if (result.error) {
      setLoadError(result.error.message || 'Unable to load your profile setup.');
      setLoading(false);
      return;
    }

    const businessProfile = normalizeBusinessProfile(result.data?.businessProfile);
    setTruckType(businessProfile.truckType);
    setState(businessProfile.location.state);
    setCity(businessProfile.location.city || '');
    setFoodTypes(businessProfile.foodTypes);
    setBusinessType(businessProfile.businessType);
    setComplianceAreas(businessProfile.complianceAreas);
    setSyncError('');
    setProfileSaved(false);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleFoodType = (foodType) => {
    setFoodTypes((prev) => (
      prev.includes(foodType)
        ? prev.filter((item) => item !== foodType)
        : [...prev, foodType]
    ));
    setFormError('');
  };

  const toggleComplianceArea = (area) => {
    setComplianceAreas((prev) => (
      prev.includes(area)
        ? prev.filter((item) => item !== area)
        : [...prev, area]
    ));
    setFormError('');
  };

  const validateForm = () => {
    if (!state || state.length !== 2) {
      setFormError('Please select a state to continue.');
      return false;
    }

    if (foodTypes.length === 0) {
      setFormError('Select at least one food type to continue.');
      return false;
    }

    if (complianceAreas.length === 0) {
      setFormError('Select at least one compliance area to continue.');
      return false;
    }

    setFormError('');
    return true;
  };

  const runPostOnboardingSetup = useCallback(async () => {
    if (!user?.uid) {
      setSyncError('You must be signed in to finish onboarding.');
      return false;
    }

    setSyncError('');

    try {
      await clearTemplateCache(user.uid);

      const templateResult = await syncTemplates(user.uid, true);
      if (templateResult.error) {
        throw new Error(templateResult.error.message || 'Unable to sync checklist templates.');
      }

      const instanceResult = await syncInstances(user.uid, templateResult.templates || [], {
        businessId: templateResult.businessId || null,
      });
      if (instanceResult.error) {
        throw new Error(instanceResult.error.message || 'Unable to generate your checklist items.');
      }

      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error syncing onboarding templates:', error);
      setSyncError(error.message || 'We saved your profile, but setup is not finished yet. Please retry.');
      return false;
    }
  }, [refreshUserProfile, user?.uid]);

  const handleContinue = async () => {
    if (!user?.uid) {
      setFormError('You must be signed in to continue.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSyncError('');

    const businessProfile = {
      truckType,
      location: {
        state,
        city,
      },
      foodTypes,
      businessType,
      complianceAreas,
    };

    const payloadHash = JSON.stringify(normalizeBusinessProfile(businessProfile));
    const now = Date.now();

    if (
      lastSubmitRef.current.payloadHash === payloadHash &&
      now - lastSubmitRef.current.timestamp < 1500
    ) {
      setSaving(false);
      return;
    }

    lastSubmitRef.current = {
      payloadHash,
      timestamp: now,
    };

    const saveResult = await saveBusinessProfile({
      user,
      businessProfile,
    });

    if (saveResult.error) {
      setFormError(saveResult.error.message || 'Unable to save your business profile.');
      setProfileSaved(false);
      setSaving(false);
      return;
    }

    setProfileSaved(true);
    await runPostOnboardingSetup();
    setSaving(false);
  };

  const handleRetrySetup = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    await runPostOnboardingSetup();
    setSaving(false);
  };

  const renderSelectorDialog = ({
    visible,
    onDismiss,
    title,
    options,
    selectedValue,
    onSelect,
    allowNone = false,
    labelMap = {},
  }) => (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content>
        <ScrollView style={styles.dialogScroll}>
          {allowNone ? (
            <TouchableOpacity
              style={[
                styles.option,
                { borderColor: colors.border },
                selectedValue === null && [styles.optionSelected, { borderColor: colors.primary }],
              ]}
              onPress={() => {
                onSelect(null);
                onDismiss();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, selectedValue === null && { color: colors.primary }]}>
                None / Not Applicable
              </Text>
              {selectedValue === null ? (
                <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ) : null}
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                { borderColor: colors.border },
                selectedValue === option && [styles.optionSelected, { borderColor: colors.primary }],
              ]}
              onPress={() => {
                onSelect(option);
                onDismiss();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, selectedValue === option && { color: colors.primary }]}>
                {labelMap[option] || option}
              </Text>
              {selectedValue === option ? (
                <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
      </Dialog.Actions>
    </Dialog>
  );

  const renderMultiSelectDialog = ({
    visible,
    onDismiss,
    title,
    options,
    selectedValues,
    onToggle,
    labelMap,
  }) => (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content>
        <ScrollView style={styles.dialogScroll}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.checkboxOption, { borderColor: colors.border }]}
              onPress={() => onToggle(option)}
              activeOpacity={0.7}
            >
              <Checkbox
                status={selectedValues.includes(option) ? 'checked' : 'unchecked'}
                onPress={() => onToggle(option)}
                color={colors.primary}
              />
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                {labelMap[option]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Done</Button>
      </Dialog.Actions>
    </Dialog>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Button loading mode="text">
          Loading onboarding...
        </Button>
      </View>
    );
  }

  return (
    <Portal.Host>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background ?? COLORS.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Surface
          style={[
            styles.surface,
            {
              backgroundColor: useGlass && Platform.OS === 'android' ? glassColors.background : colors.surface ?? COLORS.surface,
              borderColor: useGlass ? glassColors.border : colors.border,
              borderWidth: useGlass ? 1 : 0,
            },
          ]}
        >
          {useGlass && Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : null}

          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>Owner Onboarding</Text>
            <Text style={[styles.title, { color: colors.text }]}>Set up your business profile</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We need a few compliance details before we can personalize your dashboard, checklist templates, and inspection readiness views.
            </Text>
          </View>

          {loadError ? (
            <View style={styles.errorState}>
              <Text style={[styles.errorText, { color: colors.error }]}>{loadError}</Text>
              <Button mode="contained" onPress={loadProfile}>
                Refresh
              </Button>
            </View>
          ) : null}

          {syncError ? (
            <View style={styles.syncErrorContainer}>
              <Text style={styles.syncErrorTitle}>Finish checklist setup</Text>
              <Text style={styles.syncErrorText}>{syncError}</Text>
              <Button
                mode="contained-tonal"
                onPress={handleRetrySetup}
                disabled={saving}
                style={styles.retryButton}
              >
                {saving ? 'Retrying setup...' : 'Retry setup'}
              </Button>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>State *</Text>
            <TouchableOpacity
              style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowStateDialog(true)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={[styles.selectButtonText, { color: state ? colors.text : colors.textSecondary }]}>
                {state || 'Select state'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>City</Text>
            <TextInput
              mode="outlined"
              value={city}
              onChangeText={setCity}
              placeholder="Enter city name"
              disabled={saving}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Food Types *</Text>
            <TouchableOpacity
              style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowFoodTypesDialog(true)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={[styles.selectButtonText, { color: foodTypes.length > 0 ? colors.text : colors.textSecondary }]}>
                {foodTypes.length > 0
                  ? `${foodTypes.length} selected: ${foodTypes.map((item) => FOOD_TYPE_LABELS[item]).join(', ')}`
                  : 'Select food types'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Compliance Areas *</Text>
            <TouchableOpacity
              style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowComplianceAreasDialog(true)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={[styles.selectButtonText, { color: complianceAreas.length > 0 ? colors.text : colors.textSecondary }]}>
                {complianceAreas.length > 0
                  ? `${complianceAreas.length} selected: ${complianceAreas.map((item) => COMPLIANCE_AREA_LABELS[item]).join(', ')}`
                  : 'Select compliance areas'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Truck Type</Text>
            <TouchableOpacity
              style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowTruckTypeDialog(true)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={[styles.selectButtonText, { color: truckType ? colors.text : colors.textSecondary }]}>
                {truckType ? TRUCK_TYPE_LABELS[truckType] : 'Select truck type (optional)'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Business Type</Text>
            <TouchableOpacity
              style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowBusinessTypeDialog(true)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={[styles.selectButtonText, { color: businessType ? colors.text : colors.textSecondary }]}>
                {businessType ? BUSINESS_TYPE_LABELS[businessType] : 'Select business type (optional)'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {formError ? (
            <View style={styles.formErrorContainer}>
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={handleContinue}
            loading={saving}
            disabled={saving}
            style={styles.continueButton}
            contentStyle={styles.continueButtonContent}
          >
            {saving ? (profileSaved ? 'Finishing setup...' : 'Saving profile...') : 'Continue to dashboard'}
          </Button>
        </Surface>

        <Portal>
          {renderSelectorDialog({
            visible: showStateDialog,
            onDismiss: () => setShowStateDialog(false),
            title: 'Select State',
            options: US_STATES,
            selectedValue: state || null,
            onSelect: (value) => {
              setState(value || '');
              setFormError('');
            },
          })}
          {renderSelectorDialog({
            visible: showTruckTypeDialog,
            onDismiss: () => setShowTruckTypeDialog(false),
            title: 'Select Truck Type',
            options: Object.values(TRUCK_TYPES),
            selectedValue: truckType,
            onSelect: setTruckType,
            allowNone: true,
            labelMap: TRUCK_TYPE_LABELS,
          })}
          {renderSelectorDialog({
            visible: showBusinessTypeDialog,
            onDismiss: () => setShowBusinessTypeDialog(false),
            title: 'Select Business Type',
            options: Object.values(BUSINESS_TYPES),
            selectedValue: businessType,
            onSelect: setBusinessType,
            allowNone: true,
            labelMap: BUSINESS_TYPE_LABELS,
          })}
          {renderMultiSelectDialog({
            visible: showFoodTypesDialog,
            onDismiss: () => setShowFoodTypesDialog(false),
            title: 'Select Food Types',
            options: Object.values(FOOD_TYPES),
            selectedValues: foodTypes,
            onToggle: toggleFoodType,
            labelMap: FOOD_TYPE_LABELS,
          })}
          {renderMultiSelectDialog({
            visible: showComplianceAreasDialog,
            onDismiss: () => setShowComplianceAreasDialog(false),
            title: 'Select Compliance Areas',
            options: Object.values(COMPLIANCE_AREAS),
            selectedValues: complianceAreas,
            onToggle: toggleComplianceArea,
            labelMap: COMPLIANCE_AREA_LABELS,
          })}
        </Portal>
      </ScrollView>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    borderRadius: 20,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 52,
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
  },
  continueButton: {
    marginTop: 8,
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
  syncErrorContainer: {
    backgroundColor: COLORS.warningLight || '#FEF3C7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  syncErrorTitle: {
    color: COLORS.warning || '#B45309',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  syncErrorText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  formErrorContainer: {
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  formErrorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    paddingVertical: 4,
    paddingRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
  },
  dialogScroll: {
    maxHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorState: {
    marginBottom: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default OwnerOnboardingScreen;
