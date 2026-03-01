import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './styles/master.styles';

export default function MasterScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(150, [
        Animated.spring(card1Anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(card2Anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      {/* Header */}
      <LinearGradient
        colors={['#334155', '#1e293b', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backArrow} />
        </TouchableOpacity>
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Master Login</Text>
          <Text style={styles.headerSubtitle}>For transporters & staff members</Text>
        </Animated.View>
      </LinearGradient>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        <Animated.View style={{
          opacity: card1Anim,
          transform: [{ translateY: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }}>
          <TouchableOpacity
            style={styles.loginCard}
            onPress={() => navigation.navigate('TransporterLogin')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#eff6ff', '#dbeafe']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIconCircle}>
                <Text style={styles.cardIcon}>🚛</Text>
              </View>
              <View style={styles.cardTextArea}>
                <Text style={styles.cardTitle}>Transporter Login</Text>
                <Text style={styles.cardDesc}>Access your transport dashboard, manage shipments & track deliveries</Text>
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{
          opacity: card2Anim,
          transform: [{ translateY: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }}>
          <TouchableOpacity
            style={styles.loginCard}
            onPress={() => navigation.navigate('StaffLogin')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#f8fafc', '#f1f5f9']}
              style={styles.cardGradient}
            >
              <View style={[styles.cardIconCircle, { backgroundColor: '#e2e8f0' }]}>
                <Text style={styles.cardIcon}>👨‍💼</Text>
              </View>
              <View style={styles.cardTextArea}>
                <Text style={styles.cardTitle}>SS Transport Staff</Text>
                <Text style={styles.cardDesc}>Staff portal for bilty search, image upload & kaat management</Text>
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>Authorized access only</Text>
      </View>
    </View>
  );
}
