'use client';

import React, { memo } from 'react';
import { 
  Gift, 
  TrendingUp, 
  Calendar, 
  Activity,
  Target,
  Award
} from 'lucide-react';

interface SocioSidebarStatsProps {
  totalBeneficios: number;
  ahorroTotal: number;
  beneficiosUsados: number;
  beneficiosEstesMes: number;
  isOpen: boolean;
}

const SocioSidebarStats: React.FC<SocioSidebarStatsProps> = memo(({
  totalBeneficios,
  ahorroTotal,
  beneficiosUsados,
  beneficiosEstesMes,
  isOpen
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = () => {
    if (totalBeneficios === 0) return 0;
    return Math.min((beneficiosUsados / totalBeneficios) * 100, 100);
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50/50 to-white">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/50 rounded-full -mr-8 -mt-8"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Gift className="w-6 h-6 text-blue-500" />
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Activos
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalBeneficios}</p>
            <p className="text-sm text-blue-600/80">Disponibles</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-100/50 rounded-full -mr-8 -mt-8"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Total
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(ahorroTotal)}</p>
            <p className="text-sm text-green-600/80">Ahorrado</p>
          </div>
        </div>
      </div>
      
      {/* Monthly Summary */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Resumen del mes</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">Actualizado</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mb-1 mx-auto">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">{beneficiosEstesMes}</p>
            <p className="text-xs text-gray-500">Este mes</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg mb-1 mx-auto">
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">{beneficiosUsados}</p>
            <p className="text-xs text-gray-500">Total usado</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg mb-1 mx-auto">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">{progressPercentage.toFixed(0)}%</p>
            <p className="text-xs text-gray-500">Progreso</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Uso de beneficios</span>
            <span>{beneficiosUsados}/{totalBeneficios}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
});

SocioSidebarStats.displayName = 'SocioSidebarStats';

export default SocioSidebarStats;