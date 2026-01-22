import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { searchBilty } from '../../utils/biltyService';
import Colors from '../../constants/colors';
import styles from './styles/history.styles';

export default function DashboardHistory() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadShipments();
    }
  }, [user, filter]);

  const loadShipments = async () => {
    setIsLoading(true);
    try {
      const statusFilter = filter === 'all' ? null : 
                          filter === 'delivered' ? 'DELIVERED' : 
                          filter === 'in_transit' ? 'SAVE' : null;
      
      const result = await searchBilty(user, { 
        status: statusFilter,
        pageSize: 50 
      });
      
      if (result.success) {
        setShipments(result.data);
      }
    } catch (error) {
      console.error('Load shipments error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShipments();
    setRefreshing(false);
  };

  const getStatusFromSavingOption = (savingOption) => {
    switch(savingOption) {
      case 'DELIVERED': return 'Delivered';
      case 'IN_TRANSIT': return 'In Transit';
      case 'AT_HUB': return 'At Hub';
      case 'SAVE': return 'In Transit';
      default: return 'Pending';
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Delivered': return { bg: '#dcfce7', color: '#166534' };
      case 'In Transit': return { bg: '#dbeafe', color: '#1e40af' };
      case 'At Hub': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filters = ['all', 'delivered', 'in_transit'];

  const navigateToBiltyDetails = (bilty) => {
    navigation.getParent()?.navigate('BiltyDetails', { biltyId: bilty.id, grNo: bilty.gr_no });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shipment History</Text>
        <Text style={styles.subtitle}>View all your shipments</Text>
      </View>

      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'in_transit' ? 'In Transit' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Loading...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.listContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {shipments.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>No shipments found</Text>
            </View>
          ) : (
            shipments.map((shipment, index) => {
              const status = getStatusFromSavingOption(shipment.saving_option);
              const statusStyle = getStatusStyle(status);
              return (
                <TouchableOpacity 
                  key={shipment.id || index} 
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: status === 'Delivered' ? '#166534' : status === 'In Transit' ? '#1e40af' : Colors.primary,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  onPress={() => navigateToBiltyDetails(shipment)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 }}>
                        {shipment.gr_no}
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                        {formatDate(shipment.bilty_date)}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: statusStyle.color }}>{status}</Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 2 }}>FROM</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }} numberOfLines={1}>
                        {shipment.from_city_name || 'N/A'}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 12 }}>
                      <Text style={{ fontSize: 20, color: Colors.primary }}>→</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 2 }}>TO</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }} numberOfLines={1}>
                        {shipment.to_city_name || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                        <Text style={{ fontSize: 12, color: Colors.textSecondary }}>📦 {shipment.no_of_pkg || 0} Pkg</Text>
                      </View>
                      {shipment.wt && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>⚖️ {shipment.wt} Kg</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.primary }}>
                      ₹{shipment.total || 0}
                    </Text>
                  </View>

                  {shipment.consignee_name && (
                    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                      <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                        Consignee: <Text style={{ color: Colors.text, fontWeight: '500' }}>{shipment.consignee_name}</Text>
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}
