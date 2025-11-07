'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { transactionsAPI } from '@/lib/api';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  BookOpenIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface BorrowRequest {
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
    coverImage?: string;
    isbn?: string;
  };
  scannedQRCode: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    name: string;
  };
  rejectionReason?: string;
}

const BorrowRequestsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

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

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'staff' || user?.role === 'admin')) {
      fetchRequests();
    }
  }, [isAuthenticated, user, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await transactionsAPI.getBorrowRequests({ status });
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      alert('Failed to load borrow requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await transactionsAPI.approveBorrowRequest(requestId);
      alert('Request approved successfully!');
      fetchRequests();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to approve request'
        : 'Failed to approve request';
      alert(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await transactionsAPI.rejectBorrowRequest(requestId, rejectReason || undefined);
      alert('Request rejected');
      setShowRejectModal(null);
      setRejectReason('');
      fetchRequests();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || 'Failed to reject request'
        : 'Failed to reject request';
      alert(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated || (user?.role !== 'staff' && user?.role !== 'admin')) {
    return <Layout><div className="text-center">Unauthorized</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Borrow Requests</h1>
          <p className="text-gray-600">Review and approve/reject book borrowing requests</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === 'all'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500">
              {statusFilter === 'pending' 
                ? 'There are no pending borrow requests at the moment.'
                : `There are no ${statusFilter} requests.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {/* Book Cover */}
                      {request.book.coverImage && (
                        <img
                          src={request.book.coverImage}
                          alt={request.book.title}
                          className="w-20 h-28 object-cover rounded"
                        />
                      )}

                      {/* Request Details */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.book.title}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>

                        <p className="text-gray-600 mb-4">by {request.book.author}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <UserIcon className="h-4 w-4" />
                            <span>
                              <strong>Student:</strong> {request.user.name} ({request.user.email})
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              <strong>Requested:</strong>{' '}
                              {new Date(request.requestedAt).toLocaleString()}
                            </span>
                          </div>

                          {request.reviewedAt && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <CalendarIcon className="h-4 w-4" />
                              <span>
                                <strong>Reviewed:</strong>{' '}
                                {new Date(request.reviewedAt).toLocaleString()}
                                {request.reviewedBy && ` by ${request.reviewedBy.name}`}
                              </span>
                            </div>
                          )}

                          <div className="text-sm text-gray-600">
                            <strong>Scanned QR:</strong>{' '}
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {request.scannedQRCode.substring(0, 30)}...
                            </code>
                          </div>
                        </div>

                        {request.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-800">
                              <strong>Rejection Reason:</strong> {request.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(request._id)}
                        isLoading={processingId === request._id}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-2 inline-block" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowRejectModal(request._id)}
                        isLoading={processingId === request._id}
                      >
                        <XCircleIcon className="h-4 w-4 mr-2 inline-block" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowRejectModal(null);
                setRejectReason('');
              }}
            />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Borrow Request</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    onClick={() => handleReject(showRejectModal)}
                    isLoading={processingId === showRejectModal}
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BorrowRequestsPage;

