import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import styles from './styles/tracking.styles';

export default function DashboardTracking() {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }) => {
    if (!scanned) {
      setScanned(true);
      
      // Extract LR number from URL if it's a movesure.io link
      let extractedId = data;
      if (data.includes('console.movesure.io/print/')) {
        const parts = data.split('console.movesure.io/print/');
        if (parts.length > 1) {
          extractedId = parts[1].split('/')[0].split('?')[0];
        }
      }
      
      setTrackingId(extractedId);
      setShowScanner(false);
      handleTrack(extractedId);
      
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const openScanner = async () => {
    if (!permission) {
      requestPermission();
      return;
    }
    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes.');
        return;
      }
    }
    setShowScanner(true);
  };

  const handleTrack = (id = trackingId) => {
    // Dummy tracking result
    if (id) {
      setTrackingResult({
        id: id,
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
        <Text style={styles.title}>SS Tracker</Text>
        <Text style={styles.subtitle}>Enter tracking ID to get live updates</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter Tracking ID (e.g., SHP001)"
            value={trackingId}
            onChangeText={setTrackingId}
          />
          {trackingId.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => {
                setTrackingId('');
                setTrackingResult(null);
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={() => handleTrack()}>
          <Text style={styles.searchButtonText}>Track</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.scanCapsule} onPress={openScanner}>
        <Image 
          source={require('../../assets/images/scan.png')} 
          style={styles.scanIcon}
        />
        <Text style={styles.scanCapsuleText}>Scan QR Code</Text>
      </TouchableOpacity>

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

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
            }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>Position QR code within the frame</Text>
          </View>
          <View style={styles.scannerHeader}>
            <View style={styles.scannerHeaderLeft}>
              <View style={styles.scannerLogoContainer}>
                <Image 
                  source={require('../../assets/images/logo.png')} 
                  style={styles.scannerLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.scannerTitle}>SS Tracker</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
