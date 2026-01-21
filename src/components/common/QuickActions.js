/**
 * QuickActions Component
 * 
 * Horizontal scrollable row of quick action buttons for the dashboard.
 * Provides quick access to common actions like upload, checklist, documents, and reports.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QuickActionButton from './QuickActionButton';
import { COLORS } from '../../constants/colors';

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
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
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
        marginTop: 24,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    scrollContent: {
        paddingRight: 20,
    },
});

export default QuickActions;
