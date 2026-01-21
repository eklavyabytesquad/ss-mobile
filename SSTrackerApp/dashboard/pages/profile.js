import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from './styles/profile.styles';

export default function DashboardProfile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    { icon: '👤', label: 'Edit Profile', action: () => Alert.alert('Coming Soon') },
    { icon: '📍', label: 'Saved Addresses', action: () => Alert.alert('Coming Soon') },
    { icon: '💳', label: 'Payment Methods', action: () => Alert.alert('Coming Soon') },
    { icon: '🔔', label: 'Notifications', action: () => Alert.alert('Coming Soon') },
    { icon: '🔒', label: 'Privacy & Security', action: () => Alert.alert('Coming Soon') },
    { icon: '❓', label: 'Help & Support', action: () => Alert.alert('Coming Soon') },
    { icon: '📄', label: 'Terms & Conditions', action: () => Alert.alert('Coming Soon') },
    { icon: 'ℹ️', label: 'About App', action: () => Alert.alert('SS Tracker', 'Version 1.0.0') },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.userName}>User</Text>
        <Text style={styles.userPhone}>+91 {user?.phoneNumber}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>145</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹52K</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.action}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}
