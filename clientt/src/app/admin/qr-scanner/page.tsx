'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import QRScanner from '@/components/books/QRScanner';
import Button from '@/components/ui/Button';
import { transactionsAPI, authAPI } from '@/lib/api';
import { 
  QrCodeIcon, 
  UserIcon, 
  BookOpenIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ScannedUser {
  _id: string;
  name: string;
  email: string;
  qrCode?: string;
  borrowedBooks: any[];
}

interface ScannedBook {
  _id: string;
  title: string;
  author: string;
  coverImage?: string;
  isAvailable: boolean;
  availableCopies: number;
}

type ScanStep = 'user' | 'book' | 'complete';
type Action = 'borrow' | 'return';

interface TransactionResult {
  success: boolean;
  message: string;
  action?: Action;
  fineAmount?: number;
}

const AdminQRScannerPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [scanStep, setScanStep] = useState<ScanStep>('user');
  const [action, setAction] = useState<Action>('borrow');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [scannedBook, setScannedBook] = useState<ScannedBook | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);

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

  const handleScan = async (qrCode: string) => {
    setIsScannerOpen(false);
    setProcessing(true);

    // Trim whitespace from scanned QR code
    const trimmedQR = qrCode.trim();

    try {
      if (scanStep === 'user') {
        // Scanning user QR code - let backend validate format
        if (!trimmedQR || trimmedQR.length < 5) {
          alert('Invalid QR code format. Please scan a valid student QR code.\n\nScanned: ' + trimmedQR);
          setProcessing(false);
          return;
        }

        const response = await authAPI.scanUserQR(trimmedQR);
        setScannedUser(response.data.user);
        setScanStep('book');
        setProcessing(false);
      } else if (scanStep === 'book') {
        // Scanning book QR code - let backend validate format
        if (!trimmedQR || trimmedQR.length < 5) {
          alert('Invalid QR code format. Please scan a valid book QR code.\n\nScanned: ' + trimmedQR);
          setProcessing(false);
          return;
        }

        // Process the transaction
        if (!scannedUser) {
          alert('Error: No user scanned. Please restart.');
          reset();
          return;
        }

        const response = await transactionsAPI.processQR(
          scannedUser.qrCode || '',
          trimmedQR,
          action
        );

        setResult({
          success: true,
          message: response.data.message,
          action: response.data.action,
          fineAmount: response.data.fineAmount
        });
        
        // Store book info for display
        const bookInfo = response.data.book;
        setScannedBook(bookInfo);
        
        setScanStep('complete');
        setProcessing(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as any).response?.data?.message || 'Failed to process QR code'
        : 'Failed to process QR code';
      
      // Log for debugging
      console.error('QR Scan Error:', {
        step: scanStep,
        scanned: trimmedQR,
        error: errorMessage
      });
      
      setResult({
        success: false,
        message: `${errorMessage}\n\nScanned QR: ${trimmedQR.substring(0, 50)}${trimmedQR.length > 50 ? '...' : ''}`
      });
      setScanStep('complete');
      setProcessing(false);
    }
  };

  const reset = () => {
    setScanStep('user');
    setAction('borrow');
    setScannedUser(null);
    setScannedBook(null);
    setResult(null);
  };

  const startScanning = () => {
    setResult(null);
    setIsScannerOpen(true);
  };

  if (!isAuthenticated || !user || (user.role !== 'staff' && user.role !== 'admin')) {
    return <Layout><div className="text-center">Unauthorized</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <QrCodeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">QR Code Transaction Scanner</h1>
                <p className="text-gray-600">Process book borrowing and returns via QR scan</p>
              </div>
            </div>
            
            {(scannedUser || result) && (
              <Button
                variant="ghost"
                onClick={reset}
                className="flex items-center"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Start New Transaction
              </Button>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${
              scanStep === 'user' ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                scanStep !== 'user' ? 'bg-green-100 border-green-600 text-green-600' : 'border-current'
              }`}>
                {scanStep !== 'user' ? '✓' : '1'}
              </div>
              <span className="font-medium">Scan Student</span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

            <div className={`flex items-center space-x-3 ${
              scanStep === 'book' ? 'text-blue-600' : scanStep === 'complete' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                scanStep === 'complete' ? 'bg-green-100 border-green-600' : 'border-current'
              }`}>
                {scanStep === 'complete' ? '✓' : '2'}
              </div>
              <span className="font-medium">Scan Book</span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>

            <div className={`flex items-center space-x-3 ${
              scanStep === 'complete' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                scanStep === 'complete' ? 'bg-green-100 border-green-600' : 'border-current'
              }`}>
                {scanStep === 'complete' ? '✓' : '3'}
              </div>
              <span className="font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Action Selection */}
        {!scannedUser && !result && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Select Transaction Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setAction('borrow')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  action === 'borrow'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <BookOpenIcon className={`h-8 w-8 mx-auto mb-2 ${
                  action === 'borrow' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="font-medium">Borrow Book</div>
                <div className="text-sm text-gray-600 mt-1">Issue a book to a student</div>
              </button>

              <button
                onClick={() => setAction('return')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  action === 'return'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ArrowPathIcon className={`h-8 w-8 mx-auto mb-2 ${
                  action === 'return' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <div className="font-medium">Return Book</div>
                <div className="text-sm text-gray-600 mt-1">Process a book return</div>
              </button>
            </div>
          </div>
        )}

        {/* Scanned User Info */}
        {scannedUser && !result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-900 mb-2">Student Identified</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-green-700 font-medium">Name</div>
                    <div className="text-green-900">{scannedUser.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700 font-medium">Email</div>
                    <div className="text-green-900">{scannedUser.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700 font-medium">Borrowed Books</div>
                    <div className="text-green-900">{scannedUser.borrowedBooks?.length || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!processing && !result && (
          <div className={`rounded-lg border p-6 ${
            scanStep === 'user' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
          }`}>
            <h3 className={`font-medium mb-3 ${
              scanStep === 'user' ? 'text-blue-900' : 'text-green-900'
            }`}>
              {scanStep === 'user' ? 'Step 1: Scan Student QR Code' : 'Step 2: Scan Book QR Code'}
            </h3>
            <p className={`text-sm mb-4 ${
              scanStep === 'user' ? 'text-blue-700' : 'text-green-700'
            }`}>
              {scanStep === 'user' 
                ? 'Ask the student to present their library QR code (found in their profile)'
                : `Scan the book's QR code to ${action} it ${action === 'borrow' ? 'to' : 'from'} the student`
              }
            </p>
            <Button
              variant="primary"
              onClick={startScanning}
              className="flex items-center"
            >
              <QrCodeIcon className="h-5 w-5 mr-2" />
              {scanStep === 'user' ? 'Scan Student QR Code' : 'Scan Book QR Code'}
            </Button>
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing transaction...</p>
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
                  <CheckCircleIcon className="h-10 w-10" />
                ) : (
                  <XCircleIcon className="h-10 w-10" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={`text-xl font-medium mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Transaction Complete!' : 'Transaction Failed'}
                </h3>
                
                <p className={`mb-4 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {result.success && scannedUser && scannedBook && (
                  <div className="bg-white rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Student</div>
                        <div className="font-medium">{scannedUser.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <BookOpenIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Book</div>
                        <div className="font-medium">{scannedBook.title}</div>
                        <div className="text-sm text-gray-600">{scannedBook.author}</div>
                      </div>
                    </div>

                    {result.action && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600">Action</div>
                        <div className="font-medium capitalize">{result.action}</div>
                      </div>
                    )}

                    {result.fineAmount !== undefined && result.fineAmount > 0 && (
                      <div className="pt-3 border-t border-gray-200 bg-yellow-50 -m-4 p-4 rounded">
                        <div className="text-sm text-yellow-700">Fine Amount</div>
                        <div className="font-bold text-yellow-900 text-lg">${result.fineAmount.toFixed(2)}</div>
                        <div className="text-xs text-yellow-600 mt-1">Please collect payment from student</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    variant="primary"
                    onClick={reset}
                  >
                    Process Another Transaction
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/admin/transactions')}
                  >
                    View All Transactions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">Quick Tips</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Student QR codes start with "STUDENT_" prefix</li>
            <li>• Book QR codes start with "BOOK_" prefix</li>
            <li>• The system will automatically detect overdue books and calculate fines</li>
            <li>• Students can have up to 5 books borrowed at once</li>
            <li>• If camera doesn't work, ensure browser has camera permissions</li>
          </ul>
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

export default AdminQRScannerPage;

