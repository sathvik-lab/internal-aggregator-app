import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OwnerOnboardingScreen from '../screens/onboarding/OwnerOnboardingScreen';
import { ROUTES } from './navigationConfig';

const Stack = createStackNavigator();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.ONBOARDING.OWNER_PROFILE}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name={ROUTES.ONBOARDING.OWNER_PROFILE}
        component={OwnerOnboardingScreen}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
