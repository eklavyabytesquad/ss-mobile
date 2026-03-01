import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateStaffSession, logoutStaff as authLogout } from '../utils/staffAuthService';

const StaffAuthContext = createContext();

export const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within StaffAuthProvider');
  }
  return context;
};

export function StaffAuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('staffSessionToken');
      const storedUser = await AsyncStorage.getItem('staffUser');

      if (storedToken && storedUser) {
        const { valid, user: validatedUser } = await validateStaffSession(storedToken);

        if (valid) {
          setSessionToken(storedToken);
          setUser(validatedUser);
          setIsLoggedIn(true);
        } else {
          await AsyncStorage.removeItem('staffSessionToken');
          await AsyncStorage.removeItem('staffUser');
        }
      }
    } catch (error) {
      console.error('Staff session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem('staffSessionToken', token);
      await AsyncStorage.setItem('staffUser', JSON.stringify(userData));
      setSessionToken(token);
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Staff login storage error:', error);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await authLogout(sessionToken);
      }
      await AsyncStorage.removeItem('staffSessionToken');
      await AsyncStorage.removeItem('staffUser');
      setSessionToken(null);
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Staff logout error:', error);
    }
  };

  const updateUserData = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('staffUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update staff data error:', error);
      throw error;
    }
  };

  return (
    <StaffAuthContext.Provider value={{ isLoggedIn, user, sessionToken, isLoading, login, logout, updateUserData }}>
      {children}
    </StaffAuthContext.Provider>
  );
}
