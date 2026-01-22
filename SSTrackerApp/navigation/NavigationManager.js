import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from '../context/AuthContext';
import HomeScreen from '../pages/index';
import LoginScreen from '../pages/login';
import DashboardLayout from '../dashboard/_layout';
import BiltyDetails from '../dashboard/pages/bilty-details';
import Colors from '../constants/colors';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardLayout} />
            <Stack.Screen name="BiltyDetails" component={BiltyDetails} />
          </>
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
