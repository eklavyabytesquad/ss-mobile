import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HapticTab } from '../components/haptic-tab';
import { IconSymbol } from '../components/ui/icon-symbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import HomeScreen from './index';
import ExploreScreen from './explore';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tab.Screen
        name="index"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="explore"
        component={ExploreScreen}
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
