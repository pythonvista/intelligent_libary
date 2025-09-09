'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const RegisterPage: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <BookOpenIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                sign in to existing account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{errors.general}</div>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Enter your full name"
              />

              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
              />

              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Create a password (min. 6 characters)"
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
              />

              <Input
                label="Phone Number (Optional)"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                placeholder="Enter your phone number"
              />

              <Input
                label="Address (Optional)"
                name="address"
                type="text"
                autoComplete="street-address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                placeholder="Enter your address"
              />
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full"
            >
              Create account
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
