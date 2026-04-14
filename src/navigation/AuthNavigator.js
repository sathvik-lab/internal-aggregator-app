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
 * - Gesture navigation disabled to avoid platform casting issues
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
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
 * - Gesture navigation disabled for auth stack screens
 * - Prevents back navigation to authenticated screens
 * - Smooth transitions between auth screens
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.AUTH.LOGIN}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F7FAFC' },
        animationEnabled: true,
        // Disable native gesture handler to avoid "right cannot be cast from String to double" on Android
        gestureEnabled: false,
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
        name={ROUTES.AUTH.PHONE_LOGIN}
        component={PhoneLoginScreen}
        options={{
          title: 'Phone Login',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ROUTES.AUTH.SIGNUP}
        component={SignupScreen}
        options={{
          title: 'Sign Up',
          gestureEnabled: false, // Disabled: avoids "right cannot be cast from String to double" on Android
        }}
      />
      <Stack.Screen
        name={ROUTES.AUTH.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
        options={{
          title: 'Forgot Password',
          gestureEnabled: false, // Disabled: avoids "right cannot be cast from String to double" on Android
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
