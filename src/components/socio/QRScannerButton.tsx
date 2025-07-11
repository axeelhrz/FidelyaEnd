import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  X, 
  Zap, 
  AlertCircle, 
  RefreshCw,
  Flashlight,
  FlashlightOff,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
// Import media types to extend MediaTrackCapabilities
import '../../types/media';

interface QRScannerButtonProps {
  onScan: (qrData: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const QRScannerButton: React.FC<QRScannerButtonProps> = ({ 
  onScan, 
  loading = false,
  disabled = false 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<import('@zxing/library').BrowserQRCodeReader | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize QR scanner when component mounts
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        // Dynamically import QR scanner library
        const { BrowserQRCodeReader } = await import('@zxing/library');
        scannerRef.current = new BrowserQRCodeReader();
        console.log('✅ QR Scanner initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize QR scanner:', error);
        setError('Error al inicializar el escáner. Verifica que tu navegador sea compatible.');
      }
    };

    initializeScanner();

    return () => {
      stopScanning();
    };
  }, []);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      console.log('🎥 Requesting camera permission...');
      
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      console.log('✅ Camera permission granted');
      return true;
    } catch (error: unknown) {
      console.error('❌ Camera permission denied:', error);

      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        typeof (error as { name: string }).name === 'string'
      ) {
        const errorName = (error as { name: string }).name;
        if (errorName === 'NotAllowedError') {
          setError('Acceso a la cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
        } else if (errorName === 'NotFoundError') {
          setError('No se encontró una cámara disponible en tu dispositivo.');
        } else if (errorName === 'NotReadableError') {
          setError('La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.');
        } else if (errorName === 'OverconstrainedError') {
          setError('La configuración de cámara solicitada no es compatible con tu dispositivo.');
        } else {
          setError('Error al acceder a la cámara. Verifica que tu dispositivo tenga una cámara funcional.');
        }
      } else {
        setError('Error al acceder a la cámara. Verifica que tu dispositivo tenga una cámara funcional.');
      }

      return false;
    }
  };

  const startScanning = async () => {
    if (!scannerRef.current) {
      setError('Escáner no inicializado. Recarga la página e intenta de nuevo.');
      return;
    }

    try {
      console.log('🔍 Starting QR scan...');
      setError(null);
      setIsScanning(true);
      setIsProcessing(false);

      // Request camera permission and start stream
      const hasAccess = await requestCameraPermission();
      if (!hasAccess) {
        setIsScanning(false);
        return;
      }

      // Wait for video to be ready
      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error('Elemento de video no encontrado');
      }

      // Wait for video metadata to load
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for video to load'));
        }, 10000);

        videoElement.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };

        videoElement.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Error loading video'));
        };
      });

      console.log('📹 Video ready, starting QR detection...');

      // Start continuous scanning
      startContinuousScanning();

    } catch (error: unknown) {
      console.error('❌ Scanning error:', error);

      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: string }).message === 'string'
      ) {
        const errorMessage = (error as { message: string }).message;
        if (errorMessage.includes('Timeout')) {
          setError('Tiempo de espera agotado. Verifica que la cámara esté funcionando correctamente.');
        } else {
          setError('Error al iniciar el escaneo. Intenta de nuevo.');
        }
      } else {
        setError('Error al iniciar el escaneo. Intenta de nuevo.');
      }

      stopScanning();
    }
  };

  const startContinuousScanning = () => {
    if (!scannerRef.current || !videoRef.current || !streamRef.current) {
      return;
    }

    const scanFrame = async () => {
      try {
        if (!isScanning || isProcessing) {
          return;
        }

        let result = null;
        if (scannerRef.current) {
          result = await scannerRef.current.decodeOnceFromVideoDevice(
            undefined,
            videoRef.current ?? undefined
          );
        }
        
        if (result) {
          const qrText = result.getText();
          console.log('🎯 QR Code detected:', qrText);
          
          setIsProcessing(true);
          
          // Vibrate if supported
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }

          // Show success feedback
          toast.success('¡Código QR detectado!');
          
          // Call the onScan callback
          onScan(qrText);
          
          // Stop scanning after successful detection
          setTimeout(() => {
            stopScanning();
          }, 1000);
          
          return;
        }
      } catch {
        // Ignore scanning errors and continue
        // console.log('Scanning frame, no QR detected');
      }

      // Continue scanning if still active
      if (isScanning && !isProcessing) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    // Start the scanning loop
    scanFrame();
  };

  const stopScanning = () => {
    try {
      console.log('🛑 Stopping QR scan...');
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop the scanner
      if (scannerRef.current) {
        try {
          scannerRef.current.reset();
        } catch (error) {
          console.warn('Error resetting scanner:', error);
        }
      }

      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('📹 Stopped video track:', track.kind);
        });
        streamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsScanning(false);
      setIsProcessing(false);
      setFlashEnabled(false);
      
      console.log('✅ QR scan stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping scanner:', error);
    }
  };

  const toggleFlash = async () => {
    try {
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        
        // Check if torch capability exists and is supported
        if (capabilities.torch === true) {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !flashEnabled } as MediaTrackConstraintSet]
          });
          setFlashEnabled(!flashEnabled);
          toast.success(flashEnabled ? 'Flash desactivado' : 'Flash activado');
        } else {
          toast.error('Flash no disponible en este dispositivo');
        }
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      toast.error('Error al controlar el flash');
    }
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 500);
    }
    
    toast.success(`Cambiando a cámara ${newFacingMode === 'user' ? 'frontal' : 'trasera'}`);
  };

  const handleRetry = () => {
    setError(null);
    startScanning();
  };

  if (!isScanning) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={startScanning}
        disabled={loading || disabled}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 relative overflow-hidden group"
      >
        {/* Button shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {loading ? (
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Validando...</span>
          </div>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            <span>Escanear Código QR</span>
          </>
        )}
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 safe-area-top">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-violet-400" />
              <div>
                <span className="font-semibold">Escanear QR</span>
                {isProcessing && (
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">¡Código detectado!</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Flash Toggle */}
              <button
                onClick={toggleFlash}
                className={`p-2 rounded-lg transition-colors ${
                  flashEnabled ? 'bg-yellow-500' : 'bg-white/20 hover:bg-white/30'
                }`}
                title={flashEnabled ? 'Desactivar flash' : 'Activar flash'}
              >
                {flashEnabled ? (
                  <Flashlight className="w-5 h-5" />
                ) : (
                  <FlashlightOff className="w-5 h-5" />
                )}
              </button>
              
              {/* Camera Switch */}
              <button
                onClick={switchCamera}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="Cambiar cámara"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              {/* Close Button */}
              <button
                onClick={stopScanning}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="Cerrar escáner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="relative w-full h-full flex items-center justify-center">
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-white p-8 max-w-md mx-4"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Error de Cámara</h3>
              <p className="text-gray-300 mb-6 text-sm leading-relaxed">{error}</p>
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Intentar de nuevo</span>
                </button>
                
                <button
                  onClick={stopScanning}
                  className="w-full border border-white/30 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning Frame */}
                  <div className={`w-64 h-64 border-2 rounded-2xl relative transition-colors duration-300 ${
                    isProcessing ? 'border-green-400' : 'border-white/50'
                  }`}>
                    {/* Corner indicators */}
                    <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-violet-400'
                    }`} />
                    <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-violet-400'
                    }`} />
                    <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-violet-400'
                    }`} />
                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-violet-400'
                    }`} />
                    
                    {/* Scanning line animation */}
                    {!isProcessing && (
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                        animate={{
                          y: [0, 256, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Success indicator */}
                    {isProcessing && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-center">
                    <p className={`text-white text-sm font-medium transition-colors duration-300 ${
                      isProcessing ? 'text-green-400' : ''
                    }`}>
                      {isProcessing ? '¡Código QR detectado!' : 'Coloca el código QR dentro del marco'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Instructions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 safe-area-bottom">
          <div className="text-center text-white">
            <p className="text-sm opacity-80 mb-2">
              Mantén el teléfono estable y asegúrate de que haya buena iluminación
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs opacity-60">
              <span>• Enfoque automático</span>
              <span>• Detección instantánea</span>
              <span>• Seguro y privado</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};