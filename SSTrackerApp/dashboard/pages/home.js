import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../navigation/NavigationManager';
import styles from './styles/home.styles';

export default function DashboardHome() {
  const { user } = useAuth();

  const stats = [
    { label: 'Active Shipments', value: '12', icon: '📦' },
    { label: 'In Transit', value: '8', icon: '🚚' },
    { label: 'Delivered', value: '145', icon: '✅' },
    { label: 'Pending', value: '4', icon: '⏳' },
  ];

  const recentShipments = [
    { id: 'SHP001', destination: 'Mumbai', status: 'In Transit', date: '21 Jan 2026' },
    { id: 'SHP002', destination: 'Delhi', status: 'Delivered', date: '20 Jan 2026' },
    { id: 'SHP003', destination: 'Bangalore', status: 'Pending', date: '21 Jan 2026' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello!</Text>
        <Text style={styles.phoneNumber}>+91 {user?.phoneNumber}</Text>
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
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

        {recentShipments.map((shipment, index) => (
          <TouchableOpacity key={index} style={styles.shipmentCard}>
            <View style={styles.shipmentInfo}>
              <Text style={styles.shipmentId}>{shipment.id}</Text>
              <Text style={styles.shipmentDestination}>To: {shipment.destination}</Text>
              <Text style={styles.shipmentDate}>{shipment.date}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              shipment.status === 'Delivered' && styles.statusDelivered,
              shipment.status === 'In Transit' && styles.statusTransit,
              shipment.status === 'Pending' && styles.statusPending,
            ]}>
              <Text style={styles.statusText}>{shipment.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
