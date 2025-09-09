'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Transaction } from '@/types';
import { transactionsAPI } from '@/lib/api';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  BookOpenIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface BorrowingStats {
  totalBorrowed: number;
  currentlyBorrowed: number;
  overdue: number;
  returned: number;
}

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<BorrowingStats>({
    totalBorrowed: 0,
    currentlyBorrowed: 0,
    overdue: 0,
    returned: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    preferences: [] as string[]
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        preferences: user.preferences || []
      });
    }
  }, [user]);

  // Fetch borrowing statistics
  const fetchStats = async () => {
    try {
      const [currentBooks, history] = await Promise.all([
        transactionsAPI.getMyBooks(),
        transactionsAPI.getHistory({ limit: 100 })
      ]);

      const currentlyBorrowed = currentBooks.data.borrowedBooks || [];
      const allTransactions = history.data.transactions || [];

      const overdue = currentlyBorrowed.filter((book: Transaction) => book.daysOverdue && book.daysOverdue > 0).length;
      const returned = allTransactions.filter((t: Transaction) => t.status === 'returned').length;

      setStats({
        totalBorrowed: allTransactions.length,
        currentlyBorrowed: currentlyBorrowed.length,
        overdue,
        returned
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await updateUser(formData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        preferences: user.preferences || []
      });
    }
    setIsEditing(false);
  };

  if (!isAuthenticated || !user) {
    return <Layout><div className="text-center">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg text-white p-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-2xl font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-blue-100 capitalize">{user.role} Member</p>
              <p className="text-blue-200 text-sm">Member since {new Date(user.createdAt || '').toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <BookOpenIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalBorrowed}</div>
            <div className="text-sm text-gray-500">Total Borrowed</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <ClockIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.currentlyBorrowed}</div>
            <div className="text-sm text-gray-500">Currently Borrowed</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.overdue}</div>
            <div className="text-sm text-gray-500">Overdue</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <BookOpenIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.returned}</div>
            <div className="text-sm text-gray-500">Returned</div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              {!isEditing && (
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
                
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Full Name</div>
                      <div className="text-gray-900">{user.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div className="text-gray-900">{user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Phone Number</div>
                      <div className="text-gray-900">{user.phoneNumber || 'Not provided'}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Address</div>
                      <div className="text-gray-900">{user.address || 'Not provided'}</div>
                    </div>
                  </div>
                </div>

                {/* Reading Preferences */}
                {user.preferences && user.preferences.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Reading Preferences</div>
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.map((pref, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="primary"
              onClick={() => router.push('/my-books')}
              className="flex items-center justify-center"
            >
              <BookOpenIcon className="h-5 w-5 mr-2" />
              View My Books
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => router.push('/books')}
              className="flex items-center justify-center"
            >
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Browse Library
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => router.push('/settings')}
              className="flex items-center justify-center"
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Account Settings
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
