import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import Colors from '../constants/colors';

import DashboardHome from './pages/home';
import DashboardTracking from './pages/tracking';
import DashboardHistory from './pages/history';
import DashboardProfile from './pages/profile';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: 24 }}>{name}</Text>
  </View>
);

export default function DashboardLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="DashboardHome"
        component={DashboardHome}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Tracking"
        component={DashboardTracking}
        options={{
          title: 'Tracking',
          tabBarIcon: ({ focused }) => <TabIcon name="📍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={DashboardHistory}
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon name="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DashboardProfile}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
