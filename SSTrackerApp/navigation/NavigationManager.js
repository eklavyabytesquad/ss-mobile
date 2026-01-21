import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from '../context/AuthContext';
import HomeScreen from '../pages/index';
import LoginScreen from '../pages/login';
import DashboardLayout from '../dashboard/_layout';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <Stack.Screen name="Dashboard" component={DashboardLayout} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function NavigationManager() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
