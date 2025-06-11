import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiError, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';
import config from '../config/environment';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  concessions: number;
  join_date?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;  
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const token = getAuthToken();
        
        if (token) {
          console.log('🔐 Found existing token, verifying...');
          
          try {
            const authResponse = await api.getCurrentUser();
            setUser(authResponse.user);
            console.log('✅ User authenticated:', authResponse.user.email);
          } catch (error) {
            console.error('Token verification failed:', error);
            
            // Clear invalid token
            removeAuthToken();
            setUser(null);
            
            if (error instanceof ApiError) {
              console.error('API Error:', error.status, error.message);
            }
          }
        } else {
          console.log('🔐 No token found, user not authenticated');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Clear any invalid state
        removeAuthToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure environment is loaded
    const timer = setTimeout(initializeAuth, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login for:', email);
      
      // Show which API we're using
      if (config.FEATURES.USE_MOCK_API) {
        console.log('🧪 Using mock API - Demo accounts: admin@gym.com/admin123, user@gym.com/user123');
      }
      
      const loginResponse = await api.login(email, password);
      
      // Store token
      setAuthToken(loginResponse.token);
      
      // Set user
      setUser(loginResponse.user);
      
      console.log('✅ Login successful:', loginResponse.user.email);
    } catch (error) {
      console.error('Login failed:', error);
      
      // Show helpful error messages
      if (error instanceof ApiError) {
        if (error.status === 0) {
          throw new Error('Unable to connect to server. Please check your connection and try again.');
        } else if (error.status === 401) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else {
          throw new Error(error.message || 'Login failed. Please try again.');
        }
      } else if (error instanceof Error) {
        throw new Error(error.message || 'Login failed. Please try again.');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('📝 Attempting registration for:', email);
      
      const registerResponse = await api.register(name, email, password);
      
      // Store token
      setAuthToken(registerResponse.token);
      
      // Set user
      setUser(registerResponse.user);
      
      console.log('✅ Registration successful:', registerResponse.user.email);
    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error instanceof ApiError) {
        if (error.status === 0) {
          throw new Error('Unable to connect to server. Please check your connection and try again.');
        } else if (error.status === 409) {
          throw new Error('An account with this email already exists. Please use a different email or try logging in.');
        } else {
          throw new Error(error.message || 'Registration failed. Please try again.');
        }
      } else if (error instanceof Error) {
        throw new Error(error.message || 'Registration failed. Please try again.');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🔐 Logging out user');
    removeAuthToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data');
      const userResponse = await api.getCurrentUser();
      setUser(userResponse.user);
      console.log('✅ User data refreshed');
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might need to log in again
      logout();
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};