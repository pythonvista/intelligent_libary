'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { Transaction } from '@/types';
import { adminAPI } from '@/lib/api';
import { 
  UsersIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  ShieldCheckIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'patron' | 'staff' | 'admin';
  isActive: boolean;
  borrowedBooks: Transaction[];
  createdAt: string;
  phoneNumber?: string;
}

const ManageUsersPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Fetch users
  const fetchUsers = async (page = 1, searchQuery = '', role = '') => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page,
        limit: 10,
        search: searchQuery,
        role: role
      });
      
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalUsers(response.data.totalUsers || 0);
      setCurrentPage(response.data.currentPage || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, search, roleFilter);
  };

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can change user roles');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to change ${userName}'s role to ${newRole}?`);
    if (!confirmed) return;

    try {
      setActionLoading(userId);
      await adminAPI.updateUserRole(userId, newRole);
      
      // Refresh users list
      fetchUsers(currentPage, search, roleFilter);
      alert('User role updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to update user role'
        : 'Failed to update user role';
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle status change
  const handleStatusChange = async (userId: string, isActive: boolean, userName: string) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can change user status');
      return;
    }

    const action = isActive ? 'activate' : 'deactivate';
    const confirmed = window.confirm(`Are you sure you want to ${action} ${userName}'s account?`);
    if (!confirmed) return;

    try {
      setActionLoading(userId);
      await adminAPI.updateUserStatus(userId, isActive);
      
      // Refresh users list
      fetchUsers(currentPage, search, roleFilter);
      alert(`User account ${action}d successfully`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || `Failed to ${action} user account`
        : `Failed to ${action} user account`;
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page, search, roleFilter);
  };

  useEffect(() => {
    if (user?.role === 'staff' || user?.role === 'admin') {
      fetchUsers();
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
            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-600">View and manage library members</p>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{totalUsers}</span> total users
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {users.filter(u => u.isActive).length}
                </span> active users
              </div>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="patron">Patrons</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
            </select>
            
            <Button type="submit" variant="primary">
              Search
            </Button>
            {(search || roleFilter) && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setCurrentPage(1);
                  fetchUsers(1, '', '');
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Books Borrowed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Since
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
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
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map((userData) => (
                    <tr key={userData._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {userData.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                            <div className="text-sm text-gray-500">{userData.email}</div>
                            {userData.phoneNumber && (
                              <div className="text-xs text-gray-400">{userData.phoneNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          userData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          userData.role === 'staff' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {userData.role === 'admin' && <ShieldCheckIcon className="w-3 h-3 mr-1" />}
                          {userData.role === 'staff' && <UserIcon className="w-3 h-3 mr-1" />}
                          {userData.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {userData.borrowedBooks?.length || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userData.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userData.isActive ? (
                            <>
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <select
                              value={userData.role}
                              onChange={(e) => handleRoleChange(userData._id, e.target.value, userData.name)}
                              disabled={actionLoading === userData._id}
                              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="patron">Patron</option>
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                            
                            <Button
                              variant={userData.isActive ? "danger" : "primary"}
                              size="sm"
                              onClick={() => handleStatusChange(userData._id, !userData.isActive, userData.name)}
                              isLoading={actionLoading === userData._id}
                            >
                              {userData.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-12 text-center">
                      <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {search || roleFilter ? 'Try adjusting your search criteria.' : 'No users are registered yet.'}
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

export default ManageUsersPage;
