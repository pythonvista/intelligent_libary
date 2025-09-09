'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import QRCodeDisplay from '@/components/books/QRCodeDisplay';
import Button from '@/components/ui/Button';
import { booksAPI } from '@/lib/api';
import { ArrowLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface BookQRData {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  subject: string;
}

const BookQRPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [book, setBook] = useState<BookQRData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authorization
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'staff' && user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch book data
  const fetchBook = useCallback(async () => {
    if (!params.id) return;
    
    try {
      setLoading(true);
      const response = await booksAPI.getBook(params.id as string);
      setBook(response.data.book);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to fetch book details'
        : 'Failed to fetch book details';
      alert(errorMessage);
      router.push('/admin/books');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (user?.role === 'staff' || user?.role === 'admin') {
      fetchBook();
    }
  }, [params.id, user, fetchBook]);

  if (!isAuthenticated || (user?.role !== 'staff' && user?.role !== 'admin')) {
    return <Layout><div className="text-center">Unauthorized</div></Layout>;
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Book not found</h3>
          <p className="text-gray-500 mb-6">The book you are looking for does not exist.</p>
          <Button variant="primary" onClick={() => router.push('/admin/books')}>
            Back to Books
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Code</h1>
            <p className="text-gray-600">Generate and print QR code for this book</p>
          </div>
        </div>

        {/* Book Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BookOpenIcon className="h-5 w-5 mr-2" />
            Book Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Title</div>
              <div className="text-gray-900">{book.title}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Author</div>
              <div className="text-gray-900">{book.author}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Subject</div>
              <div className="text-gray-900">{book.subject}</div>
            </div>
            {book.isbn && (
              <div>
                <div className="text-sm font-medium text-gray-500">ISBN</div>
                <div className="text-gray-900">{book.isbn}</div>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Display */}
        <QRCodeDisplay 
          bookId={book._id} 
          bookTitle={book.title}
        />

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">QR Code Usage Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Print the QR code and attach it to the physical book</li>
            <li>• Users can scan the QR code to quickly view book information</li>
            <li>• Staff can use QR codes for quick book returns</li>
            <li>• QR codes help with inventory management and book tracking</li>
            <li>• Each QR code is unique and linked to this specific book</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/books')}
          >
            Back to Books
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push(`/admin/books/${book._id}/edit`)}
          >
            Edit Book
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default BookQRPage;
