import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../constants/colors';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 90,
    marginBottom: 12,
  },
  appName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 30,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  featureCard: {
    width: (width - 54) / 2,
    backgroundColor: '#FFFFFF',
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 16,
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transporterLoginButton: {
    backgroundColor: '#eff6ff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  transporterLoginText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
