import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransporterAuth } from '../../context/TransporterAuthContext';
import styles from './styles/profile.styles';

export default function TransporterProfile() {
  const { user, logout } = useTransporterAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const profileItems = [
    { icon: '🏢', label: 'Transport Name', value: user?.transportName || '-' },
    { icon: '📍', label: 'City', value: user?.cityName || '-' },
    { icon: '🏠', label: 'Address', value: user?.address || '-' },
    { icon: '📋', label: 'GST Number', value: user?.gstNumber || '-' },
    { icon: '📱', label: 'Mobile Number', value: user?.mobileNumber || '-' },
    { icon: '👤', label: 'Branch Owner', value: user?.branchOwnerName || '-' },
    { icon: '🌐', label: 'Website', value: user?.website || '-' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>🚛</Text>
            </View>
            <Text style={styles.transporterName}>{user?.transportName || 'Transporter'}</Text>
            <View style={styles.locationBadge}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{user?.cityName || 'India'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.profileCard}>
            {profileItems.map((item, index) => (
              <View key={index} style={[styles.profileItem, index !== profileItems.length - 1 && styles.profileItemBorder]}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                </View>
                <Text style={styles.itemValue} numberOfLines={2}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>SS Tracker - Transporter Portal</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
