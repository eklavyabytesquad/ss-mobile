import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Image, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { getFullBiltyDetails, trackBiltySearch, uploadBiltyImage, removeBiltyImage } from '../../utils/biltySearchService';
import supabase from '../../utils/supabase';
import styles from './styles/bilty-details.styles';

export default function StaffBiltyDetails({ route, navigation }) {
  const { grNo } = route.params || {};
  const { user } = useStaffAuth();
  const [bilty, setBilty] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Kaat details state
  const [pohonchNo, setPohonchNo] = useState('');
  const [kaatBiltyNo, setKaatBiltyNo] = useState('');
  const [transportSearch, setTransportSearch] = useState('');
  const [transportSuggestions, setTransportSuggestions] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [isSearchingTransport, setIsSearchingTransport] = useState(false);
  const [isSavingKaat, setIsSavingKaat] = useState(false);
  const [destCityId, setDestCityId] = useState(null);
  const [searchAllTransports, setSearchAllTransports] = useState(false);
  const [cityTransports, setCityTransports] = useState([]);

  useEffect(() => {
    if (grNo) loadDetails();
  }, [grNo]);

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const trackResult = await trackBiltySearch(grNo, user?.id, 'MOB');
      if (trackResult.success) setTrackingData(trackResult.trackingData);

      const result = await getFullBiltyDetails(grNo);
      if (result.success && result.data) {
        setBilty(result.data);
      } else {
        Alert.alert('Not Found', 'Bilty details not found.');
        navigation.goBack();
      }
    } catch (e) {
      console.error('Load error:', e);
      Alert.alert('Error', 'Failed to load bilty details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve destination city_id and auto-load transports for that city
  useEffect(() => {
    if (!bilty) return;

    const resolveCityAndLoadTransports = async () => {
      let cityId = null;

      if (bilty.bilty_type === 'REG' && bilty.to_city_id) {
        // Regular bilty: to_city_id is already UUID
        cityId = bilty.to_city_id;
      } else if (bilty.bilty_type === 'MANUAL' && bilty.station) {
        // Station bilty: station = city_code, lookup cities table to get id
        try {
          const { data: cityData } = await supabase
            .from('cities')
            .select('id')
            .ilike('city_code', bilty.station)
            .maybeSingle();
          if (cityData) cityId = cityData.id;
        } catch (e) {
          console.error('City lookup error:', e);
        }
      }

      setDestCityId(cityId);

      // Auto-load transports for this city
      if (cityId) {
        try {
          const { data } = await supabase
            .from('transports')
            .select('id, transport_name, city_name, mob_number, gst_number')
            .eq('city_id', cityId)
            .order('transport_name', { ascending: true })
            .limit(50);
          setCityTransports(data || []);
        } catch (e) {
          console.error('Load city transports error:', e);
        }
      }

      // Pre-fill kaat fields if bilty already has them
      if (bilty.pohonch_no) setPohonchNo(bilty.pohonch_no);
      if (bilty.kaat_bilty_no) setKaatBiltyNo(bilty.kaat_bilty_no);
      if (bilty.kaat_transport_id && bilty.kaat_transport_name) {
        setSelectedTransport({ id: bilty.kaat_transport_id, transport_name: bilty.kaat_transport_name });
      }
    };

    resolveCityAndLoadTransports();
  }, [bilty?.id]);

  // Pick from gallery and upload
  const handleUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;
    const image = result.assets?.[0];
    if (!image?.uri) return;

    await doUpload(image);
  };

  // Take photo with camera and upload
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (result.canceled) return;
    const image = result.assets?.[0];
    if (!image?.uri) return;

    await doUpload(image);
  };

  // Shared upload logic
  const doUpload = async (image) => {
    if (image.fileSize && image.fileSize > 10 * 1024 * 1024) {
      Alert.alert('Error', 'Image must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      const uploadResult = await uploadBiltyImage(
        bilty.id,
        bilty.gr_no,
        bilty.bilty_type,
        image.uri
      );

      if (uploadResult.success) {
        setBilty(prev => ({ ...prev, bilty_image: uploadResult.imageUrl }));
        Alert.alert('Success', 'Image uploaded successfully!');
      } else {
        Alert.alert('Error', uploadResult.error || 'Upload failed.');
      }
    } catch (e) {
      console.error('Upload error:', e);
      Alert.alert('Error', 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove existing image
  const handleRemoveImage = () => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setIsUploading(true);
          try {
            const result = await removeBiltyImage(
              bilty.id,
              bilty.bilty_type,
              bilty.bilty_image
            );
            if (result.success) {
              setBilty(prev => ({ ...prev, bilty_image: null }));
              Alert.alert('Success', 'Image removed.');
            } else {
              Alert.alert('Error', result.error || 'Failed to remove image.');
            }
          } catch (e) {
            console.error('Remove error:', e);
            Alert.alert('Error', 'Failed to remove image.');
          } finally {
            setIsUploading(false);
          }
        },
      },
    ]);
  };

  // Search transports by name, filter by destination city_id unless searchAll
  const searchTransports = async (term) => {
    setTransportSearch(term);
    setSelectedTransport(null);

    if (!term || term.trim().length < 2) {
      setTransportSuggestions([]);
      return;
    }

    setIsSearchingTransport(true);
    try {
      let query = supabase
        .from('transports')
        .select('id, transport_name, city_name, mob_number, gst_number')
        .ilike('transport_name', `%${term.trim()}%`)
        .limit(15);

      // Filter by city_id unless user toggled "search all"
      if (!searchAllTransports && destCityId) {
        query = query.eq('city_id', destCityId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Transport search error:', error);
        setTransportSuggestions([]);
      } else {
        setTransportSuggestions(data || []);
      }
    } catch (e) {
      console.error('Transport search error:', e);
      setTransportSuggestions([]);
    } finally {
      setIsSearchingTransport(false);
    }
  };

  const selectTransport = (transport) => {
    setSelectedTransport(transport);
    setTransportSearch(transport.transport_name);
    setTransportSuggestions([]);
  };

  const clearTransport = () => {
    setSelectedTransport(null);
    setTransportSearch('');
    setTransportSuggestions([]);
  };

  const handleSaveKaat = async () => {
    if (!pohonchNo && !kaatBiltyNo && !selectedTransport) {
      Alert.alert('Info', 'Please fill at least one field.');
      return;
    }

    setIsSavingKaat(true);
    try {
      const updateData = {};
      if (pohonchNo.trim()) updateData.pohonch_no = pohonchNo.trim();
      if (kaatBiltyNo.trim()) updateData.kaat_bilty_no = kaatBiltyNo.trim();
      if (selectedTransport) {
        updateData.kaat_transport_id = selectedTransport.id;
        updateData.kaat_transport_name = selectedTransport.transport_name;
      }

      const tableName = bilty?.bilty_type === 'MANUAL' ? 'station_bilty_summary' : 'bilty';
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', bilty.id);

      if (error) {
        console.error('Save kaat error:', error);
        Alert.alert('Error', error.message);
      } else {
        setBilty(prev => ({ ...prev, ...updateData }));
        Alert.alert('Success', 'Kaat details saved successfully!');
      }
    } catch (e) {
      console.error('Save kaat error:', e);
      Alert.alert('Error', 'Failed to save kaat details.');
    } finally {
      setIsSavingKaat(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatCurrency = (a) => {
    if (!a && a !== 0) return '₹0';
    return `₹${parseFloat(a).toLocaleString('en-IN')}`;
  };

  const getStatusLabel = (o) => {
    const map = { DELIVERED: 'Delivered', IN_TRANSIT: 'In Transit', SAVE: 'In Transit', AT_HUB: 'At Hub', paid: 'Paid', 'to-pay': 'To Pay', foc: 'FOC' };
    return map[o] || o || 'Pending';
  };

  const getStatusColors = (o) => {
    const map = {
      DELIVERED: { bg: '#dcfce7', color: '#166534' }, paid: { bg: '#dcfce7', color: '#166534' },
      IN_TRANSIT: { bg: '#dbeafe', color: '#1e40af' }, SAVE: { bg: '#dbeafe', color: '#1e40af' },
      AT_HUB: { bg: '#fef3c7', color: '#92400e' }, 'to-pay': { bg: '#fef3c7', color: '#92400e' },
      foc: { bg: '#f3e8ff', color: '#6d28d9' },
    };
    return map[o] || { bg: '#f1f5f9', color: '#64748b' };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />
        <ActivityIndicator size="large" color="#475569" />
        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>Loading details...</Text>
      </View>
    );
  }

  if (!bilty) return null;

  const sc = getStatusColors(bilty.saving_option);
  const charges = [
    { label: 'Freight', value: bilty.freight_amount },
    { label: 'Labour', value: bilty.labour_charge },
    { label: 'Bill Charge', value: bilty.bill_charge },
    { label: 'Toll Charge', value: bilty.toll_charge },
    { label: 'DD Charge', value: bilty.dd_charge },
    { label: 'PF Charge', value: bilty.pf_charge },
    { label: 'Other', value: bilty.other_charge },
  ].filter(c => c.value && parseFloat(c.value) > 0);

  const shipmentDetails = [
    { label: 'Packages', value: bilty.no_of_pkg ? String(bilty.no_of_pkg) : null },
    { label: 'Weight', value: bilty.wt ? `${bilty.wt} Kg` : null },
    { label: 'Contents', value: bilty.contain },
    { label: 'Delivery Type', value: bilty.delivery_type },
    { label: 'Payment Mode', value: bilty.payment_mode },
    { label: 'Private Marks', value: bilty.pvt_marks },
    { label: 'Invoice No', value: bilty.invoice_no },
    { label: 'Invoice Value', value: bilty.invoice_value ? formatCurrency(bilty.invoice_value) : null },
    { label: 'E-Way Bill', value: bilty.e_way_bill },
    { label: 'Remark', value: bilty.remark },
  ].filter(d => d.value);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#334155" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <LinearGradient
          colors={['#475569', '#334155', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bilty Details</Text>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoSmall}
              resizeMode="contain"
            />
          </View>
          <View style={styles.grContainer}>
            <Text style={styles.grText}>{bilty.gr_no}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {bilty.bilty_type === 'REG' ? 'REGULAR' : 'MANUAL'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusBadgeText, { color: sc.color }]}>
                  {getStatusLabel(bilty.saving_option)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.dateLine}>{formatDate(bilty.bilty_date)}</Text>
        </LinearGradient>

        {/* Route */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeCity}>
              <Text style={styles.routeCityLabel}>FROM</Text>
              <Text style={styles.routeCityName}>{bilty.from_city_name || 'N/A'}</Text>
            </View>
            <View style={styles.routeConnector}>
              <LinearGradient colors={['#94a3b8', '#64748b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.routeLine} />
              <Text style={styles.routeArrow}>▶</Text>
            </View>
            <View style={styles.routeCity}>
              <Text style={styles.routeCityLabel}>TO</Text>
              <Text style={styles.routeCityName}>{bilty.to_city_name || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={[styles.partyCard, styles.partyConsignor]}>
            <Text style={styles.partyType}>CONSIGNOR</Text>
            <Text style={styles.partyName}>{bilty.consignor_name || 'N/A'}</Text>
            {bilty.consignor_gst ? <Text style={styles.partyDetail}>GST: {bilty.consignor_gst}</Text> : null}
            {bilty.consignor_number ? <Text style={styles.partyDetail}>Ph: {bilty.consignor_number}</Text> : null}
          </View>
          <View style={[styles.partyCard, styles.partyConsignee]}>
            <Text style={styles.partyType}>CONSIGNEE</Text>
            <Text style={styles.partyName}>{bilty.consignee_name || 'N/A'}</Text>
            {bilty.consignee_gst ? <Text style={styles.partyDetail}>GST: {bilty.consignee_gst}</Text> : null}
            {bilty.consignee_number ? <Text style={styles.partyDetail}>Ph: {bilty.consignee_number}</Text> : null}
          </View>
          {bilty.transport_name && (
            <View style={[styles.partyCard, styles.partyTransport]}>
              <Text style={styles.partyType}>TRANSPORT</Text>
              <Text style={styles.partyName}>{bilty.transport_name}</Text>
              {bilty.transport_gst ? <Text style={styles.partyDetail}>GST: {bilty.transport_gst}</Text> : null}
              {bilty.transport_number ? <Text style={styles.partyDetail}>Ph: {bilty.transport_number}</Text> : null}
            </View>
          )}
        </View>

        {/* Shipment Details */}
        {shipmentDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipment Details</Text>
            <View style={styles.sectionCard}>
              {shipmentDetails.map((d, i) => (
                <View key={i} style={[styles.detailRow, i === shipmentDetails.length - 1 && styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailValue}>{d.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Kaat Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bilty Kaat Details</Text>
          <View style={styles.kaatCard}>
            {/* Pohonch Number */}
            <View style={styles.kaatFieldGroup}>
              <Text style={styles.kaatLabel}>Pohonch Number</Text>
              <TextInput
                style={styles.kaatInput}
                value={pohonchNo || bilty.pohonch_no || ''}
                onChangeText={setPohonchNo}
                placeholder="Enter pohonch number (optional)"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Bilty Number */}
            <View style={styles.kaatFieldGroup}>
              <Text style={styles.kaatLabel}>Bilty Number</Text>
              <TextInput
                style={styles.kaatInput}
                value={kaatBiltyNo || bilty.kaat_bilty_no || ''}
                onChangeText={setKaatBiltyNo}
                placeholder="Enter bilty number (optional)"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Transport Search */}
            <View style={styles.kaatFieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.kaatLabel}>
                  Transport {bilty.to_city_name && bilty.to_city_name !== 'N/A' ? `(${bilty.to_city_name})` : ''}
                </Text>
                {destCityId && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchAllTransports(!searchAllTransports);
                      setTransportSuggestions([]);
                      setTransportSearch('');
                    }}
                    style={styles.toggleAllBtn}
                  >
                    <Text style={styles.toggleAllText}>
                      {searchAllTransports ? '📍 City Only' : '🌐 Search All'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {selectedTransport || bilty.kaat_transport_name ? (
                <View style={styles.selectedTransportCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedTransportName}>
                      {selectedTransport?.transport_name || bilty.kaat_transport_name}
                    </Text>
                    {(selectedTransport?.city_name) && (
                      <Text style={styles.selectedTransportCity}>
                        {selectedTransport.city_name}
                        {selectedTransport.mob_number ? ` • ${selectedTransport.mob_number}` : ''}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={clearTransport} style={styles.clearTransportBtn}>
                    <Text style={{ fontSize: 14, color: '#94a3b8' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={styles.kaatInput}
                  value={transportSearch}
                  onChangeText={searchTransports}
                  placeholder={searchAllTransports ? 'Search all transports...' : `Search transports in ${bilty.to_city_name || 'destination'}...`}
                  placeholderTextColor="#94a3b8"
                />
              )}

              {/* Transport Suggestions from search */}
              {transportSuggestions.length > 0 && (
                <View style={styles.transportDropdown}>
                  {transportSuggestions.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.transportItem}
                      onPress={() => selectTransport(t)}
                    >
                      <Text style={styles.transportItemName}>{t.transport_name}</Text>
                      <Text style={styles.transportItemCity}>
                        {t.city_name}{t.mob_number ? ` • ${t.mob_number}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {isSearchingTransport && transportSuggestions.length === 0 && (
                <View style={styles.transportSearchingRow}>
                  <ActivityIndicator size="small" color="#64748b" />
                  <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>Searching transports...</Text>
                </View>
              )}

              {/* Auto-loaded city transports (show when no search active and no transport selected) */}
              {!selectedTransport && !bilty.kaat_transport_name && !transportSearch && cityTransports.length > 0 && !searchAllTransports && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 }}>
                    AVAILABLE IN {bilty.to_city_name?.toUpperCase() || 'DESTINATION'}
                  </Text>
                  <View style={styles.transportDropdown}>
                    {cityTransports.slice(0, 10).map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={styles.transportItem}
                        onPress={() => selectTransport(t)}
                      >
                        <Text style={styles.transportItemName}>{t.transport_name}</Text>
                        <Text style={styles.transportItemCity}>
                          {t.city_name}{t.mob_number ? ` • ${t.mob_number}` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.kaatSaveBtn, isSavingKaat && { opacity: 0.6 }]}
              onPress={handleSaveKaat}
              disabled={isSavingKaat}
            >
              {isSavingKaat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.kaatSaveBtnText}>Save Kaat Details</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Charges */}
        {charges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Charges</Text>
            <View style={styles.sectionCard}>
              {charges.map((c, i) => (
                <View key={i} style={styles.chargeRow}>
                  <Text style={styles.chargeLabel}>{c.label}</Text>
                  <Text style={styles.chargeValue}>{formatCurrency(c.value)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(bilty.total)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bilty Image */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Bilty Image</Text>

          {bilty.bilty_image ? (
            <View style={styles.imageCard}>
              <Image
                source={{ uri: bilty.bilty_image }}
                style={styles.biltyImage}
                resizeMode="contain"
              />
              {isUploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.uploadOverlayText}>Uploading...</Text>
                </View>
              )}
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.imageActionBtn} onPress={handleTakePhoto} disabled={isUploading}>
                  <Text style={{ fontSize: 15 }}>📷</Text>
                  <Text style={styles.imageActionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageActionBtn} onPress={handleUploadPhoto} disabled={isUploading}>
                  <Text style={{ fontSize: 15 }}>🖼️</Text>
                  <Text style={styles.imageActionText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageRemoveBtn} onPress={handleRemoveImage} disabled={isUploading}>
                  <Text style={{ fontSize: 15 }}>🗑️</Text>
                  <Text style={styles.imageRemoveText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.uploadCard}>
              {isUploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator size="small" color="#475569" />
                  <Text style={styles.uploadingText}>Uploading image...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📸</Text>
                  <Text style={styles.uploadTitle}>No image uploaded</Text>
                  <Text style={styles.uploadSubtext}>Take a photo or pick from gallery</Text>
                  <View style={styles.uploadBtnRow}>
                    <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleTakePhoto}>
                      <Text style={{ fontSize: 18 }}>📷</Text>
                      <Text style={styles.uploadOptionText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadOptionBtn} onPress={handleUploadPhoto}>
                      <Text style={{ fontSize: 18 }}>🖼️</Text>
                      <Text style={styles.uploadOptionText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Tracking */}
        {trackingData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Tracking</Text>
            <View style={styles.trackingCard}>
              <View style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>Searches</Text>
                <Text style={styles.trackingValue}>{trackingData.search_count || 1}</Text>
              </View>
              <View style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>First Searched</Text>
                <Text style={styles.trackingValue}>{formatDateTime(trackingData.first_searched_at)}</Text>
              </View>
              <View style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>Last Searched</Text>
                <Text style={styles.trackingValue}>{formatDateTime(trackingData.last_searched_at)}</Text>
              </View>
              {trackingData.was_previously_searched && (
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingLabel}>Previously Searched</Text>
                  <Text style={styles.trackingValue}>Yes</Text>
                </View>
              )}
              {trackingData.is_complaint && (
                <View style={[styles.complaintBadge, trackingData.is_resolved && styles.resolvedBadge]}>
                  <Text style={[styles.complaintText, trackingData.is_resolved && styles.resolvedText]}>
                    {trackingData.is_resolved ? 'Resolved' : trackingData.in_investigation ? 'Under Investigation' : 'Complaint Filed'}
                  </Text>
                </View>
              )}
              {trackingData.complaint_remark && (
                <View style={[styles.trackingRow, { marginTop: 4 }]}>
                  <Text style={styles.trackingLabel}>Complaint</Text>
                  <Text style={[styles.trackingValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>{trackingData.complaint_remark}</Text>
                </View>
              )}
              {trackingData.resolution_remark && (
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingLabel}>Resolution</Text>
                  <Text style={[styles.trackingValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>{trackingData.resolution_remark}</Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
