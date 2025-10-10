
"use client";

import { useState, useRef, useCallback } from 'react';
import { Html5Qrcode, type Html5QrcodeConfig, type QrCodeSuccessCallback } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

const config: Html5QrcodeConfig = {
  fps: 10,
  qrbox: (viewfinderWidth, viewfinderHeight) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.floor(minEdge * 0.8);
    return {
      width: qrboxSize,
      height: qrboxSize,
    };
  },
  supportedScanTypes: [],
  showTorchButtonIfSupported: true,
  showOpenFileButton: true,
};

export function useQRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      html5QrcodeRef.current.stop().catch(err => {
        console.error("Failed to stop scanner cleanly:", err);
      });
    }
  }, []);

  const startScanner = useCallback(() => {
    setError(null);
    if (scannerRef.current && !html5QrcodeRef.current?.isScanning) {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(scannerRef.current.id, { verbose: false });
      }

      const qrCodeSuccessCallback: QrCodeSuccessCallback = (decodedText, decodedResult) => {
        stopScanner();
        onScanSuccess(decodedText);
      };

      const qrCodeErrorCallback = (errorMessage: string) => {
        if (onScanError) {
          onScanError(errorMessage);
        }
        // Don't setError here as it can be noisy. Only for critical failures.
      };

      html5QrcodeRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).catch((err) => {
        console.error("Unable to start scanning.", err);
        setError("Kamera tidak dapat diakses.");
        if (onScanError) {
          onScanError("Tidak dapat memulai kamera untuk pemindaian.");
        }
      });
    }
  }, [onScanSuccess, onScanError, stopScanner]);

  return { scannerRef, startScanner, error, stopScanner };
}
