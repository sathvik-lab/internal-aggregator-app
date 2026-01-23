/**
 * QuickActions Component
 * 
 * Horizontal scrollable row of quick action buttons for the dashboard.
 * Provides quick access to common actions like upload, checklist, documents, and reports.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QuickActionButton from './QuickActionButton';
import { COLORS } from '../../constants/colors';
import { SPACING, moderateScale, PADDING } from '../../utils/responsive';

/**
 * QuickActions Component
 * 
 * @param {Object} props
 * @param {Function} props.onUploadPress - Callback for upload document action
 * @param {Function} props.onChecklistPress - Callback for view today's checklist action
 * @param {Function} props.onDocumentsPress - Callback for recent documents action
 * @param {Function} props.onReportsPress - Callback for reports action
 */
const QuickActions = ({
    onUploadPress,
    onChecklistPress,
    onDocumentsPress,
    onReportsPress,
}) => {
    return (
        <View style={styles.container} accessibilityRole="region" accessibilityLabel="Quick Actions section">
            <Text 
                style={styles.sectionTitle}
                accessibilityRole="header"
                accessibilityLevel={2}
            >
                Quick Actions
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <QuickActionButton
                    icon="upload"
                    label="Upload Document"
                    onPress={onUploadPress}
                    color={COLORS.info}
                />
                <QuickActionButton
                    icon="clipboard-check"
                    label="Today's Checklist"
                    onPress={onChecklistPress}
                    color={COLORS.success}
                />
                <QuickActionButton
                    icon="clock-outline"
                    label="Recent Documents"
                    onPress={onDocumentsPress}
                    color={COLORS.accent}
                />
                <QuickActionButton
                    icon="chart-line"
                    label="Reports"
                    onPress={onReportsPress}
                    color={COLORS.warning}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.LG,
        marginBottom: SPACING.SM,
    },
    sectionTitle: {
        fontSize: moderateScale(18),
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.MD,
        paddingHorizontal: SPACING.XS,
    },
    scrollContent: {
        paddingRight: PADDING.SCREEN_HORIZONTAL,
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(QuickActions);
