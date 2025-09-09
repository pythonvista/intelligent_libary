'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import SearchBar from '@/components/books/SearchBar';
import BookCard from '@/components/books/BookCard';
import Button from '@/components/ui/Button';
import { booksAPI, transactionsAPI } from '@/lib/api';
import { BookOpenIcon } from '@heroicons/react/24/outline';

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

interface BooksResponse {
  books: Book[];
  currentPage: number;
  totalPages: number;
  totalBooks: number;
  subjects: string[];
}

const BooksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [filters, setFilters] = useState<{
    subject?: string;
    sortBy?: string;
    sortOrder?: string;
  }>({
    subject: searchParams?.get('subject') || '',
    sortBy: searchParams?.get('sortBy') || 'createdAt',
    sortOrder: searchParams?.get('sortOrder') || 'desc',
  });

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
      setTotalBooks(data.totalBooks);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
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
      
      // Find book title for success message
      const book = books.find(b => b._id === bookId);
      alert(`Successfully borrowed "${book?.title}"`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to borrow book');
    } finally {
      setBorrowLoading(null);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateURL({ search: query, page: '1' });
    fetchBooks(1, query, filters);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL({ ...newFilters, page: '1' });
    fetchBooks(1, searchQuery, newFilters);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page: page.toString() });
    fetchBooks(page, searchQuery, filters);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update URL parameters
  const updateURL = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.replaceState({}, '', url.toString());
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  useEffect(() => {
    // Initialize from URL parameters
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
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Books</h1>
          <p className="text-gray-600">
            Discover and borrow from our collection of {totalBooks.toLocaleString()} books
          </p>
        </div>

        {/* Search and filters */}
        <SearchBar
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          subjects={subjects}
          placeholder="Search by title, author, or subject..."
        />

        {/* Results summary */}
        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchQuery ? (
                <>
                  Showing {books.length} of {totalBooks} results for "{searchQuery}"
                  {filters.subject && ` in ${filters.subject}`}
                </>
              ) : (
                <>
                  Showing {books.length} of {totalBooks} books
                  {filters.subject && ` in ${filters.subject}`}
                </>
              )}
            </p>
            
            {(searchQuery || filters.subject) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ sortBy: 'createdAt', sortOrder: 'desc' });
                  setCurrentPage(1);
                  updateURL({});
                  fetchBooks(1, '', { sortBy: 'createdAt', sortOrder: 'desc' });
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Books grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
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

            {/* Pagination */}
            <Pagination />
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filters.subject
                ? 'Try adjusting your search terms or filters.'
                : 'Books will appear here when they are added to the library.'}
            </p>
            {(searchQuery || filters.subject) && (
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ sortBy: 'createdAt', sortOrder: 'desc' });
                    setCurrentPage(1);
                    updateURL({});
                    fetchBooks(1, '', { sortBy: 'createdAt', sortOrder: 'desc' });
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BooksPage;
