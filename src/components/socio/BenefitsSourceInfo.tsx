'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Gift, 
  Star, 
  Info,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface BenefitsSourceInfoProps {
  className?: string;
}

export const BenefitsSourceInfo: React.FC<BenefitsSourceInfoProps> = ({ 
  className = '' 
}) => {
  const sources = [
    {
      icon: Users,
      title: 'Tu Asociación',
      description: 'Beneficios exclusivos creados específicamente para los miembros de tu asociación',
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      icon: Building2,
      title: 'Comercios Vinculados',
      description: 'Ofertas especiales de comercios que están afiliados a tu asociación',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      icon: Gift,
      title: 'Beneficios Públicos',
      description: 'Ofertas disponibles para todos los usuarios, sin restricciones de membresía',
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      icon: Star,
      title: 'Acceso Directo',
      description: 'Beneficios especiales con acceso inmediato, sin necesidad de validaciones',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    }
  ];

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Info className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Fuentes de tus Beneficios
          </h3>
          <p className="text-sm text-slate-600">
            Conoce de dónde provienen las ofertas disponibles para ti
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((source, index) => (
          <motion.div
            key={source.title}
            className={`${source.bgColor} ${source.borderColor} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                <source.icon className={`w-5 h-5 ${source.iconColor}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-1">
                  {source.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {source.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-green-900 mb-1">
              Actualización Automática
            </h4>
            <p className="text-sm text-green-700">
              Tus beneficios se actualizan automáticamente según tu membresía y las afiliaciones 
              de tu asociación. No necesitas hacer nada adicional para acceder a nuevas ofertas.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <button className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
          <span>Ver más información sobre membresías</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
