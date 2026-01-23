/**
 * Authentication Navigator
 * 
 * Stack navigator for authentication screens (Login, Signup, Forgot Password).
 * Used when user is not authenticated.
 * 
 * Navigation Flow:
 * - Login (initial route) → Signup
 * - Login → ForgotPassword
 * - Signup → Login (after successful signup)
 * - ForgotPassword → Login (after password reset)
 * 
 * Navigation Guards:
 * - Prevents going back to authenticated screens after logout
 * - Gesture navigation enabled for iOS swipe back
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import { ROUTES } from './navigationConfig';

const Stack = createStackNavigator();

/**
 * AuthNavigator Component
 * 
 * Stack navigator containing all authentication-related screens.
 * Header is hidden for a cleaner auth flow experience.
 * 
 * Features:
 * - Gesture navigation enabled (iOS swipe back)
 * - Prevents back navigation to authenticated screens
 * - Smooth transitions between auth screens
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.AUTH.LOGIN}
      screenOptions={{
        headerShown: false, // Hide header for auth screens
        cardStyle: { backgroundColor: '#F7FAFC' }, // Match app background
        animationEnabled: true,
        gestureEnabled: true, // Enable swipe back on iOS
        gestureDirection: 'horizontal',
        // Prevent going back to authenticated screens
        gestureResponseDistance: {
          horizontal: Platform.OS === 'ios' ? 20 : 0,
        },
        // Enhanced animation configuration for smoother transitions
        transitionSpec: {
          open: {
            animation: 'spring',
            config: {
              stiffness: 1000,
              damping: 500,
              mass: 3,
              overshootClamping: true,
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.01,
            },
          },
          close: {
            animation: 'spring',
            config: {
              stiffness: 1000,
              damping: 500,
              mass: 3,
              overshootClamping: true,
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.01,
            },
          },
        },
        // Card style interpolation for slide animation
        cardStyleInterpolator: ({ current, next, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
      }}
    >
      <Stack.Screen
        name={ROUTES.AUTH.LOGIN}
        component={LoginScreen}
        options={{
          title: 'Login',
          // Prevent going back from login screen (first screen in stack)
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ROUTES.AUTH.SIGNUP}
        component={SignupScreen}
        options={{
          title: 'Sign Up',
          gestureEnabled: true, // Allow swipe back to login
        }}
      />
      <Stack.Screen
        name={ROUTES.AUTH.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
        options={{
          title: 'Forgot Password',
          gestureEnabled: true, // Allow swipe back to login
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
