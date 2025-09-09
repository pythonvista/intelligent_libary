'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QrCodeIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { booksAPI } from '@/lib/api';

interface QRCodeDisplayProps {
  bookId: string;
  bookTitle: string;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  bookId,
  bookTitle,
  className = '',
}) => {
  const [qrCodeData, setQrCodeData] = useState<{
    qrCode: string;
    qrCodeImage: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQRCode = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await booksAPI.getQRCode(bookId);
      setQrCodeData(response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as any).response?.data?.message || 'Failed to generate QR code'
        : 'Failed to generate QR code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  const downloadQRCode = () => {
    if (!qrCodeData?.qrCodeImage) return;

    const link = document.createElement('a');
    link.href = qrCodeData.qrCodeImage;
    link.download = `qr-code-${bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    if (!qrCodeData?.qrCodeImage) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${bookTitle}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
              }
              .qr-container {
                text-align: center;
                border: 2px solid #000;
                padding: 20px;
                border-radius: 8px;
              }
              .qr-image {
                max-width: 300px;
                height: auto;
              }
              .book-title {
                margin-top: 20px;
                font-size: 18px;
                font-weight: bold;
              }
              .qr-text {
                margin-top: 10px;
                font-size: 12px;
                color: #666;
                word-break: break-all;
              }
              @media print {
                body { margin: 0; }
                .qr-container { border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${qrCodeData.qrCodeImage}" alt="QR Code" class="qr-image" />
              <div class="book-title">${bookTitle}</div>
              <div class="qr-text">${qrCodeData.qrCode}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    if (bookId) {
      fetchQRCode();
    }
  }, [bookId]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <QrCodeIcon className="h-5 w-5 mr-2" />
          QR Code
        </h3>
        
        {qrCodeData && (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadQRCode}
              className="flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={printQRCode}
              className="flex items-center"
            >
              <PrinterIcon className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700 text-sm">{error}</p>
          <Button
            variant="primary"
            size="sm"
            onClick={fetchQRCode}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {qrCodeData && !loading && (
        <div className="text-center">
          <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
            <img
              src={qrCodeData.qrCodeImage}
              alt={`QR Code for ${bookTitle}`}
              className="w-48 h-48 mx-auto"
            />
          </div>
          
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {bookTitle}
            </p>
            <p className="text-xs text-gray-500 font-mono break-all">
              {qrCodeData.qrCode}
            </p>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>Scan this QR code to quickly access book information</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
