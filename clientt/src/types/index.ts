// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'patron' | 'staff' | 'admin';
  borrowedBooks?: string[];
  preferences?: string[];
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Book types
export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  subject: string;
  description: string;
  publishedYear: number;
  copies: number;
  availableCopies: number;
  imageUrl?: string;
  coverImage?: string;
  qrCode?: string;
  borrowCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export interface Transaction {
  _id: string;
  user: User;
  book: Book;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  renewals: number;
  daysOverdue?: number;
  fine?: number;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form data types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
}

export interface BookFormData {
  title: string;
  author: string;
  isbn?: string;
  subject: string;
  description?: string;
  publisher?: string;
  publishedYear?: number;
  pages?: number;
  language?: string;
  totalCopies?: number;
  coverImage?: string;
  location?: {
    shelf?: string;
    section?: string;
    floor?: string;
  };
  tags?: string[];
}

export interface ProfileUpdateData {
  name?: string;
  phoneNumber?: string;
  address?: string;
  preferences?: string[];
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// Dashboard types
export interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  activeTransactions: number;
  overdueBooks: number;
  recentTransactions: Transaction[];
  popularBooks: Book[];
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}
