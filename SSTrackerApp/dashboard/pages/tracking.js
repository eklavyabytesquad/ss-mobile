import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { fetchBiltyByGR } from '../../utils/biltyService';
import Colors from '../../constants/colors';
import styles from './styles/tracking.styles';

export default function DashboardTracking() {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const getStatusFromSavingOption = (savingOption) => {
    switch(savingOption) {
      case 'DELIVERED': return 'Delivered';
      case 'IN_TRANSIT': return 'In Transit';
      case 'AT_HUB': return 'At Hub';
      case 'SAVE': return 'In Transit';
      default: return 'Pending';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleTrack = async (id = trackingId) => {
    if (!id) {
      Alert.alert('Error', 'Please enter a tracking ID');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await fetchBiltyByGR(id);
      
      if (result.success && result.data) {
        const bilty = result.data;
        setTrackingResult({
          id: bilty.gr_no,
          status: getStatusFromSavingOption(bilty.saving_option),
          origin: bilty.from_city_name || 'N/A',
          destination: bilty.to_city_name || 'N/A',
          consignor: bilty.consignor_name,
          consignee: bilty.consignee_name,
          biltyDate: formatDate(bilty.bilty_date),
          packages: bilty.no_of_pkg,
          weight: bilty.wt,
          total: bilty.total,
          invoiceNo: bilty.invoice_no,
          eWayBill: bilty.e_way_bill,
          paymentMode: bilty.payment_mode,
          remark: bilty.remark,
        });
      } else {
        Alert.alert('Not Found', 'No shipment found with this tracking ID');
        setTrackingResult(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tracking details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <TouchableOpacity 
        style={[styles.searchButton, isLoading && { opacity: 0.7 }]} 
        onPress={() => handleTrack()}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.searchButtonText}>Track</Text>
        )}
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
            <View style={[
              styles.statusBadge, 
              { backgroundColor: trackingResult.status === 'Delivered' ? '#dcfce7' : 
                               trackingResult.status === 'In Transit' ? '#dbeafe' : '#fef3c7' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: trackingResult.status === 'Delivered' ? Colors.delivered : 
                        trackingResult.status === 'In Transit' ? Colors.inTransit : Colors.atHub }
              ]}>{trackingResult.status}</Text>
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
            <Text style={styles.deliveryLabel}>Bilty Date</Text>
            <Text style={styles.deliveryDate}>{trackingResult.biltyDate}</Text>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.timelineTitle}>Shipment Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Consignor</Text>
              <Text style={styles.detailValue}>{trackingResult.consignor || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Consignee</Text>
              <Text style={styles.detailValue}>{trackingResult.consignee || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>No. of Packages</Text>
              <Text style={styles.detailValue}>{trackingResult.packages || '0'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{trackingResult.weight ? `${trackingResult.weight} kg` : 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice No</Text>
              <Text style={styles.detailValue}>{trackingResult.invoiceNo || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>E-Way Bill</Text>
              <Text style={styles.detailValue}>{trackingResult.eWayBill || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Mode</Text>
              <Text style={styles.detailValue}>{trackingResult.paymentMode || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={[styles.detailValue, { color: Colors.primary, fontWeight: 'bold' }]}>
                ₹{trackingResult.total || '0'}
              </Text>
            </View>

            {trackingResult.remark && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remark</Text>
                <Text style={styles.detailValue}>{trackingResult.remark}</Text>
              </View>
            )}
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
