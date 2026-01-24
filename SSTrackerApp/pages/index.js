import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import styles from './styles/index.styles';

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered animation sequence
    Animated.sequence([
      // Logo area fades in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Cards fade in
      Animated.timing(cardsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Button fades in
      Animated.spring(buttonAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Animated.Image
          source={require('../assets/images/logo.png')}
          style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
          resizeMode="contain"
        />
        <Text style={styles.appName}>SS Transport</Text>
        <Text style={styles.tagline}>Your Trusted Shipment Partner</Text>
      </Animated.View>

      <Animated.View style={[styles.featuresContainer, { opacity: cardsAnim, transform: [{ scale: cardsAnim }] }]}>
        <View style={styles.featuresGrid}>
          <Animated.View style={[styles.featureCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.featureIcon}>📦</Text>
            <Text style={styles.featureText}>Track{"\n"}Shipments</Text>
          </Animated.View>
          <Animated.View style={[styles.featureCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.featureIcon}>📄</Text>
            <Text style={styles.featureText}>Digital{"\n"}Bilty</Text>
          </Animated.View>
          <Animated.View style={[styles.featureCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Delivery{"\n"}Reports</Text>
          </Animated.View>
          <Animated.View style={[styles.featureCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureText}>Rate{"\n"}Management</Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim, transform: [{ translateY: Animated.multiply(buttonAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
      }), 1) }, { scale: buttonAnim }] }]}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>🔐 Login with Phone</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.transporterLoginButton}
          onPress={() => navigation.navigate('TransporterLogin')}
          activeOpacity={0.8}
        >
          <Text style={styles.transporterLoginText}>🚛 Transporter Login</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </Animated.View>
    </View>
  );
}
