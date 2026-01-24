import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { requestOTP, verifyOTP } from '../utils/authService';
import styles from './styles/login.styles';
import Colors from '../constants/colors';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const { login } = useAuth();

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await requestOTP(phoneNumber);
      
      if (result.success) {
        setShowOtp(true);
        setCompanyName(result.companyName || '');
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
      const result = await verifyOTP(phoneNumber, otp);
      
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
      const result = await requestOTP(phoneNumber);
      
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

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with gradient background */}
        <LinearGradient
          colors={[Colors.primary, '#b8922e', Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appTitle}>SS Tracker</Text>
            <Text style={styles.tagline}>Track Your Shipments</Text>
          </View>
        </LinearGradient>

        {/* Form Content */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <Text style={styles.title}>{showOtp ? 'Verify OTP' : 'Welcome Back'}</Text>
            <Text style={styles.subtitle}>
              {showOtp ? 'Enter the OTP sent to your WhatsApp' : 'Login to continue tracking your shipments'}
            </Text>

            {companyName ? (
              <View style={styles.welcomeBadge}>
                <Text style={styles.welcomeIcon}>👋</Text>
                <Text style={styles.welcomeText}>Welcome, {companyName}!</Text>
              </View>
            ) : null}

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.phoneInputWrapper, !showOtp && styles.inputActive]}>
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
                  editable={!showOtp}
                />
              </View>
            </View>

            {/* OTP Input */}
            {showOtp && (
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
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={showOtp ? handleVerifyOtp : handleSendOtp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, '#b8922e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.submitButtonText}>
                      {showOtp ? 'Verify OTP' : 'Send OTP'}
                    </Text>
                    <Text style={styles.buttonArrow}>→</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Change Number */}
            {showOtp && (
              <TouchableOpacity 
                style={styles.changeNumberButton}
                onPress={() => {
                  setShowOtp(false);
                  setOtp('');
                  setCompanyName('');
                }}
              >
                <Text style={styles.changeNumberText}>← Change Phone Number</Text>
              </TouchableOpacity>
            )}

            {/* Security Badge */}
            <View style={styles.securityBadge}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>Secure Login • End-to-End Encrypted</Text>
            </View>

            {/* Transporter Login Button */}
            <TouchableOpacity 
              style={styles.transporterButton}
              onPress={() => navigation.navigate('TransporterLogin')}
            >
              <Text style={styles.transporterIcon}>🚛</Text>
              <Text style={styles.transporterText}>Login as Transporter</Text>
              <Text style={styles.transporterArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
