import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransporterAuth } from '../../context/TransporterAuthContext';
import supabase from '../../utils/supabase';
import styles from './styles/home.styles';

export default function TransporterHome({ navigation }) {
  const { user, sessionToken } = useTransporterAuth();
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
    if (user && sessionToken) {
      loadDashboardData();
    }
  }, [user, sessionToken]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Step 1: Get transport_id from transport_sessions using sessionToken
      const { data: session, error: sessionError } = await supabase
        .from('transport_sessions')
        .select('transport_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (sessionError || !session?.transport_id) {
        setStats({ totalBilties: 0, inTransit: 0, delivered: 0, atHub: 0 });
        setRecentShipments([]);
        setIsLoading(false);
        return;
      }

      // Step 2: Get GST number from transports table using transport_id
      const { data: myTransport, error: myTransportError } = await supabase
        .from('transports')
        .select('gst_number')
        .eq('id', session.transport_id)
        .single();

      if (myTransportError || !myTransport?.gst_number) {
        setStats({ totalBilties: 0, inTransit: 0, delivered: 0, atHub: 0 });
        setRecentShipments([]);
        setIsLoading(false);
        return;
      }

      const userGst = myTransport.gst_number.trim().toUpperCase();

      // Step 3a: Get total count for stats (lightweight - only ids + status)
      const { data: allStatuses, error: statsError } = await supabase
        .from('bilty')
        .select('id, saving_option')
        .ilike('transport_gst', userGst)
        .eq('is_active', true);

      if (!statsError && allStatuses) {
        const total = allStatuses.length;
        const inTransit = allStatuses.filter(b => b.saving_option === 'IN_TRANSIT' || b.saving_option === 'SAVE').length;
        const delivered = allStatuses.filter(b => b.saving_option === 'DELIVERED').length;
        const atHub = allStatuses.filter(b => b.saving_option === 'AT_HUB').length;
        setStats({ totalBilties: total, inTransit, delivered, atHub });
      }

      // Step 3b: Fetch only recent 5 bilties for display
      const { data: recentBilties, error: recentError } = await supabase
        .from('bilty')
        .select('id, gr_no, saving_option, created_at, bilty_date, consignor_name, consignee_name, from_city_id, to_city_id, no_of_pkg, total, payment_mode, transport_gst')
        .ilike('transport_gst', userGst)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentError && recentBilties) {
        // Fetch city names
        const cityIds = [...new Set([...recentBilties.map(b => b.from_city_id), ...recentBilties.map(b => b.to_city_id)].filter(Boolean))];
        let cityMap = {};
        if (cityIds.length > 0) {
          const { data: cities } = await supabase
            .from('cities')
            .select('id, city_name')
            .in('id', cityIds);
          if (cities) {
            cities.forEach(c => { cityMap[c.id] = c.city_name; });
          }
        }

        const biltiesWithCities = recentBilties.map(b => ({
          ...b,
          from_city_name: cityMap[b.from_city_id] || '-',
          to_city_name: cityMap[b.to_city_id] || '-',
        }));

        setRecentShipments(biltiesWithCities);
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
                <TouchableOpacity key={index} activeOpacity={0.7} onPress={() => navigation.navigate('TransporterBiltyDetails', { biltyId: shipment.id, grNo: shipment.gr_no })}>
                <View style={styles.shipmentCard}>
                  <View style={styles.shipmentHeader}>
                    <View style={styles.grNoContainer}>
                      <Text style={styles.grNoLabel}>GR No.</Text>
                      <Text style={styles.grNoValue}>{shipment.gr_no}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
                    </View>
                  </View>

                  {/* Route */}
                  <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                      <Text style={styles.routeIcon}>📤</Text>
                      <View>
                        <Text style={styles.routeLabel}>From</Text>
                        <Text style={styles.routeValue}>{shipment.from_city_name || '-'}</Text>
                      </View>
                    </View>
                    <View style={styles.routeDivider}>
                      <Text style={styles.routeArrow}>→</Text>
                    </View>
                    <View style={styles.routePoint}>
                      <Text style={styles.routeIcon}>📥</Text>
                      <View>
                        <Text style={styles.routeLabel}>To</Text>
                        <Text style={styles.routeValue}>{shipment.to_city_name || '-'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Parties */}
                  <View style={styles.partiesContainer}>
                    <View style={styles.partyItem}>
                      <Text style={styles.partyLabel}>Consignor</Text>
                      <Text style={styles.partyValue} numberOfLines={1}>{shipment.consignor_name || '-'}</Text>
                    </View>
                    <View style={styles.partyItem}>
                      <Text style={styles.partyLabel}>Consignee</Text>
                      <Text style={styles.partyValue} numberOfLines={1}>{shipment.consignee_name || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.shipmentFooter}>
                    <View style={styles.footerRow}>
                      <Text style={styles.dateText}>📅 {formatDate(shipment.bilty_date || shipment.created_at)}</Text>
                      {shipment.total > 0 && (
                        <Text style={styles.amountText}>₹{Number(shipment.total).toLocaleString('en-IN')}</Text>
                      )}
                    </View>
                  </View>
                </View>
                </TouchableOpacity>
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
