import axios from 'axios';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    address?: string;
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (userData: any) => api.put('/auth/profile', userData),
  
  changePassword: (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => api.post('/auth/change-password', passwords),
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
  
  createBook: (bookData: any) => api.post('/books', bookData),
  
  updateBook: (id: string, bookData: any) => api.put(`/books/${id}`, bookData),
  
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
  
  bulkImportBooks: (books: any[]) => api.post('/admin/bulk-import', { books }),
};

export default api;
