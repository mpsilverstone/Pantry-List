import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, ScanBarcode } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface CameraScannerProps {
  onCapture: (data: { type: 'IMAGE' | 'BARCODE', value: string, capturedImage?: string }) => void;
  onClose: () => void;
  isProcessing: boolean;
  mode?: 'BARCODE' | 'PHOTO';
  message?: string;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ 
  onCapture, 
  onClose, 
  isProcessing,
  mode = 'BARCODE',
  message
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const scannerId = "reader";

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
          ]
        });
        scannerRef.current = scanner;
        
        const videoConstraints = {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          advanced: [{ focusMode: "continuous" } as any]
        };
        
        await scanner.start(
          { facingMode: "environment" },
          { 
            fps: 20, 
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const boxSize = Math.floor(minEdge * 0.7);
              return { width: boxSize, height: boxSize * 0.6 }; 
            },
            aspectRatio: 1.0,
            videoConstraints: videoConstraints 
          },
          (decodedText) => {
             if (mounted && !isScanningRef.current && mode === 'BARCODE') {
               isScanningRef.current = true;
               if (navigator.vibrate) navigator.vibrate(50);

               let capturedImage: string | undefined;
               const videoElement = document.querySelector('#reader video') as HTMLVideoElement;
               if (videoElement) {
                  const canvas = document.createElement('canvas');
                  canvas.width = videoElement.videoWidth;
                  canvas.height = videoElement.videoHeight;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    capturedImage = canvas.toDataURL('image/jpeg', 0.8);
                  }
               }
               onCapture({ type: 'BARCODE', value: decodedText, capturedImage });
             }
          },
          () => {} 
        );
        
        if (mounted) setHasPermission(true);
      } catch (err) {
        if (mounted) setHasPermission(false);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          if (scannerRef.current) scannerRef.current.clear();
        });
      }
    };
  }, [mode, onCapture]);

  const handleManualCapture = () => {
    const videoElement = document.querySelector('#reader video') as HTMLVideoElement;
    if (videoElement) {
       const canvas = document.createElement('canvas');
       canvas.width = videoElement.videoWidth;
       canvas.height = videoElement.videoHeight;
       const ctx = canvas.getContext('2d');
       if (ctx) {
         ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
         const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
         onCapture({ type: 'IMAGE', value: dataUrl });
       }
    }
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center text-white p-6">
        <p className="text-center mb-4">Camera access denied.</p>
        <button onClick={onClose} className="bg-white text-black px-4 py-2 rounded-full">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[60] overflow-hidden">
      <style>{`
        #reader { width: 100% !important; height: 100% !important; border: none !important; }
        #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
      `}</style>
      <div className="absolute inset-0 z-0">
        <div id="reader" className="w-full h-full bg-black"></div>
      </div>
      <div className="absolute top-0 left-0 right-0 p-4 pt-8 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onClose} className="p-2 rounded-full bg-white/20 text-white backdrop-blur-md"><X size={24} /></button>
        <div className="text-white font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-2 border border-white/10">
          {mode === 'BARCODE' ? <ScanBarcode size={16} /> : <Camera size={16} />}
          <span>{mode === 'BARCODE' ? 'Scan Barcode' : 'Manual Photo'}</span>
        </div>
        <div className="w-10"></div>
      </div>
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
         {mode === 'BARCODE' && !isProcessing && (
           <div className="flex flex-col items-center justify-center">
              <div className="w-72 h-48 relative border-2 border-dashed border-white/30 rounded-xl">
                 <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
              </div>
              <p className="mt-8 text-white font-medium bg-black/40 px-4 py-2 rounded-full text-sm backdrop-blur-md">Center barcode in frame</p>
           </div>
         )}
         {message && !isProcessing && (
           <div className="absolute top-24 bg-blue-600/90 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md">{message}</div>
         )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-12 pt-24 bg-gradient-to-t from-black/80 to-transparent z-20 flex flex-col items-center">
         {mode === 'BARCODE' && !isProcessing && (
           <button onClick={handleManualCapture} className="flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full border border-white/20 backdrop-blur-md">
             <Camera size={20} />
             <span className="font-medium">No Barcode? Manual Photo</span>
           </button>
         )}
         {mode === 'PHOTO' && !isProcessing && (
            <button onClick={handleManualCapture} className="w-20 h-20 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-black/10"></div>
            </button>
         )}
      </div>
    </div>
  );
};