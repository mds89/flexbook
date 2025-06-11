import React, { createContext, useContext, useEffect, useState } from 'react';
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
  status?: 'published' | 'draft' | 'scheduled'; // Optional for backward compatibility
  publish_date?: string; // When the class becomes available for booking
  start_date?: string; // When the class physically starts
  end_date?: string; // When the class physically ends (optional)
  created_at?: string;
  updated_at?: string;
}

interface Booking {
  id: number;
  user_id: number;
  class_id: number;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'late-cancelled';
  used_concession: boolean;
  booking_time: string;
  cancellation_time?: string;
  is_late_cancellation: boolean;
  class_name?: string;
  time?: string;
  instructor?: string;
  duration?: string;
  user_name?: string;
  user_email?: string;
}

interface BookingContextType {
  classes: GymClass[];
  bookings: Booking[];
  allBookings: Booking[];
  isLoading: boolean;
  error: string | null;
  bookClass: (classId: number, date: string) => Promise<void>;
  cancelBooking: (bookingId: number) => Promise<{ isLateCancellation: boolean; message: string; concessionRefunded?: boolean }>;
  completeClass: (classId: number, date: string) => Promise<void>;
  undoCompleteClass: (classId: number, date: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshAllBookings: () => Promise<void>;
  getClassBookings: (classId: number, date: string) => Promise<Booking[]>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

// Helper function to check if a class is available for booking
const isClassAvailableForBooking = (gymClass: GymClass): boolean => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Draft classes are never available for booking
  if (gymClass.status === 'draft') {
    return false;
  }
  
  // Published classes are immediately available (unless they have ended)
  if (gymClass.status === 'published') {
    // Check if class has ended
    if (gymClass.end_date && gymClass.end_date < today) {
      return false;
    }
    return true;
  }
  
  // Scheduled classes are available only after their publish date
  if (gymClass.status === 'scheduled' && gymClass.publish_date) {
    // Check if publish date has passed
    if (gymClass.publish_date > today) {
      return false;
    }
    // Check if class has ended
    if (gymClass.end_date && gymClass.end_date < today) {
      return false;
    }
    return true;
  }
  
  // For classes without status (backward compatibility), treat as published
  if (!gymClass.status) {
    return true;
  }
  
  return false;
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes when user is authenticated
  useEffect(() => {
    if (user) {
      loadClasses();
      refreshBookings();
      if (user.role === 'admin') {
        refreshAllBookings();
      }
    }
  }, [user]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const response = await api.getClasses();
      // Filter to only show classes that are available for booking
      const availableClasses = response.classes.filter(isClassAvailableForBooking);
      setClasses(availableClasses);
      setError(null);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setError('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBookings = async () => {
    if (!user) return;
    
    try {
      const response = await api.getMyBookings();
      setBookings(response.bookings);
      setError(null);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setError('Failed to load your bookings');
    }
  };

  const refreshAllBookings = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const response = await api.getAllBookings();
      setAllBookings(response.bookings);
      setError(null);
    } catch (error) {
      console.error('Failed to load all bookings:', error);
      setError('Failed to load all bookings');
    }
  };

  const bookClass = async (classId: number, date: string) => {
    try {
      setIsLoading(true);
      
      // Double-check that the class is still available for booking
      const gymClass = classes.find(c => c.id === classId);
      if (!gymClass || !isClassAvailableForBooking(gymClass)) {
        throw new Error('This class is no longer available for booking');
      }
      
      await api.createBooking(classId, date);
      
      // Refresh bookings and user data to update concession count
      await refreshBookings();
      await refreshUser(); // This will update the user's concession count
      if (user?.role === 'admin') {
        await refreshAllBookings();
      }
      
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to book class';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (bookingId: number) => {
    try {
      setIsLoading(true);
      const response = await api.cancelBooking(bookingId);
      
      console.log('Booking cancellation response:', response);
      
      // Refresh bookings and user data to update concession count
      await refreshBookings();
      await refreshUser(); // This will update the user's concession count
      if (user?.role === 'admin') {
        await refreshAllBookings();
      }
      
      setError(null);
      return {
        isLateCancellation: response.isLateCancellation,
        message: response.message,
        concessionRefunded: response.concessionRefunded
      };
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to cancel booking';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const completeClass = async (classId: number, date: string) => {
    try {
      setIsLoading(true);
      await api.completeClass(classId, date);
      
      // Refresh bookings
      await refreshAllBookings();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to complete class';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const undoCompleteClass = async (classId: number, date: string) => {
    try {
      setIsLoading(true);
      await api.undoCompleteClass(classId, date);
      
      // Refresh bookings
      await refreshAllBookings();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to undo class completion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getClassBookings = async (classId: number, date: string) => {
    try {
      const response = await api.getClassBookings(classId, date);
      return response.bookings;
    } catch (error) {
      console.error('Failed to get class bookings:', error);
      return [];
    }
  };

  const value = {
    classes,
    bookings,
    allBookings,
    isLoading,
    error,
    bookClass,
    cancelBooking,
    completeClass,
    undoCompleteClass,
    refreshBookings,
    refreshAllBookings,
    getClassBookings
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};