import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import StaffHome from './pages/home';
import StaffSearch from './pages/search';
import StaffProfile from './pages/profile';

const Tab = createBottomTabNavigator();

export default function StaffDashboardLayout() {
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
        tabBarActiveTintColor: '#475569',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="StaffHome"
        component={StaffHome}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#e2e8f0' : 'transparent',
              padding: 8,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 22 }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="StaffSearch"
        component={StaffSearch}
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#e2e8f0' : 'transparent',
              padding: 8,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 22 }}>🔍</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="StaffProfile"
        component={StaffProfile}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#e2e8f0' : 'transparent',
              padding: 8,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 22 }}>👨‍💼</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
