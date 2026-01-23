/**
 * BusinessProfileModal Component
 * 
 * Modal for editing user business profile (truck type, location, food types, etc.).
 * Used to customize checklist templates that apply to the user.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import {
    TextInput,
    Button,
    Portal,
    Dialog,
    Checkbox,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getDocument, updateDocument } from '../../services/firestore';
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

/**
 * BusinessProfileModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSuccess - Callback when profile is successfully updated
 */
const BusinessProfileModal = ({ visible, onClose, onSuccess }) => {
    const { user } = useAuth();
    const { colors } = useTheme();

    // Form state
    const [truckType, setTruckType] = useState(null);
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [foodTypes, setFoodTypes] = useState([]);
    const [businessType, setBusinessType] = useState(null);
    const [complianceAreas, setComplianceAreas] = useState([]);

    // UI state
    const [showTruckTypeDialog, setShowTruckTypeDialog] = useState(false);
    const [showStateDialog, setShowStateDialog] = useState(false);
    const [showBusinessTypeDialog, setShowBusinessTypeDialog] = useState(false);
    const [showFoodTypesDialog, setShowFoodTypesDialog] = useState(false);
    const [showComplianceAreasDialog, setShowComplianceAreasDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(null);

    /**
     * Load user's business profile
     */
    useEffect(() => {
        if (user?.uid && visible) {
            loadBusinessProfile();
        }
    }, [user, visible]);

    /**
     * Load business profile from Firestore
     */
    const loadBusinessProfile = async () => {
        if (!user?.uid) return;

        setLoading(true);
        setLoadError(null);
        try {
            const result = await getDocument('users', user.uid);
            if (result.error) {
                throw new Error(result.error.message || 'Failed to load business profile');
            }
            
            if (result.data && result.data.businessProfile) {
                const profile = result.data.businessProfile;
                setTruckType(profile.truckType || null);
                setState(profile.location?.state || '');
                setCity(profile.location?.city || '');
                setFoodTypes(profile.foodTypes || []);
                setBusinessType(profile.businessType || null);
                setComplianceAreas(profile.complianceAreas || []);
            } else {
                // Initialize with empty values
                setTruckType(null);
                setState('');
                setCity('');
                setFoodTypes([]);
                setBusinessType(null);
                setComplianceAreas([]);
            }
        } catch (error) {
            console.error('Error loading business profile:', error);
            setLoadError(error.message || 'Failed to load business profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Toggle food type selection
     */
    const toggleFoodType = (foodType) => {
        setFoodTypes(prev => {
            if (prev.includes(foodType)) {
                return prev.filter(ft => ft !== foodType);
            } else {
                return [...prev, foodType];
            }
        });
    };

    /**
     * Toggle compliance area selection
     */
    const toggleComplianceArea = (area) => {
        setComplianceAreas(prev => {
            if (prev.includes(area)) {
                return prev.filter(a => a !== area);
            } else {
                return [...prev, area];
            }
        });
    };

    /**
     * Validate form
     */
    const validateForm = () => {
        if (!state || state.length !== 2) {
            Alert.alert('Validation Error', 'Please select a state.');
            return false;
        }

        if (foodTypes.length === 0) {
            Alert.alert('Validation Error', 'Please select at least one food type.');
            return false;
        }

        if (complianceAreas.length === 0) {
            Alert.alert('Validation Error', 'Please select at least one compliance area.');
            return false;
        }

        return true;
    };

    /**
     * Handle save
     */
    const handleSave = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'You must be signed in to update your business profile.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const businessProfile = {
                truckType: truckType || null,
                location: {
                    state: state.trim().toUpperCase(),
                    city: city.trim() || null,
                },
                foodTypes: foodTypes,
                businessType: businessType || null,
                complianceAreas: complianceAreas,
                lastTemplateSync: null, // Will be set on next sync
            };

            const result = await updateDocument('users', user.uid, {
                businessProfile,
                updatedAt: new Date().toISOString(),
            });

            if (result.error) {
                throw new Error(result.error.message || 'Failed to update business profile');
            }

            Alert.alert('Success', 'Business profile updated successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        if (onSuccess) onSuccess();
                        onClose();
                    },
                },
            ]);
        } catch (error) {
            console.error('Error saving business profile:', error);
            Alert.alert('Error', error.message || 'Failed to update business profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Store initial values when modal opens to restore on cancel
    const initialValuesRef = useRef(null);
    const hasCapturedInitialValues = useRef(false);
    
    // Capture initial values after profile loads (only once per modal open)
    useEffect(() => {
        if (visible && !loading && !loadError && !hasCapturedInitialValues.current) {
            // Store current values as initial snapshot
            initialValuesRef.current = {
                truckType,
                state,
                city,
                foodTypes: [...foodTypes],
                businessType,
                complianceAreas: [...complianceAreas],
            };
            hasCapturedInitialValues.current = true;
        }
        
        // Reset capture flag when modal closes
        if (!visible) {
            hasCapturedInitialValues.current = false;
            initialValuesRef.current = null;
        }
    }, [visible, loading, loadError, truckType, state, city, foodTypes, businessType, complianceAreas]);
    
    /**
     * Handle cancel
     */
    const handleCancel = () => {
        // Restore initial values synchronously from ref
        if (initialValuesRef.current) {
            setTruckType(initialValuesRef.current.truckType);
            setState(initialValuesRef.current.state);
            setCity(initialValuesRef.current.city);
            setFoodTypes([...initialValuesRef.current.foodTypes]);
            setBusinessType(initialValuesRef.current.businessType);
            setComplianceAreas([...initialValuesRef.current.complianceAreas]);
        }
        setLoadError(null);
        onClose();
    };

    /**
     * Render truck type selector dialog
     */
    const renderTruckTypeDialog = () => {
        return (
            <Dialog visible={showTruckTypeDialog} onDismiss={() => setShowTruckTypeDialog(false)}>
                <Dialog.Title>Select Truck Type</Dialog.Title>
                <Dialog.Content>
                    <ScrollView style={{ maxHeight: 400 }}>
                        <TouchableOpacity
                            style={[
                                styles.option,
                                { borderColor: colors.border },
                                truckType === null && [styles.optionSelected, { borderColor: colors.primary }],
                            ]}
                            onPress={() => {
                                setTruckType(null);
                                setShowTruckTypeDialog(false);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.optionText, truckType === null && { color: colors.primary }]}>
                                None / Not Applicable
                            </Text>
                            {truckType === null && (
                                <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                        {Object.values(TRUCK_TYPES).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.option,
                                    { borderColor: colors.border },
                                    truckType === type && [styles.optionSelected, { borderColor: colors.primary }],
                                ]}
                                onPress={() => {
                                    setTruckType(type);
                                    setShowTruckTypeDialog(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.optionText, truckType === type && { color: colors.primary }]}>
                                    {TRUCK_TYPE_LABELS[type]}
                                </Text>
                                {truckType === type && (
                                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowTruckTypeDialog(false)}>Cancel</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    /**
     * Render state selector dialog
     */
    const renderStateDialog = () => {
        return (
            <Dialog visible={showStateDialog} onDismiss={() => setShowStateDialog(false)}>
                <Dialog.Title>Select State</Dialog.Title>
                <Dialog.Content>
                    <ScrollView style={{ maxHeight: 400 }}>
                        {US_STATES.map((stateCode) => (
                            <TouchableOpacity
                                key={stateCode}
                                style={[
                                    styles.option,
                                    { borderColor: colors.border },
                                    state === stateCode && [styles.optionSelected, { borderColor: colors.primary }],
                                ]}
                                onPress={() => {
                                    setState(stateCode);
                                    setShowStateDialog(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.optionText, state === stateCode && { color: colors.primary }]}>
                                    {stateCode}
                                </Text>
                                {state === stateCode && (
                                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowStateDialog(false)}>Cancel</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    /**
     * Render business type selector dialog
     */
    const renderBusinessTypeDialog = () => {
        return (
            <Dialog visible={showBusinessTypeDialog} onDismiss={() => setShowBusinessTypeDialog(false)}>
                <Dialog.Title>Select Business Type</Dialog.Title>
                <Dialog.Content>
                    <ScrollView>
                        <TouchableOpacity
                            style={[
                                styles.option,
                                { borderColor: colors.border },
                                businessType === null && [styles.optionSelected, { borderColor: colors.primary }],
                            ]}
                            onPress={() => {
                                setBusinessType(null);
                                setShowBusinessTypeDialog(false);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.optionText, businessType === null && { color: colors.primary }]}>
                                None / Not Applicable
                            </Text>
                            {businessType === null && (
                                <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                        {Object.values(BUSINESS_TYPES).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.option,
                                    { borderColor: colors.border },
                                    businessType === type && [styles.optionSelected, { borderColor: colors.primary }],
                                ]}
                                onPress={() => {
                                    setBusinessType(type);
                                    setShowBusinessTypeDialog(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.optionText, businessType === type && { color: colors.primary }]}>
                                    {BUSINESS_TYPE_LABELS[type]}
                                </Text>
                                {businessType === type && (
                                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowBusinessTypeDialog(false)}>Cancel</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    /**
     * Render food types multi-select dialog
     */
    const renderFoodTypesDialog = () => {
        return (
            <Dialog visible={showFoodTypesDialog} onDismiss={() => setShowFoodTypesDialog(false)}>
                <Dialog.Title>Select Food Types</Dialog.Title>
                <Dialog.Content>
                    <ScrollView>
                        {Object.values(FOOD_TYPES).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.checkboxOption,
                                    { borderColor: colors.border },
                                ]}
                                onPress={() => toggleFoodType(type)}
                                activeOpacity={0.7}
                            >
                                <Checkbox
                                    status={foodTypes.includes(type) ? 'checked' : 'unchecked'}
                                    onPress={() => toggleFoodType(type)}
                                    color={colors.primary}
                                />
                                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                                    {FOOD_TYPE_LABELS[type]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowFoodTypesDialog(false)}>Done</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    /**
     * Render compliance areas multi-select dialog
     */
    const renderComplianceAreasDialog = () => {
        return (
            <Dialog visible={showComplianceAreasDialog} onDismiss={() => setShowComplianceAreasDialog(false)}>
                <Dialog.Title>Select Compliance Areas</Dialog.Title>
                <Dialog.Content>
                    <ScrollView>
                        {Object.values(COMPLIANCE_AREAS).map((area) => (
                            <TouchableOpacity
                                key={area}
                                style={[
                                    styles.checkboxOption,
                                    { borderColor: colors.border },
                                ]}
                                onPress={() => toggleComplianceArea(area)}
                                activeOpacity={0.7}
                            >
                                <Checkbox
                                    status={complianceAreas.includes(area) ? 'checked' : 'unchecked'}
                                    onPress={() => toggleComplianceArea(area)}
                                    color={colors.primary}
                                />
                                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                                    {COMPLIANCE_AREA_LABELS[area]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowComplianceAreasDialog(false)}>Done</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCancel}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>Business Profile</Text>
                            <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Loading profile...
                                </Text>
                            </View>
                        ) : loadError ? (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
                                <Text style={[styles.errorText, { color: colors.text }]}>{loadError}</Text>
                                <Button
                                    mode="contained"
                                    onPress={loadBusinessProfile}
                                    style={styles.retryButton}
                                >
                                    Retry
                                </Button>
                            </View>
                        ) : (
                            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            {/* Truck Type */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Truck Type</Text>
                                <TouchableOpacity
                                    style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                    onPress={() => setShowTruckTypeDialog(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.selectButtonText, { color: truckType ? colors.text : colors.textSecondary }]}>
                                        {truckType ? TRUCK_TYPE_LABELS[truckType] : 'Select truck type (optional)'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* State */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>State *</Text>
                                <TouchableOpacity
                                    style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                    onPress={() => setShowStateDialog(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.selectButtonText, { color: state ? colors.text : colors.textSecondary }]}>
                                        {state || 'Select state'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* City */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>City (Optional)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                                    value={city}
                                    onChangeText={setCity}
                                    placeholder="Enter city name"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Food Types */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Food Types *</Text>
                                <TouchableOpacity
                                    style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                    onPress={() => setShowFoodTypesDialog(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.selectButtonText, { color: foodTypes.length > 0 ? colors.text : colors.textSecondary }]}>
                                        {foodTypes.length > 0
                                            ? `${foodTypes.length} selected: ${foodTypes.map(ft => FOOD_TYPE_LABELS[ft]).join(', ')}`
                                            : 'Select food types'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Business Type */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Business Type</Text>
                                <TouchableOpacity
                                    style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                    onPress={() => setShowBusinessTypeDialog(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.selectButtonText, { color: businessType ? colors.text : colors.textSecondary }]}>
                                        {businessType ? BUSINESS_TYPE_LABELS[businessType] : 'Select business type (optional)'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Compliance Areas */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Compliance Areas *</Text>
                                <TouchableOpacity
                                    style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                    onPress={() => setShowComplianceAreasDialog(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.selectButtonText, { color: complianceAreas.length > 0 ? colors.text : colors.textSecondary }]}>
                                        {complianceAreas.length > 0
                                            ? `${complianceAreas.length} selected: ${complianceAreas.map(ca => COMPLIANCE_AREA_LABELS[ca]).join(', ')}`
                                            : 'Select compliance areas'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                        )}

                        {/* Actions */}
                        <View style={[styles.actions, { borderTopColor: colors.border }]}>
                            <Button
                                mode="outlined"
                                onPress={handleCancel}
                                style={styles.cancelButton}
                                disabled={saving || loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveButton}
                                loading={saving}
                                disabled={saving || loading || !!loadError}
                            >
                                Save
                            </Button>
                        </View>
                    </View>
                </View>

                {/* Dialogs */}
                {renderTruckTypeDialog()}
                {renderStateDialog()}
                {renderBusinessTypeDialog()}
                {renderFoodTypesDialog()}
                {renderComplianceAreasDialog()}
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 48,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 48,
    },
    selectButtonText: {
        fontSize: 16,
        flex: 1,
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
        borderWidth: 2,
    },
    optionText: {
        fontSize: 16,
        flex: 1,
    },
    checkboxOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    checkboxLabel: {
        fontSize: 16,
        marginLeft: 8,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
    },
    cancelButton: {
        flex: 1,
        marginRight: 8,
    },
    saveButton: {
        flex: 1,
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        marginTop: 8,
    },
});

export default BusinessProfileModal;
