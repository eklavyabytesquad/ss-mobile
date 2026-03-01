import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert, Image, Clipboard, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchBiltyById, fetchBiltyByGR } from '../../utils/biltyService';
import { BiltyPdfGenerator } from '../../printing';
import styles from './styles/bilty-details.styles';

export default function TransporterBiltyDetails({ route, navigation }) {
  const { biltyId, grNo } = route.params || {};
  const [bilty, setBilty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadBiltyDetails();
  }, [biltyId, grNo]);

  useEffect(() => {
    if (bilty?.bilty_image) {
      const optimizedUrl = getOptimizedImageUrl(bilty.bilty_image);
      Image.prefetch(optimizedUrl)
        .then(() => setImageLoading(false))
        .catch(() => setImageLoading(false));
    }
  }, [bilty]);

  const getOptimizedImageUrl = (imageUrl) => {
    if (!imageUrl) return imageUrl;
    if (imageUrl.includes('supabase.co/storage')) {
      const separator = imageUrl.includes('?') ? '&' : '?';
      return `${imageUrl}${separator}width=800&quality=75`;
    }
    return imageUrl;
  };

  const loadBiltyDetails = async () => {
    setIsLoading(true);
    try {
      let result;
      if (biltyId) {
        result = await fetchBiltyById(biltyId);
      } else if (grNo) {
        result = await fetchBiltyByGR(grNo);
      }

      if (result?.success && result.data) {
        setBilty(result.data);
      } else {
        Alert.alert('Error', 'Failed to load bilty details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load bilty details error:', error);
      Alert.alert('Error', 'Failed to load bilty details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusFromSavingOption = (savingOption) => {
    switch (savingOption) {
      case 'DELIVERED': return 'Delivered';
      case 'IN_TRANSIT': return 'In Transit';
      case 'AT_HUB': return 'At Hub';
      case 'SAVE': return 'In Transit';
      default: return 'Pending';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered': return { bg: '#dcfce7', color: '#166534' };
      case 'In Transit': return { bg: '#dbeafe', color: '#1e40af' };
      case 'At Hub': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const handleShare = async () => {
    try {
      const status = getStatusFromSavingOption(bilty.saving_option);
      const message = `📦 Bilty Details\n\nGR No: ${bilty.gr_no}\nStatus: ${status}\nFrom: ${bilty.from_city_name || 'N/A'}\nTo: ${bilty.to_city_name || 'N/A'}\nConsignor: ${bilty.consignor_name || 'N/A'}\nConsignee: ${bilty.consignee_name || 'N/A'}\nPackages: ${bilty.no_of_pkg || 0}\nWeight: ${bilty.wt || 'N/A'} Kg\nTotal: ${formatCurrency(bilty.total)}\n\nTrack your shipment with SS Tracker App`;
      await Share.share({ message });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyImageLink = async () => {
    try {
      if (bilty?.bilty_image) {
        await Clipboard.setString(bilty.bilty_image);
        Alert.alert('✅ Copied', 'Image link copied to clipboard!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to copy image link');
    }
  };

  const handleDownloadImage = async () => {
    try {
      if (bilty?.bilty_image) {
        const supported = await Linking.canOpenURL(bilty.bilty_image);
        if (supported) {
          await Linking.openURL(bilty.bilty_image);
        } else {
          Alert.alert('Error', 'Cannot open image URL');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open image');
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading bilty details...</Text>
      </View>
    );
  }

  // Empty State
  if (!bilty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyText}>Bilty not found</Text>
      </View>
    );
  }

  const status = getStatusFromSavingOption(bilty.saving_option);
  const statusStyle = getStatusStyle(status);

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Top Row: Back + Title + Actions */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bilty Details</Text>
          <TouchableOpacity onPress={() => setShowPrintModal(true)} style={styles.headerAction}>
            <Text style={styles.headerActionIcon}>🖨️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
            <Text style={styles.headerActionIcon}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* GR No + Status Badge */}
        <View style={styles.grBadge}>
          <View>
            <Text style={styles.grNoText}>{bilty.gr_no}</Text>
            <View style={styles.biltyDateRow}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>📅</Text>
              <Text style={styles.biltyDateText}>{formatDate(bilty.bilty_date)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{status}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Card */}
        <View style={styles.routeCard}>
          <Text style={styles.routeSectionTitle}>ROUTE</Text>
          <View style={styles.routeRow}>
            <View style={styles.routePointContainer}>
              <View style={[styles.routeDot, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.routeSmallLabel}>FROM</Text>
              <Text style={styles.routeCityName}>{bilty.from_city_name || 'N/A'}</Text>
              {bilty.from_city_code ? <Text style={styles.routeCityCode}>{bilty.from_city_code}</Text> : null}
            </View>
            <View style={styles.routeConnector}>
              <LinearGradient
                colors={['#2563eb', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.routeLine}
              />
              <Text style={[styles.routeArrowText, { color: '#6b7280' }]}>●●●→</Text>
            </View>
            <View style={[styles.routePointContainer, { alignItems: 'flex-end' }]}>
              <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.routeSmallLabel}>TO</Text>
              <Text style={[styles.routeCityName, { textAlign: 'right' }]}>{bilty.to_city_name || 'N/A'}</Text>
              {bilty.to_city_code ? <Text style={[styles.routeCityCode, { textAlign: 'right' }]}>{bilty.to_city_code}</Text> : null}
            </View>
          </View>
        </View>

        {/* Consignor & Consignee */}
        <View style={styles.partiesRow}>
          <View style={styles.partyCard}>
            <View style={styles.partyHeader}>
              <Text style={styles.partyEmoji}>👤</Text>
              <Text style={styles.partyLabel}>CONSIGNOR</Text>
            </View>
            <Text style={styles.partyName} numberOfLines={2}>{bilty.consignor_name || 'N/A'}</Text>
            {bilty.consignor_number ? <Text style={styles.partyPhone}>📱 {bilty.consignor_number}</Text> : null}
            {bilty.consignor_gst ? <Text style={styles.partyGst}>GST: {bilty.consignor_gst}</Text> : null}
          </View>
          <View style={styles.partyCard}>
            <View style={styles.partyHeader}>
              <Text style={styles.partyEmoji}>📦</Text>
              <Text style={styles.partyLabel}>CONSIGNEE</Text>
            </View>
            <Text style={styles.partyName} numberOfLines={2}>{bilty.consignee_name || 'N/A'}</Text>
            {bilty.consignee_number ? <Text style={styles.partyPhone}>📱 {bilty.consignee_number}</Text> : null}
            {bilty.consignee_gst ? <Text style={styles.partyGst}>GST: {bilty.consignee_gst}</Text> : null}
          </View>
        </View>

        {/* Shipment Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SHIPMENT DETAILS</Text>
          <View style={styles.detailsGrid}>
            <DetailItem label="Packages" value={`${bilty.no_of_pkg || 0} Pkg`} icon="📦" />
            <DetailItem label="Weight" value={bilty.wt ? `${bilty.wt} Kg` : 'N/A'} icon="⚖️" />
            <DetailItem label="Delivery Type" value={bilty.delivery_type || 'N/A'} icon="🚚" />
            <DetailItem label="Payment Mode" value={bilty.payment_mode || 'N/A'} icon="💳" />
          </View>
          {bilty.contain ? (
            <View style={styles.contentsSection}>
              <Text style={styles.contentsLabel}>Contents</Text>
              <Text style={styles.contentsValue}>{bilty.contain}</Text>
            </View>
          ) : null}
          {bilty.pvt_marks ? (
            <View style={[styles.contentsSection, { marginTop: 10 }]}>
              <Text style={styles.contentsLabel}>Private Marks</Text>
              <Text style={styles.contentsValue}>{bilty.pvt_marks}</Text>
            </View>
          ) : null}
        </View>

        {/* Transit Bilty Image */}
        {bilty?.bilty_image && !imageError ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>TRANSIT BILTY</Text>
            <View style={styles.imageContainer}>
              {imageLoading ? (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.imageLoadingText}>Loading image...</Text>
                </View>
              ) : null}
              <Image
                source={{ uri: getOptimizedImageUrl(bilty.bilty_image), cache: 'force-cache' }}
                style={styles.biltyImage}
                resizeMode="contain"
                onLoadEnd={() => setImageLoading(false)}
                onLoad={() => setImageLoading(false)}
                onError={() => { setImageLoading(false); setImageError(true); }}
              />
            </View>
            <View style={styles.imageActions}>
              <TouchableOpacity
                onPress={handleCopyImageLink}
                style={[styles.imageActionBtn, { backgroundColor: '#f3f4f6' }]}
              >
                <Text style={{ fontSize: 15 }}>🔗</Text>
                <Text style={[styles.imageActionText, { color: '#374151' }]}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDownloadImage}
                style={[styles.imageActionBtn, { backgroundColor: '#2563eb' }]}
              >
                <Text style={{ fontSize: 15 }}>⬇️</Text>
                <Text style={[styles.imageActionText, { color: '#fff' }]}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Documents */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DOCUMENTS</Text>
          <View style={styles.detailsGrid}>
            <DetailItem label="Invoice No" value={bilty.invoice_no || 'N/A'} icon="📄" />
            <DetailItem label="Invoice Value" value={formatCurrency(bilty.invoice_value)} icon="💰" />
            <DetailItem label="Invoice Date" value={formatDate(bilty.invoice_date)} icon="📅" />
            <DetailItem label="E-Way Bill" value={bilty.e_way_bill || 'N/A'} icon="📋" />
            {bilty.document_number ? (
              <DetailItem label="Doc Number" value={bilty.document_number} icon="🔢" />
            ) : null}
          </View>
        </View>

        {/* Charges Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CHARGES BREAKDOWN</Text>
          <ChargeRow label="Freight Amount" value={bilty.freight_amount} />
          <ChargeRow label="Labour Charge" value={bilty.labour_charge} />
          <ChargeRow label="Bill Charge" value={bilty.bill_charge} />
          <ChargeRow label="Toll Charge" value={bilty.toll_charge} />
          <ChargeRow label="DD Charge" value={bilty.dd_charge} />
          <ChargeRow label="PF Charge" value={bilty.pf_charge} />
          <ChargeRow label="Other Charge" value={bilty.other_charge} />

          <View style={[styles.totalRow, { borderTopColor: '#2563eb' }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: '#2563eb' }]}>{formatCurrency(bilty.total)}</Text>
          </View>
        </View>

        {/* Transport Details */}
        {bilty.transport_name ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>TRANSPORT</Text>
            <Text style={styles.transportName}>{bilty.transport_name}</Text>
            {bilty.transport_number ? <Text style={styles.transportPhone}>📱 {bilty.transport_number}</Text> : null}
            {bilty.transport_gst ? <Text style={styles.transportGst}>GST: {bilty.transport_gst}</Text> : null}
          </View>
        ) : null}

        {/* Remark */}
        {bilty.remark ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>REMARK</Text>
            <Text style={styles.remarkText}>{bilty.remark}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Print Modal */}
      <BiltyPdfGenerator
        visible={showPrintModal}
        biltyData={bilty}
        grNo={bilty?.gr_no}
        onClose={() => setShowPrintModal(false)}
      />
    </View>
  );
}

// Sub-components
const DetailItem = ({ label, value, icon }) => (
  <View style={{ width: '50%', marginBottom: 18 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Text style={{ fontSize: 14, marginRight: 6 }}>{icon}</Text>
      <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1f2937', marginLeft: 20 }}>{value}</Text>
  </View>
);

const ChargeRow = ({ label, value }) => {
  if (!value || parseFloat(value) === 0) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ fontSize: 14, color: '#6b7280' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>₹{parseFloat(value).toLocaleString('en-IN')}</Text>
    </View>
  );
};
