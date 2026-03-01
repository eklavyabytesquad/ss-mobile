import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStaffAuth } from '../../context/StaffAuthContext';
import styles from './styles/profile.styles';

export default function StaffProfile() {
  const { user, logout } = useStaffAuth();

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

  const profileItems = [
    { label: 'Name', value: user?.name || 'N/A', icon: '👤' },
    { label: 'Username', value: user?.username || 'N/A', icon: '🆔' },
    { label: 'Post', value: user?.post || 'N/A', icon: '📋' },
    { label: 'Department', value: user?.department || 'N/A', icon: '🏢' },
    { label: 'Employee Code', value: user?.employeeCode || 'N/A', icon: '🪪' },
    { label: 'Phone', value: user?.phone || 'N/A', icon: '📱' },
    { label: 'Email', value: user?.email || 'N/A', icon: '📧' },
    { label: 'City', value: user?.city || 'N/A', icon: '📍' },
    { label: 'State', value: user?.state || 'N/A', icon: '🗺️' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#334155" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#475569', '#334155', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: 50, height: 38 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.userName}>{user?.name || user?.username || 'Staff'}</Text>
            <Text style={styles.userRole}>{user?.post || 'Staff Member'}</Text>
          </View>
        </LinearGradient>

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          {profileItems.map((item, index) => (
            <View key={index} style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Text style={styles.detailIcon}>{item.icon}</Text>
                <Text style={styles.detailLabel}>{item.label}</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={1}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
