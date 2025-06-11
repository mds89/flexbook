import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../services/api';
import { useAuth } from './AuthContext';

interface GymClass {
  id: number;
  name: string;
  time: string;
  duration: string;
  instructor: string;
  max_capacity: number;
  description: string;
  category: 'morning' | 'afternoon';
  days: string[];
  status: 'published' | 'draft' | 'scheduled';
  publish_date?: string; // When the class becomes available for booking
  start_date?: string; // When the class physically starts
  end_date?: string; // When the class physically ends (optional)
  created_at: string;
  updated_at: string;
}

interface ClassFormData {
  name: string;
  time: string;
  duration: string;
  instructor: string;
  max_capacity: number;
  description: string;
  category: 'morning' | 'afternoon';
  days: string[];
  status: 'published' | 'draft' | 'scheduled';
  publish_date?: string;
  start_date?: string;
  end_date?: string;
}

interface ClassContextType {
  classes: GymClass[];
  isLoading: boolean;
  error: string | null;
  refreshClasses: () => Promise<void>;
  getClass: (id: number) => Promise<GymClass>;
  createClass: (classData: ClassFormData) => Promise<void>;
  updateClass: (id: number, classData: Partial<ClassFormData>) => Promise<void>;
  deleteClass: (id: number) => Promise<void>;
  clearError: () => void;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const useClass = () => {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize clearError to prevent useEffect dependency issues
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load classes when admin user is authenticated
  useEffect(() => {
    if (user && user.role === 'admin') {
      refreshClasses();
    }
  }, [user]); // Remove clearError from dependencies since it's now memoized and called elsewhere

  const refreshClasses = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setIsLoading(true);
      // For admin class management, we need all classes including drafts
      // The mock API will handle this automatically, but for real API we might need a different endpoint
      const { mockApi } = await import('../services/mockApi');
      const response = await mockApi.classes.getAllForAdmin();
      setClasses(response.classes);
      setError(null);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setError('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  const getClass = async (id: number): Promise<GymClass> => {
    try {
      const response = await api.getClass(id);
      return response.class;
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to get class';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createClass = async (classData: ClassFormData) => {
    try {
      setIsLoading(true);
      await api.createClass(classData);
      
      // Refresh classes to get updated list
      await refreshClasses();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to create class';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClass = async (id: number, classData: Partial<ClassFormData>) => {
    try {
      setIsLoading(true);
      await api.updateClass(id, classData);
      
      // Refresh classes to get updated list
      await refreshClasses();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update class';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClass = async (id: number) => {
    try {
      setIsLoading(true);
      await api.deleteClass(id);
      
      // Refresh classes to get updated list
      await refreshClasses();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete class';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    classes,
    isLoading,
    error,
    refreshClasses,
    getClass,
    createClass,
    updateClass,
    deleteClass,
    clearError
  };

  return (
    <ClassContext.Provider value={value}>
      {children}
    </ClassContext.Provider>
  );
};