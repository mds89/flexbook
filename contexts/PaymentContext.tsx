import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '../services/api';
import { useAuth } from './AuthContext';

interface PaymentDetails {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  sort_code: string;
  reference_instructions: string;
  additional_info: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: number;
  user_id: number;
  amount: number;
  concessions_purchased: number;
  payment_method: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  processed_by?: number;
  processed_at?: string;
}

interface PaymentContextType {
  paymentDetails: PaymentDetails | null;
  payments: Payment[];
  userPayments: Payment[];
  isLoading: boolean;
  error: string | null;
  
  // Payment details management
  updatePaymentDetails: (details: Omit<PaymentDetails, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  
  // Payment operations
  submitPayment: (paymentData: {
    amount: number;
    concessions_purchased: number;
    payment_method: string;
    reference: string;
  }) => Promise<void>;
  
  processPayment: (id: number, status: 'confirmed' | 'rejected', notes?: string) => Promise<void>;
  
  // Data loading
  refreshPaymentDetails: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshUserPayments: (userId?: number) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userPayments, setUserPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data when component mounts
  useEffect(() => {
    refreshPaymentDetails();
    if (user) {
      refreshUserPayments();
      if (user.role === 'admin') {
        refreshPayments();
      }
    }
  }, [user]);

  const refreshPaymentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPaymentDetails();
      setPaymentDetails(response.paymentDetails);
      setError(null);
    } catch (error) {
      console.error('Failed to load payment details:', error);
      setError('Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPayments = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setIsLoading(true);
      const response = await api.getAllPayments();
      setPayments(response.payments);
      setError(null);
    } catch (error) {
      console.error('Failed to load payments:', error);
      setError('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserPayments = async (userId?: number) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;
    
    try {
      setIsLoading(true);
      const response = await api.getUserPayments(targetUserId);
      setUserPayments(response.payments);
      setError(null);
    } catch (error) {
      console.error('Failed to load user payments:', error);
      setError('Failed to load user payments');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentDetails = async (details: Omit<PaymentDetails, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      const response = await api.updatePaymentDetails(details);
      setPaymentDetails(response.paymentDetails);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update payment details';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const submitPayment = async (paymentData: {
    amount: number;
    concessions_purchased: number;
    payment_method: string;
    reference: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await api.createPayment(paymentData);
      
      // Refresh user payments to show the new payment
      await refreshUserPayments();
      
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to submit payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async (id: number, status: 'confirmed' | 'rejected', notes?: string) => {
    try {
      setIsLoading(true);
      const response = await api.updatePaymentStatus(id, status, notes);
      
      // Refresh all payments to show the updated status
      await refreshPayments();
      
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to process payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    paymentDetails,
    payments,
    userPayments,
    isLoading,
    error,
    updatePaymentDetails,
    submitPayment,
    processPayment,
    refreshPaymentDetails,
    refreshPayments,
    refreshUserPayments,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};