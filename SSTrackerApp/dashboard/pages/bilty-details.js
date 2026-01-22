import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
import { fetchBiltyById, fetchBiltyByGR } from '../../utils/biltyService';
import Colors from '../../constants/colors';

export default function BiltyDetails({ route, navigation }) {
  const { biltyId, grNo } = route.params || {};
  const [bilty, setBilty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBiltyDetails();
  }, [biltyId, grNo]);

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
    switch(savingOption) {
      case 'DELIVERED': return 'Delivered';
      case 'IN_TRANSIT': return 'In Transit';
      case 'AT_HUB': return 'At Hub';
      case 'SAVE': return 'In Transit';
      default: return 'Pending';
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
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
      const message = `📦 Bilty Details\n\nGR No: ${bilty.gr_no}\nStatus: ${status}\nFrom: ${bilty.from_city_name || 'N/A'}\nTo: ${bilty.to_city_name || 'N/A'}\nConsignee: ${bilty.consignee_name || 'N/A'}\nPackages: ${bilty.no_of_pkg || 0}\nWeight: ${bilty.wt || 'N/A'} Kg\nTotal: ${formatCurrency(bilty.total)}\n\nTrack your shipment with SS Tracker App`;
      
      await Share.share({ message });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  if (!bilty) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>Bilty not found</Text>
      </View>
    );
  }

  const status = getStatusFromSavingOption(bilty.saving_option);
  const statusStyle = getStatusStyle(status);

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: Colors.primary, 
        paddingTop: 50, 
        paddingBottom: 20, 
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 24, color: '#fff' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', flex: 1 }}>Bilty Details</Text>
          <TouchableOpacity onPress={handleShare}>
            <Text style={{ fontSize: 20, color: '#fff' }}>📤</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>{bilty.gr_no}</Text>
            <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: statusStyle.color }}>{status}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Bilty Date: {formatDate(bilty.bilty_date)}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Route Card */}
        <View style={{ backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 16 }}>ROUTE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginBottom: 6 }} />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>FROM</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 4 }}>{bilty.from_city_name || 'N/A'}</Text>
              {bilty.from_city_code && <Text style={{ fontSize: 12, color: Colors.textSecondary }}>{bilty.from_city_code}</Text>}
            </View>
            <View style={{ paddingHorizontal: 20, alignItems: 'center' }}>
              <View style={{ width: 60, height: 2, backgroundColor: Colors.primary }} />
              <Text style={{ fontSize: 16, color: Colors.primary, marginTop: 4 }}>→</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#166534', marginBottom: 6 }} />
              <Text style={{ fontSize: 11, color: Colors.textSecondary }}>TO</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 4, textAlign: 'right' }}>{bilty.to_city_name || 'N/A'}</Text>
              {bilty.to_city_code && <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'right' }}>{bilty.to_city_code}</Text>}
            </View>
          </View>
        </View>

        {/* Consignor & Consignee */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginRight: 8, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 8 }}>CONSIGNOR</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }} numberOfLines={2}>{bilty.consignor_name || 'N/A'}</Text>
            {bilty.consignor_number && (
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>📱 {bilty.consignor_number}</Text>
            )}
            {bilty.consignor_gst && (
              <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>GST: {bilty.consignor_gst}</Text>
            )}
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginLeft: 8, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 8 }}>CONSIGNEE</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }} numberOfLines={2}>{bilty.consignee_name || 'N/A'}</Text>
            {bilty.consignee_number && (
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>📱 {bilty.consignee_number}</Text>
            )}
            {bilty.consignee_gst && (
              <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>GST: {bilty.consignee_gst}</Text>
            )}
          </View>
        </View>

        {/* Shipment Details */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 16 }}>SHIPMENT DETAILS</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <DetailItem label="Packages" value={`${bilty.no_of_pkg || 0} Pkg`} icon="📦" />
            <DetailItem label="Weight" value={bilty.wt ? `${bilty.wt} Kg` : 'N/A'} icon="⚖️" />
            <DetailItem label="Delivery Type" value={bilty.delivery_type || 'N/A'} icon="🚚" />
            <DetailItem label="Payment Mode" value={bilty.payment_mode || 'N/A'} icon="💳" />
          </View>

          {bilty.contain && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Contents</Text>
              <Text style={{ fontSize: 14, color: Colors.text, marginTop: 4 }}>{bilty.contain}</Text>
            </View>
          )}

          {bilty.pvt_marks && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Private Marks</Text>
              <Text style={{ fontSize: 14, color: Colors.text, marginTop: 4 }}>{bilty.pvt_marks}</Text>
            </View>
          )}
        </View>

        {/* Invoice & Document Details */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 16 }}>DOCUMENTS</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <DetailItem label="Invoice No" value={bilty.invoice_no || 'N/A'} icon="📄" />
            <DetailItem label="Invoice Value" value={formatCurrency(bilty.invoice_value)} icon="💰" />
            <DetailItem label="Invoice Date" value={formatDate(bilty.invoice_date)} icon="📅" />
            <DetailItem label="E-Way Bill" value={bilty.e_way_bill || 'N/A'} icon="📋" />
            {bilty.document_number && (
              <DetailItem label="Doc Number" value={bilty.document_number} icon="🔢" />
            )}
          </View>
        </View>

        {/* Charges Breakdown */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 16 }}>CHARGES</Text>
          
          <ChargeRow label="Freight Amount" value={bilty.freight_amount} />
          <ChargeRow label="Labour Charge" value={bilty.labour_charge} />
          <ChargeRow label="Bill Charge" value={bilty.bill_charge} />
          <ChargeRow label="Toll Charge" value={bilty.toll_charge} />
          <ChargeRow label="DD Charge" value={bilty.dd_charge} />
          <ChargeRow label="PF Charge" value={bilty.pf_charge} />
          <ChargeRow label="Other Charge" value={bilty.other_charge} />
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: Colors.primary }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>Total Amount</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.primary }}>{formatCurrency(bilty.total)}</Text>
          </View>
        </View>

        {/* Transport Details */}
        {bilty.transport_name && (
          <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 16 }}>TRANSPORT</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text }}>{bilty.transport_name}</Text>
            {bilty.transport_number && (
              <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>📱 {bilty.transport_number}</Text>
            )}
            {bilty.transport_gst && (
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>GST: {bilty.transport_gst}</Text>
            )}
          </View>
        )}

        {/* Remark */}
        {bilty.remark && (
          <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 }}>REMARK</Text>
            <Text style={{ fontSize: 14, color: Colors.text, lineHeight: 22 }}>{bilty.remark}</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const DetailItem = ({ label, value, icon }) => (
  <View style={{ width: '50%', marginBottom: 16 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 14, marginRight: 6 }}>{icon}</Text>
      <Text style={{ fontSize: 11, color: '#6b7280' }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginTop: 4, marginLeft: 20 }}>{value}</Text>
  </View>
);

const ChargeRow = ({ label, value }) => {
  if (!value || parseFloat(value) === 0) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 14, color: '#6b7280' }}>{label}</Text>
      <Text style={{ fontSize: 14, color: '#1f2937' }}>₹{parseFloat(value).toLocaleString('en-IN')}</Text>
    </View>
  );
};
