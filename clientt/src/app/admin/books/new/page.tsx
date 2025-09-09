'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { booksAPI } from '@/lib/api';
import { ArrowLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const subjects = [
  'Literature', 'Computer Science', 'Mathematics', 'Science', 'History',
  'Psychology', 'Philosophy', 'Art', 'Business', 'Engineering',
  'Medicine', 'Law', 'Education', 'Religion', 'Fiction', 'Non-Fiction'
];

const AddBookPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    subject: '',
    description: '',
    publisher: '',
    publishedYear: '',
    pages: '',
    language: 'English',
    totalCopies: '1',
    coverImage: '',
    location: {
      shelf: '',
      section: '',
      floor: ''
    },
    tags: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check authorization
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'staff' && user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }

    if (formData.publishedYear && (isNaN(Number(formData.publishedYear)) || Number(formData.publishedYear) < 0 || Number(formData.publishedYear) > new Date().getFullYear())) {
      newErrors.publishedYear = 'Please enter a valid year';
    }

    if (formData.pages && (isNaN(Number(formData.pages)) || Number(formData.pages) < 1)) {
      newErrors.pages = 'Please enter a valid number of pages';
    }

    if (!formData.totalCopies || isNaN(Number(formData.totalCopies)) || Number(formData.totalCopies) < 1) {
      newErrors.totalCopies = 'Please enter a valid number of copies';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Prepare data for API
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        subject: formData.subject,
        description: formData.description.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        publishedYear: formData.publishedYear ? Number(formData.publishedYear) : undefined,
        pages: formData.pages ? Number(formData.pages) : undefined,
        language: formData.language,
        totalCopies: Number(formData.totalCopies),
        coverImage: formData.coverImage.trim() || undefined,
        location: {
          shelf: formData.location.shelf.trim() || undefined,
          section: formData.location.section.trim() || undefined,
          floor: formData.location.floor.trim() || undefined,
        },
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      await booksAPI.createBook(bookData);
      
      alert('Book added successfully!');
      router.push('/admin/books');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || (user?.role !== 'staff' && user?.role !== 'admin')) {
    return <Layout><div className="text-center">Unauthorized</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Book</h1>
            <p className="text-gray-600">Fill in the book details below</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  placeholder="Enter book title"
                />
                
                <Input
                  label="Author *"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  error={errors.author}
                  placeholder="Enter author name"
                />
                
                <Input
                  label="ISBN"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  error={errors.isbn}
                  placeholder="Enter ISBN number"
                />
                
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter book description"
              />
            </div>

            {/* Publication Details */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Publication Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Publisher"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  placeholder="Enter publisher name"
                />
                
                <Input
                  label="Published Year"
                  name="publishedYear"
                  type="number"
                  value={formData.publishedYear}
                  onChange={handleChange}
                  error={errors.publishedYear}
                  placeholder="Enter publication year"
                />
                
                <Input
                  label="Number of Pages"
                  name="pages"
                  type="number"
                  value={formData.pages}
                  onChange={handleChange}
                  error={errors.pages}
                  placeholder="Enter number of pages"
                />
                
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Library Information */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Library Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Total Copies *"
                  name="totalCopies"
                  type="number"
                  min="1"
                  value={formData.totalCopies}
                  onChange={handleChange}
                  error={errors.totalCopies}
                  placeholder="Enter number of copies"
                />
                
                <Input
                  label="Cover Image URL"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="Enter cover image URL"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Floor"
                  name="location.floor"
                  value={formData.location.floor}
                  onChange={handleChange}
                  placeholder="e.g., 1st Floor"
                />
                
                <Input
                  label="Section"
                  name="location.section"
                  value={formData.location.section}
                  onChange={handleChange}
                  placeholder="e.g., Science Section"
                />
                
                <Input
                  label="Shelf"
                  name="location.shelf"
                  value={formData.location.shelf}
                  onChange={handleChange}
                  placeholder="e.g., A1"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Input
                label="Tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Enter tags separated by commas (e.g., classic, bestseller, award-winning)"
                helperText="Separate multiple tags with commas"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                Add Book
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddBookPage;
