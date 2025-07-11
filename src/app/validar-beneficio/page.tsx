'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Copy, RefreshCw, Store, Gift, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

// Datos de ejemplo de comercios
const comerciosEjemplo = [
  {
    id: 'comercio_001',
    nombre: 'Restaurante El Buen Sabor',
    categoria: 'Restaurantes',
    direccion: 'Av. Principal 123',
    beneficios: [
      {
        id: 'beneficio_001',
        titulo: '20% de descuento en cena',
        descripcion: 'Descuento válido de lunes a jueves',
        tipo: 'porcentaje',
        descuento: 20
      },
      {
        id: 'beneficio_002',
        titulo: 'Postre gratis',
        descripcion: 'Postre gratis con cualquier plato principal',
        tipo: 'producto_gratis',
        descuento: 0
      }
    ]
  },
  {
    id: 'comercio_002',
    nombre: 'Farmacia San José',
    categoria: 'Farmacia',
    direccion: 'Calle Salud 456',
    beneficios: [
      {
        id: 'beneficio_003',
        titulo: '15% en medicamentos',
        descripcion: 'Descuento en medicamentos de venta libre',
        tipo: 'porcentaje',
        descuento: 15
      }
    ]
  },
  {
    id: 'comercio_003',
    nombre: 'Tienda Deportiva Pro',
    categoria: 'Deportes',
    direccion: 'Centro Comercial Plaza',
    beneficios: [
      {
        id: 'beneficio_004',
        titulo: '$5000 de descuento',
        descripcion: 'En compras superiores a $20000',
        tipo: 'monto_fijo',
        descuento: 5000
      }
    ]
  }
];

export default function ValidarBeneficioPage() {
  const [selectedComercio, setSelectedComercio] = useState(comerciosEjemplo[0]);
  const [selectedBeneficio, setSelectedBeneficio] = useState(comerciosEjemplo[0].beneficios[0]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Generar QR cuando cambie la selección
  useEffect(() => {
    const generateQR = async () => {
      setLoading(true);
      try {
        // Importar QRCode dinámicamente
        const QRCode = (await import('qrcode')).default;
        
        // Crear datos del QR
        const qrData = {
          comercioId: selectedComercio.id,
          beneficioId: selectedBeneficio.id,
          timestamp: Date.now(),
          type: 'beneficio_validation'
        };

        // También crear URL format para compatibilidad
        const urlFormat = `/validar-beneficio?comercio=${selectedComercio.id}&beneficio=${selectedBeneficio.id}`;
        
        // Generar QR con los datos JSON
        const qrDataString = JSON.stringify(qrData);
        const dataUrl = await QRCode.toDataURL(qrDataString, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });

        setQrDataUrl(dataUrl);
        console.log('QR Data:', qrDataString);
        console.log('URL Format:', urlFormat);
      } catch (error) {
        console.error('Error generating QR:', error);
        toast.error('Error al generar código QR');
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [selectedComercio, selectedBeneficio]);

  // Mover generateQR fuera del useEffect para el botón "Regenerar"
  const generateQR = async () => {
    setLoading(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const qrData = {
        comercioId: selectedComercio.id,
        beneficioId: selectedBeneficio.id,
        timestamp: Date.now(),
        type: 'beneficio_validation'
      };
      const urlFormat = `/validar-beneficio?comercio=${selectedComercio.id}&beneficio=${selectedBeneficio.id}`;
      const qrDataString = JSON.stringify(qrData);
      const dataUrl = await QRCode.toDataURL(qrDataString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrDataUrl(dataUrl);
      console.log('QR Data:', qrDataString);
      console.log('URL Format:', urlFormat);
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Error al generar código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleComercioChange = (comercio: typeof comerciosEjemplo[0]) => {
    setSelectedComercio(comercio);
    setSelectedBeneficio(comercio.beneficios[0]);
  };

  const copyQRData = async () => {
    try {
      const qrData = {
        comercioId: selectedComercio.id,
        beneficioId: selectedBeneficio.id,
        timestamp: Date.now(),
        type: 'beneficio_validation'
      };
      
      await navigator.clipboard.writeText(JSON.stringify(qrData));
      toast.success('Datos del QR copiados al portapapeles');
    } catch {
      toast.error('Error al copiar datos');
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-${selectedComercio.nombre.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('Código QR descargado');
  };

  const formatDiscount = (beneficio: typeof selectedBeneficio) => {
    switch (beneficio.tipo) {
      case 'porcentaje':
        return `${beneficio.descuento}% de descuento`;
      case 'monto_fijo':
        return `$${beneficio.descuento.toLocaleString()} de descuento`;
      case 'producto_gratis':
        return 'Producto gratis';
      default:
        return 'Beneficio especial';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <QrCode size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Generador de QR para Comercios
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Genera códigos QR para que los socios puedan escanear y acceder a los beneficios de tu comercio
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Configuración */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Selección de Comercio */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-5 h-5 text-violet-600" />
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Comercio</h3>
              </div>
              
              <div className="space-y-3">
                {comerciosEjemplo.map((comercio) => (
                  <button
                    key={comercio.id}
                    onClick={() => handleComercioChange(comercio)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                      selectedComercio.id === comercio.id
                        ? 'bg-violet-50 border-2 border-violet-200 shadow-sm'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{comercio.nombre}</div>
                    <div className="text-sm text-gray-600">{comercio.categoria}</div>
                    <div className="text-xs text-gray-500">{comercio.direccion}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selección de Beneficio */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Beneficio</h3>
              </div>
              
              <div className="space-y-3">
                {selectedComercio.beneficios.map((beneficio) => (
                  <button
                    key={beneficio.id}
                    onClick={() => setSelectedBeneficio(beneficio)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                      selectedBeneficio.id === beneficio.id
                        ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{beneficio.titulo}</div>
                    <div className="text-sm text-purple-600 font-medium">{formatDiscount(beneficio)}</div>
                    <div className="text-xs text-gray-500 mt-1">{beneficio.descripcion}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Información del QR */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Información del QR</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Comercio ID:</span>
                  <span className="ml-2 text-blue-700 font-mono">{selectedComercio.id}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Beneficio ID:</span>
                  <span className="ml-2 text-blue-700 font-mono">{selectedBeneficio.id}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Formato:</span>
                  <span className="ml-2 text-blue-700">JSON con validación</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* QR Code Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* QR Code */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Código QR Generado</h3>
                
                <div className="relative inline-block">
                  {loading ? (
                    <div className="w-72 h-72 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                  ) : qrDataUrl ? (
                      <Image
                        src={qrDataUrl}
                        alt="QR Code"
                        width={256}
                        height={256}
                        className="w-64 h-64 mx-auto"
                        unoptimized
                        priority
                      />
                    ) : (
                    <div className="w-72 h-72 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <span className="text-gray-500">Error generando QR</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 justify-center">
                  <button
                    onClick={downloadQR}
                    disabled={!qrDataUrl || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                  
                  <button
                    onClick={copyQRData}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar datos
                  </button>
                  
                  <button
                    onClick={generateQR}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Regenerar
                  </button>
                </div>
              </div>
            </div>

            {/* Preview del Beneficio */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <h4 className="text-lg font-semibold mb-4">Vista Previa del Beneficio</h4>
              
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-xl font-bold mb-2">{selectedBeneficio.titulo}</div>
                <div className="text-lg font-semibold text-purple-100 mb-2">
                  {formatDiscount(selectedBeneficio)}
                </div>
                <div className="text-sm text-purple-100 mb-3">
                  {selectedBeneficio.descripcion}
                </div>
                <div className="text-xs text-purple-200">
                  Válido en: {selectedComercio.nombre}
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
              <h4 className="text-lg font-semibold text-amber-900 mb-4">Instrucciones de Uso</h4>
              
              <ol className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0 mt-0.5">1</span>
                  <span>Descarga o imprime el código QR generado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0 mt-0.5">2</span>
                  <span>Coloca el QR en un lugar visible en tu comercio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0 mt-0.5">3</span>
                  <span>Los socios pueden escanear el QR con la app para acceder al beneficio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0 mt-0.5">4</span>
                  <span>El sistema validará automáticamente el acceso al beneficio</span>
                </li>
              </ol>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12 text-gray-600"
        >
          <p className="text-sm">
            Esta es una página de demostración para generar códigos QR de prueba.
            <br />
            En producción, los comercios generarían estos códigos desde su panel de administración.
          </p>
        </motion.div>
      </div>
    </div>
  );
}