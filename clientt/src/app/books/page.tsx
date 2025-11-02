'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import SearchBar from '@/components/books/SearchBar';
import BookCard from '@/components/books/BookCard';
import QRScannerComponent from '@/components/books/QRScanner';
import Button from '@/components/ui/Button';
import { booksAPI, transactionsAPI } from '@/lib/api';
import { BookOpenIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface BooksPageBook {
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
  books: BooksPageBook[];
  currentPage: number;
  totalPages: number;
  totalBooks: number;
  subjects: string[];
}

const BooksPageContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [books, setBooks] = useState<BooksPageBook[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch books
  const fetchBooks = useCallback(async (page = 1, search = '', filterOptions = filters) => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks({
        page,
        limit: 12,
        search,
        subject: filterOptions.subject,
        sortBy: filterOptions.sortBy,
        sortOrder: filterOptions.sortOrder
      });
      
      const data: BooksResponse = response.data;
      setBooks(data.books || []);
      setTotalPages(data.totalPages || 1);
      setTotalBooks(data.totalBooks || 0);
      setCurrentPage(data.currentPage || 1);
      setSubjects(data.subjects || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to fetch books'
        : 'Failed to fetch books';
      console.error('Failed to fetch books:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchBooks(1, query, filters);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: { subject?: string; sortBy?: string; sortOrder?: string }) => {
    const updatedFilters = {
      subject: newFilters.subject || '',
      sortBy: newFilters.sortBy || 'createdAt',
      sortOrder: newFilters.sortOrder || 'desc'
    };
    setFilters(updatedFilters);
    setCurrentPage(1);
    fetchBooks(1, searchQuery, updatedFilters);
  };

  // Handle book borrowing
  const handleBorrow = async (bookId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setBorrowLoading(bookId);
      await transactionsAPI.borrowBook(bookId);
      
      // Refresh books to update availability
      fetchBooks(currentPage, searchQuery, filters);
      alert('Book borrowed successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to borrow book'
        : 'Failed to borrow book';
      alert(errorMessage);
    } finally {
      setBorrowLoading(null);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchBooks(page, searchQuery, filters);
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
      
      // Refresh books to update availability
      fetchBooks(currentPage, searchQuery, filters);
      
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

  // Initialize from URL parameters
  useEffect(() => {
    const initialFilters = {
      subject: searchParams?.get('subject') || '',
      sortBy: searchParams?.get('sortBy') || 'createdAt',
      sortOrder: searchParams?.get('sortOrder') || 'desc',
    };
    const initialSearch = searchParams?.get('search') || '';
    const initialPage = parseInt(searchParams?.get('page') || '1');

    setFilters(initialFilters);
    setSearchQuery(initialSearch);
    setCurrentPage(initialPage);

    fetchBooks(initialPage, initialSearch, initialFilters);
  }, [searchParams]);

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const numbers = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  const paginationNumbers = getPaginationNumbers();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1"></div>
                <div className="flex-1 text-center">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Library Collection
                  </h1>
                  <p className="text-lg text-gray-600">
                    Discover and borrow from our extensive collection of books
                  </p>
                </div>
                <div className="flex-1 flex justify-end">
                  {isAuthenticated && user?.role === 'patron' && (
                    <Button
                      variant="primary"
                      onClick={() => setShowQRScanner(true)}
                      className="inline-flex items-center"
                    >
                      <QrCodeIcon className="h-5 w-5 mr-2" />
                      Scan to Borrow
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <SearchBar 
                  onSearch={handleSearch} 
                  onFilterChange={handleFilterChange}
                  subjects={subjects}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  value={filters.subject}
                  onChange={(e) => handleFilterChange({ ...filters, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Date Added</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="publishedYear">Year Published</option>
                  <option value="borrowCount">Popularity</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange({ ...filters, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {searchQuery ? (
                <>
                  Showing {books.length} of {totalBooks} results for &quot;{searchQuery}&quot;
                  {filters.subject && ` in ${filters.subject}`}
                </>
              ) : (
                <>
                  Showing {books.length} of {totalBooks} books
                  {filters.subject && ` in ${filters.subject}`}
                </>
              )}
            </p>
          </div>

          {/* Books Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {books.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onBorrow={() => handleBorrow(book._id)}
                  isLoading={borrowLoading === book._id}
                  showActions={isAuthenticated}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No books found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              
              {paginationNumbers.map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  variant={page === currentPage ? "primary" : "secondary"}
                  size="sm"
                >
                  {page}
                </Button>
              ))}
              
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
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

const BooksPage: React.FC = () => {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    }>
      <BooksPageContent />
    </Suspense>
  );
};

export default BooksPage;