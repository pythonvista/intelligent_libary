import axios from 'axios';
import { 
  LoginData, 
  RegisterData, 
  BookFormData, 
  ProfileUpdateData, 
  PasswordChangeData,
  DashboardStats,
  PaginatedResponse 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        // Use a more gentle redirect approach
        const event = new CustomEvent('auth:logout');
        window.dispatchEvent(event);
        
        // Fallback to window.location if custom event doesn't work
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: RegisterData) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (userData: ProfileUpdateData) => api.put('/auth/profile', userData),
  
  changePassword: (passwords: PasswordChangeData) => api.post('/auth/change-password', passwords),

  getMyQR: () => api.get('/auth/my-qr'),

  scanUserQR: (qrCode: string) => api.get(`/auth/scan-user/${qrCode}`),
};

// Books API functions
export const booksAPI = {
  getBooks: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    subject?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/books', { params }),
  
  getBook: (id: string) => api.get(`/books/${id}`),
  
  createBook: (bookData: BookFormData) => api.post('/books', bookData),
  
  updateBook: (id: string, bookData: BookFormData) => api.put(`/books/${id}`, bookData),
  
  deleteBook: (id: string) => api.delete(`/books/${id}`),
  
  getQRCode: (id: string) => api.get(`/books/${id}/qr`),
  
  scanQR: (qrCode: string) => api.get(`/books/scan/${qrCode}`),
  
  getRecommendations: (userId: string) => api.get(`/books/recommendations/${userId}`),
};

// Transactions API functions
export const transactionsAPI = {
  borrowBook: (bookId: string) => api.post(`/transactions/borrow/${bookId}`),
  
  returnBook: (bookId: string) => api.post(`/transactions/return/${bookId}`),
  
  getMyBooks: () => api.get('/transactions/my-books'),
  
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/transactions/history', { params }),
  
  renewBook: (transactionId: string) => api.post(`/transactions/renew/${transactionId}`),
  
  getAllTransactions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => api.get('/transactions/all', { params }),
  
  getOverdueTransactions: () => api.get('/transactions/overdue'),

  borrowBookQR: (bookQrCode: string) => api.post('/transactions/borrow-qr', { bookQrCode }),

  processQR: (userQrCode: string, bookQrCode: string, action: 'borrow' | 'return') => 
    api.post('/transactions/process-qr', { userQrCode, bookQrCode, action }),
};

// Admin API functions
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => api.get('/admin/users', { params }),
  
  updateUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  
  updateUserStatus: (userId: string, isActive: boolean) =>
    api.put(`/admin/users/${userId}/status`, { isActive }),
  
  getPopularBooksReport: (params?: { period?: string; limit?: number }) =>
    api.get('/admin/reports/popular-books', { params }),
  
  getUserActivityReport: (params?: { period?: string }) =>
    api.get('/admin/reports/user-activity', { params }),
  
  bulkImportBooks: (books: BookFormData[]) => api.post('/admin/bulk-import', { books }),
};

export default api;