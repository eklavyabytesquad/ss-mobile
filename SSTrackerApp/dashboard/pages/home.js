import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from './styles/home.styles';
import Colors from '../../constants/colors';

export default function DashboardHome() {
  const { user } = useAuth();

  const stats = [
    { label: 'Active Shipments', value: '12', icon: require('../../assets/images/shipping-box.png'), isPng: true },
    { label: 'In Transit', value: '8', icon: require('../../assets/images/truck.png'), isPng: true },
    { label: 'Delivered', value: '145', icon: '✅', isPng: false },
    { label: 'At Hub', value: '4', icon: require('../../assets/images/warehosue.png'), isPng: true },
  ];

  const recentShipments = [
    { id: 'SHP001', destination: 'Mumbai', status: 'In Transit', date: '21 Jan 2026' },
    { id: 'SHP002', destination: 'Delhi', status: 'Delivered', date: '20 Jan 2026' },
    { id: 'SHP003', destination: 'Bangalore', status: 'Delayed', date: '21 Jan 2026' },
    { id: 'SHP004', destination: 'Chennai', status: 'At Hub', date: '21 Jan 2026' },
  ];

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Delivered': return { bg: '#dcfce7', color: Colors.delivered };
      case 'In Transit': return { bg: '#dbeafe', color: Colors.inTransit };
      case 'Delayed': return { bg: '#fee2e2', color: Colors.delayed };
      case 'At Hub': return { bg: '#fef3c7', color: Colors.atHub };
      default: return { bg: '#f3f4f6', color: Colors.textSecondary };
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.greeting}>Hello!</Text>
            <Text style={styles.phoneNumber}>+91 {user?.phoneNumber}</Text>
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

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            {stat.isPng ? (
              <Image source={stat.icon} style={{ width: 32, height: 32, tintColor: Colors.primary, marginBottom: 8 }} />
            ) : (
              <Text style={styles.statIcon}>{stat.icon}</Text>
            )}
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Shipments</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentShipments.map((shipment, index) => {
          const statusStyle = getStatusStyle(shipment.status);
          return (
            <TouchableOpacity key={index} style={styles.shipmentCard}>
              <View style={styles.shipmentInfo}>
                <Text style={styles.shipmentId}>{shipment.id}</Text>
                <Text style={styles.shipmentDestination}>To: {shipment.destination}</Text>
                <Text style={styles.shipmentDate}>{shipment.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.color }]}>{shipment.status}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>New Shipment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>Track</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
