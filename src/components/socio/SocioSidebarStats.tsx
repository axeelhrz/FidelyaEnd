'use client';

import React, { memo } from 'react';
import { 
  Gift, 
  TrendingUp, 
  Calendar, 
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
    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-gray-50/30 to-white">
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
          <div className="flex items-center justify-between mb-1">
            <Gift className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">{totalBeneficios}</span>
          </div>
          <p className="text-xs text-blue-600/80 font-medium">Disponibles</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-600">{formatCurrency(ahorroTotal)}</span>
          </div>
          <p className="text-xs text-green-600/80 font-medium">Ahorrado</p>
        </div>
      </div>
      
      {/* Compact Monthly Summary */}
      <div className="bg-white rounded-lg p-2.5 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Este mes</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{beneficiosEstesMes}</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
        </div>
        
        {/* Compact Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
});

SocioSidebarStats.displayName = 'SocioSidebarStats';

export default SocioSidebarStats;