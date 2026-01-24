import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransporterAuth } from '../../context/TransporterAuthContext';
import supabase from '../../utils/supabase';
import styles from './styles/shipments.styles';

export default function TransporterShipments() {
  const { user } = useTransporterAuth();
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadShipments();
    }
  }, [user]);

  useEffect(() => {
    filterShipments();
  }, [searchQuery, activeFilter, shipments]);

  const loadShipments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bilty')
        .select(`
          id, 
          gr_no, 
          saving_option, 
          created_at,
          consignor:consignor_id(company_name),
          consignee:consignee_id(company_name),
          from_city:from_city_id(city_name),
          to_city:to_city_id(city_name)
        `)
        .eq('transport_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setShipments(data);
        setFilteredShipments(data);
      }
    } catch (error) {
      console.error('Load shipments error:', error);
    } finally {
      setIsLoading(false);
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
        s.consignor?.company_name?.toLowerCase().includes(query) ||
        s.consignee?.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredShipments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShipments();
    setRefreshing(false);
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

                <View style={styles.routeContainer}>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeIcon}>📤</Text>
                    <View>
                      <Text style={styles.routeLabel}>From</Text>
                      <Text style={styles.routeValue}>{shipment.from_city?.city_name || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.routeDivider}>
                    <Text style={styles.routeArrow}>→</Text>
                  </View>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeIcon}>📥</Text>
                    <View>
                      <Text style={styles.routeLabel}>To</Text>
                      <Text style={styles.routeValue}>{shipment.to_city?.city_name || '-'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.partiesContainer}>
                  <View style={styles.partyItem}>
                    <Text style={styles.partyLabel}>Consignor</Text>
                    <Text style={styles.partyValue} numberOfLines={1}>{shipment.consignor?.company_name || '-'}</Text>
                  </View>
                  <View style={styles.partyItem}>
                    <Text style={styles.partyLabel}>Consignee</Text>
                    <Text style={styles.partyValue} numberOfLines={1}>{shipment.consignee?.company_name || '-'}</Text>
                  </View>
                </View>

                <View style={styles.shipmentFooter}>
                  <Text style={styles.dateText}>📅 {formatDate(shipment.created_at)}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
