'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import SearchBar from '@/components/books/SearchBar';
import BookCard from '@/components/books/BookCard';
import QRScannerComponent from '@/components/books/QRScanner';
import Button from '@/components/ui/Button';
import { booksAPI, transactionsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  BookOpenIcon, 
  SparklesIcon, 
  QrCodeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface HomePageBook {
  _id: string;
  title: string;
  author: string;
  subject: string;
  description?: string;
  coverImage?: string;
  isAvailable: boolean;
  availableCopies: number;
  totalCopies: number;
  rating?: {
    average: number;
    count: number;
  };
  publishedYear?: number;
  borrowCount?: number;
}

interface BooksResponse {
  books: HomePageBook[];
  currentPage: number;
  totalPages: number;
  totalBooks: number;
  subjects: string[];
}

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [books, setBooks] = useState<HomePageBook[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<HomePageBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [filters, setFilters] = useState<{
    subject?: string;
    sortBy?: string;
    sortOrder?: string;
  }>({});

  // Fetch books
  const fetchBooks = async (page = 1, search = '', filterOptions = {}) => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks({
        page,
        limit: 12,
        search,
        ...filterOptions,
      });
      
      const data: BooksResponse = response.data;
      setBooks(data.books);
      setSubjects(data.subjects);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await booksAPI.getRecommendations(user._id);
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  }, [isAuthenticated, user]);

  // Handle book borrowing
  const handleBorrow = async (bookId: string) => {
    if (!isAuthenticated) return;
    
    try {
      setBorrowLoading(bookId);
      await transactionsAPI.borrowBook(bookId);
      
      // Refresh books and recommendations
      fetchBooks(currentPage, searchQuery, filters);
      fetchRecommendations();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to borrow book'
        : 'Failed to borrow book';
      alert(errorMessage);
    } finally {
      setBorrowLoading(null);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchBooks(1, query, filters);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchBooks(1, searchQuery, newFilters);
  };

  // Load more books
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchBooks(currentPage + 1, searchQuery, filters);
    }
  };

  // Handle QR scan for borrowing
  const handleQRScan = async (qrCode: string) => {
    setShowQRScanner(false);
    
    if (!qrCode.startsWith('BOOK_')) {
      alert('Invalid QR code. Please scan a book QR code.');
      return;
    }

    try {
      setBorrowLoading('qr-scan');
      const response = await transactionsAPI.borrowBookQR(qrCode);
      
      // Refresh books and recommendations
      fetchBooks(currentPage, searchQuery, filters);
      fetchRecommendations();
      
      alert(`✅ ${response.data.message}\n\nBook: ${response.data.book?.title}\nDue Date: ${new Date(response.data.transaction?.dueDate).toLocaleDateString()}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to borrow book via QR'
        : 'Failed to borrow book via QR';
      alert(`❌ ${errorMessage}`);
    } finally {
      setBorrowLoading(null);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations();
    }
  }, [isAuthenticated, user, fetchRecommendations]);

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg text-white p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to LibraryAI
            </h1>
            <p className="text-xl mb-6 text-blue-100">
              Discover your next favorite book with our intelligent recommendation system
              and modern digital library experience.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-5 w-5" />
                <span>AI Recommendations</span>
              </div>
              <div className="flex items-center space-x-2">
                <QrCodeIcon className="h-5 w-5" />
                <span>QR Code Scanning</span>
              </div>
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5" />
                <span>Smart Analytics</span>
              </div>
            </div>
          </div>
          
          {/* Quick Action: Scan to Borrow */}
          {isAuthenticated && user?.role === 'patron' && (
            <div className="hidden lg:block">
              <Button
                onClick={() => setShowQRScanner(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
              >
                <QrCodeIcon className="h-6 w-6 mr-3 inline-block" />
                Scan to Borrow
              </Button>
            </div>
          )}
        </div>
        
        {/* Mobile Quick Action */}
        {isAuthenticated && user?.role === 'patron' && (
          <div className="lg:hidden mt-6">
            <Button
              onClick={() => setShowQRScanner(true)}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 text-base font-semibold"
            >
              <QrCodeIcon className="h-5 w-5 mr-2 inline-block" />
              Scan to Borrow Book
            </Button>
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      {isAuthenticated && recommendations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.slice(0, 4).map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onBorrow={handleBorrow}
                isLoading={borrowLoading === book._id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          subjects={subjects}
        />
      </div>

      {/* Books Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Browse Books</h2>
          {!isAuthenticated && (
            <div className="text-sm text-gray-600">
              <a href="/login" className="text-blue-600 hover:text-blue-800">
                Sign in
              </a> to borrow books
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onBorrow={handleBorrow}
                  isLoading={borrowLoading === book._id}
                />
              ))}
            </div>

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="text-center mt-8">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  isLoading={loading}
                >
                  Load More Books
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms.' : 'Books will appear here when they are added to the library.'}
            </p>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {isAuthenticated && user?.role === 'patron' && (
        <QRScannerComponent
          isOpen={showQRScanner}
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </Layout>
  );
};

export default HomePage;