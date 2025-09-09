'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import DashboardStats from '@/components/admin/DashboardStats';
import Button from '@/components/ui/Button';
import { adminAPI, booksAPI, transactionsAPI } from '@/lib/api';
import { 
  PlusIcon, 
  UsersIcon, 
  BookOpenIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  overview: {
    totalBooks: number;
    totalUsers: number;
    activeTransactions: number;
    overdueTransactions: number;
    availabilityRate: string;
  };
  activity: {
    thisMonthTransactions: number;
    thisWeekTransactions: number;
  };
  popularBooks: any[];
  recentUsers: any[];
  libraryStats: any[];
}

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [overdueBooks, setOverdueBooks] = useState<any[]>([]);

  // Check if user has admin/staff access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, overdueResponse] = await Promise.all([
        adminAPI.getDashboard(),
        transactionsAPI.getOverdueTransactions(),
      ]);
      
      setDashboardData(dashboardResponse.data);
      setOverdueBooks(overdueResponse.data.overdueTransactions || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      fetchDashboardData();
    }
  }, [user]);

  // Show loading or redirect if not authorized
  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return <Layout><div className="text-center">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Admin Dashboard
            </h2>
            <p className="text-sm text-gray-500">
              Welcome back, {user?.name}! Here's what's happening in your library.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              variant="primary"
              onClick={() => router.push('/admin/books/new')}
              className="inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        {dashboardData && (
          <DashboardStats data={dashboardData} loading={loading} />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Popular Books
              </h3>
              {dashboardData?.popularBooks && dashboardData.popularBooks.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.popularBooks.slice(0, 5).map((book, index) => (
                    <div key={book._id || index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{book.title}</p>
                        <p className="text-xs text-gray-500">by {book.author}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {book.borrowCount} borrows
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No popular books data available.</p>
              )}
            </div>
          </div>

          {/* Overdue Books */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Overdue Books
                </h3>
                {overdueBooks.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {overdueBooks.length} overdue
                  </span>
                )}
              </div>
              
              {overdueBooks.length > 0 ? (
                <div className="space-y-3">
                  {overdueBooks.slice(0, 5).map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.book?.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Borrowed by {transaction.user?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-600 font-medium">
                          {transaction.daysOverdue} days overdue
                        </p>
                        {transaction.fine > 0 && (
                          <p className="text-xs text-gray-500">
                            Fine: ${transaction.fine}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {overdueBooks.length > 5 && (
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View all overdue books
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">No overdue books</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Management
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => router.push('/admin/books')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Manage Books
              </button>
              
              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="h-5 w-5 mr-2" />
                Manage Users
              </button>
              
              <button
                onClick={() => router.push('/admin/transactions')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                View Transactions
              </button>
              
              <button
                onClick={() => router.push('/admin/reports')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
