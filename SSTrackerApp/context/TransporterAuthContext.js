import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateTransporterSession, logoutTransporter as authLogout } from '../utils/transporterAuthService';

// Transporter Auth Context
const TransporterAuthContext = createContext();

export const useTransporterAuth = () => {
  const context = useContext(TransporterAuthContext);
  if (!context) {
    throw new Error('useTransporterAuth must be used within TransporterAuthProvider');
  }
  return context;
};

export function TransporterAuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('transporterSessionToken');
      const storedUser = await AsyncStorage.getItem('transporterUser');
      
      if (storedToken && storedUser) {
        const { valid, user: validatedUser } = await validateTransporterSession(storedToken);
        
        if (valid) {
          setSessionToken(storedToken);
          setUser(validatedUser);
          setIsLoggedIn(true);
        } else {
          // Session invalid, clear storage
          await AsyncStorage.removeItem('transporterSessionToken');
          await AsyncStorage.removeItem('transporterUser');
        }
      }
    } catch (error) {
      console.error('Transporter session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem('transporterSessionToken', token);
      await AsyncStorage.setItem('transporterUser', JSON.stringify(userData));
      setSessionToken(token);
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Transporter login storage error:', error);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await authLogout(sessionToken);
      }
      await AsyncStorage.removeItem('transporterSessionToken');
      await AsyncStorage.removeItem('transporterUser');
      setSessionToken(null);
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Transporter logout error:', error);
    }
  };

  const updateUserData = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('transporterUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update transporter data error:', error);
      throw error;
    }
  };

  return (
    <TransporterAuthContext.Provider value={{ isLoggedIn, user, sessionToken, isLoading, login, logout, updateUserData }}>
      {children}
    </TransporterAuthContext.Provider>
  );
}
