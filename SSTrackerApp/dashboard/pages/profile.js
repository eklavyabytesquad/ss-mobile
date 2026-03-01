import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/colors';

export default function DashboardProfile() {
  const navigation = useNavigation();
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

  const getInitials = () => {
    if (!user?.companyName) return '?';
    return user.companyName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const accountItems = [
    { icon: '✏️', label: 'Edit Profile', subtitle: 'Update address, PAN & Aadhar', bg: '#eff6ff', action: () => navigation.getParent()?.navigate('EditProfile') },
    { icon: '📍', label: 'Saved Addresses', subtitle: 'Manage delivery addresses', bg: '#f5f3ff', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: '🔔', label: 'Notifications', subtitle: 'Alerts & shipment updates', bg: '#fffbeb', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
  ];

  const supportItems = [
    { icon: '🔒', label: 'Privacy & Security', subtitle: 'Data protection settings', bg: '#ecfdf5', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: '❓', label: 'Help & Support', subtitle: 'FAQs & contact support', bg: '#ecfeff', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: '📄', label: 'Terms & Conditions', subtitle: 'Legal information', bg: '#f9fafb', action: () => Alert.alert('Coming Soon', 'This feature will be available soon') },
    { icon: 'ℹ️', label: 'About SS Tracker', subtitle: 'App version & info', bg: '#f1f5f9', action: () => Alert.alert('SS Tracker', 'Version 1.0.0\n\nYour trusted transport tracking partner\n\nPowered by movesure.io') },
  ];

  const renderMenuItem = (item, index, arr) => (
    <TouchableOpacity
      key={index}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: index < arr.length - 1 ? 1 : 0,
        borderBottomColor: '#f1f5f9',
      }}
      onPress={item.action}
      activeOpacity={0.6}
    >
      <View style={{
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: item.bg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
      }}>
        <Text style={{ fontSize: 19 }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e293b' }}>{item.label}</Text>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{item.subtitle}</Text>
      </View>
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 14, color: '#cbd5e1', fontWeight: '700' }}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const InfoRow = ({ emoji, label, value }) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={{
          backgroundColor: '#1e293b',
          paddingTop: Platform.OS === 'ios' ? 60 : 50,
          paddingBottom: 60,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
            My Profile
          </Text>

          <View style={{ alignItems: 'center' }}>
            {/* Avatar with initials */}
            <View style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: Colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              borderWidth: 3,
              borderColor: 'rgba(212, 172, 64, 0.3)',
              ...Platform.select({
                ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
                android: { elevation: 8 },
              }),
            }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#1e293b' }}>{getInitials()}</Text>
            </View>

            <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 }}>
              {user?.companyName || 'Guest User'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 }} />
              <Text style={{ fontSize: 14, color: '#94a3b8' }}>
                {user?.phoneNumber || 'N/A'}
              </Text>
            </View>
            {user?.gstNumber ? (
              <View style={{
                marginTop: 10,
                backgroundColor: 'rgba(212, 172, 64, 0.15)',
                paddingHorizontal: 14,
                paddingVertical: 5,
                borderRadius: 20,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.primary }}>
                  GST: {user.gstNumber}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={{
          backgroundColor: '#fff',
          marginHorizontal: 20,
          marginTop: -30,
          borderRadius: 20,
          padding: 18,
          flexDirection: 'row',
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 },
            android: { elevation: 6 },
          }),
        }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 17 }}>📦</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>Member</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 1 }}>Active</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#f1f5f9', marginVertical: 4 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 17 }}>✅</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>KYC</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: user?.pan ? '#16a34a' : '#f59e0b', marginTop: 1 }}>
              {user?.pan ? 'Verified' : 'Pending'}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#f1f5f9', marginVertical: 4 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 17 }}>⭐</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>Trust</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 1 }}>Gold</Text>
          </View>
        </View>

        {/* Company Details Card */}
        <View style={{
          backgroundColor: '#fff',
          marginHorizontal: 20,
          marginTop: 20,
          borderRadius: 20,
          padding: 20,
          borderLeftWidth: 4,
          borderLeftColor: Colors.primary,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 },
            android: { elevation: 3 },
          }),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>Company Details</Text>
            <View style={{ marginLeft: 8, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748b' }}>BUSINESS</Text>
            </View>
          </View>

          {user?.companyAddress ? (
            <InfoRow emoji="📍" label="Address" value={user.companyAddress} />
          ) : null}
          {user?.pan ? (
            <InfoRow emoji="💳" label="PAN Number" value={user.pan} />
          ) : null}
          {user?.aadhar ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc',
                justifyContent: 'center', alignItems: 'center', marginRight: 12,
              }}>
                <Text style={{ fontSize: 16 }}>🆔</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Aadhar Number</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', marginTop: 2 }}>{user.aadhar}</Text>
              </View>
            </View>
          ) : null}

          {!user?.companyAddress && !user?.pan && !user?.aadhar ? (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('EditProfile')}
              style={{
                backgroundColor: '#fef3c7',
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 22, marginRight: 12 }}>📝</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400e' }}>Complete Your Profile</Text>
                <Text style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Add address, PAN & Aadhar details</Text>
              </View>
              <Text style={{ fontSize: 16, color: '#d97706', fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Account Section */}
        <View style={{ marginTop: 24, marginHorizontal: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 }}>
            Account
          </Text>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 },
              android: { elevation: 3 },
            }),
          }}>
            {accountItems.map((item, i) => renderMenuItem(item, i, accountItems))}
          </View>
        </View>

        {/* Support Section */}
        <View style={{ marginTop: 20, marginHorizontal: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 }}>
            Support & Legal
          </Text>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 },
              android: { elevation: 3 },
            }),
          }}>
            {supportItems.map((item, i) => renderMenuItem(item, i, supportItems))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={{
            marginHorizontal: 20,
            marginTop: 28,
            backgroundColor: '#fff',
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            borderWidth: 1.5,
            borderColor: '#fecaca',
            ...Platform.select({
              ios: { shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
              android: { elevation: 2 },
            }),
          }}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>🚪</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#ef4444' }}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 12,
            borderRadius: 14,
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
              android: { elevation: 2 },
            }),
          }}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 70, height: 44 }}
              resizeMode="contain"
            />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 10 }}>SS Tracker</Text>
          <Text style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>Version 1.0.0</Text>
          <Text style={{ fontSize: 10, color: '#e2e8f0', marginTop: 6, marginBottom: 8 }}>
            Powered by movesure.io
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
