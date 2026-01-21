/**
 * Profile Screen
 * 
 * User profile screen showing account information and settings.
 * Includes sign out functionality.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

const ProfileScreen = () => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    },
                },
            ],
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            {user && (
                <View style={styles.userInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{user.email}</Text>
                    </View>

                    {user.displayName && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Name:</Text>
                            <Text style={styles.value}>{user.displayName}</Text>
                        </View>
                    )}

                    {user.phoneNumber && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Phone:</Text>
                            <Text style={styles.value}>{user.phoneNumber}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                    👤 Additional profile settings will be implemented here
                </Text>
                <Text style={styles.placeholderSubtext}>
                    Preferences, notifications, and account management
                </Text>
            </View>

            <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                activeOpacity={0.7}
            >
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 24,
    },
    userInfo: {
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoRow: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: COLORS.text,
    },
    placeholder: {
        backgroundColor: COLORS.surface,
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        marginBottom: 20,
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
    signOutButton: {
        backgroundColor: COLORS.error,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 'auto',
    },
    signOutText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;
