import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, Text, View } from 'react-native';

import TransporterHome from './pages/home';
import TransporterProfile from './pages/profile';
import TransporterShipments from './pages/shipments';

const Tab = createBottomTabNavigator();

export default function TransporterDashboardLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: 10,
          height: 75,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          position: 'absolute',
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="TransporterHome"
        component={TransporterHome}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#dbeafe' : 'transparent',
              padding: 8,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 22 }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="TransporterShipments"
        component={TransporterShipments}
        options={{
          title: 'Shipments',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#dbeafe' : 'transparent',
              padding: 8,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 22 }}>📦</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="TransporterProfile"
        component={TransporterProfile}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#dbeafe' : 'transparent',
              padding: 8,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 22 }}>👤</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
