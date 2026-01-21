import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from './styles/history.styles';

export default function DashboardHistory() {
  const [filter, setFilter] = useState('all');

  const shipments = [
    { id: 'SHP001', destination: 'Mumbai', status: 'Delivered', date: '20 Jan 2026', amount: '₹2,500' },
    { id: 'SHP002', destination: 'Delhi', status: 'Delivered', date: '18 Jan 2026', amount: '₹3,200' },
    { id: 'SHP003', destination: 'Bangalore', status: 'Cancelled', date: '15 Jan 2026', amount: '₹1,800' },
    { id: 'SHP004', destination: 'Kolkata', status: 'Delivered', date: '12 Jan 2026', amount: '₹4,100' },
    { id: 'SHP005', destination: 'Hyderabad', status: 'Delivered', date: '10 Jan 2026', amount: '₹2,900' },
    { id: 'SHP006', destination: 'Pune', status: 'Cancelled', date: '8 Jan 2026', amount: '₹1,500' },
  ];

  const filteredShipments = filter === 'all' 
    ? shipments 
    : shipments.filter(s => s.status.toLowerCase() === filter);

  const filters = ['all', 'delivered', 'cancelled'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shipment History</Text>
        <Text style={styles.subtitle}>View all your past shipments</Text>
      </View>

      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.listContainer}>
        {filteredShipments.map((shipment, index) => (
          <TouchableOpacity key={index} style={styles.shipmentCard}>
            <View style={styles.shipmentHeader}>
              <Text style={styles.shipmentId}>{shipment.id}</Text>
              <Text style={styles.shipmentAmount}>{shipment.amount}</Text>
            </View>
            <View style={styles.shipmentBody}>
              <View style={styles.shipmentInfo}>
                <Text style={styles.shipmentLabel}>Destination</Text>
                <Text style={styles.shipmentValue}>{shipment.destination}</Text>
              </View>
              <View style={styles.shipmentInfo}>
                <Text style={styles.shipmentLabel}>Date</Text>
                <Text style={styles.shipmentValue}>{shipment.date}</Text>
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              shipment.status === 'Delivered' && styles.statusDelivered,
              shipment.status === 'Cancelled' && styles.statusCancelled,
            ]}>
              <Text style={[
                styles.statusText,
                shipment.status === 'Delivered' && styles.statusTextDelivered,
                shipment.status === 'Cancelled' && styles.statusTextCancelled,
              ]}>
                {shipment.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
