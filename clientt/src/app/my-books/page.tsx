'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import QRScannerComponent from '@/components/books/QRScanner';
import Button from '@/components/ui/Button';
import { Transaction, Book } from '@/types';
import { transactionsAPI, booksAPI } from '@/lib/api';
import { 
  BookOpenIcon, 
  QrCodeIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface BorrowedBook {
  _id: string;
  book: Book;
  borrowDate: string;
  dueDate: string;
  status: string;
  daysOverdue: number;
  fine: number;
}

const MyBooksPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch borrowed books
  const fetchBorrowedBooks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getMyBooks();
      setBorrowedBooks(response.data.borrowedBooks || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to fetch borrowed books'
        : 'Failed to fetch borrowed books';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle book return
  const handleReturn = useCallback(async (bookId: string) => {
    try {
      setReturnLoading(bookId);
      await transactionsAPI.returnBook(bookId);
      
      // Refresh borrowed books
      fetchBorrowedBooks();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to return book'
        : 'Failed to return book';
      alert(errorMessage);
    } finally {
      setReturnLoading(null);
    }
  }, [fetchBorrowedBooks]);

  // Handle QR scan
  const handleQRScan = useCallback(async (qrCode: string) => {
    try {
      setShowQRScanner(false);
      
      // First, get book info from QR code
      const bookResponse = await booksAPI.scanQR(qrCode);
      const book = bookResponse.data.book;
      
      if (!book) {
        alert('Invalid QR code');
        return;
      }

      // Check if user has this book borrowed
      const borrowedBook = borrowedBooks.find(b => b.book._id === book._id);
      
      if (borrowedBook) {
        // Return the book
        await handleReturn(book._id);
        alert(`Successfully returned "${book.title}"`);
      } else {
        alert(`You don't have "${book.title}" borrowed`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to process QR code'
        : 'Failed to process QR code';
      alert(errorMessage);
    }
  }, [borrowedBooks, handleReturn]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBorrowedBooks();
    }
  }, [isAuthenticated, fetchBorrowedBooks]);

  if (!isAuthenticated) {
    return <Layout><div className="text-center">Redirecting...</div></Layout>;
  }

  // Calculate statistics
  const totalBorrowed = borrowedBooks.length;
  const overdueBooks = borrowedBooks.filter(book => book.daysOverdue > 0).length;
  const totalFines = borrowedBooks.reduce((sum, book) => sum + book.fine, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Books
            </h2>
            <p className="text-sm text-gray-500">
              Manage your borrowed books and reading history
            </p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
            <Button
              variant="secondary"
              onClick={() => setShowQRScanner(true)}
              className="inline-flex items-center"
            >
              <QrCodeIcon className="h-4 w-4 mr-2" />
              Scan to Return
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/books')}
              className="inline-flex items-center"
            >
              <BookOpenIcon className="h-4 w-4 mr-2" />
              Browse Books
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Books Borrowed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{totalBorrowed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue Books
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{overdueBooks}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Fines
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${totalFines.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Borrowed Books */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Currently Borrowed ({totalBorrowed})
            </h3>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : borrowedBooks.length > 0 ? (
              <div className="space-y-6">
                {borrowedBooks.map((borrowedBook) => (
                  <div key={borrowedBook._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Book Cover */}
                        <div className="flex-shrink-0">
                          {borrowedBook.book.coverImage ? (
                            <img
                              src={borrowedBook.book.coverImage}
                              alt={borrowedBook.book.title}
                              className="h-20 w-16 object-cover rounded"
                            />
                          ) : (
                            <div className="h-20 w-16 bg-gray-200 rounded flex items-center justify-center">
                              <BookOpenIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-medium text-gray-900">
                            {borrowedBook.book.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            by {borrowedBook.book.author}
                          </p>
                          <p className="text-sm text-gray-500">
                            Subject: {borrowedBook.book.subject}
                          </p>

                          {/* Due Date */}
                          <div className="mt-2 flex items-center space-x-4 text-sm">
                            <span className="text-gray-600">
                              Due: {new Date(borrowedBook.dueDate).toLocaleDateString()}
                            </span>
                            
                            {borrowedBook.daysOverdue > 0 && (
                              <span className="text-red-600 font-medium">
                                {borrowedBook.daysOverdue} days overdue
                              </span>
                            )}
                            
                            {borrowedBook.fine > 0 && (
                              <span className="text-red-600 font-medium">
                                Fine: ${borrowedBook.fine.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 lg:mt-0 lg:ml-4">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReturn(borrowedBook.book._id)}
                          isLoading={returnLoading === borrowedBook.book._id}
                        >
                          Return Book
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No borrowed books</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven&apos;t borrowed any books yet. Start exploring our collection!
                </p>
                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => router.push('/books')}
                  >
                    Browse Books
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerComponent
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
    </Layout>
  );
};

export default MyBooksPage;
