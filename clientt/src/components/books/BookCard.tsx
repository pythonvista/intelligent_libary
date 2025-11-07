'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BookOpenIcon, 
  UserIcon, 
  CalendarIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import BorrowWithQRModal from './BorrowWithQRModal';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

interface Book {
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

interface BookCardProps {
  book: Book;
  onBorrow?: (bookId: string) => void;
  onReturn?: (bookId: string) => void;
  showActions?: boolean;
  isLoading?: boolean;
  borrowed?: boolean;
  onBorrowSuccess?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  onBorrow,
  onReturn,
  showActions = true,
  isLoading = false,
  borrowed = false,
  onBorrowSuccess,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  const handleBorrow = () => {
    // For students, show QR modal. For staff/admin, use old direct borrow
    if (user?.role === 'patron') {
      setShowBorrowModal(true);
    } else if (onBorrow) {
      onBorrow(book._id);
    }
  };

  const handleBorrowSuccess = () => {
    setShowBorrowModal(false);
    if (onBorrowSuccess) {
      onBorrowSuccess();
    }
  };

  const handleReturn = () => {
    if (onReturn) {
      onReturn(book._id);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-gray-300" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Book Cover */}
      <Link href={`/books/${book._id}`} className="block">
        <div className="relative h-48 bg-gray-100 group">
          {book.coverImage ? (
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full group-hover:bg-gray-200 transition-colors">
              <BookOpenIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Availability Badge */}
          <div className="absolute top-2 right-2">
            {book.isAvailable ? (
              <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <CheckCircleIcon className="h-3 w-3" />
                <span>Available</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                <XCircleIcon className="h-3 w-3" />
                <span>Checked Out</span>
              </div>
            )}
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
              View Details
            </span>
          </div>
        </div>
      </Link>

      {/* Book Details */}
      <div className="p-4">
        <div className="flex flex-col space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            <Link 
              href={`/books/${book._id}`}
              className="hover:text-blue-600 transition-colors"
            >
              {book.title}
            </Link>
          </h3>

          {/* Author */}
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <UserIcon className="h-4 w-4" />
            <span>{book.author}</span>
          </div>

          {/* Subject */}
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {book.subject}
            </span>
          </div>

          {/* Rating */}
          {book.rating && book.rating.count > 0 && (
            <div className="flex items-center space-x-2">
              {renderStars(book.rating.average)}
              <span className="text-sm text-gray-500">
                ({book.rating.count} review{book.rating.count !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {book.publishedYear && (
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-3 w-3" />
                <span>{book.publishedYear}</span>
              </div>
            )}
            <span>{book.availableCopies}/{book.totalCopies} available</span>
          </div>

          {/* Description */}
          {book.description && (
            <p className="text-sm text-gray-600 overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {book.description}
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions && isAuthenticated && (
          <div className="mt-4 flex space-x-2">
            {borrowed ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleReturn}
                isLoading={isLoading}
                className="flex-1"
              >
                Return Book
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleBorrow}
                disabled={!book.isAvailable || isLoading}
                isLoading={isLoading}
                className="flex-1"
              >
                {book.isAvailable ? 'Borrow' : 'Unavailable'}
              </Button>
            )}
            
            <Link href={`/books/${book._id}`} className="flex-1">
              <Button variant="ghost" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
          </div>
        )}

        {!isAuthenticated && showActions && (
          <div className="mt-4">
            <Link href="/login">
              <Button variant="primary" size="sm" className="w-full">
                Sign in to Borrow
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Borrow with QR Modal */}
      {isAuthenticated && user?.role === 'patron' && (
        <BorrowWithQRModal
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          bookId={book._id}
          bookTitle={book.title}
          onSuccess={handleBorrowSuccess}
        />
      )}
    </div>
  );
};

export default BookCard;
