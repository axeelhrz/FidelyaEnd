'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useComercio } from '@/hooks/useComercio';
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  Palette, 
  Share2,
  Printer,
  Copy,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GenerarQRPage() {
  const { signOut } = useAuth();
  const { comercio, generateQRCode, loading } = useComercio();

  const [qrData, setQrData] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [customization, setCustomization] = useState({
    size: 256,
    margin: 4,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    includeText: true,
    includeLogo: false
  });

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleGenerateQR = async () => {
    if (!comercio) return;

    setGenerating(true);
    try {
      const success = await generateQRCode();
      if (success) {
        setQrData(comercio.qrCode || null);
        toast.success('Código QR generado exitosamente');
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Error al generar el código QR');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData || !comercio) return;

    const link = document.createElement('a');
    link.href = qrData;
    link.download = `qr-${comercio.nombreComercio}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR descargado exitosamente');
  };

  const handleCopyQR = async () => {
    if (!qrData) return;

    try {
      const response = await fetch(qrData);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      toast.success('QR copiado al portapapeles');
    } catch (error) {
      console.error('Error copying QR:', error);
      toast.error('Error al copiar el QR');
    }
  };

  const handlePrintQR = () => {
    if (!qrData) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Código QR - ${comercio?.nombreComercio}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .qr-container { 
                margin: 20px auto; 
                max-width: 400px; 
              }
              .qr-image { 
                max-width: 100%; 
                height: auto; 
              }
              .instructions {
                margin-top: 20px;
                font-size: 14px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <h1>${comercio?.nombreComercio}</h1>
            <div class="qr-container">
              <img src="${qrData}" alt="Código QR" class="qr-image" />
              <div class="instructions">
                <p><strong>Instrucciones para el socio:</strong></p>
                <p>Escanea este código QR para validar tu beneficio como socio activo</p>
                <p>Presenta tu carnet de socio junto con este código</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Load existing QR if available
  useEffect(() => {
    if (comercio?.qrCode) {
      setQrData(comercio.qrCode);
    }
  }, [comercio]);

  if (loading) {
    return (
      <DashboardLayout
        activeSection="qr-generar"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center">
              <RefreshCw size={32} className="text-green-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cargando generador de QR...
            </h3>
            <p className="text-gray-500">Preparando herramientas de código QR</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="qr-generar"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                Generar Código QR
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Crea y personaliza tu código QR para validaciones de beneficios
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => window.location.reload()}
              >
                Actualizar
              </Button>
              <Button
                size="sm"
                leftIcon={<QrCode size={16} />}
                onClick={handleGenerateQR}
                loading={generating}
              >
                {qrData ? 'Regenerar QR' : 'Generar QR'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <QrCode className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Tu Código QR
                  </h3>
                  
                  {qrData ? (
                    <div className="space-y-6">
                      <div className="relative inline-block">
                        <Image
                          src={qrData}
                          alt="Código QR"
                          width={customization.size}
                          height={customization.size}
                          className="mx-auto border-2 border-gray-200 rounded-lg"
                          unoptimized
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 justify-center">
                        <Button
                          variant="outline"
                          leftIcon={<Download size={16} />}
                          onClick={handleDownloadQR}
                        >
                          Descargar
                        </Button>
                        <Button
                          variant="outline"
                          leftIcon={<Copy size={16} />}
                          onClick={handleCopyQR}
                        >
                          Copiar
                        </Button>
                        <Button
                          variant="outline"
                          leftIcon={<Printer size={16} />}
                          onClick={handlePrintQR}
                        >
                          Imprimir
                        </Button>
                        <Button
                          variant="outline"
                          leftIcon={<Share2 size={16} />}
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: `QR Code - ${comercio?.nombreComercio}`,
                                text: 'Escanea este código para validar beneficios',
                                url: window.location.href
                              });
                            } else {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success('Enlace copiado al portapapeles');
                            }
                          }}
                        >
                          Compartir
                        </Button>
                      </div>

                      {/* Customization Panel */}
                      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Palette className="w-5 h-5 mr-2" />
                          Personalización
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tamaño del QR
                            </label>
                            <input
                              type="range"
                              min="128"
                              max="512"
                              value={customization.size}
                              onChange={(e) => setCustomization(prev => ({
                                ...prev,
                                size: parseInt(e.target.value)
                              }))}
                              className="w-full"
                            />
                            <span className="text-sm text-gray-500">{customization.size}px</span>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Color del QR
                            </label>
                            <input
                              type="color"
                              value={customization.color}
                              onChange={(e) => setCustomization(prev => ({
                                ...prev,
                                color: e.target.value
                              }))}
                              className="w-full h-10 rounded-lg border border-gray-300"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Color de fondo
                            </label>
                            <input
                              type="color"
                              value={customization.backgroundColor}
                              onChange={(e) => setCustomization(prev => ({
                                ...prev,
                                backgroundColor: e.target.value
                              }))}
                              className="w-full h-10 rounded-lg border border-gray-300"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={customization.includeText}
                                onChange={(e) => setCustomization(prev => ({
                                  ...prev,
                                  includeText: e.target.checked
                                }))}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                Incluir texto explicativo
                              </span>
                            </label>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={customization.includeLogo}
                                onChange={(e) => setCustomization(prev => ({
                                  ...prev,
                                  includeLogo: e.target.checked
                                }))}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                Incluir logo del comercio
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No hay código QR generado</p>
                        </div>
                      </div>
                      <Button
                        leftIcon={<QrCode size={16} />}
                        onClick={handleGenerateQR}
                        loading={generating}
                        size="lg"
                      >
                        Generar Mi Código QR
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Estado del QR</h3>
                  <p className="text-sm text-gray-500">Información actual</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className={`text-sm font-medium flex items-center ${qrData ? 'text-green-600' : 'text-gray-400'}`}>
                    {qrData ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Generado
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-1" />
                        No generado
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última actualización:</span>
                  <span className="text-sm text-gray-500">
                    {comercio?.actualizadoEn
                      ? ('toDate' in comercio.actualizadoEn && typeof comercio.actualizadoEn.toDate === 'function'
                          ? comercio.actualizadoEn.toDate().toLocaleDateString()
                          : new Date(comercio.actualizadoEn as string | Date).toLocaleDateString())
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tamaño:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {customization.size}x{customization.size}px
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Instrucciones</h3>
                  <p className="text-sm text-blue-600">Cómo usar tu QR</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <p>Genera tu código QR único</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <p>Descarga e imprime el código</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </div>
                  <p>Colócalo en un lugar visible</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    4
                  </div>
                  <p>Los socios lo escanean para validar beneficios</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  leftIcon={<QrCode size={16} />}
                  onClick={handleGenerateQR}
                  loading={generating}
                >
                  {qrData ? 'Regenerar QR' : 'Generar QR'}
                </Button>
                {qrData && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      leftIcon={<Download size={16} />}
                      onClick={handleDownloadQR}
                    >
                      Descargar PNG
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      leftIcon={<Printer size={16} />}
                      onClick={handlePrintQR}
                    >
                      Imprimir
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
