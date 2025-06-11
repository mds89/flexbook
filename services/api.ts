import config from '../config/environment';
import { mockApi } from './mockApi';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token management functions
export const getAuthToken = (): string | null => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('flexbook_token');
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('flexbook_token', token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('flexbook_token');
  }
};

// Determine which API to use - prioritize mock API flag
const shouldUseMockApi = config.FEATURES.USE_MOCK_API;

// Always log which API is being used
console.log(`🔗 FlexBook API Mode: ${shouldUseMockApi ? '🧪 Mock API (Development)' : '🌐 Real API (Production)'}`);

if (shouldUseMockApi) {
  console.log('📝 Using test accounts: admin@gym.com/admin123, user@gym.com/user123');
} else {
  console.log('🚀 Connecting to backend API:', config.API_BASE_URL);
}

// Request timeout configuration
const REQUEST_TIMEOUT = config.UI.LOADING_TIMEOUT;

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout - please check your connection');
    }
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
      throw new ApiError(0, 'Network error - unable to connect to server');
    }
    throw error;
  }
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(response.status, errorMessage);
  }
  
  const data = await response.json();
  return data;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Real API implementation
const realApi = {
  // Authentication
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    },

    register: async (name: string, email: string, password: string) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      return handleResponse(response);
    },

    me: async () => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
  },

  // Classes
  classes: {
    getAll: async () => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/classes`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getAllForAdmin: async () => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/classes/admin/all`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getById: async (id: number) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/classes/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    create: async (classData: any) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/classes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData),
      });
      return handleResponse(response);
    },

    update: async (id: number, classData: any) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/classes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData),
      });
      return handleResponse(response);
    },

    delete: async (id: number) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/classes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getBookings: async (id: number, date: string) => {
      const response = await fetchWithTimeout(
        `${config.API_BASE_URL}/classes/${id}/bookings?date=${date}`,
        { headers: getAuthHeaders() }
      );
      return handleResponse(response);
    },
  },

  // Bookings
  bookings: {
    getMyBookings: async () => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/bookings/my-bookings`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getAll: async () => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/bookings`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    create: async (classId: number, bookingDate: string) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ class_id: classId, booking_date: bookingDate }),
      });
      return handleResponse(response);
    },

    cancel: async (id: number) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    completeClass: async (classId: number, bookingDate: string) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/bookings/complete-class`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ class_id: classId, booking_date: bookingDate }),
      });
      return handleResponse(response);
    },

    undoCompleteClass: async (classId: number, bookingDate: string) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/bookings/undo-complete-class`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ class_id: classId, booking_date: bookingDate }),
      });
      return handleResponse(response);
    },
  },

  // Users
  users: {
    getAll: async () => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/users`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getById: async (id: number) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/users/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    updateConcessions: async (id: number, concessions: number) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/users/${id}/concessions`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ concessions }),
      });
      return handleResponse(response);
    },
  },

  // Notes
  notes: {
    getAll: async (userId?: number, category?: string) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId.toString());
      if (category) params.append('category', category);
      
      const response = await fetchWithTimeout(
        `${config.API_BASE_URL}/notes?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      return handleResponse(response);
    },

    getUserNotes: async (userId: number, category?: string) => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const response = await fetchWithTimeout(
        `${config.API_BASE_URL}/notes/user/${userId}?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      return handleResponse(response);
    },

    create: async (userId: number, content: string, category: string) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: userId, content, category }),
      });
      return handleResponse(response);
    },

    update: async (id: number, content: string, category: string) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, category }),
      });
      return handleResponse(response);
    },

    delete: async (id: number) => {
      const response = await fetchWithTimeout(`${config.API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
  },
};

// API interface
interface ApiInterface {
  auth: typeof realApi.auth;
  classes: typeof realApi.classes;
  bookings: typeof realApi.bookings;
  users: typeof realApi.users;
  notes: typeof realApi.notes;
  // Additional methods
  login: typeof realApi.auth.login;
  register: typeof realApi.auth.register;
  getCurrentUser: typeof realApi.auth.me;
  getMe: typeof realApi.auth.me;
  getClasses: typeof realApi.classes.getAll;
  getClassesForAdmin: typeof realApi.classes.getAllForAdmin;
  getClassById: typeof realApi.classes.getById;
  createClass: typeof realApi.classes.create;
  updateClass: typeof realApi.classes.update;
  deleteClass: typeof realApi.classes.delete;
  getClassBookings: typeof realApi.classes.getBookings;
  getMyBookings: typeof realApi.bookings.getMyBookings;
  getAllBookings: typeof realApi.bookings.getAll;
  createBooking: typeof realApi.bookings.create;
  cancelBooking: typeof realApi.bookings.cancel;
  completeClass: typeof realApi.bookings.completeClass;
  undoCompleteClass: typeof realApi.bookings.undoCompleteClass;
  getAllUsers: typeof realApi.users.getAll;
  getUsers: typeof realApi.users.getAll; // Alias for compatibility
  getUserById: typeof realApi.users.getById;
  updateUserConcessions: typeof realApi.users.updateConcessions;
  getAllNotes: typeof realApi.notes.getAll;
  getUserNotes: typeof realApi.notes.getUserNotes;
  createNote: typeof realApi.notes.create;
  updateNote: typeof realApi.notes.update;
  deleteNote: typeof realApi.notes.delete;
}

// Create the API object with proper selection
const createApi = (): ApiInterface => {
  // Use mock API when flag is set
  const baseApi = shouldUseMockApi ? mockApi : realApi;
  
  return {
    ...baseApi,
    // Convenience methods
    login: baseApi.auth.login,
    register: baseApi.auth.register,
    getCurrentUser: baseApi.auth.me,
    getMe: baseApi.auth.me,
    getClasses: baseApi.classes.getAll,
    getClassesForAdmin: baseApi.classes.getAllForAdmin,
    getClassById: baseApi.classes.getById,
    createClass: baseApi.classes.create,
    updateClass: baseApi.classes.update,
    deleteClass: baseApi.classes.delete,
    getClassBookings: baseApi.classes.getBookings,
    getMyBookings: baseApi.bookings.getMyBookings,
    getAllBookings: baseApi.bookings.getAll,
    createBooking: baseApi.bookings.create,
    cancelBooking: baseApi.bookings.cancel,
    completeClass: baseApi.bookings.completeClass,
    undoCompleteClass: baseApi.bookings.undoCompleteClass,
    getAllUsers: baseApi.users.getAll,
    getUsers: baseApi.users.getAll, // Alias for compatibility
    getUserById: baseApi.users.getById,
    updateUserConcessions: baseApi.users.updateConcessions,
    getAllNotes: baseApi.notes.getAll,
    getUserNotes: baseApi.notes.getUserNotes,
    createNote: baseApi.notes.create,
    updateNote: baseApi.notes.update,
    deleteNote: baseApi.notes.delete,
  };
};

export const api = createApi();

// Health check function for production monitoring
export const healthCheck = async (): Promise<boolean> => {
  if (shouldUseMockApi) {
    return true; // Mock API is always "healthy"
  }
  
  try {
    const response = await fetchWithTimeout(`${config.API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Export configuration for external use
export { config };