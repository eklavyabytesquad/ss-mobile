import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import styles from './styles/tracking.styles';

export default function DashboardTracking() {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);

  const handleTrack = () => {
    // Dummy tracking result
    if (trackingId) {
      setTrackingResult({
        id: trackingId,
        status: 'In Transit',
        origin: 'Chennai',
        destination: 'Mumbai',
        estimatedDelivery: '23 Jan 2026',
        timeline: [
          { date: '21 Jan, 10:00 AM', status: 'In Transit', location: 'Hyderabad Hub' },
          { date: '20 Jan, 6:00 PM', status: 'Departed', location: 'Chennai Hub' },
          { date: '20 Jan, 2:00 PM', status: 'Picked Up', location: 'Chennai' },
          { date: '20 Jan, 10:00 AM', status: 'Order Placed', location: 'Chennai' },
        ],
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Shipment</Text>
        <Text style={styles.subtitle}>Enter tracking ID to get live updates</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter Tracking ID (e.g., SHP001)"
          value={trackingId}
          onChangeText={setTrackingId}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleTrack}>
          <Text style={styles.searchButtonText}>Track</Text>
        </TouchableOpacity>
      </View>

      {trackingResult && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultId}>{trackingResult.id}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{trackingResult.status}</Text>
            </View>
          </View>

          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeValue}>{trackingResult.origin}</Text>
            </View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeValue}>{trackingResult.destination}</Text>
            </View>
          </View>

          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
            <Text style={styles.deliveryDate}>{trackingResult.estimatedDelivery}</Text>
          </View>

          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>Tracking History</Text>
            {trackingResult.timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < trackingResult.timeline.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{item.status}</Text>
                  <Text style={styles.timelineLocation}>{item.location}</Text>
                  <Text style={styles.timelineDate}>{item.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
