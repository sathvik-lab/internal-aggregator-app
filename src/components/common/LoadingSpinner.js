/**
 * LoadingSpinner Component
 * 
 * Reusable loading indicator component with optional text and full-screen overlay variant.
 * Used throughout the app to show loading states.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * LoadingSpinner Component
 * 
 * @param {Object} props
 * @param {string} props.text - Optional loading text to display below spinner
 * @param {boolean} props.fullScreen - If true, displays as full-screen overlay modal
 * @param {string} props.color - Color of the spinner (default: primary)
 * @param {string} props.size - Size of the spinner ('small' | 'large', default: 'large')
 */
const LoadingSpinner = ({ 
    text, 
    fullScreen = false, 
    color = COLORS.primary,
    size = 'large'
}) => {
    const accessibilityLabel = text || 'Loading';
    
    const spinner = (
        <View 
            style={styles.container}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="progressbar"
            accessibilityLiveRegion="polite"
        >
            <ActivityIndicator 
                size={size} 
                color={color}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
            />
            {text && (
                <Text 
                    style={styles.text}
                    accessibilityRole="text"
                >
                    {text}
                </Text>
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
                onRequestClose={() => {}}
            >
                <View 
                    style={styles.overlay}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole="progressbar"
                    accessibilityLiveRegion="polite"
                >
                    <View style={styles.fullScreenContainer}>
                        <ActivityIndicator 
                            size={size} 
                            color={color}
                            accessibilityElementsHidden={true}
                            importantForAccessibility="no-hide-descendants"
                        />
                        {text && (
                            <Text 
                                style={styles.fullScreenText}
                                accessibilityRole="text"
                            >
                                {text}
                            </Text>
                        )}
                    </View>
                </View>
            </Modal>
        );
    }

    return spinner;
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    text: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
        minHeight: 120,
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    fullScreenText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default LoadingSpinner;
