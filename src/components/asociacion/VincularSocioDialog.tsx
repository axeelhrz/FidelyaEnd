'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  UserPlus,
  X,
  Mail,
  Phone,
  User,
  AlertCircle,
  Loader2,
  CheckCircle,
  Bug
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocioAsociacion } from '@/hooks/useSocioAsociacion';
import { userSearchService, RegisteredUser } from '@/services/user-search.service';
import toast from 'react-hot-toast';

interface VincularSocioDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VincularSocioDialog: React.FC<VincularSocioDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { vincularSocio, loading: vinculandoSocio } = useSocioAsociacion();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Efecto para limpiar la búsqueda cuando se abre/cierra el diálogo
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setUsers([]);
      setError(null);
      setSelectedUser(null);
      console.log('🔄 Dialog opened, cleared state');
    }
  }, [open]);

  // Función para debug de colecciones
  const handleDebug = async () => {
    console.log('🐛 Starting debug...');
    await userSearchService.debugCollections();
    setDebugMode(true);
    toast.success('Debug info logged to console');
  };

  // Función para buscar usuarios
  const handleSearch = async () => {
    if (!searchTerm.trim() || !user) {
      console.log('⚠️ Search term empty or no user');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      console.log('🔍 Starting search with term:', searchTerm);
      console.log('👤 Current user:', { uid: user.uid, role: user.role });

      // Buscar usuarios que no estén ya vinculados a la asociación
      const result = await userSearchService.searchRegisteredUsers({
        search: searchTerm,
        role: 'socio', // Buscar específicamente usuarios con role 'socio'
        estado: 'activo',
        excludeAsociacionId: user.uid
      });

      console.log('📊 Search result:', result);
      setUsers(result.users);

      if (result.users.length === 0) {
        const errorMsg = 'No se encontraron usuarios con role "socio" que coincidan con la búsqueda';
        setError(errorMsg);
        console.log('❌', errorMsg);
      } else {
        console.log(`✅ Found ${result.users.length} users`);
      }
    } catch (err) {
      console.error('❌ Error buscando usuarios:', err);
      const errorMsg = 'Error al buscar usuarios. Revisa la consola para más detalles.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSearching(false);
    }
  };

  // Función para vincular el socio seleccionado
  const handleVincular = async () => {
    if (!selectedUser || !user) {
      console.log('⚠️ No selected user or current user');
      return;
    }

    try {
      console.log('🔗 Starting vincular process:', {
        selectedUser: selectedUser.id,
        asociacion: user.uid
      });

      // Usar el método mejorado para verificar si el usuario puede ser agregado
      const userExists = await userSearchService.getUserByIdEnhanced(selectedUser.id);
      
      if (!userExists) {
        toast.error('Usuario no encontrado en el sistema');
        console.log('❌ User not found in enhanced search');
        return;
      }

      // Verificar si el usuario puede ser agregado como socio
      const canAdd = await userSearchService.canAddAsSocio(selectedUser.id, user.uid);
      console.log('✅ Can add check result:', canAdd);
      
      if (!canAdd.canAdd) {
        const errorMsg = canAdd.reason || 'No se puede agregar este usuario como socio';
        toast.error(errorMsg);
        console.log('❌ Cannot add user:', errorMsg);
        return;
      }

      const success = await vincularSocio(selectedUser.id);
      console.log('🔗 Vincular result:', success);
      
      if (success) {
        toast.success('Socio vinculado exitosamente');
        console.log('✅ Socio vinculado exitosamente');
        onSuccess?.();
        onClose();
      } else {
        toast.error('Error al vincular el socio');
        console.log('❌ Error al vincular el socio');
      }
    } catch (err) {
      console.error('❌ Error vinculando socio:', err);
      toast.error('Error al vincular el socio');
    }
  };

  // Manejar tecla Enter en la búsqueda
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Manejar clic en el overlay (solo cerrar si se hace clic directamente en el overlay)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div 
          className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
          onClick={handleOverlayClick}
        >
          {/* Overlay más sutil */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 transition-opacity bg-black bg-opacity-25"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente */}
            <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-purple-100">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Vincular Nuevo Socio
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Busca usuarios con role &quot;socio&quot; para vincular a la asociación
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDebug}
                    className="p-2 text-gray-500 transition-all duration-200 rounded-lg hover:text-purple-600 hover:bg-white hover:shadow-sm"
                    title="Debug collections"
                  >
                    <Bug className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-500 transition-all duration-200 rounded-lg hover:text-red-600 hover:bg-white hover:shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="px-6 py-6">
              <div className="flex space-x-3">
                <div className="relative flex-1">
                  <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Buscar por nombre, email o DNI..."
                    className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    disabled={searching || vinculandoSocio}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() || searching || vinculandoSocio}
                  className="px-6 py-3 text-white transition-all duration-200 bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {searching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Buscar'
                  )}
                </button>
              </div>

              {/* Debug info */}
              {debugMode && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-700 font-medium">
                    🐛 Debug mode activado. Revisa la consola del navegador para información detallada.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Asociación ID: {user?.uid}
                  </p>
                </div>
              )}

              {/* Results Section */}
              <div className="mt-6">
                {error && (
                  <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                      <span className="font-medium">{error}</span>
                    </div>
                    <div className="mt-2 text-xs text-red-600">
                      💡 Tip: Asegúrate de que existan usuarios registrados con role &quot;socio&quot; en Firebase
                    </div>
                  </div>
                )}

                {users.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2 text-purple-600" />
                      Usuarios encontrados ({users.length})
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className={`p-4 transition-all duration-200 border rounded-xl cursor-pointer hover:shadow-md ${
                            selectedUser?.id === user.id
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {user.avatar ? (
                                <Image
                                  src={user.avatar}
                                  alt={user.nombre}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{user.nombre}</h4>
                              <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Mail className="w-4 h-4 mr-1" />
                                  {user.email}
                                </span>
                                {user.telefono && (
                                  <span className="flex items-center">
                                    <Phone className="w-4 h-4 mr-1" />
                                    {user.telefono}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-gray-400">
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 mr-2">
                                  {user.role}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                  {user.estado}
                                </span>
                                {user.dni && (
                                  <span className="ml-2 text-gray-500">
                                    DNI: {user.dni}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedUser?.id === user.id && (
                              <CheckCircle className="w-6 h-6 text-purple-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchTerm && !searching && users.length === 0 && !error && (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Busca usuarios con role &quot;socio&quot; registrados en el sistema
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={vinculandoSocio}
                  className="px-6 py-2 text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm hover:shadow-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVincular}
                  disabled={!selectedUser || vinculandoSocio}
                  className="flex items-center px-6 py-2 text-white transition-all duration-200 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {vinculandoSocio ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Vinculando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Vincular Socio
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};