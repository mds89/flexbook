// Mock API service for development when backend is not available
// This version simulates state changes in localStorage to mimic a real database

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  concessions: number;
  join_date: string;
}

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
}

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

interface Note {
  id: number;
  user_id: number;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

// Safe localStorage access
const safeGetItem = (key: string): string | null => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const safeSetItem = (key: string, value: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Initialize mock data in localStorage if not exists
const initializeMockData = () => {
  if (!safeGetItem('flexbook_mock_users')) {
    const users = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@gym.com',
        role: 'admin',
        concessions: 10,
        join_date: '2024-01-01'
      },
      {
        id: 2,
        name: 'Test User',
        email: 'user@gym.com',
        role: 'user',
        concessions: 5,
        join_date: '2024-01-15'
      }
    ];
    safeSetItem('flexbook_mock_users', JSON.stringify(users));
  }

  if (!safeGetItem('flexbook_mock_classes')) {
    const classes = [
      {
        id: 1,
        name: 'Morning Yoga',
        time: '07:00',
        duration: '60 minutes',
        instructor: 'Sarah Johnson',
        max_capacity: 20,
        description: 'Start your day with energizing yoga flow',
        category: 'morning',
        days: ['Monday', 'Friday'],
        status: 'published',
        publish_date: '2024-01-01',
        start_date: '2024-01-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Strength Training',
        time: '17:30',
        duration: '45 minutes',
        instructor: 'Mike Davis',
        max_capacity: 15,
        description: 'Build strength with guided weight training',
        category: 'afternoon',
        days: ['Monday', 'Wednesday', 'Friday'],
        status: 'published',
        publish_date: '2024-01-01',
        start_date: '2024-01-20',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Advanced Pilates',
        time: '18:30',
        duration: '50 minutes',
        instructor: 'Emma Wilson',
        max_capacity: 12,
        description: 'Advanced pilates for experienced practitioners',
        category: 'afternoon',
        days: ['Tuesday', 'Thursday'],
        status: 'scheduled',
        publish_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    safeSetItem('flexbook_mock_classes', JSON.stringify(classes));
  }

  if (!safeGetItem('flexbook_mock_bookings')) {
    safeSetItem('flexbook_mock_bookings', JSON.stringify([]));
  }

  if (!safeGetItem('flexbook_mock_payment_details')) {
    const defaultPaymentDetails = {
      id: 1,
      bank_name: 'ANZ New Zealand',
      account_name: 'FlexGym Ltd',
      account_number: '01-0123-0123456-00',
      sort_code: '',
      reference_instructions: 'Please use your full name and email address as the payment reference',
      additional_info: 'Payments are typically processed within 1-2 business days. Contact us if you have any questions.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    safeSetItem('flexbook_mock_payment_details', JSON.stringify(defaultPaymentDetails));
  }

  if (!safeGetItem('flexbook_mock_payments')) {
    safeSetItem('flexbook_mock_payments', JSON.stringify([]));
  }

  if (!safeGetItem('flexbook_mock_notes')) {
    safeSetItem('flexbook_mock_notes', JSON.stringify([]));
  }
};

// Helper functions to get/set mock data
const getMockUsers = (): User[] => {
  initializeMockData();
  return JSON.parse(safeGetItem('flexbook_mock_users') || '[]');
};

const setMockUsers = (users: User[]) => {
  safeSetItem('flexbook_mock_users', JSON.stringify(users));
};

const getMockClasses = (): GymClass[] => {
  initializeMockData();
  return JSON.parse(safeGetItem('flexbook_mock_classes') || '[]');
};

const setMockClasses = (classes: GymClass[]) => {
  safeSetItem('flexbook_mock_classes', JSON.stringify(classes));
};

const getMockBookings = (): Booking[] => {
  initializeMockData();
  return JSON.parse(safeGetItem('flexbook_mock_bookings') || '[]');
};

const setMockBookings = (bookings: Booking[]) => {
  safeSetItem('flexbook_mock_bookings', JSON.stringify(bookings));
};

const getMockPaymentDetails = (): PaymentDetails => {
  initializeMockData();
  return JSON.parse(safeGetItem('flexbook_mock_payment_details') || '{}');
};

const setMockPaymentDetails = (paymentDetails: PaymentDetails) => {
  safeSetItem('flexbook_mock_payment_details', JSON.stringify(paymentDetails));
};

const getMockPayments = (): Payment[] => {
  initializeMockData();
  return JSON.parse(safeGetItem('flexbook_mock_payments') || '[]');
};

const setMockPayments = (payments: Payment[]) => {
  safeSetItem('flexbook_mock_payments', JSON.stringify(payments));
};

const getMockNotes = (): Note[] => {
  initializeMockData();
  return JSON.parse(safeGetItem('flexbook_mock_notes') || '[]');
};

const setMockNotes = (notes: Note[]) => {
  safeSetItem('flexbook_mock_notes', JSON.stringify(notes));
};

const getUserByToken = (token: string): User | null => {
  const users = getMockUsers();
  if (token === 'mock-admin-token') {
    return users.find(u => u.email === 'admin@gym.com') || null;
  }
  if (token === 'mock-user-token') {
    return users.find(u => u.email === 'user@gym.com') || null;
  }
  return null;
};

const updateUserConcessions = (userId: number, newConcessions: number) => {
  const users = getMockUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].concessions = newConcessions;
    setMockUsers(users);
    console.log(`✅ Updated user ${userId} concessions to ${newConcessions}`);
  }
};

// Helper function to check if a class is available for booking
const isClassAvailableForBooking = (gymClass: GymClass): boolean => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Draft classes are never available for booking
  if (gymClass.status === 'draft') {
    return false;
  }
  
  // Published classes are immediately available
  if (gymClass.status === 'published') {
    return true;
  }
  
  // Scheduled classes are available only after their publish date
  if (gymClass.status === 'scheduled' && gymClass.publish_date) {
    return gymClass.publish_date <= today;
  }
  
  return false;
};

export const mockApi = {
  auth: {
    login: async (email: string, password: string) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = getMockUsers();
      
      if (email === 'admin@gym.com' && password === 'admin123') {
        const user = users.find(u => u.email === 'admin@gym.com');
        return {
          token: 'mock-admin-token',
          user: user || {
            id: 1,
            name: 'Admin User',
            email: 'admin@gym.com',
            role: 'admin',
            concessions: 10,
            join_date: '2024-01-01'
          },
          message: 'Login successful'
        };
      }
      
      if (email === 'user@gym.com' && password === 'user123') {
        const user = users.find(u => u.email === 'user@gym.com');
        return {
          token: 'mock-user-token',
          user: user || {
            id: 2,
            name: 'Test User',
            email: 'user@gym.com',
            role: 'user',
            concessions: 5,
            join_date: '2024-01-15'
          },
          message: 'Login successful'
        };
      }
      
      throw new Error('Invalid credentials');
    },

    register: async (name: string, email: string, password: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = getMockUsers();
      const newUser = {
        id: Date.now(),
        name,
        email,
        role: 'user',
        concessions: 5,
        join_date: new Date().toISOString()
      };
      
      users.push(newUser);
      setMockUsers(users);
      
      return {
        token: `mock-user-token-${newUser.id}`,
        user: newUser,
        message: 'Registration successful'
      };
    },

    me: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (user) {
        return { user };
      }
      
      throw new Error('Unauthorized');
    }
  },

  classes: {
    getAll: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const classes = getMockClasses();
      
      // For regular users, only return classes that are available for booking
      const availableClasses = classes.filter(isClassAvailableForBooking);
      
      return {
        classes: availableClasses
      };
    },

    getAllForAdmin: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const classes = getMockClasses();
      
      return {
        classes: classes // Return all classes for admin management
      };
    },

    getById: async (id: number) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const classes = getMockClasses();
      const gymClass = classes.find(c => c.id === id);
      
      if (!gymClass) {
        throw new Error('Class not found');
      }
      
      return { class: gymClass };
    },

    create: async (classData: Omit<GymClass, 'id' | 'created_at' | 'updated_at'>) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      const classes = getMockClasses();
      const newClass: GymClass = {
        ...classData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      classes.push(newClass);
      setMockClasses(classes);
      
      console.log(`✅ Class created successfully:`, newClass);
      
      return {
        class: newClass,
        message: 'Class created successfully'
      };
    },

    update: async (id: number, classData: Partial<GymClass>) => {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      const classes = getMockClasses();
      const classIndex = classes.findIndex(c => c.id === id);
      
      if (classIndex === -1) {
        throw new Error('Class not found');
      }
      
      const updatedClass = {
        ...classes[classIndex],
        ...classData,
        updated_at: new Date().toISOString()
      };
      
      classes[classIndex] = updatedClass;
      setMockClasses(classes);
      
      console.log(`✅ Class updated successfully:`, updatedClass);
      
      return {
        class: updatedClass,
        message: 'Class updated successfully'
      };
    },

    delete: async (id: number) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user || user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      const classes = getMockClasses();
      const classIndex = classes.findIndex(c => c.id === id);
      
      if (classIndex === -1) {
        throw new Error('Class not found');
      }
      
      // Check if there are active bookings for this class
      const bookings = getMockBookings();
      const hasActiveBookings = bookings.some(b => 
        b.class_id === id && 
        b.status === 'confirmed' && 
        new Date(b.booking_date) > new Date()
      );
      
      if (hasActiveBookings) {
        throw new Error('Cannot delete class with active future bookings');
      }
      
      classes.splice(classIndex, 1);
      setMockClasses(classes);
      
      console.log(`✅ Class deleted successfully`);
      
      return {
        message: 'Class deleted successfully'
      };
    },

    getBookings: async (id: number, date: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const bookings = getMockBookings();
      const classBookings = bookings.filter(
        b => b.class_id === id && b.booking_date === date && b.status === 'confirmed'
      );
      return { bookings: classBookings };
    }
  },

  bookings: {
    getMyBookings: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const bookings = getMockBookings();
      const userBookings = bookings.filter(b => b.user_id === user.id);
      
      return { bookings: userBookings };
    },

    getAll: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const bookings = getMockBookings();
      return { bookings };
    },

    create: async (classId: number, bookingDate: string) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user) {
        throw new Error('Unauthorized');
      }

      console.log(`🎯 Creating booking for user ${user.id}, class ${classId}, date ${bookingDate}`);
      console.log(`User current concessions: ${user.concessions}`);
      
      // Allow negative concessions up to -5
      if (user.concessions <= -5) {
        throw new Error('You have reached the maximum credit limit. Please make a payment to continue booking classes.');
      }
      
      // Check if class is available for booking
      const classes = getMockClasses();
      const gymClass = classes.find(c => c.id === classId);
      if (!gymClass || !isClassAvailableForBooking(gymClass)) {
        throw new Error('This class is not currently available for booking');
      }
      
      // Check if already booked
      const bookings = getMockBookings();
      const existingBooking = bookings.find(
        b => b.user_id === user.id && 
             b.class_id === classId && 
             b.booking_date === bookingDate && 
             b.status === 'confirmed'
      );
      
      if (existingBooking) {
        throw new Error('You have already booked this class');
      }
      
      // Create new booking
      const newBooking: Booking = {
        id: Date.now(),
        user_id: user.id,
        class_id: classId,
        booking_date: bookingDate,
        status: 'confirmed',
        used_concession: true,
        booking_time: new Date().toISOString(),
        is_late_cancellation: false
      };
      
      // Add booking to storage
      bookings.push(newBooking);
      setMockBookings(bookings);
      
      // Reduce user concessions (can go negative)
      updateUserConcessions(user.id, user.concessions - 1);
      
      const isNegative = user.concessions - 1 < 0;
      console.log(`✅ Booking created successfully! New concession count: ${user.concessions - 1}${isNegative ? ' (using credit)' : ''}`);
      
      return {
        booking: newBooking,
        message: isNegative 
          ? 'Booking created using credit. Please make a payment soon to avoid booking restrictions.'
          : 'Booking created successfully'
      };
    },

    cancel: async (id: number) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const bookings = getMockBookings();
      const bookingIndex = bookings.findIndex(b => b.id === id && b.user_id === user.id);
      
      if (bookingIndex === -1) {
        throw new Error('Booking not found');
      }
      
      const booking = bookings[bookingIndex];
      
      // Get the class details to use the correct class time
      const classes = getMockClasses();
      const gymClass = classes.find(c => c.id === booking.class_id);
      
      if (!gymClass) {
        throw new Error('Class not found');
      }
      
      // Check if it's a late cancellation (within 24 hours of class start time)
      const now = new Date();
      const classDateTime = new Date(`${booking.booking_date}T${gymClass.time}:00`);
      const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isLateCancellation = hoursUntilClass <= 24 && hoursUntilClass > 0;
      
      console.log(`🕒 Cancellation check for booking ${id}:`);
      console.log(`   Class time: ${gymClass.time}`);
      console.log(`   Class date/time: ${classDateTime.toISOString()}`);
      console.log(`   Current time: ${now.toISOString()}`);
      console.log(`   Hours until class: ${hoursUntilClass.toFixed(2)}`);
      console.log(`   Is late cancellation: ${isLateCancellation}`);
      
      // Store the original used_concession value before modifying
      const originalUsedConcession = booking.used_concession;
      
      // Update booking status
      booking.status = isLateCancellation ? 'late-cancelled' : 'cancelled';
      booking.cancellation_time = new Date().toISOString();
      booking.is_late_cancellation = isLateCancellation;
      
      bookings[bookingIndex] = booking;
      setMockBookings(bookings);
      
      // If not late cancellation and concession was originally used, refund it
      let concessionRefunded = false;
      if (!isLateCancellation && originalUsedConcession) {
        updateUserConcessions(user.id, user.concessions + 1);
        concessionRefunded = true;
        console.log(`💰 Concession refunded for early cancellation`);
      } else if (isLateCancellation) {
        console.log(`⚠️ No refund - late cancellation penalty applied`);
      }
      
      return {
        success: true,
        isLateCancellation,
        concessionRefunded,
        message: isLateCancellation 
          ? 'Late cancellation: You have been charged a concession'
          : 'Booking cancelled successfully. Your concession has been refunded.'
      };
    },

    completeClass: async (classId: number, bookingDate: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const bookings = getMockBookings();
      const updatedBookings = bookings.map(b => {
        if (b.class_id === classId && b.booking_date === bookingDate && b.status === 'confirmed') {
          return { ...b, status: 'completed' as const };
        }
        return b;
      });
      
      setMockBookings(updatedBookings);
      
      return {
        message: 'Class marked as completed',
        updated_bookings: updatedBookings.filter(b => b.class_id === classId && b.booking_date === bookingDate).length
      };
    },

    undoCompleteClass: async (classId: number, bookingDate: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const bookings = getMockBookings();
      const updatedBookings = bookings.map(b => {
        if (b.class_id === classId && b.booking_date === bookingDate && b.status === 'completed') {
          return { ...b, status: 'confirmed' as const };
        }
        return b;
      });
      
      setMockBookings(updatedBookings);
      
      return {
        message: 'Class completion undone',
        updated_bookings: updatedBookings.filter(b => b.class_id === classId && b.booking_date === bookingDate).length
      };
    }
  },

  users: {
    getAll: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const users = getMockUsers();
      
      return {
        users: users.map(user => ({
          ...user,
          note_count: 0 // Mock note count
        }))
      };
    },

    // Alias for getAll to match expected API
    getUsers: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const users = getMockUsers();
      
      return {
        users: users.map(user => ({
          ...user,
          note_count: 0 // Mock note count
        }))
      };
    },

    getById: async (id: number) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const users = getMockUsers();
      const user = users.find(u => u.id === id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return { user };
    },

    updateConcessions: async (id: number, concessions: number) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const users = getMockUsers();
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      const currentConcessions = users[userIndex].concessions;
      const newConcessions = currentConcessions + concessions;
      
      users[userIndex].concessions = newConcessions;
      setMockUsers(users);
      
      console.log(`💰 Updated user ${id} concessions: ${currentConcessions} + ${concessions} = ${newConcessions}`);
      
      return {
        user: users[userIndex],
        message: 'Concessions updated successfully'
      };
    }
  },

  notes: {
    getAll: async (userId?: number, category?: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      let notes = getMockNotes();
      
      if (userId) {
        notes = notes.filter(n => n.user_id === userId);
      }
      
      if (category) {
        notes = notes.filter(n => n.category === category);
      }
      
      return { notes };
    },

    getUserNotes: async (userId: number, category?: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      let notes = getMockNotes().filter(n => n.user_id === userId);
      
      if (category) {
        notes = notes.filter(n => n.category === category);
      }
      
      return { notes };
    },

    create: async (userId: number, content: string, category: string) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const notes = getMockNotes();
      const newNote: Note = {
        id: Date.now(),
        user_id: userId,
        content,
        category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id
      };
      
      notes.push(newNote);
      setMockNotes(notes);
      
      return {
        note: newNote,
        message: 'Note created successfully'
      };
    },

    update: async (id: number, content: string, category: string) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const notes = getMockNotes();
      const noteIndex = notes.findIndex(n => n.id === id);
      
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      notes[noteIndex] = {
        ...notes[noteIndex],
        content,
        category,
        updated_at: new Date().toISOString()
      };
      
      setMockNotes(notes);
      
      return {
        note: notes[noteIndex],
        message: 'Note updated successfully'
      };
    },

    delete: async (id: number) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const token = safeGetItem('flexbook_token');
      const user = getUserByToken(token || '');
      
      if (!user) {
        throw new Error('Unauthorized');
      }
      
      const notes = getMockNotes();
      const noteIndex = notes.findIndex(n => n.id === id);
      
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }
      
      notes.splice(noteIndex, 1);
      setMockNotes(notes);
      
      return {
        message: 'Note deleted successfully'
      };
    }
  }
};