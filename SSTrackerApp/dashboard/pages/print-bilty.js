// print-bilty.js - Standalone screen for printing bilty by GR number
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { loadBiltyForPrinting } from '../../printing/biltyPdfService';
import { generateBiltyPdfHtml, generateSingleCopyHtml } from '../../printing/biltyPdfTemplate';
import Colors from '../../constants/colors';

export default function PrintBiltyScreen({ navigation }) {
  const [grNo, setGrNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [biltyData, setBiltyData] = useState(null);
  const [error, setError] = useState(null);

  // Search bilty by GR number
  const handleSearch = async () => {
    if (!grNo.trim()) {
      Alert.alert('Error', 'Please enter a GR number');
      return;
    }

    setLoading(true);
    setError(null);
    setBiltyData(null);

    try {
      const result = await loadBiltyForPrinting(grNo.trim());
      
      if (result.success && result.data) {
        setBiltyData(result.data);
      } else {
        setError(result.error || 'Bilty not found');
        Alert.alert('Not Found', `No bilty found with GR No: ${grNo}`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Print PDF
  const handlePrint = async (copyType = null) => {
    if (!biltyData) {
      Alert.alert('Error', 'No bilty data available');
      return;
    }

    setGenerating(true);
    try {
      let html;
      if (copyType) {
        html = generateSingleCopyHtml(biltyData, copyType);
      } else {
        html = generateBiltyPdfHtml(biltyData);
      }

      await Print.printAsync({
        html,
        orientation: Print.Orientation.portrait,
      });
    } catch (err) {
      console.error('Print error:', err);
      Alert.alert('Print Error', 'Failed to print. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Share PDF
  const handleShare = async () => {
    if (!biltyData) {
      Alert.alert('Error', 'No bilty data available');
      return;
    }

    setGenerating(true);
    try {
      const html = generateBiltyPdfHtml(biltyData);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Bilty - ${biltyData.bilty.gr_no}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      console.error('Share error:', err);
      Alert.alert('Share Error', 'Failed to share PDF');
    } finally {
      setGenerating(false);
    }
  };

  // Clear search
  const handleClear = () => {
    setGrNo('');
    setBiltyData(null);
    setError(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🖨️ Print Bilty</Text>
          <Text style={styles.headerSubtitle}>Search by GR number and print</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter GR Number (e.g., ALG001234)"
              placeholderTextColor="#9ca3af"
              value={grNo}
              onChangeText={setGrNo}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {grNo.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error State */}
        {error && !biltyData && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Bilty Preview Card */}
        {biltyData && (
          <View style={styles.biltyCard}>
            {/* Bilty Header */}
            <View style={styles.biltyHeader}>
              <View>
                <Text style={styles.grNumber}>{biltyData.bilty.gr_no}</Text>
                <Text style={styles.biltyDate}>{formatDate(biltyData.bilty.bilty_date)}</Text>
              </View>
              <View style={[
                styles.paymentBadge,
                biltyData.bilty.payment_mode === 'paid' ? styles.paidBadge : styles.toPayBadge
              ]}>
                <Text style={[
                  styles.paymentBadgeText,
                  biltyData.bilty.payment_mode === 'paid' ? styles.paidText : styles.toPayText
                ]}>
                  {biltyData.bilty.payment_mode?.toUpperCase() || 'TO PAY'}
                </Text>
              </View>
            </View>

            {/* Route */}
            <View style={styles.routeSection}>
              <View style={styles.cityInfo}>
                <Text style={styles.cityLabel}>From</Text>
                <Text style={styles.cityName}>{biltyData.fromCity?.city_name || 'N/A'}</Text>
              </View>
              <Text style={styles.routeArrow}>→</Text>
              <View style={styles.cityInfo}>
                <Text style={styles.cityLabel}>To</Text>
                <Text style={styles.cityName}>{biltyData.toCity?.city_name || 'N/A'}</Text>
              </View>
            </View>

            {/* Party Details */}
            <View style={styles.partySection}>
              <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Consignor:</Text>
                <Text style={styles.partyValue}>{biltyData.bilty.consignor_name || 'N/A'}</Text>
              </View>
              <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Consignee:</Text>
                <Text style={styles.partyValue}>{biltyData.bilty.consignee_name || 'N/A'}</Text>
              </View>
              <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Transport:</Text>
                <Text style={styles.partyValue}>{biltyData.bilty.transport_name || 'N/A'}</Text>
              </View>
            </View>

            {/* Package Info */}
            <View style={styles.packageSection}>
              <View style={styles.packageItem}>
                <Text style={styles.packageLabel}>Packages</Text>
                <Text style={styles.packageValue}>{biltyData.bilty.no_of_pkg || 0}</Text>
              </View>
              <View style={styles.packageItem}>
                <Text style={styles.packageLabel}>Weight</Text>
                <Text style={styles.packageValue}>{biltyData.bilty.wt || 0} KG</Text>
              </View>
              <View style={styles.packageItem}>
                <Text style={styles.packageLabel}>Total</Text>
                <Text style={styles.packageValue}>{formatCurrency(biltyData.bilty.total)}</Text>
              </View>
            </View>

            {/* Print Actions */}
            <View style={styles.actionSection}>
              <Text style={styles.actionTitle}>Print Options</Text>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handlePrint()}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>🖨️</Text>
                    <Text style={styles.primaryButtonText}>Print Both Copies</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, styles.halfButton]}
                  onPress={() => handlePrint('CONSIGNEE COPY')}
                  disabled={generating}
                >
                  <Text style={styles.buttonIcon}>📄</Text>
                  <Text style={styles.secondaryButtonText}>Consignee</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, styles.halfButton]}
                  onPress={() => handlePrint('DRIVER COPY')}
                  disabled={generating}
                >
                  <Text style={styles.buttonIcon}>🚚</Text>
                  <Text style={styles.secondaryButtonText}>Driver</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, styles.outlineButton]}
                onPress={handleShare}
                disabled={generating}
              >
                <Text style={styles.buttonIcon}>📤</Text>
                <Text style={styles.outlineButtonText}>Share PDF via WhatsApp/Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!biltyData && !loading && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Search for a Bilty</Text>
            <Text style={styles.emptySubtitle}>Enter a GR number above to search and print</Text>
          </View>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {generating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating PDF...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  biltyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  biltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  grNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  biltyDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paidBadge: {
    backgroundColor: '#dcfce7',
  },
  toPayBadge: {
    backgroundColor: '#fef3c7',
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paidText: {
    color: '#166534',
  },
  toPayText: {
    color: '#92400e',
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cityInfo: {
    alignItems: 'center',
    flex: 1,
  },
  cityLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  routeArrow: {
    fontSize: 24,
    color: Colors.primary,
    marginHorizontal: 15,
  },
  partySection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  partyRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  partyLabel: {
    fontSize: 13,
    color: '#6b7280',
    width: 90,
  },
  partyValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  packageSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  packageItem: {
    alignItems: 'center',
  },
  packageLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  packageValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  actionSection: {
    gap: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonIcon: {
    fontSize: 18,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  outlineButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },
});
