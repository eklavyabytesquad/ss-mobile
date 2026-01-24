import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransporterAuth } from '../../context/TransporterAuthContext';
import supabase from '../../utils/supabase';
import styles from './styles/home.styles';

export default function TransporterHome() {
  const { user } = useTransporterAuth();
  const [stats, setStats] = useState({
    totalBilties: 0,
    inTransit: 0,
    delivered: 0,
    atHub: 0,
  });
  const [recentShipments, setRecentShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get bilty stats for this transporter
      const { data: bilties, error } = await supabase
        .from('bilty')
        .select('id, gr_no, saving_option, created_at, consignor_id, consignee_id')
        .eq('transport_id', user.id);

      if (!error && bilties) {
        const total = bilties.length;
        const inTransit = bilties.filter(b => b.saving_option === 'IN_TRANSIT' || b.saving_option === 'SAVE').length;
        const delivered = bilties.filter(b => b.saving_option === 'DELIVERED').length;
        const atHub = bilties.filter(b => b.saving_option === 'AT_HUB').length;

        setStats({
          totalBilties: total,
          inTransit,
          delivered,
          atHub,
        });

        // Get recent 5 shipments with more details
        const recentBilties = bilties.slice(0, 5);
        setRecentShipments(recentBilties);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const statsData = [
    { label: 'Total Bilties', value: stats.totalBilties.toString(), icon: '📦', color: '#8b5cf6', bgColor: '#f3e8ff' },
    { label: 'In Transit', value: stats.inTransit.toString(), icon: '🚛', color: '#3b82f6', bgColor: '#dbeafe' },
    { label: 'Delivered', value: stats.delivered.toString(), icon: '✅', color: '#10b981', bgColor: '#d1fae5' },
    { label: 'At Hub', value: stats.atHub.toString(), icon: '🏭', color: '#f59e0b', bgColor: '#fef3c7' },
  ];

  const getStatusStyle = (status) => {
    switch(status) {
      case 'DELIVERED': return { bg: '#dcfce7', color: '#166534', text: 'Delivered' };
      case 'IN_TRANSIT': 
      case 'SAVE': return { bg: '#dbeafe', color: '#1e40af', text: 'In Transit' };
      case 'AT_HUB': return { bg: '#fef3c7', color: '#92400e', text: 'At Hub' };
      default: return { bg: '#f3f4f6', color: '#6b7280', text: 'Pending' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.transporterName}>{user?.transportName || 'Transporter'}</Text>
              <View style={styles.locationBadge}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{user?.cityName || 'India'}</Text>
              </View>
            </View>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>🚛</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {statsData.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Shipments */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Shipments</Text>
          </View>

          {recentShipments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No shipments yet</Text>
              <Text style={styles.emptySubtext}>Your recent shipments will appear here</Text>
            </View>
          ) : (
            recentShipments.map((shipment, index) => {
              const statusStyle = getStatusStyle(shipment.saving_option);
              return (
                <View key={index} style={styles.shipmentCard}>
                  <View style={styles.shipmentHeader}>
                    <View style={styles.grNoContainer}>
                      <Text style={styles.grNoLabel}>GR No.</Text>
                      <Text style={styles.grNoValue}>{shipment.gr_no}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
                    </View>
                  </View>
                  <View style={styles.shipmentFooter}>
                    <Text style={styles.dateText}>📅 {formatDate(shipment.created_at)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
