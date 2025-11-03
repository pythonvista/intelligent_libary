'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import QRScanner from '@/components/books/QRScanner';
import Button from '@/components/ui/Button';
import { transactionsAPI } from '@/lib/api';
import { QrCodeIcon, BookOpenIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface BookInfo {
  _id: string;
  title: string;
  author: string;
  coverImage?: string;
}

interface TransactionResult {
  success: boolean;
  message: string;
  book?: BookInfo;
  dueDate?: string;
}

const BorrowBookPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role === 'staff' || user?.role === 'admin') {
      router.push('/admin');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleScan = async (qrCode: string) => {
    setIsScannerOpen(false);
    setProcessing(true);
    setResult(null);

    // Trim whitespace from scanned QR code
    const trimmedQR = qrCode.trim();

    try {
      // Basic validation - let backend handle format checking
      if (!trimmedQR || trimmedQR.length < 5) {
        setResult({
          success: false,
          message: `Invalid QR code format. Please scan a valid book QR code.\n\nScanned: ${trimmedQR}`
        });
        return;
      }

      // Borrow the book using the QR code
      const response = await transactionsAPI.borrowBookQR(trimmedQR);

      setResult({
        success: true,
        message: response.data.message || 'Book borrowed successfully!',
        book: response.data.book,
        dueDate: response.data.transaction?.dueDate
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as any).response?.data?.message || 'Failed to borrow book'
        : 'Failed to borrow book';
      
      // Log for debugging
      console.error('QR Scan Error:', {
        scanned: trimmedQR,
        error: errorMessage
      });
      
      setResult({
        success: false,
        message: `${errorMessage}\n\nScanned QR: ${trimmedQR.substring(0, 50)}${trimmedQR.length > 50 ? '...' : ''}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setIsScannerOpen(true);
  };

  if (!isAuthenticated || !user) {
    return <Layout><div className="text-center">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <QrCodeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Borrow Book via QR Code</h1>
              <p className="text-gray-600">Scan a book's QR code to borrow it instantly</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">How to Borrow a Book</h3>
          <ol className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Click the "Scan Book QR Code" button below</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Allow camera access when prompted</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Point your camera at the book's QR code (usually on the back cover or inside)</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>The book will be automatically borrowed and added to your account</span>
            </li>
          </ol>
        </div>

        {/* Scan Button */}
        {!processing && !result && (
          <div className="text-center py-12">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center mx-auto"
            >
              <QrCodeIcon className="h-6 w-6 mr-2" />
              Scan Book QR Code
            </Button>
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your request...</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-lg shadow-sm border p-6 ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 ${
                result.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.success ? (
                  <CheckCircleIcon className="h-8 w-8" />
                ) : (
                  <XCircleIcon className="h-8 w-8" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={`text-lg font-medium mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                
                <p className={`mb-4 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {result.success && result.book && (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-4">
                      {result.book.coverImage && (
                        <img
                          src={result.book.coverImage}
                          alt={result.book.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{result.book.title}</h4>
                        <p className="text-sm text-gray-600">{result.book.author}</p>
                        {result.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(result.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {result.success ? (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => router.push('/my-books')}
                      >
                        <BookOpenIcon className="h-4 w-4 mr-2" />
                        View My Books
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={resetScanner}
                      >
                        Borrow Another Book
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={resetScanner}
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">Important Information</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Books are borrowed for 14 days by default</li>
            <li>• You can borrow up to 5 books at a time</li>
            <li>• Late returns may incur fines ($1 per day, max $50)</li>
            <li>• You can renew books up to 3 times from your "My Books" page</li>
            <li>• If you have trouble scanning, visit the front desk for assistance</li>
          </ul>
        </div>

        {/* Alternative Actions */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">Or</p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/books')}
            >
              Browse Catalog
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/profile')}
            >
              View My QR Code
            </Button>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScannerOpen}
        onScan={handleScan}
        onClose={() => setIsScannerOpen(false)}
      />
    </Layout>
  );
};

export default BorrowBookPage;

