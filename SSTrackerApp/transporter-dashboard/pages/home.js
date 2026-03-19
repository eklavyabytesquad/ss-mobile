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

      // Step 2: Get GST number and city_id from transports table
      const { data: myTransport, error: myTransportError } = await supabase
        .from('transports')
        .select('gst_number, city_id')
        .eq('id', session.transport_id)
        .single();

      if (myTransportError || !myTransport?.gst_number) {
        setStats({ totalBilties: 0, inTransit: 0, delivered: 0, atHub: 0 });
        setRecentShipments([]);
        setIsLoading(false);
        return;
      }

      const transportId = session.transport_id;
      const userGst = myTransport.gst_number.trim().toUpperCase();

      // Get city_code for station matching
      let cityCode = null;
      if (myTransport.city_id) {
        const { data: cityData } = await supabase
          .from('cities')
          .select('city_code')
          .eq('id', myTransport.city_id)
          .single();
        if (cityData) cityCode = cityData.city_code;
      }
      const stationOrParts = [`transport_id.eq.${transportId}`, `transport_gst.ilike.${userGst}`];
      if (cityCode) stationOrParts.push(`station.ilike.${cityCode}`);
      const stationOrFilter = stationOrParts.join(',');

      // Step 3a: Get stats from bilty table
      const { data: biltyStatuses } = await supabase
        .from('bilty')
        .select('id, saving_option')
        .ilike('transport_gst', userGst)
        .eq('is_active', true);

      // Step 3b: Get stats from station_bilty_summary table
      const { data: stationBilties } = await supabase
        .from('station_bilty_summary')
        .select('id')
        .or(stationOrFilter);

      const biltyCount = biltyStatuses?.length || 0;
      const stationCount = stationBilties?.length || 0;
      let inTransit = 0, delivered = 0, atHub = 0;
      if (biltyStatuses) {
        inTransit = biltyStatuses.filter(b => b.saving_option === 'IN_TRANSIT' || b.saving_option === 'SAVE').length;
        delivered = biltyStatuses.filter(b => b.saving_option === 'DELIVERED').length;
        atHub = biltyStatuses.filter(b => b.saving_option === 'AT_HUB').length;
      }
      setStats({ totalBilties: biltyCount + stationCount, inTransit, delivered, atHub });

      // Step 4: Fetch recent bilties from BOTH tables
      const { data: recentBilties } = await supabase
        .from('bilty')
        .select('id, gr_no, saving_option, created_at, to_city_id, total, payment_mode, pvt_marks, dd_charge, wt, no_of_pkg')
        .ilike('transport_gst', userGst)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentStationBilties } = await supabase
        .from('station_bilty_summary')
        .select('id, gr_no, station, amount, payment_status, pvt_marks, created_at, weight, no_of_packets')
        .or(stationOrFilter)
        .order('created_at', { ascending: false })
        .limit(5);

      // Enrich bilty items with city names
      let biltyItems = [];
      if (recentBilties?.length) {
        const cityIds = [...new Set(recentBilties.map(b => b.to_city_id).filter(Boolean))];
        let cityMap = {};
        if (cityIds.length > 0) {
          const { data: cities } = await supabase.from('cities').select('id, city_name').in('id', cityIds);
          if (cities) cities.forEach(c => { cityMap[c.id] = c.city_name; });
        }
        biltyItems = recentBilties.map(b => ({
          id: b.id, gr_no: b.gr_no, source: 'bilty',
          destination: cityMap[b.to_city_id] || '-',
          pvt_marks: b.pvt_marks, payment_mode: b.payment_mode || '-',
          amount: b.total || 0, dd_charge: b.dd_charge || 0,
          saving_option: b.saving_option, created_at: b.created_at,
          weight: b.wt || 0, no_of_packets: b.no_of_pkg || 0,
        }));
      }

      // Normalize station_bilty_summary: map station (city_code) -> city_name
      let stationItems = [];
      if (recentStationBilties?.length) {
        const stationCodes = [...new Set(recentStationBilties.map(b => b.station).filter(Boolean))];
        let stationCityMap = {};
        if (stationCodes.length > 0) {
          const { data: sCities } = await supabase.from('cities').select('city_code, city_name').in('city_code', stationCodes);
          if (sCities) sCities.forEach(c => { stationCityMap[c.city_code] = c.city_name; });
        }
        stationItems = recentStationBilties.map(b => ({
          id: b.id, gr_no: b.gr_no, source: 'station',
          destination: stationCityMap[b.station] || b.station || '-',
          pvt_marks: b.pvt_marks, payment_mode: b.payment_status || '-',
          amount: b.amount || 0, dd_charge: 0,
          saving_option: null, created_at: b.created_at,
          weight: b.weight || 0, no_of_packets: b.no_of_packets || 0,
        }));
      }

      // Merge, sort, take top 5
      const merged = [...biltyItems, ...stationItems]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      // Fetch challan_no from transit_details
      const grNos = merged.map(b => b.gr_no).filter(Boolean);
      let challanMap = {};
      if (grNos.length > 0) {
        const { data: transitData } = await supabase
          .from('transit_details')
          .select('gr_no, challan_no')
          .in('gr_no', grNos);
        if (transitData) transitData.forEach(t => { challanMap[t.gr_no] = t.challan_no; });
      }

      // Fetch dispatch_date from challan_details
      const challanNos = [...new Set(Object.values(challanMap).filter(Boolean))];
      let dispatchMap = {};
      if (challanNos.length > 0) {
        const { data: challanData } = await supabase
          .from('challan_details')
          .select('challan_no, dispatch_date')
          .in('challan_no', challanNos);
        if (challanData) challanData.forEach(c => { dispatchMap[c.challan_no] = c.dispatch_date; });
      }

      setRecentShipments(merged.map(b => {
        const cNo = challanMap[b.gr_no] || '-';
        return { ...b, challan_no: cNo, dispatch_date: cNo !== '-' ? (dispatchMap[cNo] || null) : null };
      }));
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
      case null:
      case undefined: return { bg: '#e0e7ff', color: '#4338ca', text: 'Manual' };
      default: return { bg: '#f3f4f6', color: '#6b7280', text: 'Pending' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
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
                <TouchableOpacity key={index} activeOpacity={0.7} onPress={() => navigation.navigate('TransporterBiltyDetails', { biltyId: shipment.id, grNo: shipment.gr_no, source: shipment.source })}>
                <View style={styles.shipmentCard}>
                  <View style={styles.shipmentHeader}>
                    <Text style={styles.grNoValue}>{shipment.gr_no}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
                    </View>
                  </View>

                  <View style={styles.cardRow}>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>Destination</Text>
                      <Text style={styles.fieldValue} numberOfLines={1}>{shipment.destination}</Text>
                    </View>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>Challan No</Text>
                      <Text style={styles.fieldValue}>{shipment.challan_no}</Text>
                    </View>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>Dispatched</Text>
                      <Text style={styles.fieldValue}>{formatDate(shipment.dispatch_date)}</Text>
                    </View>
                  </View>

                  {shipment.pvt_marks ? (
                    <View style={styles.pvtRow}>
                      <Text style={styles.fieldLabel}>Pvt Marks</Text>
                      <Text style={styles.fieldValue} numberOfLines={1}>{shipment.pvt_marks}</Text>
                    </View>
                  ) : null}

                  <View style={styles.cardRow}>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>Weight</Text>
                      <Text style={styles.fieldValue}>{shipment.weight} kg</Text>
                    </View>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>Packets</Text>
                      <Text style={styles.fieldValue}>{shipment.no_of_packets}</Text>
                    </View>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>Payment</Text>
                      <Text style={styles.fieldValueBold}>{shipment.payment_mode || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardRow}>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>Amount</Text>
                      <Text style={styles.amountText}>₹{Number(shipment.amount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>DD</Text>
                      <Text style={styles.fieldValue}>₹{Number(shipment.dd_charge || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.cardField} />
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
