'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  X,
  RefreshCw,
  Download,
  Plus
} from 'lucide-react';
import { BeneficioCard } from './BeneficioCard';
import { Beneficio, BeneficioFilter, CATEGORIAS_BENEFICIOS } from '@/types/beneficio';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';

interface BeneficiosListProps {
  beneficios: Beneficio[];
  loading?: boolean;
  userRole?: 'socio' | 'comercio' | 'asociacion';
  onUse?: (beneficioId: string, comercioId: string) => Promise<void>;
  onEdit?: (beneficio: Beneficio) => void;
  onDelete?: (beneficioId: string) => void;
  onToggleStatus?: (beneficioId: string, estado: 'activo' | 'inactivo') => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onCreateNew?: () => void;
  showCreateButton?: boolean;
  showFilters?: boolean;
  className?: string;
}

export const BeneficiosList: React.FC<BeneficiosListProps> = ({
  beneficios,
  loading = false,
  userRole = 'socio',
  onUse,
  onEdit,
  onDelete,
  onToggleStatus,
  onRefresh,
  onExport,
  onCreateNew,
  showCreateButton = false,
  showFilters = true,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<BeneficioFilter>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrar y ordenar beneficios
  const filteredBeneficios = useMemo(() => {
    let filtered = [...beneficios];

    // Filtro de búsqueda
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(beneficio =>
        beneficio.titulo.toLowerCase().includes(searchLower) ||
        beneficio.descripcion.toLowerCase().includes(searchLower) ||
        beneficio.comercioNombre.toLowerCase().includes(searchLower) ||
        beneficio.categoria.toLowerCase().includes(searchLower)
      );
    }

    // Filtros adicionales
    if (filters.categoria) {
      filtered = filtered.filter(b => b.categoria === filters.categoria);
    }

    if (filters.estado) {
      filtered = filtered.filter(b => b.estado === filters.estado);
    }

    if (filters.soloDestacados) {
      filtered = filtered.filter(b => b.destacado);
    }

    if (filters.soloNuevos) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(b => b.creadoEn.toDate() > sevenDaysAgo);
    }

    if (filters.proximosAVencer) {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(b => 
        b.fechaFin.toDate() <= sevenDaysFromNow && 
        b.fechaFin.toDate() > new Date()
      );
    }

    // Ordenar por fecha de creación (más recientes primero)
    filtered.sort((a, b) => b.creadoEn.toDate().getTime() - a.creadoEn.toDate().getTime());

    return filtered;
  }, [beneficios, debouncedSearchTerm, filters]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  const hasActiveFilters = debouncedSearchTerm || Object.keys(filters).some(key => filters[key as keyof BeneficioFilter]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Beneficios ({filteredBeneficios.length})
          </h2>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<X size={16} />}
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              onClick={onRefresh}
            >
              Actualizar
            </Button>
          )}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={onExport}
            >
              Exportar
            </Button>
          )}

          {showCreateButton && onCreateNew && (
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={onCreateNew}
            >
              Nuevo Beneficio
            </Button>
          )}

          {/* Toggle de vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <Input
                placeholder="Buscar beneficios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>

            {/* Filtros rápidos */}
            <div className="flex gap-2">
              <select
                value={filters.categoria || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value || undefined }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS_BENEFICIOS.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>

              <select
                value={filters.estado || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value || undefined }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
                <option value="vencido">Vencidos</option>
                <option value="agotado">Agotados</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<SlidersHorizontal size={16} />}
                onClick={() => setShowFilterPanel(!showFilterPanel)}
              >
                Más filtros
              </Button>
            </div>
          </div>

          {/* Panel de filtros avanzados */}
          <AnimatePresence>
            {showFilterPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.soloDestacados || false}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        soloDestacados: e.target.checked || undefined 
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Solo destacados</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.soloNuevos || false}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        soloNuevos: e.target.checked || undefined 
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Solo nuevos</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.proximosAVencer || false}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        proximosAVencer: e.target.checked || undefined 
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Próximos a vencer</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Lista de beneficios */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
              >
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredBeneficios.length > 0 ? (
          <motion.div
            key="beneficios"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}
          >
            {filteredBeneficios.map((beneficio, index) => (
              <motion.div
                key={beneficio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <BeneficioCard
                  beneficio={beneficio}
                  onUse={onUse}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                  view={viewMode}
                  userRole={userRole}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron beneficios
            </h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters 
                ? 'Intenta ajustar los filtros o buscar con otros términos'
                : 'No hay beneficios disponibles en este momento'
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
