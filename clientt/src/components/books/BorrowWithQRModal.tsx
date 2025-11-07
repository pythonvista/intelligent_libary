'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, QrCodeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import QRScannerComponent from './QRScanner';
import Button from '@/components/ui/Button';
import { booksAPI, transactionsAPI } from '@/lib/api';

interface BorrowWithQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  onSuccess: () => void;
}

const BorrowWithQRModal: React.FC<BorrowWithQRModalProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  onSuccess,
}) => {
  const [step, setStep] = useState<'show-qr' | 'scan' | 'processing' | 'success' | 'error'>('show-qr');
  const [bookQRCode, setBookQRCode] = useState<string>('');
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch book QR code when modal opens
  useEffect(() => {
    if (isOpen && bookId) {
      fetchBookQRCode();
    }
  }, [isOpen, bookId]);

  const fetchBookQRCode = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await booksAPI.getQRCode(bookId);
      setBookQRCode(response.data.qrCode);
      setQrCodeImage(response.data.qrCodeImage);
      setStep('show-qr');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as any).response?.data?.message || 'Failed to load QR code'
        : 'Failed to load QR code';
      setError(errorMessage);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartScan = () => {
    setStep('scan');
    setError('');
  };

  const handleQRScan = async (scannedQR: string) => {
    setStep('processing');
    setError('');

    try {
      const trimmedQR = scannedQR.trim();

      // Submit borrow request
      await transactionsAPI.createBorrowRequest(bookId, trimmedQR);

      setStep('success');
      // Call success callback after a delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as any).response?.data?.message || 'Failed to submit borrow request'
        : 'Failed to submit borrow request';
      setError(errorMessage);
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('show-qr');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Borrow: {bookTitle}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Step 1: Show QR Code */}
            {step === 'show-qr' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Step 1: Verify Book QR Code</h4>
                      <p className="text-sm text-blue-700">
                        Scan the QR code below and match it with the QR code on the physical book you want to borrow.
                      </p>
                    </div>

                    {qrCodeImage && (
                      <div className="text-center">
                        <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                          <img
                            src={qrCodeImage}
                            alt="Book QR Code"
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 font-mono break-all">
                          {bookQRCode}
                        </p>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> Make sure the QR code you scan from the physical book matches the one shown above.
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleStartScan}
                      className="w-full"
                    >
                      <QrCodeIcon className="h-5 w-5 mr-2 inline-block" />
                      Scan Book QR Code
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Scan QR Code */}
            {step === 'scan' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Step 2: Scan Physical Book QR Code</h4>
                  <p className="text-sm text-blue-700">
                    Point your camera at the QR code on the physical book. The scanned code must match the one shown above.
                  </p>
                </div>

                <QRScannerComponent
                  isOpen={true}
                  onScan={handleQRScan}
                  onClose={() => setStep('show-qr')}
                />
              </div>
            )}

            {/* Processing */}
            {step === 'processing' && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Submitting borrow request...</p>
              </div>
            )}

            {/* Success */}
            {step === 'success' && (
              <div className="text-center py-12">
                <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-green-900 mb-2">Request Submitted!</h4>
                <p className="text-green-700">
                  Your borrow request has been submitted and is waiting for admin approval.
                </p>
              </div>
            )}

            {/* Error */}
            {step === 'error' && (
              <div className="text-center py-12">
                <XCircleIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-red-900 mb-2">Error</h4>
                <p className="text-red-700 mb-4">{error}</p>
                <div className="flex space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => setStep('show-qr')}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleClose}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowWithQRModal;

