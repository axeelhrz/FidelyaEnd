'use client';

import React, { memo } from 'react';
import { 
  Gift, 
  TrendingUp, 
  Calendar, 
} from 'lucide-react';

interface SocioSidebarStatsProps {
  totalBeneficios: number;
  beneficiosUsados: number;
  beneficiosEstesMes: number;
  isOpen: boolean;
}

const SocioSidebarStats: React.FC<SocioSidebarStatsProps> = memo(({
  totalBeneficios,
  beneficiosUsados,
  beneficiosEstesMes,
  isOpen
}) => {
  if (!isOpen) return null;

  const getProgressPercentage = () => {
    if (totalBeneficios === 0) return 0;
    return Math.min((beneficiosUsados / totalBeneficios) * 100, 100);
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-gray-50/50 to-white">
      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-3 border border-blue-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-blue-600">{totalBeneficios}</span>
          </div>
          <p className="text-xs text-blue-600/80 font-bold">Disponibles</p>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-3 border border-emerald-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-emerald-600">{beneficiosUsados}</span>
          </div>
          <p className="text-xs text-emerald-600/80 font-bold">Usados</p>
        </div>
      </div>
      
      {/* Modern Monthly Summary */}
      <div className="bg-white rounded-2xl p-3 border border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700">Este mes</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span className="font-bold">{beneficiosEstesMes}</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span className="font-bold">{progressPercentage.toFixed(0)}%</span>
          </div>
        </div>
        
        {/* Modern Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-lg"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Activity Indicator */}
        <div className="flex items-center justify-center mt-3 space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 font-medium">Actividad reciente</span>
        </div>
      </div>
    </div>
  );
});

SocioSidebarStats.displayName = 'SocioSidebarStats';

export default SocioSidebarStats;