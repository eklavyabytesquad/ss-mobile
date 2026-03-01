import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert, Image, Clipboard, Linking } from 'react-native';
import { fetchBiltyById, fetchBiltyByGR } from '../../utils/biltyService';
import { BiltyPdfGenerator } from '../../printing';
import Colors from '../../constants/colors';
import supabase from '../../utils/supabase';

export default function BiltyDetails({ route, navigation }) {
  const { biltyId, grNo } = route.params || {};
  const [bilty, setBilty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [transitData, setTransitData] = useState(null);
  const [challanData, setChallanData] = useState(null);
  const [kaatTransport, setKaatTransport] = useState(null);

  useEffect(() => {
    loadBiltyDetails();
  }, [biltyId, grNo]);

  // Prefetch image when bilty data loads
  useEffect(() => {
    if (bilty?.bilty_image) {
      const optimizedUrl = getOptimizedImageUrl(bilty.bilty_image);
      Image.prefetch(optimizedUrl)
        .then(() => {
          console.log('Image prefetched successfully');
          setImageLoading(false);
        })
        .catch((error) => {
          console.error('Image prefetch error:', error);
          setImageLoading(false);
        });
    }
  }, [bilty]);

  // Optimize image URL with Supabase transformations
  const getOptimizedImageUrl = (imageUrl) => {
    if (!imageUrl) return imageUrl;
    
    // Add Supabase image transformation parameters to reduce size
    // width=800 and quality=75 for faster loading
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
        loadTransitDetails(result.data.gr_no);
        loadKaatTransport(result.data.gr_no);
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

  const loadTransitDetails = async (grNumber) => {
    try {
      const { data: transit, error: tErr } = await supabase
        .from('transit_details')
        .select('*, from_branch:branches!transit_details_from_branch_id_fkey(*), to_branch:branches!transit_details_to_branch_id_fkey(*)')
        .eq('gr_no', grNumber)
        .maybeSingle();

      if (tErr || !transit) return;
      setTransitData(transit);

      const { data: challan } = await supabase
        .from('challan_details')
        .select('*, truck:trucks(*)')
        .eq('challan_no', transit.challan_no)
        .maybeSingle();

      if (challan) setChallanData(challan);
    } catch (err) {
      console.log('Transit details fetch error:', err);
    }
  };

  const loadKaatTransport = async (grNumber) => {
    try {
      const { data: kaat } = await supabase
        .from('bilty_wise_kaat')
        .select('transport_id, transport:transports!bilty_wise_kaat_transport_id_fkey(transport_name, mob_number)')
        .eq('gr_no', grNumber)
        .maybeSingle();

      if (kaat?.transport) setKaatTransport(kaat.transport);
    } catch (err) {
      console.log('Kaat transport fetch error:', err);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getBranchName = (branch) => {
    if (!branch) return '';
    return branch.branch_name || branch.name || branch.city || '';
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
      const message = `📦 Bilty Details\n\nGR No: ${bilty.gr_no}\nStatus: ${status}\nFrom: ${bilty.from_city_name || 'N/A'}\nTo: ${bilty.to_city_name || 'N/A'}\nConsignee: ${bilty.consignee_name || 'N/A'}\nPackages: ${bilty.no_of_pkg || 0}\nWeight: ${bilty.wt || 'N/A'} Kg\nTotal: ${formatCurrency(bilty.total)}${bilty.pdf_bucket ? '\n\n📄 Download Bilty PDF:\n' + bilty.pdf_bucket : ''}\n\nTrack your shipment with SS Tracker App`;
      
      await Share.share({ message });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyImageLink = async () => {
    try {
      if (bilty?.bilty_image) {
        await Clipboard.setString(bilty.bilty_image);
        Alert.alert('Success', 'Image link copied to clipboard!');
      }
    } catch (error) {
      console.error('Copy link error:', error);
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
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to open image');
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

  // Check if destination is Kanpur using to_city_name (matched via city_id join)
  const isKanpurDest = (bilty.to_city_name || '').toUpperCase().includes('KANPUR');
  const destCityLabel = bilty.to_city_name || 'Destination';

  // Duration calculation
  const getDuration = () => {
    const start = bilty.bilty_date ? new Date(bilty.bilty_date) : null;
    const end = transitData?.delivered_at_destination_date
      ? new Date(transitData.delivered_at_destination_date)
      : new Date();
    if (!start) return null;
    const diffMs = end - start;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return { value: days, unit: days === 1 ? 'Day' : 'Days', hours };
    return { value: hours, unit: hours === 1 ? 'Hour' : 'Hours', hours: 0 };
  };
  const duration = getDuration();

  const getExpectedDispatch = () => {
    if (!bilty.bilty_date) return 'Tomorrow, ~12:00 AM';
    const d = new Date(bilty.bilty_date);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ~12:00 AM';
  };

  const rawSteps = [
    { title: 'Booked', icon: '📋', completed: true, date: bilty.bilty_date, detail: `GR: ${bilty.gr_no}` },
    { title: 'Dispatched', icon: '🚛', completed: !!challanData?.is_dispatched, date: challanData?.dispatch_date, detail: challanData ? `Challan: ${challanData.challan_no}` : null },
    { title: 'In Transit', icon: '🛣️', completed: !!transitData?.is_out_of_delivery_from_branch1, date: transitData?.out_of_delivery_from_branch1_date, detail: getBranchName(transitData?.from_branch) ? `From: ${getBranchName(transitData?.from_branch)}` : null },
    { title: 'Reached Hub', icon: '🏢', completed: !!transitData?.is_delivered_at_branch2, date: transitData?.delivered_at_branch2_date, detail: 'KANPUR WAREHOUSE' },
    ...(!isKanpurDest ? [{
      title: `Out for Delivery for ${destCityLabel}`,
      icon: '🚚',
      completed: !!transitData?.is_out_of_delivery_from_branch2 || !!transitData?.out_for_door_delivery,
      date: transitData?.out_of_delivery_from_branch2_date || transitData?.out_for_door_delivery_date,
      detail: transitData?.delivery_agent_name ? `Agent: ${transitData.delivery_agent_name}${transitData.delivery_agent_phone ? ' • ' + transitData.delivery_agent_phone : ''}` : null,
    }] : []),
    { title: `Delivered at ${bilty.to_city_name || 'Destination'}`, icon: '✅', completed: !!transitData?.is_delivered_at_destination, date: transitData?.delivered_at_destination_date, detail: null },
  ];

  // Mark the current active step (first incomplete step)
  const trackingSteps = rawSteps.map((step, i) => {
    const isActive = !step.completed && (i === 0 || rawSteps[i - 1].completed);
    return { ...step, isActive };
  });
  const completedCount = trackingSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / trackingSteps.length) * 100);
  const isDelivered = trackingSteps[trackingSteps.length - 1].completed;

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
          <TouchableOpacity onPress={() => {
            if (bilty.pdf_bucket) {
              Linking.openURL(bilty.pdf_bucket);
            } else {
              setShowPrintModal(true);
            }
          }} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 20, color: '#fff' }}>{bilty.pdf_bucket ? '📄' : '🖨️'}</Text>
          </TouchableOpacity>
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
        {/* ── Tracking Section ── */}
        <View style={{ margin: 16, marginBottom: 0 }}>

          {/* Progress Header Card */}
          <View style={{
            backgroundColor: isDelivered ? '#059669' : '#1e293b',
            borderRadius: 20,
            padding: 20,
            marginBottom: 12,
            elevation: 6,
            shadowColor: isDelivered ? '#059669' : '#1e293b',
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 1 }}>📍 LIVE TRACKING</Text>
              </View>
              {challanData?.challan_no ? (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>CH: {challanData.challan_no}</Text>
                </View>
              ) : null}
            </View>

            {/* Progress Bar */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>{completedCount} of {trackingSteps.length} steps completed</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>{progressPercent}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3 }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: isDelivered ? '#fff' : '#d4ac40', width: `${progressPercent}%` }} />
              </View>
            </View>

            {/* Duration Stats Row */}
            <View style={{ flexDirection: 'row' }}>
              {duration ? (
                <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, marginRight: 8 }}>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>⏱️ DURATION</Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>
                    {duration.value} <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>{duration.unit}</Text>
                  </Text>
                  {duration.hours > 0 && duration.value > 0 ? (
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>+ {duration.hours}h</Text>
                  ) : null}
                </View>
              ) : null}
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, marginLeft: duration ? 0 : 0 }}>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>📦 STATUS</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{isDelivered ? '✓ Delivered' : status}</Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {bilty.from_city_name || '?'} → {bilty.to_city_name || '?'}
                </Text>
              </View>
            </View>
          </View>

          {/* Truck / Warehouse Card */}
          {challanData?.truck?.truck_number ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 14,
              marginBottom: 12,
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#d4ac40',
            }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 22 }}>🚛</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b', letterSpacing: 1 }}>{challanData.truck.truck_number}</Text>
                {challanData.truck.truck_type ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#d4ac40', marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>{challanData.truck.truck_type}</Text>
                  </View>
                ) : null}
              </View>
              {challanData.dispatch_date ? (
                <View style={{ alignItems: 'flex-end', backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.3 }}>DISPATCHED</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 2 }}>{formatDateTime(challanData.dispatch_date)}</Text>
                </View>
              ) : null}
            </View>
          ) : !isDelivered ? (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#f59e0b',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 22 }}>🏭</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>Currently at DUBE PARAO WAREHOUSE</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 11, color: '#92400e', fontWeight: '600' }}>🕐 Expected dispatch: </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309' }}>{getExpectedDispatch()}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* Timeline Steps Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 20,
            elevation: 3,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 10,
          }}>
            {trackingSteps.map((step, index) => {
              const stepColors = step.completed
                ? { dot: '#059669', bg: '#ecfdf5', text: '#1e293b', line: '#059669' }
                : step.isActive
                  ? { dot: '#d4ac40', bg: '#fffbeb', text: '#1e293b', line: '#e5e7eb' }
                  : { dot: '#d1d5db', bg: '#f9fafb', text: '#9ca3af', line: '#e5e7eb' };

              return (
                <View key={index} style={{ flexDirection: 'row' }}>
                  {/* Timeline Rail */}
                  <View style={{ alignItems: 'center', width: 32 }}>
                    {/* Dot / Active ring */}
                    <View style={{
                      width: step.isActive ? 22 : step.completed ? 18 : 14,
                      height: step.isActive ? 22 : step.completed ? 18 : 14,
                      borderRadius: 11,
                      backgroundColor: step.isActive ? '#fffbeb' : step.completed ? stepColors.dot : 'transparent',
                      borderWidth: step.isActive ? 3 : step.completed ? 0 : 2,
                      borderColor: step.isActive ? '#d4ac40' : '#d1d5db',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      {step.completed ? (
                        <Text style={{ fontSize: 9, color: '#fff', fontWeight: '900' }}>✓</Text>
                      ) : step.isActive ? (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#d4ac40' }} />
                      ) : null}
                    </View>
                    {/* Connecting Line */}
                    {index < trackingSteps.length - 1 ? (
                      <View style={{
                        width: 2.5,
                        flex: 1,
                        minHeight: 32,
                        backgroundColor: step.completed && trackingSteps[index + 1]?.completed ? '#059669' : '#e5e7eb',
                        borderRadius: 1.25,
                      }} />
                    ) : null}
                  </View>

                  {/* Step Content */}
                  <View style={{
                    flex: 1,
                    paddingLeft: 12,
                    paddingBottom: index < trackingSteps.length - 1 ? 8 : 0,
                    marginTop: step.isActive ? -2 : step.completed ? -1 : 0,
                  }}>
                    <View style={{
                      backgroundColor: step.isActive ? stepColors.bg : 'transparent',
                      borderRadius: 12,
                      padding: step.isActive ? 12 : 4,
                      borderWidth: step.isActive ? 1 : 0,
                      borderColor: step.isActive ? '#fde68a' : 'transparent',
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 15, marginRight: 6 }}>{step.icon}</Text>
                          <Text style={{
                            fontSize: 13,
                            fontWeight: step.completed || step.isActive ? '700' : '500',
                            color: stepColors.text,
                          }}>
                            {step.title}
                          </Text>
                          {step.isActive ? (
                            <View style={{ marginLeft: 8, backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 8, fontWeight: '800', color: '#92400e', letterSpacing: 0.5 }}>CURRENT</Text>
                            </View>
                          ) : null}
                        </View>
                        {step.date ? (
                          <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '500' }}>{formatDateTime(step.date)}</Text>
                        ) : null}
                      </View>
                      {step.detail ? (
                        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 3, marginLeft: 21 }}>{step.detail}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Delivered celebration banner */}
            {isDelivered ? (
              <View style={{
                marginTop: 16,
                backgroundColor: '#ecfdf5',
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#a7f3d0',
              }}>
                <Text style={{ fontSize: 24, marginRight: 10 }}>🎉</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#065f46' }}>Delivered at {bilty.to_city_name || 'Destination'}!</Text>
                  <Text style={{ fontSize: 11, color: '#047857', marginTop: 2 }}>
                    {duration ? `Delivered in ${duration.value} ${duration.unit}${duration.hours > 0 ? ` ${duration.hours}h` : ''}` : 'Package has been delivered'}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Kaat Transport Details */}
          {kaatTransport ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 14,
              marginTop: 12,
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#475569',
            }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 18 }}>🚛</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.5 }}>HANDLED BY TRANSPORT</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 2 }}>{kaatTransport.transport_name}</Text>
                {kaatTransport.mob_number ? (
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>📱 {kaatTransport.mob_number}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

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

        {/* Transit Bilty Image */}
        {bilty?.bilty_image && !imageError && (
          <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 16 }}>TRANSIT BILTY</Text>
            <TouchableOpacity activeOpacity={0.9}>
              <View style={{ position: 'relative' }}>
                {imageLoading && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, height: 300, zIndex: 1 }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 10, color: Colors.textSecondary, fontSize: 12 }}>Loading image...</Text>
                  </View>
                )}
                <Image 
                  source={{ 
                    uri: getOptimizedImageUrl(bilty.bilty_image),
                    cache: 'force-cache'
                  }}
                  style={{ 
                    width: '100%', 
                    height: 300, 
                    borderRadius: 12,
                    resizeMode: 'contain',
                    backgroundColor: '#f9fafb'
                  }}
                  onLoadEnd={() => setImageLoading(false)}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    console.error('Image load error:', e.nativeEvent.error);
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              </View>
            </TouchableOpacity>
            
            {/* Image Actions */}
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
              <TouchableOpacity 
                onPress={handleCopyImageLink}
                style={{ 
                  flex: 1, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6', 
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  borderRadius: 10
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>🔗</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>Copy Link</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleDownloadImage}
                style={{ 
                  flex: 1, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: Colors.primary, 
                  paddingVertical: 12, 
                  paddingHorizontal: 16, 
                  borderRadius: 10
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>⬇️</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
