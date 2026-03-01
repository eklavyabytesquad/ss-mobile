import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStaffAuth } from '../../context/StaffAuthContext';
import styles from './styles/home.styles';

export default function StaffHome() {
  const { user } = useStaffAuth();
  const navigation = useNavigation();

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
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.staffName}>{user?.name || user?.username || 'Staff'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.post || 'Staff Member'}</Text>
              </View>
            </View>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>

        {/* Quick Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Your Info</Text>
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.infoIcon}>🏢</Text>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{user?.department || 'N/A'}</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.infoIcon}>🪪</Text>
              <Text style={styles.infoLabel}>Employee Code</Text>
              <Text style={styles.infoValue}>{user?.employeeCode || 'N/A'}</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.infoIcon}>📱</Text>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: '#f3e8ff' }]}>
              <Text style={styles.infoIcon}>📧</Text>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Search */}
        <View style={styles.comingSoonSection}>
          <TouchableOpacity
            style={styles.comingSoonCard}
            onPress={() => navigation.navigate('StaffSearch')}
            activeOpacity={0.8}
          >
            <Text style={styles.comingSoonIcon}>🔍</Text>
            <Text style={styles.comingSoonTitle}>Search Bilty</Text>
            <Text style={styles.comingSoonText}>
              Search any bilty by GR number across all regular and manual bilties.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
