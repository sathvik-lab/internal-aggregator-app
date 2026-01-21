/**
 * Dashboard Screen
 * 
 * Main dashboard screen showing overview of compliance status,
 * recent documents, and quick actions.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/common/Header';
import { COLORS } from '../constants/colors';

const DashboardScreen = () => {
    const navigation = useNavigation();

    // Mock notification count - will be replaced with real data later
    const notificationCount = 5;

    const handleNotificationPress = () => {
        Alert.alert(
            'Notifications',
            `You have ${notificationCount} unread notifications`,
            [{ text: 'OK' }]
        );
    };

    const handleProfilePress = () => {
        // Navigate to Profile tab
        navigation.navigate('Profile');
    };

    return (
        <View style={styles.container}>
            <Header
                notificationCount={notificationCount}
                onNotificationPress={handleNotificationPress}
                onProfilePress={handleProfilePress}
            />

            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>
                            📊 Dashboard content will be implemented here
                        </Text>
                        <Text style={styles.placeholderSubtext}>
                            This will include compliance overview, recent activity, and quick actions
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    placeholder: {
        backgroundColor: COLORS.surface,
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    placeholderText: {
        fontSize: 18,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    placeholderSubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default DashboardScreen;
