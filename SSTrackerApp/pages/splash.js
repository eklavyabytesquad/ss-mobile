import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, Image } from 'react-native';
import styles from './styles/splash.styles';

const { height } = Dimensions.get('window');

export default function SplashScreen({ onAnimationComplete }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const logoPositionY = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Logo appears in center with scale and fade
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Hold for a moment
      setTimeout(() => {
        // Phase 3: Logo moves up and scales down, screen fades
        const targetY = -height * 0.25; // Move to top position
        
        Animated.parallel([
          Animated.timing(logoPositionY, {
            toValue: targetY,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 0.7,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(screenFade, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Transition complete
          onAnimationComplete();
        });
      }, 1000);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: logoPositionY },
              { scale: Animated.multiply(scaleAnim, logoScale) },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.appName, { opacity: fadeAnim }]}>
          SS Transport
        </Animated.Text>
        <Animated.View style={[styles.taglineContainer, { opacity: fadeAnim }]}>
          <Text style={styles.tagline}>Your Trusted Shipment Partner</Text>
        </Animated.View>
      </Animated.View>
      
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <View style={styles.loadingBar}>
          <Animated.View 
            style={[
              styles.loadingProgress,
              {
                transform: [{
                  scaleX: fadeAnim,
                }],
              },
            ]} 
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}
