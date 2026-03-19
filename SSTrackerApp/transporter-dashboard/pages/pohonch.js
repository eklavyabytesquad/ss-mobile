import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransporterAuth } from '../../context/TransporterAuthContext';
import supabase from '../../utils/supabase';
import styles from './styles/pohonch.styles';

const PAGE_SIZE = 5;

export default function TransporterPohonch({ navigation }) {
  const { user, sessionToken } = useTransporterAuth();
  const [challanGroups, setChallanGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const transportInfoRef = useRef(null);
  const allGroupsRef = useRef([]);
  const [expandedChallans, setExpandedChallans] = useState({});
  const [updatingGr, setUpdatingGr] = useState({});
  const transitMapRef = useRef({});
  const kaatMapRef = useRef({});

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalChallan, setModalChallan] = useState(null);
  const [modalField, setModalField] = useState('pohonch'); // 'pohonch' or 'bilty'
  const [modalValue, setModalValue] = useState('');
  const [selectedGrs, setSelectedGrs] = useState({});
  const [savingModal, setSavingModal] = useState(false);

  useEffect(() => {
    if (user && sessionToken) {
      loadChallans(true);
    }
  }, [user, sessionToken]);

  const getTransportInfo = async () => {
    if (transportInfoRef.current) return transportInfoRef.current;

    const { data: session } = await supabase
      .from('transport_sessions')
      .select('transport_id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (!session?.transport_id) return null;

    const { data: myTransport } = await supabase
      .from('transports')
      .select('gst_number, city_id')
      .eq('id', session.transport_id)
      .single();

    if (!myTransport?.gst_number) return null;

    let cityCode = null;
    if (myTransport.city_id) {
      const { data: cityData } = await supabase
        .from('cities')
        .select('city_code')
        .eq('id', myTransport.city_id)
        .single();
      if (cityData) cityCode = cityData.city_code;
    }

    const info = {
      transportId: session.transport_id,
      gst: myTransport.gst_number.trim().toUpperCase(),
      cityId: myTransport.city_id || null,
      cityCode: cityCode,
    };
    transportInfoRef.current = info;
    return info;
  };

  const loadChallans = async (initial = true) => {
    if (initial) {
      setIsLoading(true);
      offsetRef.current = 0;
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const info = await getTransportInfo();
      if (!info) {
        setChallanGroups([]);
        setIsLoading(false);
        setLoadingMore(false);
        return;
      }

      // Step 1: Get branches in this transport's city
      let branchIds = [];
      if (info.cityId) {
        const { data: branches } = await supabase
          .from('branches')
          .select('id')
          .eq('city_id', info.cityId);
        if (branches) branchIds = branches.map(b => b.id);
      }

      // Step 2: Get transit_details via BOTH paths (branch + GR)
      const transitSelect = 'id, challan_no, gr_no, is_out_of_delivery_from_branch2, out_of_delivery_from_branch2_date, is_delivered_at_destination, delivered_at_destination_date';

      // Path A: All transit records destined for our branches
      let branchTransit = [];
      if (branchIds.length > 0) {
        const { data } = await supabase
          .from('transit_details')
          .select(transitSelect)
          .in('to_branch_id', branchIds);
        if (data) branchTransit = data;
      }

      // Path B: GR-based matching (bilty + station_bilty_summary)
      const { data: biltyGrs } = await supabase
        .from('bilty')
        .select('gr_no')
        .ilike('transport_gst', info.gst);

      const stationOrParts = [`transport_id.eq.${info.transportId}`, `transport_gst.ilike.${info.gst}`];
      if (info.cityCode) stationOrParts.push(`station.ilike.${info.cityCode}`);
      const { data: stationGrs } = await supabase
        .from('station_bilty_summary')
        .select('gr_no')
        .or(stationOrParts.join(','));

      const grSet = new Set();
      if (biltyGrs) biltyGrs.forEach(b => grSet.add(b.gr_no));
      if (stationGrs) stationGrs.forEach(s => grSet.add(s.gr_no));

      // Get transit for GRs not already covered by branch path
      const branchGrSet = new Set(branchTransit.map(t => t.gr_no));
      const remainingGrs = [...grSet].filter(g => !branchGrSet.has(g));

      let grTransit = [];
      if (remainingGrs.length > 0) {
        const { data } = await supabase
          .from('transit_details')
          .select(transitSelect)
          .in('gr_no', remainingGrs);
        if (data) grTransit = data;
      }

      // Merge both paths (dedupe by id)
      const seenIds = new Set();
      const allTransitData = [];
      [...branchTransit, ...grTransit].forEach(t => {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          allTransitData.push(t);
        }
      });

      if (allTransitData.length === 0) {
        if (initial) setChallanGroups([]);
        setHasMore(false);
        setIsLoading(false);
        setLoadingMore(false);
        return;
      }

      // Build transit status map
      const transitStatusMap = {};
      allTransitData.forEach(t => {
        transitStatusMap[t.gr_no] = {
          transit_id: t.id,
          is_out_of_delivery_from_branch2: t.is_out_of_delivery_from_branch2 || false,
          out_of_delivery_from_branch2_date: t.out_of_delivery_from_branch2_date,
          is_delivered_at_destination: t.is_delivered_at_destination || false,
          delivered_at_destination_date: t.delivered_at_destination_date,
        };
      });
      transitMapRef.current = transitStatusMap;

      // Step 3: Enrich GR details from bilty + station
      const allGrNos = [...new Set(allTransitData.map(t => t.gr_no))];

      const { data: biltyRows } = await supabase
        .from('bilty')
        .select('gr_no, pvt_marks, wt, no_of_pkg, to_city_id')
        .in('gr_no', allGrNos);

      const { data: stationRows } = await supabase
        .from('station_bilty_summary')
        .select('gr_no, pvt_marks, weight, no_of_packets, station')
        .in('gr_no', allGrNos);

      // Resolve city names for bilty to_city_id
      const cityIds = [...new Set((biltyRows || []).map(b => b.to_city_id).filter(Boolean))];
      let cityNameMap = {};
      if (cityIds.length > 0) {
        const { data: cities } = await supabase.from('cities').select('id, city_name').in('id', cityIds);
        if (cities) cities.forEach(c => { cityNameMap[c.id] = c.city_name; });
      }

      // Resolve city names for station codes
      const stationCodes = [...new Set((stationRows || []).map(s => s.station).filter(Boolean))];
      let stationCityMap = {};
      if (stationCodes.length > 0) {
        const { data: cities } = await supabase.from('cities').select('city_code, city_name').in('city_code', stationCodes);
        if (cities) cities.forEach(c => { stationCityMap[c.city_code] = c.city_name; });
      }

      // Build GR details map
      const grDetailsMap = {};
      if (biltyRows) {
        biltyRows.forEach(b => {
          grDetailsMap[b.gr_no] = {
            gr_no: b.gr_no,
            pvt_marks: b.pvt_marks || '-',
            weight: b.wt || 0,
            packets: b.no_of_pkg || 0,
            destination: cityNameMap[b.to_city_id] || '-',
          };
        });
      }
      if (stationRows) {
        stationRows.forEach(s => {
          if (!grDetailsMap[s.gr_no]) {
            grDetailsMap[s.gr_no] = {
              gr_no: s.gr_no,
              pvt_marks: s.pvt_marks || '-',
              weight: s.weight || 0,
              packets: s.no_of_packets || 0,
              destination: stationCityMap[s.station] || s.station || '-',
            };
          }
        });
      }

      // Step 4: Group GR detail objects by challan_no
      const challanGrMap = {};
      allTransitData.forEach(t => {
        if (!t.challan_no) return;
        if (!challanGrMap[t.challan_no]) challanGrMap[t.challan_no] = [];
        const grDetail = grDetailsMap[t.gr_no] || { gr_no: t.gr_no, pvt_marks: '-', weight: 0, packets: 0, destination: '-' };
        const transitStatus = transitStatusMap[t.gr_no] || {};
        challanGrMap[t.challan_no].push({
          ...grDetail,
          transit_id: transitStatus.transit_id || null,
          is_out_of_delivery: transitStatus.is_out_of_delivery_from_branch2 || false,
          out_of_delivery_date: transitStatus.out_of_delivery_from_branch2_date || null,
          is_delivered: transitStatus.is_delivered_at_destination || false,
          delivered_date: transitStatus.delivered_at_destination_date || null,
        });
      });

      // Step 5: Fetch challan_details
      const allChallanNos = Object.keys(challanGrMap);
      const { data: challanDetails } = await supabase
        .from('challan_details')
        .select('challan_no, dispatch_date, date, total_bilty_count, is_dispatched, is_received_at_hub')
        .in('challan_no', allChallanNos);

      const challanInfoMap = {};
      if (challanDetails) {
        challanDetails.forEach(c => {
          challanInfoMap[c.challan_no] = {
            dispatch_date: c.dispatch_date,
            date: c.date,
            total_bilty_count: c.total_bilty_count || 0,
            is_dispatched: c.is_dispatched,
            is_received_at_hub: c.is_received_at_hub,
          };
        });
      }

      // Step 6: Fetch bilty_wise_kaat for pohonch_no + bilty_number
      const { data: kaatRows } = await supabase
        .from('bilty_wise_kaat')
        .select('gr_no, pohonch_no, bilty_number')
        .in('gr_no', allGrNos);

      const kaatMap = {};
      if (kaatRows) {
        kaatRows.forEach(k => {
          kaatMap[k.gr_no] = {
            pohonch_no: k.pohonch_no || '',
            bilty_number: k.bilty_number || '',
          };
        });
      }
      kaatMapRef.current = kaatMap;

      // Inject kaat info into GR items in challanGrMap
      Object.keys(challanGrMap).forEach(cNo => {
        challanGrMap[cNo] = challanGrMap[cNo].map(gr => ({
          ...gr,
          pohonch_no: kaatMap[gr.gr_no]?.pohonch_no || '',
          bilty_number: kaatMap[gr.gr_no]?.bilty_number || '',
        }));
      });

      // Build sorted list by dispatch_date descending (newest first)
      const allGroups = allChallanNos.map(cNo => ({
        challan_no: cNo,
        dispatch_date: challanInfoMap[cNo]?.dispatch_date || null,
        challan_date: challanInfoMap[cNo]?.date || null,
        total_bilty_count: challanInfoMap[cNo]?.total_bilty_count || 0,
        is_dispatched: challanInfoMap[cNo]?.is_dispatched || false,
        is_received_at_hub: challanInfoMap[cNo]?.is_received_at_hub || false,
        gr_items: challanGrMap[cNo] || [],
      })).sort((a, b) => {
        const dateA = a.dispatch_date || a.challan_date || '';
        const dateB = b.dispatch_date || b.challan_date || '';
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        const numA = parseInt(a.challan_no, 10) || 0;
        const numB = parseInt(b.challan_no, 10) || 0;
        return numB - numA;
      });

      // Cache full list for load-more, then paginate
      allGroupsRef.current = allGroups;
      const offset = initial ? 0 : offsetRef.current;
      const page = allGroups.slice(offset, offset + PAGE_SIZE);
      if (offset + PAGE_SIZE >= allGroups.length) setHasMore(false);
      offsetRef.current = offset + page.length;

      if (initial) {
        setChallanGroups(page);
      } else {
        setChallanGroups(prev => {
          const existing = new Set(prev.map(g => g.challan_no));
          const fresh = page.filter(g => !existing.has(g.challan_no));
          return [...prev, ...fresh];
        });
      }
    } catch (error) {
      console.error('Load challans error:', error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    transportInfoRef.current = null;
    await loadChallans(true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      // Use cached allGroups for fast pagination
      const allGroups = allGroupsRef.current;
      if (allGroups.length > 0) {
        setLoadingMore(true);
        const offset = offsetRef.current;
        const page = allGroups.slice(offset, offset + PAGE_SIZE);
        if (offset + PAGE_SIZE >= allGroups.length) setHasMore(false);
        offsetRef.current = offset + page.length;
        setChallanGroups(prev => {
          const existing = new Set(prev.map(g => g.challan_no));
          const fresh = page.filter(g => !existing.has(g.challan_no));
          return [...prev, ...fresh];
        });
        setLoadingMore(false);
      } else {
        loadChallans(false);
      }
    }
  };

  const toggleExpand = (challanNo) => {
    setExpandedChallans(prev => ({ ...prev, [challanNo]: !prev[challanNo] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleOutOfDelivery = (gr) => {
    if (gr.is_out_of_delivery) return; // Already marked
    Alert.alert(
      'Out of Delivery',
      `Mark GR ${gr.gr_no} as Out of Delivery from Branch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateTransitStatus(gr, 'out_of_delivery'),
        },
      ]
    );
  };

  const handleDelivered = (gr) => {
    if (gr.is_delivered) return; // Already marked
    if (!gr.is_out_of_delivery) {
      Alert.alert('Action Required', 'Please mark Out of Delivery first before marking Delivered.');
      return;
    }
    Alert.alert(
      'Delivered at Destination',
      `Mark GR ${gr.gr_no} as Delivered at Destination?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => updateTransitStatus(gr, 'delivered'),
        },
      ]
    );
  };

  const updateTransitStatus = async (gr, type) => {
    const grNo = gr.gr_no;
    setUpdatingGr(prev => ({ ...prev, [grNo + '_' + type]: true }));

    try {
      const now = new Date().toISOString();
      let updatePayload = {};

      if (type === 'out_of_delivery') {
        updatePayload = {
          is_out_of_delivery_from_branch2: true,
          out_of_delivery_from_branch2_date: now,
          updated_at: now,
        };
      } else if (type === 'delivered') {
        updatePayload = {
          is_delivered_at_destination: true,
          delivered_at_destination_date: now,
          updated_at: now,
        };
      }

      const { error } = await supabase
        .from('transit_details')
        .update(updatePayload)
        .eq('gr_no', grNo);

      if (error) {
        console.error('Update transit error:', error);
        Alert.alert('Error', 'Failed to update status. Please try again.');
        return;
      }

      // Update local state
      setChallanGroups(prev => prev.map(group => ({
        ...group,
        gr_items: group.gr_items.map(item => {
          if (item.gr_no !== grNo) return item;
          if (type === 'out_of_delivery') {
            return { ...item, is_out_of_delivery: true, out_of_delivery_date: now };
          } else {
            return { ...item, is_delivered: true, delivered_date: now };
          }
        }),
      })));

      // Also update the cached allGroupsRef
      allGroupsRef.current = allGroupsRef.current.map(group => ({
        ...group,
        gr_items: group.gr_items.map(item => {
          if (item.gr_no !== grNo) return item;
          if (type === 'out_of_delivery') {
            return { ...item, is_out_of_delivery: true, out_of_delivery_date: now };
          } else {
            return { ...item, is_delivered: true, delivered_date: now };
          }
        }),
      }));

      Alert.alert('Success', type === 'out_of_delivery'
        ? `GR ${grNo} marked as Out of Delivery`
        : `GR ${grNo} marked as Delivered at Destination`
      );
    } catch (err) {
      console.error('Update status error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUpdatingGr(prev => ({ ...prev, [grNo + '_' + type]: false }));
    }
  };

  // ---- Modal functions ----
  const openAddModal = (group) => {
    setModalChallan(group);
    setModalField('pohonch');
    setModalValue('');
    const sel = {};
    group.gr_items.forEach(gr => { sel[gr.gr_no] = false; });
    setSelectedGrs(sel);
    setModalVisible(true);
  };

  const toggleGrSelect = (grNo) => {
    setSelectedGrs(prev => ({ ...prev, [grNo]: !prev[grNo] }));
  };

  const selectAllGrs = () => {
    if (!modalChallan) return;
    const allSelected = modalChallan.gr_items.every(gr => selectedGrs[gr.gr_no]);
    const sel = {};
    modalChallan.gr_items.forEach(gr => { sel[gr.gr_no] = !allSelected; });
    setSelectedGrs(sel);
  };

  const handleSaveModal = async () => {
    const chosen = Object.keys(selectedGrs).filter(g => selectedGrs[g]);
    if (chosen.length === 0) {
      Alert.alert('Select GRs', 'Please select at least one GR number.');
      return;
    }
    if (!modalValue.trim()) {
      Alert.alert('Enter Value', `Please enter a ${modalField === 'pohonch' ? 'Pohonch No' : 'Bilty No'}.`);
      return;
    }

    setSavingModal(true);
    try {
      const info = transportInfoRef.current;
      const now = new Date().toISOString();
      const col = modalField === 'pohonch' ? 'pohonch_no' : 'bilty_number';

      // Upsert each GR (bilty_wise_kaat has unique gr_no)
      for (const grNo of chosen) {
        const { data: existing } = await supabase
          .from('bilty_wise_kaat')
          .select('id')
          .eq('gr_no', grNo)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('bilty_wise_kaat')
            .update({ [col]: modalValue.trim(), updated_at: now })
            .eq('gr_no', grNo);
        } else {
          await supabase
            .from('bilty_wise_kaat')
            .insert({
              gr_no: grNo,
              challan_no: modalChallan?.challan_no || null,
              transport_id: info?.transportId || null,
              [col]: modalValue.trim(),
              created_at: now,
              updated_at: now,
            });
        }
      }

      // Update local state
      const updateGrItems = (groups) => groups.map(group => ({
        ...group,
        gr_items: group.gr_items.map(item => {
          if (!chosen.includes(item.gr_no)) return item;
          return { ...item, [col]: modalValue.trim() };
        }),
      }));

      setChallanGroups(prev => updateGrItems(prev));
      allGroupsRef.current = updateGrItems(allGroupsRef.current);

      Alert.alert('Success', `${col === 'pohonch_no' ? 'Pohonch No' : 'Bilty No'} updated for ${chosen.length} GR(s).`);
      setModalVisible(false);
    } catch (err) {
      console.error('Save kaat error:', err);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSavingModal(false);
    }
  };

  const renderChallanCard = useCallback(({ item: group }) => {
    const isExpanded = expandedChallans[group.challan_no];
    const statusText = group.is_received_at_hub ? 'Received' : group.is_dispatched ? 'Dispatched' : 'Pending';
    const statusBg = group.is_received_at_hub ? '#dcfce7' : group.is_dispatched ? '#dbeafe' : '#fef3c7';
    const statusColor = group.is_received_at_hub ? '#166534' : group.is_dispatched ? '#1e40af' : '#92400e';
    return (
      <View style={styles.challanCard}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(group.challan_no)}>
          <View style={styles.challanHeader}>
            <View style={styles.challanInfo}>
              <Text style={styles.challanNo}>Challan #{group.challan_no}</Text>
              <Text style={styles.challanMeta}>
                {formatDate(group.dispatch_date || group.challan_date)} {group.is_dispatched ? '• Dispatched' : ''}
              </Text>
            </View>
            <View style={styles.challanRight}>
              <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
              </View>
              <View style={styles.grCountBadge}>
                <Text style={styles.grCountText}>{group.gr_items.length} GR</Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.grListContainer}>
            {group.gr_items.length === 0 ? (
              <Text style={styles.noGrText}>No GR numbers found</Text>
            ) : (
              <>
                {/* Summary row */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Nag</Text>
                    <Text style={styles.summaryValue}>{group.gr_items.reduce((sum, g) => sum + Number(g.packets || 0), 0)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Weight</Text>
                    <Text style={styles.summaryValue}>{group.gr_items.reduce((sum, g) => sum + Number(g.weight || 0), 0).toFixed(1)} kg</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>GR Count</Text>
                    <Text style={styles.summaryValue}>{group.gr_items.length}</Text>
                  </View>
                </View>

                {/* Add Pohonch/Bilty button */}
                <TouchableOpacity style={styles.addKaatBtn} onPress={() => openAddModal(group)} activeOpacity={0.7}>
                  <Text style={styles.addKaatBtnText}>+ Add Pohonch / Bilty No</Text>
                </TouchableOpacity>

                {/* GR list */}
                {group.gr_items.map((gr, idx) => {
                  const isOutLoading = updatingGr[gr.gr_no + '_out_of_delivery'];
                  const isDelLoading = updatingGr[gr.gr_no + '_delivered'];
                  return (
                    <View key={idx} style={[styles.grItem, idx === group.gr_items.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={styles.grTop}>
                        <View style={styles.grLeft}>
                          <View style={styles.grBadge}>
                            <Text style={styles.grBadgeText}>{gr.gr_no}</Text>
                          </View>
                        </View>
                        <View style={styles.grMiddle}>
                          <Text style={styles.grDestination} numberOfLines={1}>{gr.destination}</Text>
                          <Text style={styles.grDetail}>{gr.pvt_marks} • {gr.weight}kg • {gr.packets}pkg</Text>
                          {(gr.pohonch_no || gr.bilty_number) ? (
                            <View style={styles.kaatInfoRow}>
                              {gr.pohonch_no ? <Text style={styles.kaatTag}>📄 P: {gr.pohonch_no}</Text> : null}
                              {gr.bilty_number ? <Text style={styles.kaatTag}>📝 B: {gr.bilty_number}</Text> : null}
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.grActions}>
                          <TouchableOpacity
                            style={[styles.signalBtn, styles.redSignal, gr.is_out_of_delivery && styles.redSignalActive]}
                            onPress={() => handleOutOfDelivery(gr)}
                            disabled={gr.is_out_of_delivery || isOutLoading}
                            activeOpacity={0.7}
                          >
                            {isOutLoading ? (
                              <ActivityIndicator size={10} color="#fff" />
                            ) : (
                              <Text style={[styles.signalIcon, gr.is_out_of_delivery && styles.signalIconActive]}>{gr.is_out_of_delivery ? '🔴' : '⭕'}</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.signalBtn, styles.greenSignal, gr.is_delivered && styles.greenSignalActive]}
                            onPress={() => handleDelivered(gr)}
                            disabled={gr.is_delivered || isDelLoading}
                            activeOpacity={0.7}
                          >
                            {isDelLoading ? (
                              <ActivityIndicator size={10} color="#fff" />
                            ) : (
                              <Text style={[styles.signalIcon, gr.is_delivered && styles.signalIconActive]}>{gr.is_delivered ? '✅' : '☑️'}</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                      {/* Status timestamps */}
                      {(gr.is_out_of_delivery || gr.is_delivered) && (
                        <View style={styles.grStatusRow}>
                          {gr.is_out_of_delivery && (
                            <View style={[styles.statusTag, styles.statusTagRedBg]}>
                              <Text style={styles.statusTagRed}>🚚 Out: {formatDateTime(gr.out_of_delivery_date)}</Text>
                            </View>
                          )}
                          {gr.is_delivered && (
                            <View style={styles.statusTag}>
                              <Text style={styles.statusTagGreen}>✅ Delivered: {formatDateTime(gr.delivered_date)}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}
      </View>
    );
  }, [expandedChallans]);

  const keyExtractor = useCallback((item) => item.challan_no, []);

  const ListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreContent}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadMoreText}>Loading more challans...</Text>
        </View>
      );
    }
    if (hasMore && challanGroups.length > 0) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.7}>
          <Text style={styles.loadMoreBtnText}>Load More Challans ▼</Text>
        </TouchableOpacity>
      );
    }
    if (!hasMore && challanGroups.length > 0) {
      return (
        <View style={styles.endOfList}>
          <Text style={styles.endOfListText}>— All challans loaded —</Text>
        </View>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading pohonch...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

      <LinearGradient
        colors={['#2563eb', '#1d4ed8', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Pohonch</Text>
        <Text style={styles.headerSubtitle}>{challanGroups.length} challans loaded</Text>
      </LinearGradient>

      <FlatList
        style={styles.listContainer}
        data={challanGroups}
        renderItem={renderChallanCard}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No challans found</Text>
            <Text style={styles.emptySubtext}>Your challan-wise GR data will appear here</Text>
          </View>
        }
        ListFooterComponent={<ListFooter />}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
      />

      {/* Add Pohonch/Bilty Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {modalField === 'pohonch' ? 'Pohonch' : 'Bilty'} No</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {modalChallan && <Text style={styles.modalSubtitle}>Challan #{modalChallan.challan_no} • {modalChallan.gr_items.length} GRs</Text>}

            {/* Toggle Pohonch / Bilty */}
            <View style={styles.modalToggleRow}>
              <TouchableOpacity
                style={[styles.modalToggleBtn, modalField === 'pohonch' && styles.modalToggleActive]}
                onPress={() => setModalField('pohonch')}
              >
                <Text style={[styles.modalToggleText, modalField === 'pohonch' && styles.modalToggleTextActive]}>Pohonch No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalToggleBtn, modalField === 'bilty' && styles.modalToggleActive]}
                onPress={() => setModalField('bilty')}
              >
                <Text style={[styles.modalToggleText, modalField === 'bilty' && styles.modalToggleTextActive]}>Bilty No</Text>
              </TouchableOpacity>
            </View>

            {/* Input */}
            <TextInput
              style={styles.modalInput}
              placeholder={modalField === 'pohonch' ? 'Enter Pohonch Number' : 'Enter Bilty Number'}
              placeholderTextColor="#9ca3af"
              value={modalValue}
              onChangeText={setModalValue}
              autoCapitalize="characters"
            />

            {/* Select All */}
            <TouchableOpacity style={styles.selectAllBtn} onPress={selectAllGrs}>
              <Text style={styles.selectAllText}>
                {modalChallan && modalChallan.gr_items.every(gr => selectedGrs[gr.gr_no]) ? '☑ Deselect All' : '☐ Select All'}
              </Text>
            </TouchableOpacity>

            {/* GR List with checkboxes */}
            <ScrollView style={styles.modalGrList} showsVerticalScrollIndicator={false}>
              {modalChallan && modalChallan.gr_items.map((gr, idx) => (
                <TouchableOpacity key={idx} style={styles.modalGrItem} onPress={() => toggleGrSelect(gr.gr_no)} activeOpacity={0.7}>
                  <Text style={styles.modalCheckbox}>{selectedGrs[gr.gr_no] ? '☑' : '☐'}</Text>
                  <View style={styles.modalGrInfo}>
                    <Text style={styles.modalGrNo}>{gr.gr_no}</Text>
                    <Text style={styles.modalGrMeta}>{gr.destination} • {gr.pvt_marks}</Text>
                    {(gr.pohonch_no || gr.bilty_number) ? (
                      <Text style={styles.modalGrExisting}>
                        {gr.pohonch_no ? `P: ${gr.pohonch_no}` : ''}{gr.pohonch_no && gr.bilty_number ? ' • ' : ''}{gr.bilty_number ? `B: ${gr.bilty_number}` : ''}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.modalSaveBtn, savingModal && { opacity: 0.6 }]}
              onPress={handleSaveModal}
              disabled={savingModal}
              activeOpacity={0.7}
            >
              {savingModal ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Save {modalField === 'pohonch' ? 'Pohonch' : 'Bilty'} No ({Object.values(selectedGrs).filter(Boolean).length} selected)</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
