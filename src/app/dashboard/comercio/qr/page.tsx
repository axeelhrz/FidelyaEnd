'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useComercio } from '@/hooks/useComercio'; // Usar el hook correcto para comercios individuales
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  Palette, 
  BarChart3,
  Share2,
  Printer,
  Copy,
  Eye,
  Zap,
  Smartphone,
  Monitor,
  Tablet,
  ChevronRight,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ComercioQRContent() {
  const { signOut } = useAuth();
  const { comercio, stats, loading, generateQRCode } = useComercio(); // Hook correcto
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'generar';

  const [generating, setGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  type DeviceType = 'mobile' | 'tablet' | 'desktop';
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('mobile');
  const [customization, setCustomization] = useState({
    size: 256,
    margin: 4,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    includeText: true,
    includeLogo: false,
    style: 'default',
    cornerRadius: 0
  });

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleGenerateQR = async () => {
    if (!comercio) {
      toast.error('❌ No se pudo identificar el comercio');
      return;
    }

    setGenerating(true);
    try {
      // Mostrar toast de inicio
      const loadingToast = toast.loading('🔄 Generando código QR...');
      
      const success = await generateQRCode();
      
      // Remover toast de loading
      toast.dismiss(loadingToast);
      
      if (success) {
        // Toast de éxito con animación
        toast.success('🎉 ¡Código QR generado exitosamente!', {
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontWeight: '600',
            borderRadius: '12px',
            padding: '16px 20px',
          },
        });
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('❌ Error al generar el código QR', {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!comercio?.qrCode) {
      toast.error('❌ No hay código QR para descargar');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = comercio.qrCode;
      link.download = `qr-${comercio.nombreComercio.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('📥 QR descargado exitosamente', {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      });
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('❌ Error al descargar el QR');
    }
  };

  const handleCopyQR = async () => {
    if (!comercio?.qrCode) {
      toast.error('❌ No hay código QR para copiar');
      return;
    }

    try {
      const response = await fetch(comercio.qrCode);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      toast.success('📋 QR copiado al portapapeles', {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      });
    } catch (error) {
      console.error('Error copying QR:', error);
      toast.error('❌ Error al copiar el QR');
    }
  };

  const handlePrintQR = () => {
    if (!comercio?.qrCode) {
      toast.error('❌ No hay código QR para imprimir');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Código QR - ${comercio.nombreComercio}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              
              body { 
                font-family: 'Inter', system-ui, -apple-system, sans-serif; 
                text-align: center; 
                padding: 40px 20px; 
                margin: 0;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                color: #1e293b;
              }
              
              .print-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 24px;
                padding: 40px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              }
              
              .header {
                margin-bottom: 30px;
              }
              
              .logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                border-radius: 20px;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 32px;
                font-weight: bold;
              }
              
              .title {
                font-size: 28px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 8px;
              }
              
              .subtitle {
                font-size: 16px;
                color: #64748b;
                margin-bottom: 30px;
              }
              
              .qr-section {
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                border-radius: 20px;
                padding: 30px;
                margin: 30px 0;
              }
              
              .qr-image { 
                width: 280px;
                height: 280px;
                margin: 0 auto 20px;
                display: block;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              }
              
              .instructions {
                margin-top: 30px;
                text-align: left;
                background: #f8fafc;
                border-radius: 16px;
                padding: 24px;
                border-left: 4px solid #3b82f6;
              }
              
              .instructions h3 {
                color: #1e293b;
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .instructions ol {
                margin: 0;
                padding-left: 20px;
                color: #475569;
                line-height: 1.6;
              }
              
              .instructions li {
                margin-bottom: 8px;
                font-size: 14px;
              }
              
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                font-size: 12px;
                color: #64748b;
              }
              
              .url-box {
                background: #f1f5f9;
                border: 2px dashed #cbd5e1;
                border-radius: 12px;
                padding: 12px;
                margin: 16px 0;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 11px;
                word-break: break-all;
                color: #475569;
              }
              
              @media print {
                body { 
                  background: white !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .print-container { 
                  box-shadow: none;
                  border: 2px solid #e2e8f0;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="header">
                <div class="logo">QR</div>
                <h1 class="title">${comercio.nombreComercio}</h1>
                <p class="subtitle">Código QR para Validación de Beneficios</p>
              </div>
              
              <div class="qr-section">
                <img src="${comercio.qrCode}" alt="Código QR" class="qr-image" />
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  Escanea este código para acceder a los beneficios
                </p>
              </div>
              
              <div class="instructions">
                <h3>📱 Instrucciones para Socios</h3>
                <ol>
                  <li>Abre la cámara de tu teléfono o una app de escaneo QR</li>
                  <li>Apunta la cámara hacia este código QR</li>
                  <li>Toca la notificación que aparece en tu pantalla</li>
                  <li>Inicia sesión con tu cuenta de socio</li>
                  <li>¡Disfruta de tus beneficios exclusivos!</li>
                </ol>
                
                <div class="url-box">
                  <strong>URL directa:</strong><br>
                  ${window.location.origin}/validar-beneficio?comercio=${comercio.id}
                </div>
              </div>
              
              <div class="footer">
                <p><strong>Generado el:</strong> ${new Date().toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p>Este código QR es único para ${comercio.nombreComercio}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      
      toast.success('🖨️ Ventana de impresión abierta', {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      });
    }
  };

  const handleShareQR = async () => {
    if (!comercio?.qrCode) {
      toast.error('❌ No hay código QR para compartir');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Código QR - ${comercio.nombreComercio}`,
          text: '🎯 Escanea este código QR para acceder a beneficios exclusivos',
          url: `${window.location.origin}/validar-beneficio?comercio=${comercio.id}`
        });
        toast.success('📤 Compartido exitosamente');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/validar-beneficio?comercio=${comercio.id}`);
      toast.success('🔗 Enlace copiado al portapapeles', {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      });
    }
  };

  const tabs = [
    {
      id: 'generar',
      label: 'Generar',
      icon: QrCode,
      description: 'Crear y gestionar tu código QR',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'personalizar',
      label: 'Personalizar',
      icon: Palette,
      description: 'Customizar apariencia del QR',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'descargar',
      label: 'Descargar',
      icon: Download,
      description: 'Opciones de descarga y compartir',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'estadisticas',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Análisis de uso del QR',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const devicePresets = [
    { id: 'mobile', icon: Smartphone, label: 'Móvil', width: '375px' },
    { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
    { id: 'desktop', icon: Monitor, label: 'Desktop', width: '1024px' }
  ];

  if (loading) {
    return (
      <DashboardLayout
        activeSection="qr"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <RefreshCw size={40} className="text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Cargando Dashboard QR
            </h3>
            <p className="text-gray-600 text-lg">Preparando herramientas avanzadas...</p>
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-blue-500 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="qr"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Header */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
          
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-64 h-64 bg-white/5 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [0, 30, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          <div className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/80 font-medium">Dashboard QR</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                    Gestión
                    <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                      Inteligente
                    </span>
                  </h1>
                  
                  <p className="text-xl text-white/90 mb-8 leading-relaxed">
                    Crea, personaliza y gestiona códigos QR con tecnología avanzada. 
                    Experiencia optimizada para todos los dispositivos.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                      leftIcon={generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                      onClick={handleGenerateQR}
                      disabled={generating}
                    >
                      {generating ? 'Generando...' : (comercio?.qrCode ? 'Regenerar QR' : 'Crear QR Ahora')}
                    </Button>
                    
                    {comercio?.qrCode && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                        leftIcon={<Download size={20} />}
                        onClick={handleDownloadQR}
                      >
                        Descargar
                      </Button>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="relative">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <motion.div 
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stats?.validacionesHoy || 0}</p>
                            <p className="text-white/70 text-sm">Escaneos Hoy</p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div 
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-400 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stats?.clientesUnicos || 0}</p>
                            <p className="text-white/70 text-sm">Usuarios</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* QR Preview */}
                    {comercio?.qrCode && (
                      <motion.div 
                        className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="text-center">
                          <p className="text-white/80 text-sm mb-4">Vista Previa</p>
                          <div className="relative inline-block">
                            <Image
                              src={comercio.qrCode}
                              alt="QR Preview"
                              width={120}
                              height={120}
                              className="rounded-2xl shadow-2xl"
                              unoptimized
                            />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 py-4 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', tab.id);
                    window.history.pushState({}, '', url.toString());
                    window.location.reload();
                  }}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-blue-500/25 scale-105`
                      : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900 border border-gray-200/50'
                  }`}
                  whileHover={{ scale: activeTab === tab.id ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Generate Tab */}
              {activeTab === 'generar' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Main QR Section */}
                  <div className="xl:col-span-2">
                    <motion.div
                      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="p-8 lg:p-12">
                        <div className="text-center">
                          <motion.div
                            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <QrCode className="w-10 h-10 text-white" />
                          </motion.div>
                          
                          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            Tu Código QR
                          </h2>
                          <p className="text-gray-600 text-lg mb-8">
                            Código único para validación de beneficios
                          </p>
                          
                          {comercio?.qrCode ? (
                            <motion.div 
                              className="space-y-8"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            >
                              {/* QR Code Display */}
                              <div className="relative inline-block">
                                <motion.div
                                  className="relative"
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                >
                                  <Image
                                    src={comercio.qrCode}
                                    alt="Código QR"
                                    width={280}
                                    height={280}
                                    className="w-70 h-70 mx-auto rounded-3xl shadow-2xl border-4 border-white"
                                    unoptimized
                                  />
                                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  </div>
                                </motion.div>
                                
                                <button
                                  onClick={() => setIsFullscreen(!isFullscreen)}
                                  className="absolute top-4 right-4 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors"
                                >
                                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                              </div>

                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <motion.button
                                  onClick={handleDownloadQR}
                                  className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Download className="w-6 h-6 text-white" />
                                  </div>
                                  <span className="text-sm font-semibold text-blue-700">Descargar</span>
                                </motion.button>

                                <motion.button
                                  onClick={handleCopyQR}
                                  className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Copy className="w-6 h-6 text-white" />
                                  </div>
                                  <span className="text-sm font-semibold text-purple-700">Copiar</span>
                                </motion.button>

                                <motion.button
                                  onClick={handlePrintQR}
                                  className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Printer className="w-6 h-6 text-white" />
                                  </div>
                                  <span className="text-sm font-semibold text-green-700">Imprimir</span>
                                </motion.button>

                                <motion.button
                                  onClick={handleShareQR}
                                  className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 group"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Share2 className="w-6 h-6 text-white" />
                                  </div>
                                  <span className="text-sm font-semibold text-orange-700">Compartir</span>
                                </motion.button>
                              </div>

                              {/* QR Info */}
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-semibold text-gray-700">Comercio:</span>
                                    <p className="text-gray-600 mt-1">{comercio.nombreComercio}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700">Generado:</span>
                                    <p className="text-gray-600 mt-1">
                                      {new Date().toLocaleDateString('es-ES')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div 
                              className="space-y-8"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="w-80 h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto border-4 border-dashed border-gray-300">
                                <div className="text-center">
                                  <QrCode className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-500 text-lg">No hay código QR</p>
                                </div>
                              </div>
                              
                              <Button
                                size="lg"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                                leftIcon={generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                onClick={handleGenerateQR}
                                disabled={generating}
                              >
                                {generating ? 'Generando...' : 'Generar Mi Código QR'}
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Status Card */}
                    <motion.div
                      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Estado del QR</h3>
                          <p className="text-sm text-gray-600">Información actual</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Estado:</span>
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            comercio?.qrCode 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {comercio?.qrCode ? '✅ Activo' : '⏳ Pendiente'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Escaneos hoy:</span>
                          <span className="text-sm font-bold text-blue-600">
                            {stats?.validacionesHoy || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total mes:</span>
                          <span className="text-sm font-bold text-purple-600">
                            {stats?.validacionesMes || 0}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Instructions Card */}
                    <motion.div
                      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border border-blue-200/50 p-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                          <Info className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Guía Rápida</h3>
                          <p className="text-sm text-blue-600">Cómo usar tu QR</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { step: 1, text: 'Genera tu código QR único', icon: '🎯' },
                          { step: 2, text: 'Descarga e imprime el código', icon: '📥' },
                          { step: 3, text: 'Colócalo en lugar visible', icon: '📍' },
                          { step: 4, text: 'Los socios escanean para validar', icon: '📱' }
                        ].map((item, index) => (
                          <motion.div
                            key={item.step}
                            className="flex items-start space-x-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                          >
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {item.step}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                <span className="mr-2">{item.icon}</span>
                                {item.text}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                        Acciones Rápidas
                      </h3>
                      
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start hover:bg-blue-50 border-blue-200 text-blue-700"
                          leftIcon={generating ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                          onClick={handleGenerateQR}
                          disabled={generating}
                        >
                          {generating ? 'Generando...' : (comercio?.qrCode ? 'Regenerar QR' : 'Generar QR')}
                        </Button>
                        
                        {comercio?.qrCode && (
                          <>
                            <Button
                              variant="outline"
                              className="w-full justify-start hover:bg-green-50 border-green-200 text-green-700"
                              leftIcon={<Download size={16} />}
                              onClick={handleDownloadQR}
                            >
                              Descargar PNG
                            </Button>
                            
                            <Button
                              variant="outline"
                              className="w-full justify-start hover:bg-purple-50 border-purple-200 text-purple-700"
                              leftIcon={<Printer size={16} />}
                              onClick={handlePrintQR}
                            >
                              Imprimir
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Customize Tab */}
              {activeTab === 'personalizar' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Customization Controls */}
                  <motion.div
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center space-x-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <Palette className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Personalizar QR</h2>
                        <p className="text-gray-600">Ajusta la apariencia de tu código</p>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Size Control */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                          Tamaño del QR
                        </label>
                        <div className="space-y-3">
                          <input
                            type="range"
                            min="128"
                            max="512"
                            value={customization.size}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              size: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>128px</span>
                            <span className="font-semibold text-purple-600">{customization.size}px</span>
                            <span>512px</span>
                          </div>
                        </div>
                      </div>

                      {/* Color Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Color del QR
                          </label>
                          <div className="relative">
                            <input
                              type="color"
                              value={customization.color}
                              onChange={(e) => setCustomization(prev => ({
                                ...prev,
                                color: e.target.value
                              }))}
                              className="w-full h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                            />
                            <div className="absolute inset-0 rounded-xl border-2 border-gray-200 pointer-events-none"></div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Color de fondo
                          </label>
                          <div className="relative">
                            <input
                              type="color"
                              value={customization.backgroundColor}
                              onChange={(e) => setCustomization(prev => ({
                                ...prev,
                                backgroundColor: e.target.value
                              }))}
                              className="w-full h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                            />
                            <div className="absolute inset-0 rounded-xl border-2 border-gray-200 pointer-events-none"></div>
                          </div>
                        </div>
                      </div>

                      {/* Style Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                          Estilo del QR
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'default', name: 'Clásico', preview: '⬛' },
                            { id: 'rounded', name: 'Redondeado', preview: '⬜' },
                            { id: 'dots', name: 'Puntos', preview: '⚫' }
                          ].map((style) => (
                            <motion.button
                              key={style.id}
                              onClick={() => setCustomization(prev => ({ ...prev, style: style.id }))}
                              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                                customization.style === style.id
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="text-2xl mb-2">{style.preview}</div>
                              <div className="text-sm font-medium">{style.name}</div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customization.includeText}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              includeText: e.target.checked
                            }))}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Incluir texto explicativo
                          </span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customization.includeLogo}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              includeLogo: e.target.checked
                            }))}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Incluir logo del comercio
                          </span>
                        </label>
                      </div>

                      {/* Apply Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        leftIcon={generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                        onClick={handleGenerateQR}
                        disabled={generating}
                      >
                        {generating ? 'Aplicando...' : 'Aplicar Personalización'}
                      </Button>
                    </div>
                  </motion.div>

                  {/* Preview */}
                  <motion.div
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Vista Previa</h3>
                      
                      {/* Device Preview Selector */}
                      <div className="flex justify-center space-x-2 mb-8">
                        {devicePresets.map((device) => (
                          <button
                            key={device.id}
                            onClick={() => setPreviewDevice(device.id as DeviceType)}
                            className={`p-3 rounded-xl transition-all duration-300 ${
                              previewDevice === device.id
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <device.icon size={20} />
                          </button>
                        ))}
                      </div>

                      {/* Preview Container */}
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 mb-6">
                        <div 
                          className="mx-auto bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500"
                          style={{ 
                            width: devicePresets.find(d => d.id === previewDevice)?.width,
                            maxWidth: '100%'
                          }}
                        >
                          <div className="p-6">
                            <div className="text-center">
                              {comercio?.qrCode ? (
                                <div className="space-y-4">
                                  <Image
                                    src={comercio.qrCode}
                                    alt="Preview QR"
                                    width={customization.size / 2}
                                    height={customization.size / 2}
                                    className="mx-auto rounded-2xl shadow-lg"
                                    style={{
                                      width: Math.min(customization.size / 2, 150),
                                      height: Math.min(customization.size / 2, 150),
                                      filter: `hue-rotate(${customization.color === '#000000' ? '0' : '180'}deg)`
                                    }}
                                    unoptimized
                                  />
                                  {customization.includeText && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {comercio.nombreComercio}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        Escanea para validar beneficio
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div 
                                  className="bg-gray-300 rounded-2xl flex items-center justify-center"
                                  style={{ 
                                    width: Math.min(customization.size / 2, 150),
                                    height: Math.min(customization.size / 2, 150)
                                  }}
                                >
                                  <QrCode className="w-12 h-12 text-gray-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview Info */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Vista en {devicePresets.find(d => d.id === previewDevice)?.label}:</span>
                          <br />
                          Tamaño: {customization.size}px • Estilo: {customization.style}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Download Tab */}
              {activeTab === 'descargar' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Download Options */}
                  <motion.div
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center space-x-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <Download className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Opciones de Descarga</h2>
                        <p className="text-gray-600">Múltiples formatos disponibles</p>
                      </div>
                    </div>
                    
                    {comercio?.qrCode ? (
                      <div className="space-y-6">
                        {/* Format Options */}
                        <div className="grid grid-cols-1 gap-4">
                          {[
                            {
                              format: 'PNG',
                              description: 'Imagen de alta calidad (Recomendado)',
                              icon: '🖼️',
                              action: handleDownloadQR,
                              color: 'from-blue-500 to-blue-600'
                            },
                            {
                              format: 'PDF',
                              description: 'Documento listo para imprimir',
                              icon: '📄',
                              action: handlePrintQR,
                              color: 'from-red-500 to-red-600'
                            },
                            {
                              format: 'SVG',
                              description: 'Vector escalable (Próximamente)',
                              icon: '⚡',
                              action: () => toast('🚀 Formato SVG próximamente disponible'),
                              color: 'from-purple-500 to-purple-600',
                              disabled: true
                            }
                          ].map((option, index) => (
                            <motion.button
                              key={option.format}
                              onClick={option.action}
                              disabled={option.disabled}
                              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                                option.disabled
                                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                              }`}
                              whileHover={!option.disabled ? { scale: 1.02 } : {}}
                              whileTap={!option.disabled ? { scale: 0.98 } : {}}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center text-white text-xl`}>
                                  {option.icon}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-gray-900 mb-1">
                                    Descargar {option.format}
                                  </h3>
                                  <p className="text-sm text-gray-600">{option.description}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              </div>
                            </motion.button>
                          ))}
                        </div>

                        {/* Share Options */}
                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <Share2 className="w-5 h-5 mr-2 text-blue-500" />
                            Compartir
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <motion.button
                              onClick={handleCopyQR}
                              className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Copy className="w-6 h-6 text-white" />
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-purple-700">Copiar QR</p>
                                <p className="text-xs text-purple-600">Al portapapeles</p>
                              </div>
                            </motion.button>

                            <motion.button
                              onClick={handleShareQR}
                              className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 group"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ExternalLink className="w-6 h-6 text-white" />
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-orange-700">Compartir URL</p>
                                <p className="text-xs text-orange-600">Enlace directo</p>
                              </div>
                            </motion.button>
                          </div>
                        </div>

                        {/* Print Instructions */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                          <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                            <Printer className="w-5 h-5 mr-2" />
                            Consejos para Imprimir
                          </h4>
                          <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start space-x-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span>Usa papel de alta calidad para mejor durabilidad</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span>Tamaño mínimo recomendado: 5x5 cm</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span>Evita doblar o dañar el código</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <QrCode className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          No hay código QR disponible
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Primero genera tu código QR para poder descargarlo
                        </p>
                        <Button
                          className="bg-gradient-to-r from-blue-500 to-purple-600"
                          leftIcon={generating ? <Loader2 size={20} className="animate-spin" /> : <QrCode size={20} />}
                          onClick={handleGenerateQR}
                          disabled={generating}
                        >
                          {generating ? 'Generando...' : 'Generar Código QR'}
                        </Button>
                      </div>
                    )}
                  </motion.div>

                  {/* Preview & Info */}
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {/* QR Preview */}
                    {comercio?.qrCode && (
                      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                          Vista Previa de Descarga
                        </h3>
                        
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
                          <Image
                            src={comercio.qrCode}
                            alt="QR para descargar"
                            width={200}
                            height={200}
                            className="w-50 h-50 mx-auto rounded-2xl shadow-lg border-4 border-white"
                            unoptimized
                          />
                          <p className="text-sm text-gray-600 mt-4">
                            Resolución: {customization.size}x{customization.size}px
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Usage Stats */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-blue-500" />
                        Estadísticas de Uso
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {stats?.validacionesHoy || 0}
                          </p>
                          <p className="text-sm text-blue-600 font-medium">Escaneos Hoy</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {stats?.validacionesMes || 0}
                          </p>
                          <p className="text-sm text-green-600 font-medium">Total Mes</p>
                        </div>
                      </div>
                    </div>

                    {/* Best Practices */}
                    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl border border-green-200/50 p-8">
                      <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center">
                        <Star className="w-6 h-6 mr-3 text-green-600" />
                        Mejores Prácticas
                      </h3>
                      
                      <div className="space-y-4">
                        {[
                          { icon: '📍', text: 'Coloca el QR a la altura de los ojos' },
                          { icon: '💡', text: 'Asegúrate de que haya buena iluminación' },
                          { icon: '🧹', text: 'Mantén el código limpio y sin daños' },
                          { icon: '📝', text: 'Incluye instrucciones claras para los socios' },
                          { icon: '📱', text: 'Prueba el escaneo antes de colocarlo' }
                        ].map((tip, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center space-x-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <span className="text-lg">{tip.icon}</span>
                            <span className="text-sm text-green-800">{tip.text}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'estadisticas' && (
                <div className="space-y-8">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        title: 'Escaneos Hoy',
                        value: stats?.validacionesHoy || 0,
                        icon: Eye,
                        color: 'from-blue-500 to-blue-600',
                        bgColor: 'from-blue-50 to-blue-100',
                        change: '+12%'
                      },
                      {
                        title: 'Total Mes',
                        value: stats?.validacionesMes || 0,
                        icon: Calendar,
                        color: 'from-green-500 to-green-600',
                        bgColor: 'from-green-50 to-green-100',
                        change: '+8%'
                      },
                      {
                        title: 'Usuarios Únicos',
                        value: stats?.clientesUnicos || 0,
                        icon: Users,
                        color: 'from-purple-500 to-purple-600',
                        bgColor: 'from-purple-50 to-purple-100',
                        change: '+15%'
                      },
                      {
                        title: 'Tasa de Éxito',
                        value: '98.5%',
                        icon: CheckCircle2,
                        color: 'from-orange-500 to-orange-600',
                        bgColor: 'from-orange-50 to-orange-100',
                        change: '+2%'
                      }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.title}
                        className={`bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 border border-white/50 shadow-xl`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            {stat.change}
                          </span>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Charts and Activity */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Activity Chart */}
                    <motion.div
                      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Actividad por Horas</h3>
                          <p className="text-gray-600">Escaneos durante el día</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* Simple Chart Representation */}
                      <div className="space-y-4">
                        {[
                          { hour: '09:00', value: 15, percentage: 60 },
                          { hour: '12:00', value: 25, percentage: 100 },
                          { hour: '15:00', value: 18, percentage: 72 },
                          { hour: '18:00', value: 22, percentage: 88 },
                          { hour: '21:00', value: 8, percentage: 32 }
                        ].map((data, index) => (
                          <motion.div
                            key={data.hour}
                            className="flex items-center space-x-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                          >
                            <span className="text-sm font-medium text-gray-600 w-12">{data.hour}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${data.percentage}%` }}
                                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 w-8">{data.value}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Actividad Reciente</h3>
                          <p className="text-gray-600">Últimos escaneos</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { time: 'Hace 5 min', status: 'success', user: 'Socio #1234' },
                          { time: 'Hace 12 min', status: 'success', user: 'Socio #5678' },
                          { time: 'Hace 18 min', status: 'success', user: 'Socio #9012' },
                          { time: 'Hace 25 min', status: 'success', user: 'Socio #3456' },
                          { time: 'Hace 32 min', status: 'success', user: 'Socio #7890' }
                        ].map((activity, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <QrCode className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                QR escaneado por {activity.user}
                              </p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <Button
                          variant="outline"
                          className="w-full justify-center"
                          rightIcon={<ArrowRight size={16} />}
                        >
                          Ver Historial Completo
                        </Button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Performance Insights */}
                  <motion.div
                    className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl border border-indigo-200/50 p-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <div className="flex items-center space-x-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Insights de Rendimiento</h3>
                        <p className="text-gray-600">Análisis inteligente de tu QR</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Excelente Rendimiento</h4>
                        <p className="text-sm text-gray-600">
                          Tu QR tiene una tasa de escaneo 23% superior al promedio
                        </p>
                      </div>

                      <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Horario Pico</h4>
                        <p className="text-sm text-gray-600">
                          La mayoría de escaneos ocurren entre 12:00 - 14:00
                        </p>
                      </div>

                      <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Usuarios Recurrentes</h4>
                        <p className="text-sm text-gray-600">
                          65% de los escaneos son de socios que regresan
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fullscreen QR Modal */}
        <AnimatePresence>
          {isFullscreen && comercio?.qrCode && (
            <motion.div
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFullscreen(false)}
            >
              <motion.div
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={comercio.qrCode}
                  alt="Código QR Fullscreen"
                  width={400}
                  height={400}
                  className="w-96 h-96 rounded-3xl shadow-2xl"
                  unoptimized
                />
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                >
                  <Minimize2 size={20} className="text-gray-700" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

// Loading fallback component
function ComercioQRLoading() {
  return (
    <DashboardLayout
      activeSection="qr"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <RefreshCw size={40} className="text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Cargando Dashboard QR
          </h3>
          <p className="text-gray-600 text-lg">Preparando herramientas avanzadas...</p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function ComercioQRPage() {
  return (
    <Suspense fallback={<ComercioQRLoading />}>
      <ComercioQRContent />
    </Suspense>
  );
}
