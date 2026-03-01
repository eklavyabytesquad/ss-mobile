import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Keyboard, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabase';
import Colors from '../../constants/colors';

export default function EditProfile() {
  const navigation = useNavigation();
  const { user, updateUserData } = useAuth();

  const [formData, setFormData] = useState({
    companyAddress: user?.companyAddress || '',
    pan: user?.pan || '',
    aadhar: user?.aadhar || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const panRef = useRef(null);
  const aadharRef = useRef(null);

  const getInitials = () => {
    if (!user?.companyName) return '?';
    return user.companyName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdate = async () => {
    Keyboard.dismiss();

    if (!formData.companyAddress.trim()) {
      Alert.alert('Missing Field', 'Please enter your company address');
      return;
    }
    if (!formData.pan.trim()) {
      Alert.alert('Missing Field', 'Please enter your PAN card number');
      return;
    }
    if (!formData.aadhar.trim()) {
      Alert.alert('Missing Field', 'Please enter your Aadhar number');
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.pan.toUpperCase())) {
      Alert.alert('Invalid PAN', 'Please enter a valid PAN number\ne.g., ABCDE1234F');
      return;
    }

    const aadharRegex = /^[0-9]{12}$/;
    if (!aadharRegex.test(formData.aadhar.replace(/\s/g, ''))) {
      Alert.alert('Invalid Aadhar', 'Please enter a valid 12-digit Aadhar number');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('consignors')
        .update({
          company_add: formData.companyAddress.trim(),
          pan: formData.pan.toUpperCase().trim(),
          adhar: formData.aadhar.replace(/\s/g, '').trim(),
        })
        .eq('number', user.phoneNumber)
        .select()
        .single();

      if (error) throw error;

      await updateUserData({
        companyAddress: formData.companyAddress.trim(),
        pan: formData.pan.toUpperCase().trim(),
        aadhar: formData.aadhar.replace(/\s/g, '').trim(),
      });


      Alert.alert(
        '✅ Profile Updated',
        'Your details have been saved successfully!',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Update Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAadhar = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 12);
    const formatted = limited.replace(/(\d{4})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
      let result = p1;
      if (p2) result += ' ' + p2;
      if (p3) result += ' ' + p3;
      return result;
    });
    return formatted;
  };

  const getFieldStatus = (field) => {
    const value = formData[field];
    if (!value || !value.trim()) return 'empty';
    if (field === 'pan') {
      return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase()) ? 'valid' : 'invalid';
    }
    if (field === 'aadhar') {
      return /^[0-9]{12}$/.test(value.replace(/\s/g, '')) ? 'valid' : 'invalid';
    }
    return value.trim().length > 5 ? 'valid' : 'empty';
  };

  const getFieldBorderColor = (field) => {
    if (focusedField === field) return Colors.primary;
    const status = getFieldStatus(field);
    if (status === 'valid') return '#22c55e';
    if (status === 'invalid') return '#ef4444';
    return '#e2e8f0';
  };

  const StatusDot = ({ field }) => {
    const status = getFieldStatus(field);
    if (status === 'empty') return null;
    return (
      <View style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: status === 'valid' ? '#dcfce7' : '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
      }}>
        <Text style={{ fontSize: 10, color: status === 'valid' ? '#16a34a' : '#ef4444' }}>
          {status === 'valid' ? '✓' : '!'}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#1e293b',
        paddingTop: Platform.OS === 'ios' ? 58 : 46,
        paddingBottom: 28,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.1)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#fff', fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 14 }}>
            Edit Profile
          </Text>
        </View>

        {/* Profile Mini Card */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
          }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1e293b' }}>{getInitials()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
              {user?.companyName || 'Guest'}
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              📱 {user?.phoneNumber || 'N/A'}
            </Text>
          </View>
          <View style={{
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#22c55e' }}>ACTIVE</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View style={{
            backgroundColor: '#eff6ff',
            borderRadius: 14,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#dbeafe',
          }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#dbeafe',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Text style={{ fontSize: 16 }}>💡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e40af' }}>
                Keep your details updated
              </Text>
              <Text style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>
                Required for KYC verification & billing
              </Text>
            </View>
          </View>

          {/* Company Address */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1.5,
            borderColor: getFieldBorderColor('companyAddress'),
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
              android: { elevation: 2 },
            }),
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#fef3c7',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}>
                <Text style={{ fontSize: 15 }}>📍</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 }}>Company Address</Text>
              <StatusDot field="companyAddress" />
            </View>
            <TextInput
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: '#1e293b',
                borderWidth: 1,
                borderColor: focusedField === 'companyAddress' ? 'rgba(212,172,64,0.3)' : '#f1f5f9',
                minHeight: 80,
                textAlignVertical: 'top',
                lineHeight: 20,
              }}
              placeholder="Enter your complete company address"
              placeholderTextColor="#cbd5e1"
              value={formData.companyAddress}
              onChangeText={(text) => setFormData({ ...formData, companyAddress: text })}
              onFocus={() => setFocusedField('companyAddress')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={3}
              returnKeyType="next"
              blurOnSubmit={true}
              onSubmitEditing={() => panRef.current?.focus()}
            />
          </View>

          {/* PAN Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1.5,
            borderColor: getFieldBorderColor('pan'),
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
              android: { elevation: 2 },
            }),
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#ede9fe',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}>
                <Text style={{ fontSize: 15 }}>💳</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 }}>PAN Card Number</Text>
              <StatusDot field="pan" />
            </View>
            <TextInput
              ref={panRef}
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: '#1e293b',
                borderWidth: 1,
                borderColor: focusedField === 'pan' ? 'rgba(212,172,64,0.3)' : '#f1f5f9',
                fontWeight: '600',
                letterSpacing: 1.5,
              }}
              placeholder="ABCDE1234F"
              placeholderTextColor="#cbd5e1"
              value={formData.pan}
              onChangeText={(text) => setFormData({ ...formData, pan: text.toUpperCase() })}
              onFocus={() => setFocusedField('pan')}
              onBlur={() => setFocusedField(null)}
              maxLength={10}
              autoCapitalize="characters"
              returnKeyType="next"
              onSubmitEditing={() => aadharRef.current?.focus()}
            />
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, marginLeft: 2 }}>
              Format: 5 letters + 4 digits + 1 letter
            </Text>
          </View>

          {/* Aadhar Number */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18,
            padding: 18,
            marginBottom: 24,
            borderWidth: 1.5,
            borderColor: getFieldBorderColor('aadhar'),
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
              android: { elevation: 2 },
            }),
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#ecfdf5',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}>
                <Text style={{ fontSize: 15 }}>🆔</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 }}>Aadhar Number</Text>
              <StatusDot field="aadhar" />
            </View>
            <TextInput
              ref={aadharRef}
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: '#1e293b',
                borderWidth: 1,
                borderColor: focusedField === 'aadhar' ? 'rgba(212,172,64,0.3)' : '#f1f5f9',
                fontWeight: '600',
                letterSpacing: 2,
              }}
              placeholder="1234 5678 9012"
              placeholderTextColor="#cbd5e1"
              value={formData.aadhar}
              onChangeText={(text) => setFormData({ ...formData, aadhar: formatAadhar(text) })}
              onFocus={() => setFocusedField('aadhar')}
              onBlur={() => setFocusedField(null)}
              keyboardType="number-pad"
              maxLength={14}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, marginLeft: 2 }}>
              12 digit unique identity number
            </Text>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={{
              backgroundColor: Colors.primary,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              opacity: isLoading ? 0.7 : 1,
              ...Platform.select({
                ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
                android: { elevation: 6 },
              }),
            }}
            onPress={handleUpdate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 10 }}>
                  Saving...
                </Text>
              </>
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                ✓  Save Changes
              </Text>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={{
              marginTop: 12,
              paddingVertical: 14,
              alignItems: 'center',
              borderRadius: 14,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e2e8f0',
            }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#64748b', fontSize: 15, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
