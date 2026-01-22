import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getBiltyStats, getRecentBilty } from '../../utils/biltyService';
import styles from './styles/home.styles';
import Colors from '../../constants/colors';

export default function DashboardHome() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
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
      const statsResult = await getBiltyStats(user);
      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      const recentResult = await getRecentBilty(user, 5);
      if (recentResult.success) {
        setRecentShipments(recentResult.data);
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
    { label: 'Total Bilties', value: stats.total.toString(), icon: require('../../assets/images/shipping-box.png'), isPng: true, color: '#8b5cf6' },
    { label: 'In Transit', value: stats.inTransit.toString(), icon: require('../../assets/images/truck.png'), isPng: true, color: '#3b82f6' },
    { label: 'Delivered', value: stats.delivered.toString(), icon: '✅', isPng: false, color: '#10b981' },
    { label: 'At Hub', value: stats.atHub.toString(), icon: require('../../assets/images/warehosue.png'), isPng: true, color: '#f59e0b' },
  ];

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

  const navigateToBiltyDetails = (bilty) => {
    navigation.getParent()?.navigate('BiltyDetails', { biltyId: bilty.id, grNo: bilty.gr_no });
  };

  const handleCallSupport = () => {
    const phoneNumber = '7902122230';
    Alert.alert(
      'Call Support',
      `Do you want to call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.greeting}>Hello!</Text>
            <Text style={styles.phoneNumber}>{user?.companyName || 'Guest'}</Text>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{user?.phoneNumber || ''}</Text>
          </View>
          <View style={{ 
            backgroundColor: Colors.background, 
            padding: 10, 
            borderRadius: 12,
            shadowColor: Colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: 100, height: 65 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            {statsData.map((stat, index) => (
              <View key={index} style={[styles.statCard, { borderTopWidth: 3, borderTopColor: stat.color || Colors.primary }]}>
                {stat.isPng ? (
                  <Image source={stat.icon} style={{ width: 32, height: 32, tintColor: stat.color || Colors.primary, marginBottom: 8 }} />
                ) : (
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                )}
                <Text style={[styles.statValue, { color: stat.color || Colors.primary }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 }}>Your Consignments</Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Recent {recentShipments.length} shipment{recentShipments.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Activity</Text>
              <TouchableOpacity onPress={() => navigation?.navigate('History')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentShipments.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: Colors.textSecondary }}>No shipments found</Text>
              </View>
            ) : (
              recentShipments.map((shipment, index) => {
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
                      borderLeftColor: Colors.primary,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                    onPress={() => navigateToBiltyDetails(shipment)}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 }}>
                          {shipment.gr_no}
                        </Text>
                        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 2 }}>
                          To: {shipment.consignee_name || 'N/A'}
                        </Text>
                        <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                          {formatDate(shipment.bilty_date)}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: statusStyle.color }}>{status}</Text>
                      </View>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 2 }}>FROM</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }} numberOfLines={1}>
                          {shipment.from_city_name || 'N/A'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 18, color: Colors.primary, marginHorizontal: 12 }}>→</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 2 }}>TO</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }} numberOfLines={1}>
                          {shipment.to_city_name || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: Colors.textSecondary }}>📦 {shipment.no_of_pkg || 0} Pkg</Text>
                        {shipment.wt && (
                          <>
                            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginHorizontal: 8 }}>•</Text>
                            <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{shipment.wt} Kg</Text>
                          </>
                        )}
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.primary }}>
                        ₹{shipment.total || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.getParent()?.navigate('PrintBilty')}>
                <Text style={styles.actionIcon}>🖨️</Text>
                <Text style={styles.actionText}>Print Bilty</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('Tracking')}>
                <Text style={styles.actionIcon}>🔍</Text>
                <Text style={styles.actionText}>Track</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleCallSupport}>
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionText}>Support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation?.navigate('CityRates')}>
                <Text style={styles.actionIcon}>💰</Text>
                <Text style={styles.actionText}>Rates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
