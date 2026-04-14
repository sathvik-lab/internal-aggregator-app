/**
 * Main Navigator
 * 
 * Bottom tab navigation for authenticated users.
 * Features 4 main tabs: Dashboard, Documents, Checklist, and Profile.
 * 
 * Navigation Structure:
 * 
 * MainNavigator (Bottom Tabs)
 * ├── Dashboard (Tab)
 * │   └── DashboardScreen
 * │
 * ├── Documents (Tab)
 * │   └── DocumentsStack
 * │       ├── DocumentsList (initial route)
 * │       └── DocumentDetail
 * │
 * ├── Checklist (Tab)
 * │   └── ChecklistScreen
 * │
 * └── Profile (Tab)
 *     └── ProfileScreen
 * 
 * Navigation Features:
 * - Tab badges for notifications (Checklist tab)
 * - Stack navigation within Documents tab
 * - Gesture navigation enabled
 * - Proper back button handling
 */

import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/colors';
import { ROUTES } from './navigationConfig';
import { sanitizeStyleForGestures } from '../utils/glassmorphism';
import { useEffectiveRole } from '../hooks/useEffectiveRole';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DocumentDetailScreen from '../screens/DocumentDetailScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MediaLogScreen from '../screens/MediaLogScreen';
import InspectionReadinessScreen from '../screens/InspectionReadinessScreen';
import StaffScreen from '../screens/StaffScreen';
import IncidentsScreen from '../screens/IncidentsScreen';
import IncidentDetailScreen from '../screens/IncidentDetailScreen';
import MaintenanceTasksScreen from '../screens/MaintenanceTasksScreen';
import MaintenanceTaskDetailScreen from '../screens/MaintenanceTaskDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack options: no custom interpolator or gesture to avoid native "right" casting errors on Android
const screenOptions = {
    headerShown: false,
    gestureEnabled: false,
};

/**
 * Badge component for tab icon. Uses theme when available.
 */
const TabBarBadge = ({ count, useGlass, colors }) => {
  if (!count || count === 0) return null;
  const bg = useGlass ? (colors.glassBackground ?? 'rgba(255,255,255,0.15)') : COLORS.error;
  const border = useGlass ? (colors.glassBorder ?? 'rgba(255,255,255,0.2)') : COLORS.surface;
  const textColor = useGlass ? (colors.text?.primary ?? '#FFF') : COLORS.textInverse;

  return (
    <View style={sanitizeStyleForGestures([styles.badge, { backgroundColor: bg, borderColor: border }])}>
      <Text style={[styles.badgeText, { color: textColor }]}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

/**
 * Documents Stack Navigator
 * 
 * Stack navigator for Documents tab to support detail screen navigation.
 * 
 * Navigation Flow:
 * - DocumentsList (initial route) → DocumentDetail
 * - DocumentDetail → DocumentsList (back button)
 * 
 * Features:
 * - Gesture navigation enabled (iOS swipe back)
 * - Proper header styling
 * - Back button handling
 */
const DocumentsStack = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name={ROUTES.DOCUMENTS.LIST}
        component={DocumentsScreen}
        options={{
          title: 'My Documents',
          // Prevent going back from list (first screen in stack)
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ROUTES.DOCUMENTS.DETAIL}
        component={DocumentDetailScreen}
        options={{
          title: 'Document Details',
          gestureEnabled: false, // Disabled: avoids "right cannot be cast from String to double" on Android
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * Profile Stack Navigator
 * 
 * Stack navigator for Profile tab to support navigation to Staff and other management screens.
 * 
 * Navigation Flow:
 * - ProfileScreen (initial route) → StaffScreen
 * - StaffScreen → ProfileScreen (back button)
 */
const ProfileStack = () => {
  const { isOwner } = useEffectiveRole();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name={ROUTES.PROFILE.MAIN}
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          headerShown: false, // Custom header in the screen
        }}
      />
      {isOwner && (
        <Stack.Screen
          name={ROUTES.PROFILE.STAFF}
          component={StaffScreen}
          options={{
            title: 'Team Management',
            headerShown: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
};

const IncidentsStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen
      name={ROUTES.INCIDENTS.LIST}
      component={IncidentsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name={ROUTES.INCIDENTS.DETAIL}
      component={IncidentDetailScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const MaintenanceStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen
      name={ROUTES.MAINTENANCE.LIST}
      component={MaintenanceTasksScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name={ROUTES.MAINTENANCE.DETAIL}
      component={MaintenanceTaskDetailScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

/**
 * MainNavigator Component
 *
 * Bottom tab navigator with main tabs and glassmorphism-friendly styling.
 */
const MainNavigator = () => {
  const { colors } = useTheme();
  const useGlass = colors.glassBackground != null;
  const incompleteChecklistCount = 7;

  const tabBarStyle = useMemo(() => {
    const raw = useGlass
      ? {
          backgroundColor: colors.background || colors.zinc950 || COLORS.background || '#18181B',
          borderTopColor: colors.glassBorder || 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
        }
      : {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: Number(Number(0)), height: Number(Number(-2)) },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        };
    return sanitizeStyleForGestures(raw);
  }, [useGlass, colors.background, colors.zinc950, colors.glassBorder]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle,
        tabBarActiveTintColor: useGlass ? (colors.text?.primary ?? '#FFF') : COLORS.primary,
        tabBarInactiveTintColor: useGlass ? (colors.textLight ?? colors.zinc400) : COLORS.textLight,
        // Tab bar icon configuration
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case ROUTES.MAIN.DASHBOARD:
              iconName = focused ? 'home' : 'home-outline';
              break;
            case ROUTES.MAIN.DOCUMENTS:
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case ROUTES.MAIN.CHECKLIST:
              iconName = focused ? 'checkbox-marked' : 'checkbox-marked-outline';
              break;
            case ROUTES.MAIN.MEDIA_LOGS:
              iconName = focused ? 'image-multiple' : 'image-multiple-outline';
              break;
            case ROUTES.MAIN.INSPECTION_READINESS:
              iconName = focused ? 'shield-check' : 'shield-check-outline';
              break;
            case ROUTES.MAIN.PROFILE:
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={iconName} size={size} color={color} />
              {/* 
              {route.name === ROUTES.MAIN.CHECKLIST && (
                <TabBarBadge
                  count={incompleteChecklistCount}
                  useGlass={useGlass}
                  colors={colors}
                />
              )}
                */}
            </View>
          );
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },

        headerStyle: {
          backgroundColor: useGlass ? (colors.background || colors.zinc950 || '#18181B') : COLORS.primary,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: Number(Number(0)), height: Number(Number(2)) },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        headerTintColor: useGlass ? (colors.text?.primary ?? '#FFF') : COLORS.textInverse,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.MAIN.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerShown: false, // Using custom header in the screen
        }}
      />

      <Tab.Screen
        name={ROUTES.MAIN.DOCUMENTS}
        component={DocumentsStack}
        options={{
          title: 'Documents',
          headerShown: false, // Header handled by stack navigator
        }}
      />

      <Tab.Screen
        name={ROUTES.MAIN.CHECKLIST}
        component={ChecklistScreen}
        options={{
          title: 'Checklist',
          headerTitle: 'Compliance Checklist',
          // Badge is handled by custom TabBarBadge component in tabBarIcon
        }}
      />

      <Tab.Screen
        name={ROUTES.MAIN.PROFILE}
        component={ProfileStack}
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name={ROUTES.MAIN.MEDIA_LOGS}
        component={MediaLogScreen}
        options={{
          title: 'Logs',
          headerTitle: 'Media Logs',
        }}
      />

      <Tab.Screen
        name={ROUTES.MAIN.INSPECTION_READINESS}
        component={InspectionReadinessScreen}
        options={{
          title: 'Readiness',
          headerTitle: 'Inspection Readiness',
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.INCIDENTS}
        component={IncidentsStack}
        options={{
          headerShown: false,
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.MAINTENANCE}
        component={MaintenanceStack}
        options={{
          headerShown: false,
          tabBarButton: () => null,
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
    top: Number(-4),
    right: Number(-12),
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default MainNavigator;
