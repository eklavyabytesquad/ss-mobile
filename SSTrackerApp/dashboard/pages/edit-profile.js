import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';
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

  const handleUpdate = async () => {
    // Validation
    if (!formData.companyAddress.trim()) {
      Alert.alert('Validation Error', 'Company address is required');
      return;
    }

    if (!formData.pan.trim()) {
      Alert.alert('Validation Error', 'PAN card number is required');
      return;
    }

    if (!formData.aadhar.trim()) {
      Alert.alert('Validation Error', 'Aadhar number is required');
      return;
    }

    // Validate PAN format (10 alphanumeric characters)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.pan.toUpperCase())) {
      Alert.alert('Validation Error', 'Please enter a valid PAN card number (e.g., ABCDE1234F)');
      return;
    }

    // Validate Aadhar format (12 digits)
    const aadharRegex = /^[0-9]{12}$/;
    if (!aadharRegex.test(formData.aadhar.replace(/\s/g, ''))) {
      Alert.alert('Validation Error', 'Please enter a valid 12-digit Aadhar number');
      return;
    }

    setIsLoading(true);
    try {
      // Update in consignors table
      const { data, error } = await supabase
        .from('consignors')
        .update({
          company_address: formData.companyAddress.trim(),
          pan: formData.pan.toUpperCase().trim(),
          aadhar: formData.aadhar.replace(/\s/g, '').trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('phone_number', user.phoneNumber)
        .select()
        .single();

      if (error) throw error;

      // Update local user context
      await updateUserData({
        companyAddress: formData.companyAddress.trim(),
        pan: formData.pan.toUpperCase().trim(),
        aadhar: formData.aadhar.replace(/\s/g, '').trim(),
      });

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAadhar = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Limit to 12 digits
    const limited = cleaned.slice(0, 12);
    // Format as XXXX XXXX XXXX
    const formatted = limited.replace(/(\d{4})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
      let result = p1;
      if (p2) result += ' ' + p2;
      if (p3) result += ' ' + p3;
      return result;
    });
    return formatted;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <LinearGradient
        colors={[Colors.primary, '#b8922e', Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: '#fff',
            marginLeft: 16,
          }}>
            Edit Profile
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ padding: 20 }}>
          {/* Info Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>ℹ️</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                Profile Information
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 20 }}>
              Update your company address, PAN card, and Aadhar details. All fields are required for verification purposes.
            </Text>
          </View>

          {/* Company Details */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🏢</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                Company Name
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: '#1f2937', fontWeight: '600', marginBottom: 16 }}>
              {user?.companyName}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>📱</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                Phone Number
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: '#1f2937', fontWeight: '600' }}>
              {user?.phoneNumber}
            </Text>
          </View>

          {/* Editable Fields */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 20 }}>
              Update Details
            </Text>

            {/* Company Address */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>📍</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                  Company Address
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 15,
                  color: '#1f2937',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Enter complete company address"
                placeholderTextColor="#9ca3af"
                value={formData.companyAddress}
                onChangeText={(text) => setFormData({ ...formData, companyAddress: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* PAN Card */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>💳</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                  PAN Card Number
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 15,
                  color: '#1f2937',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
                placeholder="ABCDE1234F"
                placeholderTextColor="#9ca3af"
                value={formData.pan}
                onChangeText={(text) => setFormData({ ...formData, pan: text.toUpperCase() })}
                maxLength={10}
                autoCapitalize="characters"
              />
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                10 characters (e.g., ABCDE1234F)
              </Text>
            </View>

            {/* Aadhar Number */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🆔</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                  Aadhar Number
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 15,
                  color: '#1f2937',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
                placeholder="1234 5678 9012"
                placeholderTextColor="#9ca3af"
                value={formData.aadhar}
                onChangeText={(text) => setFormData({ ...formData, aadhar: formatAadhar(text) })}
                keyboardType="number-pad"
                maxLength={14}
              />
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                12 digits (e.g., 1234 5678 9012)
              </Text>
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={{
              marginTop: 24,
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              opacity: isLoading ? 0.7 : 1,
            }}
            onPress={handleUpdate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, '#b8922e', Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
                    Updating...
                  </Text>
                </>
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  ✓ Update Profile
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              marginTop: 12,
              paddingVertical: 16,
              alignItems: 'center',
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#6b7280', fontSize: 15, fontWeight: '600' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
