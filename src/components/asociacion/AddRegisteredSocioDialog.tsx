'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { RegisteredUser } from '@/services/user-search.service';
import { useDebounce } from '@/hooks/useDebounce';

interface AddRegisteredSocioDialogProps {
  open: boolean;
  onClose: () => void;
  onAddSocio: (userData: {
    nombre: string;
    email: string;
    telefono?: string;
    dni?: string;
    estado: 'activo' | 'vencido';
  }) => Promise<boolean>;
}

export const AddRegisteredSocioDialog: React.FC<AddRegisteredSocioDialogProps> = ({
  open,
  onClose,
  onAddSocio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const {
    searchResults,
    selectedUser,
    loading,
    error,
    searchUsers,
    selectUser,
    clearSelection,
    clearResults,
    canAddUser,
    clearError,
  } = useUserSearch();

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Effect to search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm && open) {
      searchUsers(debouncedSearchTerm);
    } else {
      clearResults();
    }
  }, [debouncedSearchTerm, open, searchUsers, clearResults]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      clearSelection();
      clearResults();
      clearError();
    }
  }, [open, clearSelection, clearResults, clearError]);

  const handleClose = () => {
    if (!isAdding) {
      onClose();
    }
  };

  const handleUserSelect = (user: RegisteredUser) => {
    selectUser(user);
  };

  const handleAddSocio = async (user: RegisteredUser) => {
    try {
      setIsAdding(true);
      setAddingUserId(user.id);

      // First check if user can be added
      const canAdd = await canAddUser(user.uid);
      if (!canAdd.canAdd) {
        throw new Error(canAdd.reason || 'No se puede agregar este usuario como socio');
      }

      // Prepare socio data
      const socioData = {
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        dni: user.dni,
        estado: 'activo' as const,
      };

      // Add socio
      const success = await onAddSocio(socioData);
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error adding socio:', error);
    } finally {
      setIsAdding(false);
      setAddingUserId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      asociacion: 'Asociación',
      comercio: 'Comercio',
      socio: 'Socio',
    };
    return roleLabels[role] || role;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Agregar Socio Registrado
                  </h3>
                  <p className="text-green-100 text-sm">
                    Busca y agrega usuarios ya registrados en el sistema
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isAdding}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar usuario registrado
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, email, DNI o teléfono..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isAdding}
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              
              {/* Search hint */}
              <p className="mt-2 text-sm text-gray-500">
                Ingresa al menos 3 caracteres para buscar usuarios registrados
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Results */}
            <div className="space-y-3">
              <AnimatePresence>
                {searchResults.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedUser?.id === user.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div>
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.nombre}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-lg">
                              {user.nombre.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {user.nombre}
                          </h4>
                          
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              {user.email}
                            </div>
                            
                            {user.telefono && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                {user.telefono}
                              </div>
                            )}
                            
                            {user.dni && (
                              <div className="flex items-center text-sm text-gray-600">
                                <User className="w-4 h-4 mr-2" />
                                DNI: {user.dni}
                              </div>
                            )}
                          </div>

                          <div className="mt-2 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.estado === 'activo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <Shield className="w-3 h-3 mr-1" />
                              {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            </span>
                            
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getRoleLabel(user.role)}
                            </span>
                            
                            <span className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              Registrado: {formatDate(user.creadoEn)}
                            </span>
                          </div>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSocio(user);
                          }}
                          disabled={isAdding}
                          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isAdding && addingUserId === user.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Agregando...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Agregar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* No results message */}
              {searchTerm && !loading && searchResults.length === 0 && !error && (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No se encontraron usuarios
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No hay usuarios registrados que coincidan con tu búsqueda.
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!searchTerm && (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Buscar usuarios registrados
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Utiliza el campo de búsqueda para encontrar usuarios ya registrados en el sistema.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                disabled={isAdding}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
