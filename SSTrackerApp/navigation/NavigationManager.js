import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from '../context/AuthContext';
import SplashScreen from '../pages/splash';
import HomeScreen from '../pages/index';
import LoginScreen from '../pages/login';
import DashboardLayout from '../dashboard/_layout';
import BiltyDetails from '../dashboard/pages/bilty-details';
import EditProfile from '../dashboard/pages/edit-profile';
import PrintBilty from '../dashboard/pages/print-bilty';
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
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Only show splash on first mount
    if (!isLoading && showSplash) {
      // Splash will control its own timing
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (showSplash) {
    return (
      <SplashScreen onAnimationComplete={() => setShowSplash(false)} />
    );
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
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="PrintBilty" component={PrintBilty} />
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
