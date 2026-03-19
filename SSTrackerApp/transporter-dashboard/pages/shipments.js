import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransporterAuth } from '../../context/TransporterAuthContext';
import supabase from '../../utils/supabase';
import styles from './styles/shipments.styles';

const PAGE_SIZE = 50;

export default function TransporterShipments({ navigation }) {
  const { user, sessionToken } = useTransporterAuth();
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searching, setSearching] = useState(false);
  const [hasMoreBilty, setHasMoreBilty] = useState(true);
  const [hasMoreStation, setHasMoreStation] = useState(true);
  const transportInfoRef = useRef(null);
  const biltyOffsetRef = useRef(0);
  const stationOffsetRef = useRef(0);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (user && sessionToken) {
      loadShipments(true);
    }
  }, [user, sessionToken]);

  // Debounced server search when query changes
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        serverSearch(searchQuery.trim());
      }, 400);
    } else {
      // No search query — apply local filter on loaded data
      filterShipments();
    }
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      filterShipments();
    }
  }, [activeFilter, shipments]);

  const getTransportInfo = async () => {
    if (transportInfoRef.current) return transportInfoRef.current;

    const { data: session } = await supabase
      .from('transport_sessions')
      .select('transport_id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (!session?.transport_id) return null;

    const { data: myTransport } = await supabase
      .from('transports')
      .select('gst_number, city_id')
      .eq('id', session.transport_id)
      .single();

    if (!myTransport?.gst_number) return null;

    // Get city_code from cities table for station matching
    let cityCode = null;
    if (myTransport.city_id) {
      const { data: cityData } = await supabase
        .from('cities')
        .select('city_code')
        .eq('id', myTransport.city_id)
        .single();
      if (cityData) cityCode = cityData.city_code;
    }

    const info = {
      transportId: session.transport_id,
      gst: myTransport.gst_number.trim().toUpperCase(),
      cityId: myTransport.city_id,
      cityCode: cityCode,
    };
    transportInfoRef.current = info;
    return info;
  };

  const enrichItems = async (biltyData, stationData) => {
    // --- Enrich bilty with city names ---
    let biltyItems = [];
    if (biltyData?.length) {
      const cityIds = [...new Set(biltyData.map(b => b.to_city_id).filter(Boolean))];
      let cityMap = {};
      if (cityIds.length > 0) {
        const { data: cities } = await supabase.from('cities').select('id, city_name').in('id', cityIds);
        if (cities) cities.forEach(c => { cityMap[c.id] = c.city_name; });
      }
      biltyItems = biltyData.map(b => ({
        id: b.id, gr_no: b.gr_no, source: 'bilty',
        destination: cityMap[b.to_city_id] || '-',
        pvt_marks: b.pvt_marks, payment_mode: b.payment_mode || '-',
        amount: b.total || 0, dd_charge: b.dd_charge || 0,
        saving_option: b.saving_option, created_at: b.created_at,
        consignor_name: b.consignor_name, consignee_name: b.consignee_name,
        weight: b.wt || 0, no_of_packets: b.no_of_pkg || 0,
      }));
    }

    // --- Enrich station_bilty_summary: station = city_code -> map to city_name ---
    let stationItems = [];
    if (stationData?.length) {
      const stationCodes = [...new Set(stationData.map(b => b.station).filter(Boolean))];
      let stationCityMap = {};
      if (stationCodes.length > 0) {
        const { data: cities } = await supabase
          .from('cities')
          .select('city_code, city_name')
          .in('city_code', stationCodes);
        if (cities) cities.forEach(c => { stationCityMap[c.city_code] = c.city_name; });
      }
      stationItems = stationData.map(b => ({
        id: b.id, gr_no: b.gr_no, source: 'station',
        destination: stationCityMap[b.station] || b.station || '-',
        pvt_marks: b.pvt_marks, payment_mode: b.payment_status || '-',
        amount: b.amount || 0, dd_charge: 0,
        saving_option: null, created_at: b.created_at,
        consignor_name: b.consignor, consignee_name: b.consignee,
        weight: b.weight || 0, no_of_packets: b.no_of_packets || 0,
      }));
    }

    // --- Merge & sort by date ---
    const merged = [...biltyItems, ...stationItems]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // --- Fetch challan_no from transit_details ---
    const grNos = merged.map(b => b.gr_no).filter(Boolean);
    let challanMap = {};
    if (grNos.length > 0) {
      const { data: transitData } = await supabase
        .from('transit_details')
        .select('gr_no, challan_no')
        .in('gr_no', grNos);
      if (transitData) transitData.forEach(t => { challanMap[t.gr_no] = t.challan_no; });
    }

    // --- Fetch dispatch_date from challan_details ---
    const challanNos = [...new Set(Object.values(challanMap).filter(Boolean))];
    let dispatchMap = {};
    if (challanNos.length > 0) {
      const { data: challanData } = await supabase
        .from('challan_details')
        .select('challan_no, dispatch_date')
        .in('challan_no', challanNos);
      if (challanData) challanData.forEach(c => { dispatchMap[c.challan_no] = c.dispatch_date; });
    }

    return merged.map(b => {
      const cNo = challanMap[b.gr_no] || '-';
      return {
        ...b,
        challan_no: cNo,
        dispatch_date: cNo !== '-' ? (dispatchMap[cNo] || null) : null,
      };
    });
  };

  const loadShipments = async (initial = true) => {
    if (initial) {
      setIsLoading(true);
      biltyOffsetRef.current = 0;
      stationOffsetRef.current = 0;
      setHasMoreBilty(true);
      setHasMoreStation(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const info = await getTransportInfo();
      if (!info) {
        setShipments([]);
        setFilteredShipments([]);
        setIsLoading(false);
        setLoadingMore(false);
        return;
      }

      const bOffset = initial ? 0 : biltyOffsetRef.current;
      const sOffset = initial ? 0 : stationOffsetRef.current;

      // Fetch page from bilty
      let biltyPage = [];
      if (initial ? true : hasMoreBilty) {
        const { data } = await supabase
          .from('bilty')
          .select('id, gr_no, saving_option, created_at, to_city_id, total, payment_mode, pvt_marks, dd_charge, consignor_name, consignee_name, wt, no_of_pkg')
          .ilike('transport_gst', info.gst)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(bOffset, bOffset + PAGE_SIZE - 1);
        biltyPage = data || [];
        if (biltyPage.length < PAGE_SIZE) setHasMoreBilty(false);
        biltyOffsetRef.current = bOffset + biltyPage.length;
      }

      // Fetch page from station_bilty_summary
      let stationPage = [];
      if (initial ? true : hasMoreStation) {
        const stationOrParts = [`transport_id.eq.${info.transportId}`, `transport_gst.ilike.${info.gst}`];
        if (info.cityCode) stationOrParts.push(`station.ilike.${info.cityCode}`);
        const { data } = await supabase
          .from('station_bilty_summary')
          .select('id, gr_no, station, amount, payment_status, pvt_marks, consignor, consignee, created_at, weight, no_of_packets')
          .or(stationOrParts.join(','))
          .order('created_at', { ascending: false })
          .range(sOffset, sOffset + PAGE_SIZE - 1);
        stationPage = data || [];
        if (stationPage.length < PAGE_SIZE) setHasMoreStation(false);
        stationOffsetRef.current = sOffset + stationPage.length;
      }

      const enriched = await enrichItems(biltyPage, stationPage);

      if (initial) {
        setShipments(enriched);
      } else {
        setShipments(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newItems = enriched.filter(s => !existingIds.has(s.id));
          return [...prev, ...newItems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        });
      }
    } catch (error) {
      console.error('Load shipments error:', error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const hasMore = hasMoreBilty || hasMoreStation;

  const filterShipments = () => {
    let filtered = [...shipments];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (activeFilter === 'transit') return s.saving_option === 'IN_TRANSIT' || s.saving_option === 'SAVE';
        if (activeFilter === 'delivered') return s.saving_option === 'DELIVERED';
        if (activeFilter === 'hub') return s.saving_option === 'AT_HUB';
        if (activeFilter === 'manual') return s.source === 'station';
        return true;
      });
    }

    setFilteredShipments(filtered);
  };

  const serverSearch = async (query) => {
    setSearching(true);
    try {
      const info = await getTransportInfo();
      if (!info) { setFilteredShipments([]); setSearching(false); return; }

      const q = query.toLowerCase();

      // Search bilty table: gr_no, consignor, consignee, pvt_marks
      const { data: biltyResults } = await supabase
        .from('bilty')
        .select('id, gr_no, saving_option, created_at, to_city_id, total, payment_mode, pvt_marks, dd_charge, consignor_name, consignee_name, wt, no_of_pkg')
        .ilike('transport_gst', info.gst)
        .eq('is_active', true)
        .or(`gr_no.ilike.%${q}%,consignor_name.ilike.%${q}%,consignee_name.ilike.%${q}%,pvt_marks.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      // Search station_bilty_summary: gr_no, consignor, consignee, pvt_marks, station
      const searchStationOrParts = [`transport_id.eq.${info.transportId}`, `transport_gst.ilike.${info.gst}`];
      if (info.cityCode) searchStationOrParts.push(`station.ilike.${info.cityCode}`);
      const { data: stationResults } = await supabase
        .from('station_bilty_summary')
        .select('id, gr_no, station, amount, payment_status, pvt_marks, consignor, consignee, created_at, weight, no_of_packets')
        .or(searchStationOrParts.join(','))
        .or(`gr_no.ilike.%${q}%,consignor.ilike.%${q}%,consignee.ilike.%${q}%,pvt_marks.ilike.%${q}%,station.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      const enriched = await enrichItems(biltyResults || [], stationResults || []);

      // Apply active filter on search results too
      let filtered = enriched;
      if (activeFilter !== 'all') {
        filtered = filtered.filter(s => {
          if (activeFilter === 'transit') return s.saving_option === 'IN_TRANSIT' || s.saving_option === 'SAVE';
          if (activeFilter === 'delivered') return s.saving_option === 'DELIVERED';
          if (activeFilter === 'hub') return s.saving_option === 'AT_HUB';
          if (activeFilter === 'manual') return s.source === 'station';
          return true;
        });
      }

      setFilteredShipments(filtered);
    } catch (err) {
      console.error('Server search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    transportInfoRef.current = null;
    await loadShipments(true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !searchQuery && activeFilter === 'all') {
      loadShipments(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
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

  const filters = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'transit', label: 'In Transit', icon: '🚛' },
    { key: 'delivered', label: 'Delivered', icon: '✅' },
    { key: 'hub', label: 'At Hub', icon: '🏭' },
    { key: 'manual', label: 'Manual', icon: '📝' },
  ];

  const renderCard = useCallback(({ item: shipment }) => {
    const statusStyle = getStatusStyle(shipment.saving_option);
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TransporterBiltyDetails', { biltyId: shipment.id, grNo: shipment.gr_no, source: shipment.source })}>
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
              <Text style={styles.fieldValueBold}>{shipment.payment_mode}</Text>
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
  }, [navigation]);

  const keyExtractor = useCallback((item) => `${item.source}_${item.id}`, []);

  const ListFooter = () => {
    if (loadingMore || searching) {
      return (
        <View style={styles.loadMoreContent}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadMoreText}>{searching ? 'Searching...' : 'Loading more...'}</Text>
        </View>
      );
    }
    if (!hasMore && filteredShipments.length > 0 && !searchQuery.trim()) {
      return (
        <View style={styles.endOfList}>
          <Text style={styles.endOfListText}>— All shipments loaded —</Text>
        </View>
      );
    }
    return null;
  };

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
            placeholder="Search GR, Challan, Pvt Marks..."
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
              style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={styles.filterIcon}>{filter.icon}</Text>
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Shipments List — FlatList for performance */}
      <FlatList
        style={styles.listContainer}
        data={filteredShipments}
        renderItem={renderCard}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No shipments found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Your shipments will appear here'}
            </Text>
          </View>
        }
        ListFooterComponent={<ListFooter />}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
}
