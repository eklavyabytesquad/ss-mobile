import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/colors';

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
    { icon: '👤', label: 'Edit Profile', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: '📍', label: 'Saved Addresses', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: '🔔', label: 'Notifications', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: '🔒', label: 'Privacy & Security', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: '❓', label: 'Help & Support', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: '📄', label: 'Terms & Conditions', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: 'ℹ️', label: 'About SS Tracker', action: () => Alert.alert('SS Tracker', 'Version 1.0.0\n\nYour trusted transport tracking partner') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[Colors.primary, '#b8922e', Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 60,
            paddingBottom: 40,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            {/* Avatar */}
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: '#fff',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}>
              <Text style={{ fontSize: 48 }}>👤</Text>
            </View>

            {/* User Info */}
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '700', 
              color: '#fff', 
              marginBottom: 6,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}>
              {user?.companyName || 'Guest User'}
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 4 }}>
              📱 {user?.phoneNumber || 'N/A'}
            </Text>
            {user?.gstNumber && (
              <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)' }}>
                GST: {user.gstNumber}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Company Details Card */}
        <View style={{
          backgroundColor: '#fff',
          marginHorizontal: 20,
          marginTop: -20,
          borderRadius: 20,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 6,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
            Company Details
          </Text>
          
          {user?.companyAddress && (
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Address</Text>
                <Text style={{ fontSize: 14, color: '#1f2937', lineHeight: 20 }}>
                  {user.companyAddress}
                </Text>
              </View>
            </View>
          )}

          {user?.pan && (
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>💳</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>PAN</Text>
                <Text style={{ fontSize: 14, color: '#1f2937', fontWeight: '600' }}>
                  {user.pan}
                </Text>
              </View>
            </View>
          )}

          {user?.aadhar && (
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 18, marginRight: 12 }}>🆔</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Aadhar</Text>
                <Text style={{ fontSize: 14, color: '#1f2937', fontWeight: '600' }}>
                  {user.aadhar}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={{ marginTop: 24, marginHorizontal: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
            Settings
          </Text>
          
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: '#f3f4f6',
                }}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#fef3c7',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 15, 
                  color: '#1f2937',
                  fontWeight: '500'
                }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: 20, color: '#9ca3af' }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={{
            marginHorizontal: 20,
            marginTop: 24,
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              🚪 Logout
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* App Info */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 16,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: 80, height: 50 }}
              resizeMode="contain"
            />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginTop: 12 }}>
            SS Tracker
          </Text>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Version 1.0.0
          </Text>
          <Text style={{ fontSize: 11, color: '#d1d5db', marginTop: 8 }}>
            © 2026 SS Transport. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
