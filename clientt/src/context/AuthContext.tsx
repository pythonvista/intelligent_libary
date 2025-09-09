'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { User, RegisterData, ProfileUpdateData } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: ProfileUpdateData) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { user: userData, token: authToken } = response.data;

      setUser(userData);
      setToken(authToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Login failed'
        : 'Login failed';
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      const response = await authAPI.register(userData);
      const { user: newUser, token: authToken } = response.data;

      setUser(newUser);
      setToken(authToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(newUser));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Registration failed'
        : 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // Update user function
  const updateUser = async (userData: ProfileUpdateData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Update failed'
        : 'Update failed';
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
