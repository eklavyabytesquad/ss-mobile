import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransporterAuth } from '../../context/TransporterAuthContext';
import supabase from '../../utils/supabase';
import styles from './styles/shipments.styles';

const PAGE_SIZE = 20;

export default function TransporterShipments({ navigation }) {
  const { user, sessionToken } = useTransporterAuth();
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [userGstCached, setUserGstCached] = useState(null);

  useEffect(() => {
    if (user && sessionToken) {
      loadShipments(true);
    }
  }, [user, sessionToken]);

  useEffect(() => {
    filterShipments();
  }, [searchQuery, activeFilter, shipments]);

  const getGst = async () => {
    if (userGstCached) return userGstCached;

    const { data: session, error: sessionError } = await supabase
      .from('transport_sessions')
      .select('transport_id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (sessionError || !session?.transport_id) return null;

    const { data: myTransport, error: myTransportError } = await supabase
      .from('transports')
      .select('gst_number')
      .eq('id', session.transport_id)
      .single();

    if (myTransportError || !myTransport?.gst_number) return null;

    const gst = myTransport.gst_number.trim().toUpperCase();
    setUserGstCached(gst);
    return gst;
  };

  const enrichWithCities = async (bilties) => {
    const cityIds = [...new Set([...bilties.map(b => b.from_city_id), ...bilties.map(b => b.to_city_id)].filter(Boolean))];
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
    return bilties.map(b => ({
      ...b,
      from_city_name: cityMap[b.from_city_id] || '-',
      to_city_name: cityMap[b.to_city_id] || '-',
    }));
  };

  const loadShipments = async (initial = false) => {
    if (initial) {
      setIsLoading(true);
      setShipments([]);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const userGst = await getGst();
      if (!userGst) {
        setShipments([]);
        setFilteredShipments([]);
        setIsLoading(false);
        setLoadingMore(false);
        return;
      }

      const offset = initial ? 0 : shipments.length;

      const { data, error } = await supabase
        .from('bilty')
        .select('id, gr_no, saving_option, created_at, bilty_date, consignor_name, consignee_name, from_city_id, to_city_id, no_of_pkg, total, payment_mode, freight_amount, transport_gst')
        .ilike('transport_gst', userGst)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (!error && data) {
        const enriched = await enrichWithCities(data);

        if (initial) {
          setShipments(enriched);
        } else {
          setShipments(prev => [...prev, ...enriched]);
        }

        setHasMore(data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Load shipments error:', error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const filterShipments = () => {
    let filtered = [...shipments];

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (activeFilter === 'transit') return s.saving_option === 'IN_TRANSIT' || s.saving_option === 'SAVE';
        if (activeFilter === 'delivered') return s.saving_option === 'DELIVERED';
        if (activeFilter === 'hub') return s.saving_option === 'AT_HUB';
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.gr_no?.toLowerCase().includes(query) ||
        s.consignor_name?.toLowerCase().includes(query) ||
        s.consignee_name?.toLowerCase().includes(query)
      );
    }

    setFilteredShipments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setUserGstCached(null);
    await loadShipments(true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadShipments(false);
    }
  };

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

  const filters = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'transit', label: 'In Transit', icon: '🚛' },
    { key: 'delivered', label: 'Delivered', icon: '✅' },
    { key: 'hub', label: 'At Hub', icon: '🏭' },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading shipments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* Header */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Shipments</Text>
        <Text style={styles.headerSubtitle}>{shipments.length} total shipments</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by GR No, Consignor, Consignee..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={styles.filterIcon}>{filter.icon}</Text>
              <Text style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive
              ]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Shipments List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {filteredShipments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No shipments found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Your shipments will appear here'}
            </Text>
          </View>
        ) : (
          filteredShipments.map((shipment, index) => {
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

        {/* Load More Button */}
        {filteredShipments.length > 0 && hasMore && !searchQuery && activeFilter === 'all' && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={handleLoadMore}
            disabled={loadingMore}
            activeOpacity={0.7}
          >
            {loadingMore ? (
              <View style={styles.loadMoreContent}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadMoreText}>Loading...</Text>
              </View>
            ) : (
              <View style={styles.loadMoreContent}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>📦</Text>
                <Text style={styles.loadMoreText}>Load More Shipments</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {filteredShipments.length > 0 && !hasMore && (
          <View style={styles.endOfList}>
            <Text style={styles.endOfListText}>— All shipments loaded —</Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
