
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (file: File) => void;
  onError: (error: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ 
  isOpen, 
  onClose, 
  onImageCaptured,
  onError
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available in this browser.");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Prioritize rear camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera. Please ensure permissions are granted.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Camera permission denied. Please enable it in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "No camera found. Please ensure a camera is connected and enabled.";
      } else if (err.message) {
        message = err.message;
      }
      setCameraError(message);
      onError(message); // Propagate error up
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup function
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const videoNode = videoRef.current;
      const canvasNode = canvasRef.current;

      // Set canvas dimensions to video stream dimensions
      canvasNode.width = videoNode.videoWidth;
      canvasNode.height = videoNode.videoHeight;

      const context = canvasNode.getContext('2d');
      if (context) {
        context.drawImage(videoNode, 0, 0, canvasNode.width, canvasNode.height);
        canvasNode.toBlob(blob => {
          if (blob) {
            const imageFile = new File([blob], `captured-image-${Date.now()}.png`, { type: 'image/png' });
            onImageCaptured(imageFile);
            onClose(); // Close modal after capture
          } else {
            setCameraError("Failed to capture image. Could not create blob.");
            onError("Failed to capture image from canvas.");
          }
        }, 'image/png');
      } else {
        setCameraError("Failed to get canvas context for image capture.");
        onError("Failed to get canvas context.");
      }
    } else {
        setCameraError("Camera stream not available for capture.");
        onError("Camera stream not available for capture.");
    }
  };
  
  const handleClose = () => {
    stopCamera();
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg space-y-4 transform transition-all">
        <h2 id="camera-modal-title" className="text-2xl font-semibold text-pink-400">Capture Image</h2>
        
        {cameraError && (
          <div className="bg-red-700/50 border border-red-500 text-red-200 p-3 rounded-md text-sm">
            <p className="font-semibold">Camera Error:</p>
            <p>{cameraError}</p>
          </div>
        )}

        <div className="relative aspect-video bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted  // Mute to avoid feedback loops if microphone was accidentally requested
            className="w-full h-full object-cover"
            aria-label="Live camera feed"
          />
          {!stream && !cameraError && (
             <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <svg className="animate-spin h-8 w-8 text-pink-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Initializing Camera...
             </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleCapture}
            disabled={!stream || !!cameraError}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Capture image from camera"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.174C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.174 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            Capture Image
          </button>
          <button
            onClick={handleClose}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-slate-600 hover:bg-slate-500 text-slate-100 font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors duration-200"
            aria-label="Close camera modal"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
