/**
 * ErrorMessage Component
 * 
 * Reusable error display component with icon, message, and optional retry button.
 * Used throughout the app to show error states.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * ErrorMessage Component
 * 
 * @param {Object} props
 * @param {string} props.message - Error message text to display
 * @param {Function} props.onRetry - Optional callback for retry button
 * @param {string} props.retryLabel - Label for retry button (default: 'Retry')
 * @param {boolean} props.fullScreen - If true, displays as full-screen modal
 * @param {string} props.icon - Icon name from MaterialCommunityIcons (default: 'alert-circle')
 */
const ErrorMessage = ({ 
    message, 
    onRetry, 
    onDismiss,
    retryLabel = 'Retry',
    fullScreen = false,
    icon = 'alert-circle'
}) => {
    const errorContent = (
        <View 
            style={styles.container}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
        >
            <MaterialCommunityIcons
                name={icon}
                size={48}
                color={COLORS.error}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
            />
            <Text 
                style={styles.message}
                accessibilityRole="text"
            >
                {message}
            </Text>
            {onRetry && (
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetry}
                    activeOpacity={0.7}
                    accessibilityLabel={retryLabel}
                    accessibilityHint="Double tap to retry the failed operation"
                    accessibilityRole="button"
                >
                    <Text style={styles.retryButtonText}>{retryLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (fullScreen) {
        return (
            <Modal
                transparent
                animationType="fade"
                visible={true}
                statusBarTranslucent
                onRequestClose={onDismiss || onRetry || (() => {})}
            >
                <View 
                    style={styles.overlay}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="assertive"
                >
                    <View style={styles.fullScreenContainer}>
                        <MaterialCommunityIcons
                            name={icon}
                            size={64}
                            color={COLORS.error}
                            accessibilityElementsHidden={true}
                            importantForAccessibility="no-hide-descendants"
                        />
                        <Text 
                            style={styles.fullScreenMessage}
                            accessibilityRole="text"
                        >
                            {message}
                        </Text>
                        {onRetry && (
                            <TouchableOpacity
                                style={styles.fullScreenRetryButton}
                                onPress={onRetry}
                                activeOpacity={0.7}
                                accessibilityLabel={retryLabel}
                                accessibilityHint="Double tap to retry the failed operation"
                                accessibilityRole="button"
                            >
                                <Text style={styles.fullScreenRetryButtonText}>{retryLabel}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        );
    }

    return errorContent;
};

const styles = StyleSheet.create({
    container: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 120,
    },
    retryButtonText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    fullScreenContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 400,
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: Number(0), height: Number(2) },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    fullScreenMessage: {
        fontSize: 18,
        color: COLORS.text,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 32,
        lineHeight: 24,
        fontWeight: '500',
    },
    fullScreenRetryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 8,
        minWidth: 140,
    },
    fullScreenRetryButtonText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ErrorMessage;
