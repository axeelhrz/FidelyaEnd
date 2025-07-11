'use client';

import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useQRStats } from '@/hooks/useQRStats';
import { 
  TrendingUp, 
  Users, 
  Scan,
  MapPin,
  RefreshCw,
  Download,
  Eye,
  Activity,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Sidebar personalizado que maneja el logout
const ComercioSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <ComercioSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

// Main component content
const EstadisticasQRContent: React.FC = () => {
  const { signOut } = useAuth();
  const { stats, loading, refreshStats } = useQRStats();
  
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('scans');

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const dateRangeOptions = [
    { value: '24h', label: 'Últimas 24 horas' },
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' }
  ];

  const metricOptions = [
    { value: 'scans', label: 'Escaneos', icon: Scan },
    { value: 'validations', label: 'Validaciones', icon: Eye },
    { value: 'users', label: 'Usuarios únicos', icon: Users },
    { value: 'conversions', label: 'Conversiones', icon: TrendingUp }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <DashboardLayout
        activeSection="qr-estadisticas"
        sidebarComponent={(props) => (
          <ComercioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
              <RefreshCw size={32} className="text-blue-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cargando estadísticas...
            </h3>
            <p className="text-gray-500">Analizando datos de uso del QR</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="qr-estadisticas"
      sidebarComponent={(props) => (
        <ComercioSidebarWithLogout
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Estadísticas de QR
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Analiza el rendimiento y uso de tu código QR
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => refreshStats()}
              >
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => {
                  // Implementar exportación de datos
                }}
              >
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Scan className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.totalScans || 0}
                </div>
                <div className="text-sm text-gray-500">Total Escaneos</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+{stats?.scansGrowth || 0}%</span>
              <span className="text-gray-500 ml-1">vs período anterior</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.totalValidations || 0}
                </div>
                <div className="text-sm text-gray-500">Validaciones</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+{stats?.validationsGrowth || 0}%</span>
              <span className="text-gray-500 ml-1">vs período anterior</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.uniqueUsers || 0}
                </div>
                <div className="text-sm text-gray-500">Usuarios Únicos</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+{stats?.usersGrowth || 0}%</span>
              <span className="text-gray-500 ml-1">vs período anterior</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.conversionRate || 0}%
                </div>
                <div className="text-sm text-gray-500">Tasa Conversión</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+{stats?.conversionGrowth || 0}%</span>
              <span className="text-gray-500 ml-1">vs período anterior</span>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Escaneos por día */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Escaneos por Día</h3>
              <div className="flex gap-2">
                {metricOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedMetric(option.value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedMetric === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.dailyScans || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Horarios de mayor actividad */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Horarios de Mayor Actividad</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.hourlyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="scans" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dispositivos más usados */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Dispositivos Más Usados</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats?.deviceStats || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(stats?.deviceStats || []).map((entry: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {(stats?.deviceStats || []).map((device: { name: string; value: number }, index: number) => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{device.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{device.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ubicaciones principales */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Ubicaciones Principales
            </h3>
            <div className="space-y-4">
              {(stats?.topLocations || []).map((location: { city: string; country: string; scans: number }) => (
                <div key={location.city} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{location.city}</div>
                    <div className="text-sm text-gray-500">{location.country}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{location.scans}</div>
                    <div className="text-sm text-gray-500">escaneos</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Actividad Reciente
            </h3>
            <div className="space-y-4">
              {(stats?.recentActivity || []).map(
                (
                  activity: { time: string; location: string; device: string },
                  index: number
                ) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Scan className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        QR escaneado
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.time} - {activity.location}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {activity.device}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

// Main page component with Suspense boundary
export default function EstadisticasQRPage() {
  return (
    <Suspense fallback={
      <DashboardLayout
        activeSection="qr-estadisticas"
        sidebarComponent={(props) => (
          <ComercioSidebarWithLogout
            {...props}
            onLogoutClick={() => {}}
          />
        )}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <RefreshCw size={32} className="text-white animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Cargando estadísticas...</h3>
              <p className="text-gray-500">Analizando datos de uso del QR</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <EstadisticasQRContent />
    </Suspense>
  );
}