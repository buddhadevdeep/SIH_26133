import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConnectionProvider } from '@/contexts/ConnectionContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { FamilyProvider } from '@/contexts/FamilyContext';
import { LocationSelectorModal } from '@/components/location/LocationSelectorModal';
import { AppRoutes } from '@/routes/AppRoutes';
import '@/locales/i18n';

// Configure TanStack Query with appropriate stale time and retry defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  useEffect(() => {
    // Register PWA Service Worker for offline shell caching
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('HealthConnect PWA Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA registration ignored:', err);
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ConnectionProvider>
            <SocketProvider>
              <LocationProvider>
                <FamilyProvider>
                  <AppRoutes />
                  <LocationSelectorModal />
                </FamilyProvider>
              </LocationProvider>
            </SocketProvider>
          </ConnectionProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
