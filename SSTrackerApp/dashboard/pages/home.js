import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Linking, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getBiltyStats, getRecentBilty } from '../../utils/biltyService';
import styles from './styles/home.styles';
import Colors from '../../constants/colors';

// ── Offer Banner Component ──
const OfferBanner = () => {
  const handleRateUs = () => {
    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/id000000000' // replace with real id
      : 'https://play.google.com/store/apps/details?id=com.sstransport.tracker';
    Alert.alert(
      '⭐ Rate SS Transport',
      'Rate us 5 stars on the store and get toll tax waived on your next consignment!',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now ⭐', onPress: () => Linking.openURL(storeUrl) },
      ]
    );
  };

  return (
    <View style={{
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <View style={{
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#1e293b', letterSpacing: 0.5 }}>OFFER</Text>
            </View>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Limited Time</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 6, lineHeight: 22 }}>
            Rate Us & Get Toll Tax Free! 🎉
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 18 }}>
            Rate us 5 stars and enjoy toll charge waiver on your next consignment
          </Text>
          <TouchableOpacity
            onPress={handleRateUs}
            style={{
              backgroundColor: '#fbbf24',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 10,
              alignSelf: 'flex-start',
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b' }}>⭐ Rate Us Now</Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 32 }}>🏷️</Text>
        </View>
      </View>
    </View>
  );
};

// ── Stat Card Component ──
const StatCard = ({ stat, index }) => (
  <View style={{
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  }}>
    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: stat.bgColor, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
      {stat.isPng ? (
        <Image source={stat.icon} style={{ width: 24, height: 24, tintColor: stat.tint }} />
      ) : (
        <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
      )}
    </View>
    <Text style={{ fontSize: 26, fontWeight: '800', color: '#1e293b' }}>{stat.value}</Text>
    <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '500', textAlign: 'center' }}>{stat.label}</Text>
  </View>
);

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
    { label: 'Total Bilties', value: stats.total.toString(), icon: require('../../assets/images/shipping-box.png'), isPng: true, bgColor: '#fef3c7', tint: '#d4ac40' },
    { label: 'In Transit', value: stats.inTransit.toString(), icon: require('../../assets/images/truck.png'), isPng: true, bgColor: '#dbeafe', tint: '#3b82f6' },
    { label: 'Delivered', value: stats.delivered.toString(), icon: '✅', isPng: false, bgColor: '#dcfce7', tint: '#16a34a' },
    { label: 'At Hub', value: stats.atHub.toString(), icon: require('../../assets/images/warehosue.png'), isPng: true, bgColor: '#fef9c3', tint: '#f59e0b' },
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
      case 'Delivered': return { bg: '#dcfce7', color: '#166534', dot: '#16a34a' };
      case 'In Transit': return { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' };
      case 'At Hub': return { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' };
      default: return { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{getGreeting()} 👋</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 }} numberOfLines={1}>
              {user?.companyName || 'Guest'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399', marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{user?.phoneNumber || ''}</Text>
            </View>
          </View>
          <View style={{ 
            backgroundColor: '#fff', 
            padding: 8, 
            borderRadius: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: 80, height: 50 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
          {/* ── Stats Grid ── */}
          <View style={styles.statsContainer}>
            {statsData.map((stat, index) => (
              <StatCard key={index} stat={stat} index={index} />
            ))}
          </View>

          {/* ── Offer Banner ── */}
          <OfferBanner />

          {/* ── Quick Actions ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 }}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {[
                { icon: '🔍', label: 'Track', onPress: () => navigation?.navigate('Tracking'), bg: '#dbeafe', border: '#93c5fd' },
                { icon: '', label: 'Rates', onPress: () => navigation?.navigate('CityRates'), bg: '#dcfce7', border: '#a7f3d0' },
                { icon: '📞', label: 'Support', onPress: handleCallSupport, bg: '#fce7f3', border: '#f9a8d4' },
                { icon: '📋', label: 'History', onPress: () => navigation?.navigate('History'), bg: '#f1f5f9', border: '#cbd5e1' },
              ].map((action, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={action.onPress}
                  style={{
                    backgroundColor: action.bg,
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: action.border,
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{action.icon}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Recent Shipments ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>Recent Consignments</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {recentShipments.length} latest shipment{recentShipments.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation?.navigate('History')}
                style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentShipments.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📦</Text>
                <Text style={{ color: '#94a3b8', fontSize: 14 }}>No shipments found</Text>
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
                      borderRadius: 18,
                      marginBottom: 14,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.07,
                      shadowRadius: 10,
                      elevation: 3,
                      overflow: 'hidden',
                    }}
                    onPress={() => navigateToBiltyDetails(shipment)}
                    activeOpacity={0.7}
                  >
                    {/* Status Strip at Top */}
                    <View style={{ height: 3, backgroundColor: statusStyle.dot }} />

                    <View style={{ padding: 16 }}>
                      {/* Top Row: GR + Status + Amount */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: statusStyle.bg, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                            <Text style={{ fontSize: 18 }}>📦</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b', letterSpacing: 0.3 }}>
                                {shipment.gr_no}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: statusStyle.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 }}>
                                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusStyle.dot, marginRight: 4 }} />
                                <Text style={{ fontSize: 9, fontWeight: '700', color: statusStyle.color }}>{status}</Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                              {formatDate(shipment.bilty_date)}
                              {shipment.consignee_name ? ` • To: ${shipment.consignee_name}` : ''}
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.primary }}>
                            ₹{shipment.total || 0}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Route Row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5 }}>FROM</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 3 }} numberOfLines={1}>
                            {shipment.from_city_name || 'N/A'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'center', marginHorizontal: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 16, height: 2, backgroundColor: '#cbd5e1', borderRadius: 1 }} />
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 }}>
                              <Text style={{ fontSize: 10, color: '#fff' }}>→</Text>
                            </View>
                            <View style={{ width: 16, height: 2, backgroundColor: '#cbd5e1', borderRadius: 1 }} />
                          </View>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5 }}>TO</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 3 }} numberOfLines={1}>
                            {shipment.to_city_name || 'N/A'}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom Row: Packages + Weight */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 }}>
                            <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>📦 {shipment.no_of_pkg || 0} Pkg</Text>
                          </View>
                          {shipment.wt ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                              <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>⚖️ {shipment.wt} Kg</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>Details</Text>
                          <Text style={{ fontSize: 12, color: '#94a3b8' }}>›</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── Powered By Footer ── */}
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
            <Text style={{ fontSize: 11, color: '#cbd5e1', letterSpacing: 0.3 }}>Powered by movesure.io</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}
