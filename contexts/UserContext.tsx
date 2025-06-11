import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { useAuth } from './AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  concessions: number;
  join_date: string;
  note_count?: number;
}

interface Note {
  id: number;
  user_id: number;
  content: string;
  category: 'payment' | 'health' | 'general' | 'emergency';
  created_by: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  created_by_name?: string;
}

interface UserContextType {
  users: User[];
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  updateUserConcessions: (userId: number, concessions: number) => Promise<void>;
  getNotes: (userId?: number, category?: string) => Promise<void>;
  createNote: (userId: number, content: string, category: string) => Promise<void>;
  updateNote: (id: number, content: string, category: string) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load users when admin user is authenticated
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      refreshUsers();
      getNotes();
    }
  }, [currentUser]);

  const refreshUsers = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
      setIsLoading(true);
      const response = await api.getUsers();
      setUsers(response.users);
      setError(null);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserConcessions = async (userId: number, concessions: number) => {
    try {
      setIsLoading(true);
      await api.updateUserConcessions(userId, concessions);
      
      // Refresh users to get updated data
      await refreshUsers();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update concessions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotes = async (userId?: number, category?: string) => {
    try {
      setIsLoading(true);
      const response = userId 
        ? await api.getUserNotes(userId, category)
        : await api.getAllNotes(userId, category);
      setNotes(response.notes);
      setError(null);
    } catch (error) {
      console.error('Failed to load notes:', error);
      setError('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async (userId: number, content: string, category: string) => {
    try {
      setIsLoading(true);
      await api.createNote(userId, content, category);
      
      // Refresh notes
      await getNotes();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to create note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateNote = async (id: number, content: string, category: string) => {
    try {
      setIsLoading(true);
      await api.updateNote(id, content, category);
      
      // Refresh notes
      await getNotes();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      setIsLoading(true);
      await api.deleteNote(id);
      
      // Refresh notes
      await getNotes();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    users,
    notes,
    isLoading,
    error,
    refreshUsers,
    updateUserConcessions,
    getNotes,
    createNote,
    updateNote,
    deleteNote
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};