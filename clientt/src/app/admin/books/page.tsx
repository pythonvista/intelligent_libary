'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { booksAPI } from '@/lib/api';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  QrCodeIcon,
  MagnifyingGlassIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface AdminBook {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  subject: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear?: number;
  isAvailable: boolean;
  borrowCount?: number;
  createdAt?: string;
}

const ManageBooksPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'staff' && user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch books
  const fetchBooks = async (page = 1, searchQuery = '') => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks({
        page,
        limit: 10,
        search: searchQuery,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      setBooks(response.data.books || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalBooks(response.data.totalBooks || 0);
      setCurrentPage(response.data.currentPage || 1);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBooks(1, search);
  };

  // Handle delete book
  const handleDelete = async (bookId: string, bookTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`);
    
    if (!confirmed) return;

    try {
      setDeleteLoading(bookId);
      await booksAPI.deleteBook(bookId);
      
      // Refresh books list
      fetchBooks(currentPage, search);
      alert('Book deleted successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to delete book'
        : 'Failed to delete book';
      alert(errorMessage);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchBooks(page, search);
  };

  useEffect(() => {
    if (user?.role === 'staff' || user?.role === 'admin') {
      fetchBooks();
    }
  }, [user]);

  if (!isAuthenticated || (user?.role !== 'staff' && user?.role !== 'admin')) {
    return <Layout><div className="text-center">Unauthorized</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Books</h1>
            <p className="text-gray-600">Add, edit, and manage library books</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/admin/books/new">
              <Button variant="primary" className="flex items-center">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add New Book
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{totalBooks}</span> total books
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {books.reduce((sum, book) => sum + book.availableCopies, 0)}
                </span> available copies
              </div>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search books by title, author, or ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
            {search && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                  fetchBooks(1, '');
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        {/* Books Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Copies
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : books.length > 0 ? (
                  books.map((book) => (
                    <tr key={book._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">by {book.author}</div>
                          {book.isbn && (
                            <div className="text-xs text-gray-400">ISBN: {book.isbn}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {book.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{book.availableCopies} / {book.totalCopies}</div>
                        <div className="text-xs text-gray-500">
                          {book.borrowCount || 0} borrowed
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          book.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {book.isAvailable ? 'Available' : 'Checked Out'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link href={`/books/${book._id}`}>
                            <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </Link>
                          
                          <Link href={`/admin/books/${book._id}/edit`}>
                            <button className="text-green-600 hover:text-green-800 p-1 rounded">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </Link>
                          
                          <Link href={`/admin/books/${book._id}/qr`}>
                            <button className="text-purple-600 hover:text-purple-800 p-1 rounded">
                              <QrCodeIcon className="h-4 w-4" />
                            </button>
                          </Link>
                          
                          <button
                            onClick={() => handleDelete(book._id, book.title)}
                            disabled={deleteLoading === book._id}
                            className="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {search ? 'Try adjusting your search terms.' : 'Get started by adding a new book.'}
                      </p>
                      <div className="mt-6">
                        <Link href="/admin/books/new">
                          <Button variant="primary">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Book
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ManageBooksPage;
