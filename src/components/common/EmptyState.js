/**
 * EmptyState Component
 * 
 * Displays an empty state message when there's no data to show.
 * Used in lists, sections, and search results throughout the app.
 */

import React, { useRef, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

/**
 * EmptyState Component
 * 
 * @param {Object} props
 * @param {string} props.icon - Icon name from MaterialCommunityIcons (default: 'inbox-outline')
 * @param {string} props.title - Title text
 * @param {string} props.message - Message text
 * @param {Function} props.onAction - Optional callback for action button
 * @param {string} props.actionLabel - Label for action button (default: 'Get Started')
 * @param {boolean} props.showAction - Whether to show action button (default: false)
 */
const EmptyState = ({ 
    icon = 'inbox-outline', 
    title, 
    message,
    onAction,
    actionLabel = 'Get Started',
    showAction = false
}) => {
    const { colors, typography, spacing } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, scaleAnim]);

    return (
        <Animated.View 
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                }
            ]}
            accessibilityRole="text"
        >
            <MaterialCommunityIcons
                name={icon}
                size={64}
                color={colors.text.tertiary}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
            />
            {title && (
                <Text 
                    style={[
                        styles.title,
                        {
                            color: colors.text.primary,
                            ...typography.textStyles.h3,
                        }
                    ]}
                    accessibilityRole="header"
                    accessibilityLevel={3}
                >
                    {title}
                </Text>
            )}
            {message && (
                <Text 
                    style={[
                        styles.message,
                        {
                            color: colors.text.secondary,
                            ...typography.textStyles.body,
                        }
                    ]}
                    accessibilityRole="text"
                >
                    {message}
                </Text>
            )}
            {showAction && onAction && (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    variant="primary"
                    style={{ marginTop: spacing.MD }}
                />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    title: {
        marginTop: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
});

export default EmptyState;
