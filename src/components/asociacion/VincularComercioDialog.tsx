import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  Search,
  Store,
  MapPin,
  Phone,
  Mail,
  Star,
  Check,
  AlertCircle,
  Filter,
  ChevronDown
} from 'lucide-react';
import { ComercioDisponible } from '@/services/adhesion.service';
import { CATEGORIAS_COMERCIO } from '@/types/comercio';

interface VincularComercioDialogProps {
  open: boolean;
  onClose: () => void;
  onVincular: (comercioId: string) => Promise<boolean>;
  onBuscar: (termino: string) => Promise<ComercioDisponible[]>;
  loading: boolean;
}

export const VincularComercioDialog: React.FC<VincularComercioDialogProps> = ({
  open,
  onClose,
  onVincular,
  onBuscar,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [comercios, setComercios] = useState<ComercioDisponible[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [vinculando, setVinculando] = useState<string | null>(null);

  // Buscar comercios
  const handleSearch = React.useCallback(
    async (termino: string) => {
      if (!termino.trim()) {
        setComercios([]);
        return;
      }

      setSearchLoading(true);
      try {
        const resultados = await onBuscar(termino);
        setComercios(resultados);
      } catch (error) {
        console.error('Error searching comercios:', error);
      } finally {
        setSearchLoading(false);
      }
    },
    [onBuscar]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setComercios([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch]);

  // Filtrar por categoría
  const comerciosFiltrados = selectedCategoria
    ? comercios.filter(comercio => comercio.categoria === selectedCategoria)
    : comercios;

  // Manejar vinculación
  const handleVincular = async (comercio: ComercioDisponible) => {
    setVinculando(comercio.id);
    try {
      const success = await onVincular(comercio.id);
      if (success) {
        onClose();
      }
    } finally {
      setVinculando(null);
    }
  };

  // Reset al cerrar
  // Reset al cerrar
  const handleClose = () => {
    setSearchTerm('');
    setSelectedCategoria('');
    setComercios([]);
    setShowFilters(false);
    onClose();
  };
  if (!open) return null;

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
          className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10"
        >
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vincular Comercio
                  </h3>
                  <p className="text-sm text-gray-500">
                    Busca y vincula comercios a tu asociación
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Filters Toggle */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                {comerciosFiltrados.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {comerciosFiltrados.length} comercio(s) encontrado(s)
                  </span>
                )}
              </div>

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría
                      </label>
                      <select
                        value={selectedCategoria}
                        onChange={(e) => setSelectedCategoria(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Todas las categorías</option>
                        {CATEGORIAS_COMERCIO.map(categoria => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Results */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {!searchTerm ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Buscar comercios
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ingresa un término de búsqueda para encontrar comercios disponibles
                </p>
              </div>
            ) : comerciosFiltrados.length === 0 && !searchLoading ? (
              <div className="text-center py-12">
                <Store className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No se encontraron comercios
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comerciosFiltrados.map((comercio) => (
                  <motion.div
                    key={comercio.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Logo */}
                        {comercio.logoUrl ? (
                          <Image
                            src={comercio.logoUrl}
                            alt={comercio.nombreComercio}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-gray-400" />
                        )}
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">
                              {comercio.nombreComercio}
                            </h4>
                            {comercio.verificado && (
                              <div className="flex items-center text-green-600">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {comercio.categoria}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-1" />
                              {comercio.email}
                            </div>
                            {comercio.telefono && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-1" />
                                {comercio.telefono}
                              </div>
                            )}
                            {comercio.direccion && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-4 h-4 mr-1" />
                                {comercio.direccion}
                              </div>
                            )}
                            {comercio.puntuacion > 0 && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                                {comercio.puntuacion.toFixed(1)} ({comercio.totalReviews} reseñas)
                              </div>
                            )}
                          </div>
                          {/* Status */}
                          <div className="mt-2">
                            {comercio.asociacionesVinculadas.length > 0 ? (
                              <div className="flex items-center text-sm text-amber-600">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Ya vinculado a {comercio.asociacionesVinculadas.length} asociación(es)
                              </div>
                            ) : (
                              <div className="flex items-center text-sm text-green-600">
                                <Check className="w-4 h-4 mr-1" />
                                Disponible para vinculación
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Action Button */}
                      <div className="ml-4">
                        <button
                          onClick={() => handleVincular(comercio)}
                          disabled={vinculando === comercio.id || loading}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {vinculando === comercio.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Vinculando...
                            </>
                          ) : (
                            'Vincular'
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
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
