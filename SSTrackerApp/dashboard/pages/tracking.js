import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { fetchBiltyByGR } from '../../utils/biltyService';
import Colors from '../../constants/colors';
import styles from './styles/tracking.styles';

export default function DashboardTracking() {
  const navigation = useNavigation();
  const [grNumber, setGrNumber] = useState('');
  const [biltyData, setBiltyData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBarcodeScanned = ({ data }) => {
    if (!scanned) {
      setScanned(true);
      
      // Extract GR number from URL if it's a movesure.io link
      let extractedGR = data;
      if (data.includes('console.movesure.io/print/')) {
        const parts = data.split('console.movesure.io/print/');
        if (parts.length > 1) {
          extractedGR = parts[1].split('/')[0].split('?')[0];
        }
      }
      
      setGrNumber(extractedGR);
      setShowScanner(false);
      searchBiltyByGR(extractedGR);
      
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

  const searchBiltyByGR = async (grNo = grNumber) => {
    if (!grNo || grNo.trim() === '') {
      Alert.alert('Error', 'Please enter a GR Number');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await fetchBiltyByGR(grNo.trim());
      
      if (result.success && result.data) {
        setBiltyData(result.data);
      } else {
        Alert.alert('Not Found', `No bilty found with GR Number: ${grNo}`);
        setBiltyData(null);
      }
    } catch (error) {
      console.error('Error fetching bilty:', error);
      Alert.alert('Error', 'Failed to fetch bilty details. Please try again.');
      setBiltyData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiltyPress = (bilty) => {
    // Navigate to BiltyDetails screen in parent stack navigator
    navigation.getParent()?.navigate('BiltyDetails', { biltyId: bilty.id });
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>SS Tracker</Text>
        <Text style={styles.subtitle}>Search by GR Number or Scan QR Code</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter GR Number"
            placeholderTextColor={Colors.textMuted || '#999'}
            value={grNumber}
            onChangeText={setGrNumber}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={() => searchBiltyByGR()}
          />
          {grNumber.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => {
                setGrNumber('');
                setBiltyData(null);
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.searchButton, isLoading && { opacity: 0.7 }]} 
          onPress={() => searchBiltyByGR()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
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

      {biltyData && (
        <TouchableOpacity 
          style={styles.biltyCard}
          onPress={() => handleBiltyPress(biltyData)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.grNumber}>{biltyData.gr_no}</Text>
              <Text style={styles.biltyDate}>{formatDate(biltyData.bilty_date)}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: biltyData.saving_option === 'DELIVERED' ? '#dcfce7' : 
                               biltyData.saving_option === 'IN_TRANSIT' ? '#dbeafe' : '#fef3c7' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: biltyData.saving_option === 'DELIVERED' ? Colors.delivered : 
                        biltyData.saving_option === 'IN_TRANSIT' ? Colors.inTransit : Colors.atHub }
              ]}>
                {getStatusFromSavingOption(biltyData.saving_option)}
              </Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.cityBox}>
              <Text style={styles.cityLabel}>From</Text>
              <Text style={styles.cityName} numberOfLines={1}>
                {biltyData.from_city_name || 'N/A'}
              </Text>
            </View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={styles.cityBox}>
              <Text style={styles.cityLabel}>To</Text>
              <Text style={styles.cityName} numberOfLines={1}>
                {biltyData.to_city_name || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Consignor:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {biltyData.consignor_name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Consignee:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {biltyData.consignee_name || 'N/A'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Packages</Text>
              <Text style={styles.footerValue}>{biltyData.no_of_pkg || 0}</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Weight</Text>
              <Text style={styles.footerValue}>{biltyData.wt ? `${biltyData.wt} kg` : 'N/A'}</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Amount</Text>
              <Text style={[styles.footerValue, { color: Colors.primary }]}>
                ₹{biltyData.total || '0'}
              </Text>
            </View>
          </View>

          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap to view full details →</Text>
          </View>
        </TouchableOpacity>
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
