'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import BookCard from '@/components/books/BookCard';
import QRCodeDisplay from '@/components/books/QRCodeDisplay';
import Button from '@/components/ui/Button';
import { booksAPI, transactionsAPI } from '@/lib/api';
import { 
  BookOpenIcon, 
  UserIcon, 
  CalendarIcon,
  TagIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
  HeartIcon,
  ShareIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  subject: string;
  description?: string;
  publisher?: string;
  publishedYear?: number;
  pages?: number;
  language?: string;
  coverImage?: string;
  isAvailable: boolean;
  availableCopies: number;
  totalCopies: number;
  location?: {
    shelf?: string;
    section?: string;
    floor?: string;
  };
  tags?: string[];
  rating?: {
    average: number;
    count: number;
  };
  borrowCount?: number;
}

interface BookDetailsResponse {
  book: Book;
  relatedBooks: Book[];
}

const BookDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch book details
  const fetchBookDetails = async () => {
    if (!params.id) return;
    
    try {
      setLoading(true);
      const response = await booksAPI.getBook(params.id as string);
      const data: BookDetailsResponse = response.data;
      setBook(data.book);
      setRelatedBooks(data.relatedBooks || []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch book details');
    } finally {
      setLoading(false);
    }
  };

  // Handle book borrowing
  const handleBorrow = async () => {
    if (!book || !isAuthenticated) return;
    
    try {
      setBorrowLoading(true);
      await transactionsAPI.borrowBook(book._id);
      
      // Refresh book details to update availability
      await fetchBookDetails();
      
      // Show success message
      alert(`Successfully borrowed "${book.title}"`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to borrow book');
    } finally {
      setBorrowLoading(false);
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement actual favorite functionality with API
  };

  // Handle sharing
  const handleShare = async () => {
    if (navigator.share && book) {
      try {
        await navigator.share({
          title: book.title,
          text: `Check out "${book.title}" by ${book.author}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIconSolid className="h-5 w-5 text-yellow-400" />
            ) : (
              <StarIcon className="h-5 w-5 text-gray-300" />
            )}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchBookDetails();
  }, [params.id]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !book) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Book not found</h3>
          <p className="text-gray-500 mb-6">{error || 'The book you are looking for does not exist.'}</p>
          <Button variant="primary" onClick={() => router.push('/books')}>
            Browse Books
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Books
        </button>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Book cover and actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              {/* Book cover */}
              <div className="relative mb-6">
                {book.coverImage ? (
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    width={400}
                    height={600}
                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                    <BookOpenIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Availability badge */}
                <div className="absolute top-4 right-4">
                  {book.isAvailable ? (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Available</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      <XCircleIcon className="h-4 w-4" />
                      <span>Checked Out</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                {isAuthenticated ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleBorrow}
                    disabled={!book.isAvailable || borrowLoading}
                    isLoading={borrowLoading}
                    className="w-full"
                  >
                    {book.isAvailable ? 'Borrow Book' : 'Currently Unavailable'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Sign in to Borrow
                  </Button>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    onClick={handleFavoriteToggle}
                    className="flex-1 flex items-center justify-center"
                  >
                    {isFavorite ? (
                      <HeartIconSolid className="h-5 w-5 text-red-500 mr-2" />
                    ) : (
                      <HeartIcon className="h-5 w-5 mr-2" />
                    )}
                    {isFavorite ? 'Favorited' : 'Add to Favorites'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={handleShare}
                    className="flex items-center justify-center px-4"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </Button>
                </div>

                {/* QR Code for staff */}
                {(user?.role === 'staff' || user?.role === 'admin') && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="w-full"
                  >
                    {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                  </Button>
                )}
              </div>

              {/* QR Code display */}
              {showQRCode && (user?.role === 'staff' || user?.role === 'admin') && (
                <div className="mt-6">
                  <QRCodeDisplay bookId={book._id} bookTitle={book.title} />
                </div>
              )}
            </div>
          </div>

          {/* Book details */}
          <div className="lg:col-span-2">
            {/* Title and author */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <div className="flex items-center text-lg text-gray-600 mb-4">
                <UserIcon className="h-5 w-5 mr-2" />
                <span>by {book.author}</span>
              </div>

              {/* Rating */}
              {book.rating && book.rating.count > 0 && (
                <div className="flex items-center space-x-3 mb-4">
                  {renderStars(book.rating.average)}
                  <span className="text-sm text-gray-500">
                    {book.rating.average.toFixed(1)} ({book.rating.count} review{book.rating.count !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              {/* Subject tag */}
              <div className="flex items-center space-x-2 mb-4">
                <TagIcon className="h-4 w-4 text-gray-400" />
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {book.subject}
                </span>
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* Book details grid */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Book Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {book.isbn && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">ISBN:</span>
                    <span className="text-gray-900">{book.isbn}</span>
                  </div>
                )}
                
                {book.publisher && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Publisher:</span>
                    <span className="text-gray-900">{book.publisher}</span>
                  </div>
                )}
                
                {book.publishedYear && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Published:</span>
                    <span className="text-gray-900">{book.publishedYear}</span>
                  </div>
                )}
                
                {book.pages && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Pages:</span>
                    <span className="text-gray-900">{book.pages}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500">Language:</span>
                  <span className="text-gray-900">{book.language || 'English'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500">Available Copies:</span>
                  <span className="text-gray-900">{book.availableCopies} of {book.totalCopies}</span>
                </div>

                {book.borrowCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Times Borrowed:</span>
                    <span className="text-gray-900">{book.borrowCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {book.location && (book.location.shelf || book.location.section || book.location.floor) && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Location</h2>
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  <span>
                    {[book.location.floor && `Floor ${book.location.floor}`, 
                      book.location.section && `Section ${book.location.section}`, 
                      book.location.shelf && `Shelf ${book.location.shelf}`]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            {book.tags && book.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related books */}
        {relatedBooks.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More books in {book.subject}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook) => (
                <BookCard
                  key={relatedBook._id}
                  book={relatedBook}
                  showActions={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookDetailPage;
