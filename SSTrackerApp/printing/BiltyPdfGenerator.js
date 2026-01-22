// BiltyPdfGenerator.js - Main component for generating and viewing bilty PDFs
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { loadBiltyForPrinting, loadBiltyForPrintingById, loadAllPdfData } from './biltyPdfService';
import { generateBiltyPdfHtml, generateSingleCopyHtml } from './biltyPdfTemplate';
import Colors from '../constants/colors';

/**
 * BiltyPdfGenerator Component
 * 
 * Props:
 * - grNo: GR number to fetch and print
 * - biltyId: Bilty ID to fetch and print (alternative to grNo)
 * - biltyData: Pre-fetched bilty data (if already available)
 * - onClose: Callback when modal is closed
 * - visible: Whether the modal is visible
 * - autoGenerate: Auto-generate PDF when opened (default: true)
 */
const BiltyPdfGenerator = ({
  grNo,
  biltyId,
  biltyData: preFetchedBiltyData,
  onClose,
  visible = false,
  autoGenerate = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [error, setError] = useState(null);

  // Load data when modal opens
  useEffect(() => {
    if (visible && autoGenerate) {
      loadData();
    }
  }, [visible, grNo, biltyId]);

  // Load bilty data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (preFetchedBiltyData) {
        // Use pre-fetched bilty data and load additional PDF data
        result = await loadAllPdfData(preFetchedBiltyData);
      } else if (grNo) {
        // Fetch by GR number
        result = await loadBiltyForPrinting(grNo);
      } else if (biltyId) {
        // Fetch by ID
        result = await loadBiltyForPrintingById(biltyId);
      } else {
        throw new Error('No bilty identifier provided');
      }
      
      if (result.success && result.data) {
        setPdfData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load bilty data');
      }
    } catch (err) {
      console.error('Load data error:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Print PDF
  const handlePrint = async (copyType = null) => {
    if (!pdfData) {
      Alert.alert('Error', 'No data available for printing');
      return;
    }
    
    setGenerating(true);
    try {
      let html;
      if (copyType) {
        // Single copy
        html = generateSingleCopyHtml(pdfData, copyType);
      } else {
        // Both copies
        html = generateBiltyPdfHtml(pdfData);
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

  // Generate PDF and share
  const handleShare = async () => {
    if (!pdfData) {
      Alert.alert('Error', 'No data available for sharing');
      return;
    }
    
    setGenerating(true);
    try {
      const html = generateBiltyPdfHtml(pdfData);
      
      // Generate PDF file
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
        return;
      }
      
      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Bilty - ${pdfData.bilty.gr_no}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      console.error('Share error:', err);
      Alert.alert('Share Error', 'Failed to share PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Download/Save PDF
  const handleDownload = async () => {
    if (!pdfData) {
      Alert.alert('Error', 'No data available for download');
      return;
    }
    
    setGenerating(true);
    try {
      const html = generateBiltyPdfHtml(pdfData);
      
      // Generate PDF file
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      // On mobile, share is the way to "download/save"
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save Bilty - ${pdfData.bilty.gr_no}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', `PDF saved to: ${uri}`);
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Download Error', 'Failed to save PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Quick preview (shows print preview on some devices)
  const handlePreview = async () => {
    if (!pdfData) {
      Alert.alert('Error', 'No data available for preview');
      return;
    }
    
    setGenerating(true);
    try {
      const html = generateBiltyPdfHtml(pdfData);
      
      // On iOS, this shows a preview
      // On Android, it might go directly to print
      await Print.printAsync({
        html,
        orientation: Print.Orientation.portrait,
      });
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setPdfData(null);
    setError(null);
    if (onClose) onClose();
  };

  // Render loading state
  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading bilty data...</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Render error state
  if (error) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Main render
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Print Bilty</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Bilty Info */}
          {pdfData && (
            <View style={styles.biltyInfo}>
              <Text style={styles.grNumber}>GR No: {pdfData.bilty.gr_no}</Text>
              <Text style={styles.route}>
                {pdfData.fromCity?.city_name || 'N/A'} → {pdfData.toCity?.city_name || 'N/A'}
              </Text>
              <Text style={styles.date}>Date: {new Date(pdfData.bilty.bilty_date).toLocaleDateString('en-IN')}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Print Both Copies */}
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handlePrint()}
              disabled={generating || !pdfData}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.actionIcon}>🖨️</Text>
                  <Text style={styles.actionButtonText}>Print Both Copies</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Print Options Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, styles.halfButton]}
                onPress={() => handlePrint('CONSIGNEE COPY')}
                disabled={generating || !pdfData}
              >
                <Text style={styles.actionIcon}>📄</Text>
                <Text style={styles.secondaryButtonText}>Consignee Copy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, styles.halfButton]}
                onPress={() => handlePrint('DRIVER COPY')}
                disabled={generating || !pdfData}
              >
                <Text style={styles.actionIcon}>🚚</Text>
                <Text style={styles.secondaryButtonText}>Driver Copy</Text>
              </TouchableOpacity>
            </View>

            {/* Share & Download Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.outlineButton, styles.halfButton]}
                onPress={handleShare}
                disabled={generating || !pdfData}
              >
                <Text style={styles.actionIcon}>📤</Text>
                <Text style={styles.outlineButtonText}>Share PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.outlineButton, styles.halfButton]}
                onPress={handleDownload}
                disabled={generating || !pdfData}
              >
                <Text style={styles.actionIcon}>💾</Text>
                <Text style={styles.outlineButtonText}>Save PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Generating Overlay */}
          {generating && (
            <View style={styles.generatingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.generatingText}>Generating PDF...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  biltyInfo: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  grNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  route: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 3,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionsContainer: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
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
  actionIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  outlineButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  generatingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default BiltyPdfGenerator;
