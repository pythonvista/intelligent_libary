'use client';

import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  isOpen,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const initializeScanner = async () => {
      try {
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          setError('No camera found on this device');
          return;
        }

        // Create scanner instance
        qrScannerRef.current = new QrScanner(
          videoRef.current!,
          (result) => {
            onScan(result.data);
            stopScanner();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera if available
          }
        );

        // Start scanning
        await qrScannerRef.current.start();
        setHasPermission(true);
        setError('');
      } catch (err: any) {
        console.error('QR Scanner initialization failed:', err);
        setHasPermission(false);
        
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Failed to initialize camera. Please try again.');
        }
      }
    };

    initializeScanner();

    // Cleanup function
    return () => {
      stopScanner();
    };
  }, [isOpen, onScan]);

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanner();
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
                Scan QR Code
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Scanner area */}
            <div className="relative">
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <CameraIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
                  <p className="text-red-700 text-sm mb-4">{error}</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setError('');
                      setHasPermission(null);
                      // Retry initialization
                      const timer = setTimeout(() => {
                        if (videoRef.current && qrScannerRef.current === null) {
                          // Re-trigger useEffect by changing a dependency
                          window.location.reload();
                        }
                      }, 100);
                      return () => clearTimeout(timer);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover rounded-lg bg-gray-100"
                    style={{ transform: 'scaleX(-1)' }} // Mirror the video
                  />
                  
                  {hasPermission === null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-600">Initializing camera...</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Position the QR code within the camera view to scan it automatically.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="w-full sm:w-auto sm:ml-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerComponent;
