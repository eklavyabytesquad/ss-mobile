import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButton: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#333333',
  },
  resendText: {
    marginTop: 12,
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  demoText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999999',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
