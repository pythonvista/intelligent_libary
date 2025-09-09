'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { transactionsAPI } from '@/lib/api';
import { 
  ClockIcon, 
  BookOpenIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  book: {
    _id: string;
    title: string;
    author: string;
    isbn?: string;
  };
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue' | 'lost';
  renewalCount: number;
  fineAmount: number;
  daysOverdue?: number;
  fine?: number;
}

const ManageTransactionsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

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

  // Fetch transactions
  const fetchTransactions = async (page = 1, status = '') => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAllTransactions({
        page,
        limit: 15,
        status: status,
      });
      
      setTransactions(response.data.transactions || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalTransactions(response.data.totalTransactions || 0);
      setCurrentPage(response.data.currentPage || 1);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchTransactions(1, status);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTransactions(page, statusFilter);
  };

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'lost':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ClockIcon className="w-3 h-3 mr-1" />;
      case 'returned':
        return <CheckCircleIcon className="w-3 h-3 mr-1" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="w-3 h-3 mr-1" />;
      case 'lost':
        return <XCircleIcon className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (user?.role === 'staff' || user?.role === 'admin') {
      fetchTransactions();
    }
  }, [user]);

  if (!isAuthenticated || (user?.role !== 'staff' && user?.role !== 'admin')) {
    return <Layout><div className="text-center">Unauthorized</div></Layout>;
  }

  // Calculate stats
  const activeTransactions = transactions.filter(t => t.status === 'active').length;
  const overdueTransactions = transactions.filter(t => t.status === 'overdue').length;
  const totalFines = transactions.reduce((sum, t) => sum + (t.fine || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Transactions</h1>
            <p className="text-gray-600">View and manage all book borrowing transactions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <BookOpenIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalTransactions}</div>
            <div className="text-sm text-gray-500">Total Transactions</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <ClockIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{activeTransactions}</div>
            <div className="text-sm text-gray-500">Active Borrowings</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{overdueTransactions}</div>
            <div className="text-sm text-gray-500">Overdue Books</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">${totalFines.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Total Fines</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === '' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleStatusFilter('')}
            >
              All Transactions
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'overdue' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleStatusFilter('overdue')}
            >
              Overdue
            </Button>
            <Button
              variant={statusFilter === 'returned' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleStatusFilter('returned')}
            >
              Returned
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fine
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                    </tr>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {transaction.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.user?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <Link 
                              href={`/books/${transaction.book?._id}`}
                              className="hover:text-blue-600"
                            >
                              {transaction.book?.title}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            by {transaction.book?.author}
                          </div>
                          {transaction.book?.isbn && (
                            <div className="text-xs text-gray-400">
                              ISBN: {transaction.book.isbn}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            Borrowed: {new Date(transaction.borrowDate).toLocaleDateString()}
                          </div>
                          <div className={`text-sm ${
                            new Date(transaction.dueDate) < new Date() && transaction.status === 'active'
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}>
                            Due: {new Date(transaction.dueDate).toLocaleDateString()}
                          </div>
                          {transaction.returnDate && (
                            <div className="text-sm text-green-600">
                              Returned: {new Date(transaction.returnDate).toLocaleDateString()}
                            </div>
                          )}
                          {transaction.renewalCount > 0 && (
                            <div className="text-xs text-blue-600">
                              Renewed {transaction.renewalCount} time(s)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusStyle(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </span>
                        {transaction.daysOverdue > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {transaction.daysOverdue} days overdue
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.fine > 0 ? (
                          <span className="text-red-600 font-medium">
                            ${transaction.fine.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">$0.00</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {statusFilter ? `No ${statusFilter} transactions found.` : 'No transactions have been recorded yet.'}
                      </p>
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

export default ManageTransactionsPage;
