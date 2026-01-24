import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransporterAuth } from '../context/TransporterAuthContext';
import { checkTransporterByGST, requestTransporterOTP, verifyTransporterOTP } from '../utils/transporterAuthService';
import styles from './styles/transporter-login.styles';
import Colors from '../constants/colors';

export default function TransporterLoginScreen({ navigation }) {
  const [gstNumber, setGstNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('gst'); // 'gst', 'mobile', 'otp'
  const [isLoading, setIsLoading] = useState(false);
  const [transporterData, setTransporterData] = useState(null);
  const { login } = useTransporterAuth();

  const handleVerifyGST = async () => {
    const cleanGst = gstNumber.trim();
    
    // Basic GST validation
    if (cleanGst.length !== 15) {
      Alert.alert('Invalid GST', 'GST number must be exactly 15 characters long');
      return;
    }

    // GST format validation (basic)
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstPattern.test(cleanGst.toUpperCase())) {
      Alert.alert('Invalid Format', 'Please enter a valid GST number format');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await checkTransporterByGST(cleanGst);
      
      if (result.exists && result.transporter) {
        // Check if mobile number exists
        if (!result.transporter.mob_number || result.transporter.mob_number.trim() === '') {
          Alert.alert(
            'No Mobile Number',
            'No mobile number registered for this GST. Please contact support to add your mobile number.',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }

        setTransporterData(result.transporter);
        setPhoneNumber(result.transporter.mob_number.trim());
        setStep('mobile');
      } else {
        Alert.alert(
          'GST Not Found',
          'This GST number is not registered in our system. Please contact SS Transport support to register your transport company.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('GST Verification Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Invalid mobile number');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await requestTransporterOTP(phoneNumber, transporterData.id);
      
      if (result.success) {
        setStep('otp');
        Alert.alert('OTP Sent', 'OTP has been sent to your WhatsApp');
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
      const result = await verifyTransporterOTP(phoneNumber, otp);
      
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
      const result = await requestTransporterOTP(phoneNumber, transporterData.id);
      
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
      setStep('mobile');
      setOtp('');
    } else if (step === 'mobile') {
      setStep('gst');
      setTransporterData(null);
      setPhoneNumber('');
    } else {
      navigation.goBack();
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'gst': return 'Transporter Login';
      case 'mobile': return 'Verify Mobile';
      case 'otp': return 'Verify OTP';
      default: return 'Transporter Login';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'gst': return 'Enter your GST number to continue';
      case 'mobile': return 'We will send OTP to your registered mobile';
      case 'otp': return 'Enter the OTP sent to your WhatsApp';
      default: return '';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with gradient background */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Text style={styles.logoIcon}>🚛</Text>
            </View>
            <Text style={styles.appTitle}>Transporter Portal</Text>
            <Text style={styles.tagline}>SS Transport Network</Text>
          </View>
        </LinearGradient>

        {/* Form Content */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>

            {/* Transporter Info Badge */}
            {transporterData && (
              <View style={styles.welcomeBadge}>
                <Text style={styles.welcomeIcon}>🏢</Text>
                <View style={styles.welcomeInfo}>
                  <Text style={styles.welcomeText}>{transporterData.transport_name}</Text>
                  <Text style={styles.welcomeSubtext}>📍 {transporterData.city_name}</Text>
                  {transporterData.gst_number && (
                    <Text style={styles.gstDisplay}>GST: {transporterData.gst_number}</Text>
                  )}
                </View>
              </View>
            )}

            {/* GST Input - Step 1 */}
            {step === 'gst' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>GST Number (GSTIN)</Text>
                <View style={[styles.inputWrapper, styles.inputActive]}>
                  <Text style={styles.inputIcon}>📋</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="22AAAAA0000A1Z5"
                    placeholderTextColor="#9ca3af"
                    value={gstNumber}
                    onChangeText={(text) => setGstNumber(text.toUpperCase())}
                    maxLength={15}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.gstInfoContainer}>
                  <Text style={styles.inputHint}>• Must be 15 characters</Text>
                  <Text style={styles.inputHint}>• Format: 22AAAAA0000A1Z5</Text>
                  <Text style={styles.gstLength}>{gstNumber.length}/15</Text>
                </View>
              </View>
            )}

            {/* Mobile Display - Step 2 */}
            {step === 'mobile' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Registered Mobile Number</Text>
                <View style={[styles.phoneInputWrapper, styles.inputActive]}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCode}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    editable={false}
                    placeholderTextColor="#9ca3af"
                  />
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                </View>
                <Text style={styles.inputHint}>This is your registered mobile number</Text>
              </View>
            )}

            {/* OTP Input - Step 3 */}
            {step === 'otp' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>📱 Mobile Number</Text>
                  <View style={[styles.phoneInputWrapper]}>
                    <View style={styles.countryCodeContainer}>
                      <Text style={styles.countryCode}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      value={phoneNumber}
                      editable={false}
                    />
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
              onPress={step === 'gst' ? handleVerifyGST : step === 'mobile' ? handleSendOtp : handleVerifyOtp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.submitButtonText}>
                      {step === 'gst' ? 'Verify GST' : step === 'mobile' ? 'Send OTP' : 'Verify OTP'}
                    </Text>
                    <Text style={styles.buttonArrow}>→</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Change GST */}
            {step !== 'gst' && (
              <TouchableOpacity 
                style={styles.changeNumberButton}
                onPress={() => {
                  setStep('gst');
                  setTransporterData(null);
                  setPhoneNumber('');
                  setOtp('');
                }}
              >
                <Text style={styles.changeNumberText}>← Change GST Number</Text>
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
