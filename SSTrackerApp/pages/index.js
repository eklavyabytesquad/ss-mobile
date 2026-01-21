import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import styles from './styles/index.styles';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>SS</Text>
        </View>
        <Text style={styles.appName}>SS Tracker</Text>
        <Text style={styles.tagline}>Track your shipments with ease</Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📍</Text>
          <Text style={styles.featureText}>Real-time Tracking</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🚚</Text>
          <Text style={styles.featureText}>Fleet Management</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={styles.featureText}>Analytics Dashboard</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login with Phone</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
}
