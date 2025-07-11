'use client';

import { useEffect, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/providers/ToastProvider';

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Componente de loading global
const GlobalLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-sky-50/50 via-white to-celestial-50/30 flex items-center justify-center">
    <div className="text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Cargando Fidelya
      </h2>
      <p className="text-gray-600">
        Preparando la aplicación...
      </p>
    </div>
  </div>
);

export function ClientLayout({ children }: ClientLayoutProps) {
  // Initialize any client-side configurations
  useEffect(() => {
    // Set up any global client configurations here
    console.log('🚀 Fidelya Client initialized');
  }, []);

  return (
    <AuthProvider>
      <ToastProvider />
      <Suspense fallback={<GlobalLoading />}>
        {children}
      </Suspense>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}