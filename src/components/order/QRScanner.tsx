
"use client";

import { useEffect } from 'react';
import { useQRScanner } from '@/hooks/useQRScanner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const { scannerRef, startScanner, error, stopScanner } = useQRScanner({ onScanSuccess, onScanError });

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="w-full">
      <div id="qr-scanner-region" ref={scannerRef} className="w-full" />
      {error && (
         <Alert variant="destructive" className="mt-4">
            <AlertTitle>Gagal Memulai Kamera</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              <p className="mt-2">Pastikan Anda telah memberikan izin akses kamera untuk situs ini di pengaturan browser Anda.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={startScanner}>
                Coba Lagi
              </Button>
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

