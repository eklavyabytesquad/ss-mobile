import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateSession, logout as authLogout } from '../utils/authService';

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
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
      const storedToken = await AsyncStorage.getItem('sessionToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        const { valid, user: validatedUser } = await validateSession(storedToken);
        
        if (valid) {
          setSessionToken(storedToken);
          setUser(validatedUser);
          setIsLoggedIn(true);
        } else {
          // Session invalid, clear storage
          await AsyncStorage.removeItem('sessionToken');
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem('sessionToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setSessionToken(token);
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login storage error:', error);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await authLogout(sessionToken);
      }
      await AsyncStorage.removeItem('sessionToken');
      await AsyncStorage.removeItem('user');
      setSessionToken(null);
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, sessionToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
