import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../navigation/NavigationManager';
import styles from './styles/login.styles';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const { login } = useAuth();

  const handleSendOtp = () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    // Dummy OTP send
    setShowOtp(true);
    Alert.alert('OTP Sent', 'Use 123456 as OTP for demo');
  };

  const handleVerifyOtp = () => {
    // Dummy OTP verification
    if (otp === '123456') {
      login(phoneNumber);
    } else {
      Alert.alert('Error', 'Invalid OTP. Use 123456 for demo');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Enter your phone number to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
              editable={!showOtp}
            />
          </View>
        </View>

        {showOtp && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>OTP</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <TouchableOpacity onPress={() => Alert.alert('OTP Resent', 'Use 123456')}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={showOtp ? handleVerifyOtp : handleSendOtp}
        >
          <Text style={styles.submitButtonText}>
            {showOtp ? 'Verify OTP' : 'Send OTP'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.demoText}>
          Demo: Use any 10-digit number and OTP: 123456
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
