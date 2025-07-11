'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  QrCode,
  Download,
  Share,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Store,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import QRCodeLib from 'qrcode';
import Image from 'next/image';

interface QRGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  comercio: {
    id: string;
    nombreComercio: string;
    qrCode?: string;
    qrCodeUrl?: string;
  } | null;
  onGenerateQR: (comercioId: string) => Promise<{ qrCode: string; qrCodeUrl: string } | null>;
  loading?: boolean;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({
  open,
  onClose,
  comercio,
  onGenerateQR,
}) => {
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [qrText, setQrText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrSize, setQrSize] = useState(256);
  const [includeText, setIncludeText] = useState(true);

  // Generar QR cuando se abre el modal
  const generateQRCode = React.useCallback(async () => {
    if (!comercio) return;

    setGenerating(true);
    try {
      // Primero intentar generar desde el servicio
      const result = await onGenerateQR(comercio.id);
      
      let qrCodeData = result?.qrCode || comercio.qrCode;
      
      // Si no hay QR code, generar uno temporal
      if (!qrCodeData) {
        qrCodeData = `https://fidelya.app/validar/${comercio.id}`;
      }

      setQrText(qrCodeData);

      // Generar imagen QR
      const qrOptions = {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      const qrDataURL = await QRCodeLib.toDataURL(qrCodeData, qrOptions);
      setQrDataURL(qrDataURL);
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Error al generar el código QR');
    } finally {
      setGenerating(false);
    }
  }, [comercio, onGenerateQR, qrSize]);

  useEffect(() => {
    if (open && comercio) {
      generateQRCode();
    }
  }, [open, comercio, generateQRCode]);

  // Regenerar QR cuando cambia el tamaño
  useEffect(() => {
    if (qrText) {
      const generateWithNewSize = async () => {
        try {
          const qrOptions = {
            width: qrSize,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          };
          const qrDataURL = await QRCodeLib.toDataURL(qrText, qrOptions);
          setQrDataURL(qrDataURL);
        } catch (error) {
          console.error('Error regenerating QR:', error);
        }
      };
      generateWithNewSize();
    }
  }, [qrSize, qrText]);

  const handleCopyText = async () => {
    if (!qrText) return;
    
    try {
      await navigator.clipboard.writeText(qrText);
      setCopied(true);
      toast.success('Texto copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar el texto');
    }
  };

  const handleDownload = () => {
    if (!qrDataURL || !comercio) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = () => {
      // Calcular dimensiones del canvas
      const padding = 40;
      const textHeight = includeText ? 60 : 0;
      canvas.width = qrSize + (padding * 2);
      canvas.height = qrSize + (padding * 2) + textHeight;

      if (!ctx) return;

      // Fondo blanco
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar QR
      ctx.drawImage(img, padding, padding, qrSize, qrSize);

      // Agregar texto si está habilitado
      if (includeText) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          comercio.nombreComercio,
          canvas.width / 2,
          qrSize + padding + 30
        );
        
        ctx.font = '12px Arial';
        ctx.fillText(
          'Escanea para validar beneficios',
          canvas.width / 2,
          qrSize + padding + 50
        );
      }

      // Descargar
      const link = document.createElement('a');
      link.download = `QR_${comercio.nombreComercio.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('QR descargado correctamente');
    };

    img.src = qrDataURL;
  };

  const handlePrint = () => {
    if (!qrDataURL || !comercio) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${comercio.nombreComercio}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 20px;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #000;
              padding: 20px;
              margin: 20px;
            }
            .qr-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .qr-subtitle {
              font-size: 14px;
              color: #666;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">${comercio.nombreComercio}</div>
            <img src="${qrDataURL}" alt="QR Code" style="width: ${qrSize}px; height: ${qrSize}px;" />
            <div class="qr-subtitle">Escanea para validar beneficios</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = async () => {
    if (!qrDataURL || !comercio) return;

    try {
      // Convertir data URL a blob
      const response = await fetch(qrDataURL);
      const blob = await response.blob();
      const file = new File([blob], `QR_${comercio.nombreComercio}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `QR Code - ${comercio.nombreComercio}`,
          text: 'Código QR para validar beneficios',
          files: [file]
        });
      } else {
        // Fallback: copiar imagen al portapapeles
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        toast.success('QR copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error sharing QR:', error);
      toast.error('Error al compartir el QR');
    }
  };

  const handleClose = () => {
    setQrDataURL('');
    setQrText('');
    setCopied(false);
    setGenerating(false);
    onClose();
  };

  if (!open || !comercio) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Código QR
                  </h3>
                  <p className="text-indigo-100 text-sm">
                    {comercio.nombreComercio}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-indigo-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-600">Generando código QR...</p>
              </div>
            ) : qrDataURL ? (
              <div className="space-y-6">
                {/* QR Display */}
                <div className="flex justify-center">
                  <div>
                    <Image
                      src={qrDataURL}
                      alt="QR Code"
                      className="mx-auto"
                      width={qrSize}
                      height={qrSize}
                      style={{ width: qrSize, height: qrSize }}
                      unoptimized
                      priority
                    />
                    {includeText && (
                      <div className="text-center mt-4">
                        <p className="font-semibold text-gray-900">{comercio.nombreComercio}</p>
                        <p className="text-sm text-gray-600">Escanea para validar beneficios</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño del QR
                    </label>
                    <select
                      value={qrSize}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value={128}>Pequeño (128px)</option>
                      <option value={256}>Mediano (256px)</option>
                      <option value={512}>Grande (512px)</option>
                      <option value={1024}>Extra Grande (1024px)</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeText}
                        onChange={(e) => setIncludeText(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Incluir texto descriptivo
                      </span>
                    </label>
                  </div>
                </div>

                {/* QR Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del código QR
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={qrText}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={handleCopyText}
                      className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Copiar URL"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Compartir
                  </button>

                  <button
                    onClick={generateQRCode}
                    disabled={generating}
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    Regenerar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-gray-600 mb-4">Error al generar el código QR</p>
                <button
                  onClick={generateQRCode}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <Store className="w-4 h-4 inline mr-1" />
                El QR permite validar beneficios en este comercio
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
