import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStaffAuth } from '../context/StaffAuthContext';
import { checkStaffByPhone, requestStaffOTP, verifyStaffOTP } from '../utils/staffAuthService';
import styles from './styles/staff-login.styles';

export default function StaffLoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone', 'otp'
  const [isLoading, setIsLoading] = useState(false);
  const [staffData, setStaffData] = useState(null);
  const { login } = useStaffAuth();

  const handleCheckPhone = async () => {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');

    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkStaffByPhone(cleanPhone);

      if (result.exists && result.staff) {
        setStaffData(result.staff);

        // Send OTP immediately
        const otpResult = await requestStaffOTP(cleanPhone, result.staff.id);

        if (otpResult.success) {
          setStep('otp');
          Alert.alert('OTP Sent', 'OTP has been sent to your WhatsApp');
        } else {
          Alert.alert('Error', otpResult.error || 'Failed to send OTP');
        }
      } else {
        Alert.alert(
          'Not Found',
          result.error || 'This mobile number is not registered as a staff member. Please contact admin.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Check Phone Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
      const result = await verifyStaffOTP(cleanPhone, otp);

      if (result.success) {
        await login(result.user, result.sessionToken);
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
      const result = await requestStaffOTP(cleanPhone, staffData.id);

      if (result.success) {
        Alert.alert('OTP Resent', 'New OTP has been sent to your WhatsApp');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    } else {
      navigation.goBack();
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'phone': return 'Staff Login';
      case 'otp': return 'Verify OTP';
      default: return 'Staff Login';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'phone': return 'Enter your registered mobile number to login';
      case 'otp': return 'Enter the OTP sent to your WhatsApp';
      default: return '';
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#b45309" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={['#f59e0b', '#d97706', '#b45309']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Text style={styles.logoIcon}>👨‍💼</Text>
            </View>
            <Text style={styles.appTitle}>Staff Portal</Text>
            <Text style={styles.tagline}>SS Transport Team</Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>

            {/* Staff Info Badge */}
            {staffData && (
              <View style={styles.welcomeBadge}>
                <Text style={styles.welcomeIcon}>👋</Text>
                <View style={styles.welcomeInfo}>
                  <Text style={styles.welcomeText}>{staffData.name || staffData.username}</Text>
                  {staffData.post && (
                    <Text style={styles.welcomeSubtext}>📋 {staffData.post}</Text>
                  )}
                  {staffData.department && (
                    <Text style={styles.welcomeDetail}>🏢 {staffData.department}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Phone Input - Step 1 */}
            {step === 'phone' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>📱 Mobile Number</Text>
                <View style={[styles.phoneInputWrapper, styles.inputActive]}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCode}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={10}
                  />
                </View>
                <Text style={styles.inputHint}>Enter the mobile number registered with your staff account</Text>
              </View>
            )}

            {/* OTP Input - Step 2 */}
            {step === 'otp' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>📱 Mobile Number</Text>
                  <View style={styles.phoneInputWrapper}>
                    <View style={styles.countryCodeContainer}>
                      <Text style={styles.countryCode}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      value={phoneNumber}
                      editable={false}
                    />
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>🔐 Enter OTP</Text>
                  <TextInput
                    style={[styles.otpInput, styles.inputActive]}
                    placeholder="• • • • • •"
                    placeholderTextColor="#d1d5db"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                  />
                  <View style={styles.otpActions}>
                    <Text style={styles.otpHint}>Sent via WhatsApp</Text>
                    <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                      <Text style={styles.resendText}>🔄 Resend</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={step === 'phone' ? handleCheckPhone : handleVerifyOtp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.submitButtonText}>
                      {step === 'phone' ? 'Send OTP' : 'Verify & Login'}
                    </Text>
                    <Text style={styles.buttonArrow}>→</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Change Number */}
            {step === 'otp' && (
              <TouchableOpacity
                style={styles.changeNumberButton}
                onPress={() => {
                  setStep('phone');
                  setStaffData(null);
                  setOtp('');
                }}
              >
                <Text style={styles.changeNumberText}>← Change Mobile Number</Text>
              </TouchableOpacity>
            )}

            {/* Security Badge */}
            <View style={styles.securityBadge}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>Secure Login • End-to-End Encrypted</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
