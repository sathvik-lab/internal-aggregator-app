/**
 * Main Navigator
 * 
 * Bottom tab navigation for authenticated users.
 * Features 4 main tabs: Dashboard, Documents, Checklist, and Profile.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DocumentDetailScreen from '../screens/DocumentDetailScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Badge Component
 * 
 * Displays a badge with a count on the tab icon
 */
const TabBarBadge = ({ count }) => {
  if (!count || count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

/**
 * Documents Stack Navigator
 * 
 * Stack navigator for Documents tab to support detail screen navigation
 */
const DocumentsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.textInverse,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="DocumentsList"
        component={DocumentsScreen}
        options={{
          title: 'My Documents',
        }}
      />
      <Stack.Screen
        name="DocumentDetail"
        component={DocumentDetailScreen}
        options={{
          title: 'Document Details',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * MainNavigator Component
 * 
 * Bottom tab navigator with 4 tabs and professional styling
 */
const MainNavigator = () => {
  // Mock count for incomplete checklist items
  // This will be replaced with actual data from context/state management later
  const incompleteChecklistCount = 7;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Tab bar icon configuration
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Documents':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Checklist':
              iconName = focused ? 'checkbox-marked' : 'checkbox-marked-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={iconName} size={size} color={color} />
              {route.name === 'Checklist' && (
                <TabBarBadge count={incompleteChecklistCount} />
              )}
            </View>
          );
        },

        // Tab bar styling
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },

        // Header styling
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        headerTintColor: COLORS.textInverse,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerShown: false, // Using custom header in the screen
        }}
      />

      <Tab.Screen
        name="Documents"
        component={DocumentsStack}
        options={{
          title: 'Documents',
          headerShown: false, // Header handled by stack navigator
        }}
      />

      <Tab.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={{
          title: 'Checklist',
          headerTitle: 'Compliance Checklist',
          // Badge is handled by custom TabBarBadge component in tabBarIcon
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default MainNavigator;
