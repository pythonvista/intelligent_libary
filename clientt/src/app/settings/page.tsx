'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/lib/api';
import { 
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Notification preferences (mock - you can implement with backend)
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    dueReminders: true,
    newBooks: false,
    overdueNotices: true
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('Password changed successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to change password'
        : 'Failed to change password';
      alert(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
    // TODO: Send to backend
  };

  const handleAccountDeactivation = () => {
    const confirmed = window.confirm(
      'Are you sure you want to deactivate your account? This action cannot be undone and you will lose access to all your data.'
    );
    
    if (confirmed) {
      // TODO: Implement account deactivation
      alert('Account deactivation feature coming soon');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isAuthenticated || !user) {
    return <Layout><div className="text-center">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and security settings</p>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <KeyIcon className="h-5 w-5 mr-2" />
                Change Password
              </h3>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="New Password"
                    name="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    helperText="Must be at least 6 characters long"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={passwordLoading}
              >
                Update Password
              </Button>
            </form>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <BellIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {key === 'emailNotifications' && 'Email Notifications'}
                    {key === 'dueReminders' && 'Due Date Reminders'}
                    {key === 'newBooks' && 'New Book Alerts'}
                    {key === 'overdueNotices' && 'Overdue Notices'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {key === 'emailNotifications' && 'Receive notifications via email'}
                    {key === 'dueReminders' && 'Get reminded before books are due'}
                    {key === 'newBooks' && 'Notify me when new books are added'}
                    {key === 'overdueNotices' && 'Receive overdue book notifications'}
                  </div>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    value ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onClick={() => handleNotificationChange(key)}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account Management */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Account Management</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Account Status</div>
                <div className="text-sm text-gray-500">
                  Your account is currently {user.isActive ? 'active' : 'inactive'}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Member Since</div>
                <div className="text-sm text-gray-500">
                  {new Date(user.createdAt || '').toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Account Type</div>
                <div className="text-sm text-gray-500 capitalize">{user.role}</div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <Button
                  variant="secondary"
                  onClick={logout}
                  className="flex items-center"
                >
                  Sign Out
                </Button>
                
                <Button
                  variant="danger"
                  onClick={handleAccountDeactivation}
                  className="flex items-center"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Deactivate Account
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Privacy & Security</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your personal information is encrypted and stored securely. We never share your data with third parties without your explicit consent.
                <a href="#" className="underline ml-1">Learn more about our privacy policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
