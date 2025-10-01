
"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerRegionId = "qr-scanner-region";

  useEffect(() => {
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        scannerRegionId,
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 }
        },
        /* verbose= */ false
      );

      const successCallback = (decodedText: string, result: Html5QrcodeResult) => {
        scanner.clear();
        onScanSuccess(decodedText);
      };

      const errorCallback = (errorMessage: string) => {
        if (onScanError) {
          onScanError(errorMessage);
        }
      };

      scanner.render(successCallback, errorCallback);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
        });
        scannerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={scannerRegionId} />;
}
