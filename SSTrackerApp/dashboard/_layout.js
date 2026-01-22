import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import Colors from '../constants/colors';

import DashboardHome from './pages/home';
import DashboardTracking from './pages/tracking';
import DashboardHistory from './pages/history';
import DashboardProfile from './pages/profile';
import CityRates from './pages/city-rates';

const Tab = createBottomTabNavigator();

export default function DashboardLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: 10,
          height: 75,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          position: 'absolute',
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="DashboardHome"
        component={DashboardHome}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/images/home.png')}
              style={{ 
                width: 28, 
                height: 28,
                tintColor: focused ? Colors.primary : Colors.textMuted 
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Tracking"
        component={DashboardTracking}
        options={{
          title: 'Tracking',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/images/tracking.png')}
              style={{ 
                width: 28, 
                height: 28,
                tintColor: focused ? Colors.primary : Colors.textMuted 
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={DashboardHistory}
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/images/list.png')}
              style={{ 
                width: 28, 
                height: 28,
                tintColor: focused ? Colors.primary : Colors.textMuted 
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CityRates"
        component={CityRates}
        options={{
          title: 'Pricing',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/images/rates.png')}
              style={{ 
                width: 28, 
                height: 28,
                tintColor: focused ? Colors.primary : Colors.textMuted 
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DashboardProfile}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/images/profile.png')}
              style={{ 
                width: 28, 
                height: 28,
                tintColor: focused ? Colors.primary : Colors.textMuted 
              }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
