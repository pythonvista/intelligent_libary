'use client';

import React, { useState, useEffect } from 'react';
import { QrCodeIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { authAPI } from '@/lib/api';

interface UserQRCodeProps {
  className?: string;
}

interface QRData {
  name: string;
  email: string;
  qrCode: string;
  qrCodeImage: string;
}

const UserQRCode: React.FC<UserQRCodeProps> = ({ className = '' }) => {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getMyQR();
      setQrData(response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as any).response?.data?.message || 'Failed to load QR code'
        : 'Failed to load QR code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData?.qrCodeImage) return;

    const link = document.createElement('a');
    link.href = qrData.qrCodeImage;
    link.download = `my-library-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    if (!qrData?.qrCodeImage) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>My Library QR Code</title>
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
                padding: 30px;
                border-radius: 8px;
                max-width: 400px;
              }
              .qr-image {
                max-width: 300px;
                height: auto;
                margin-bottom: 20px;
              }
              .user-name {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .user-email {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
              }
              .instructions {
                margin-top: 20px;
                font-size: 14px;
                color: #333;
                text-align: left;
              }
              .qr-text {
                margin-top: 10px;
                font-size: 10px;
                color: #999;
                word-break: break-all;
              }
              @media print {
                body { margin: 0; }
                .qr-container { border: 2px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${qrData.qrCodeImage}" alt="QR Code" class="qr-image" />
              <div class="user-name">${qrData.name}</div>
              <div class="user-email">${qrData.email}</div>
              <div class="instructions">
                <strong>Library Member QR Code</strong><br/>
                Present this QR code to library staff for borrowing and returning books.
              </div>
              <div class="qr-text">${qrData.qrCode}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700 text-sm mb-2">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchQRCode}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!qrData) return null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <QrCodeIcon className="h-5 w-5 mr-2" />
          My Library QR Code
        </h3>
        
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
      </div>

      <div className="text-center">
        <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
          <img
            src={qrData.qrCodeImage}
            alt="My Library QR Code"
            className="w-48 h-48 mx-auto"
          />
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {qrData.name}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            {qrData.email}
          </p>
          <p className="text-xs text-gray-500 font-mono break-all">
            {qrData.qrCode}
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 text-sm">How to Use</h4>
          <ul className="text-xs text-blue-700 text-left space-y-1">
            <li>• Present this QR code to library staff when borrowing books</li>
            <li>• Show it when returning books for quick processing</li>
            <li>• Keep a digital or printed copy with you</li>
            <li>• You can also scan book QR codes directly from the "Borrow Book" page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserQRCode;

