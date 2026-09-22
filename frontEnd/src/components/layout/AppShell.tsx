import React, { useState } from 'react';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { CallingAlertModal } from './CallingAlertModal';
import { PatientChatbotWidget } from '@/components/chatbot/PatientChatbotWidget';
import { useConnection } from '@/contexts/ConnectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { networkState, pendingSyncCount, syncOfflineQueue, toggleSimulatedOffline } = useConnection();
  const { user, role } = useAuth();

  // Show chatbot widget on patient pages or for citizens/patients
  const isPatientScope = !role || role === 'PATIENT';

  return (
    <div className="min-h-screen bg-[#F4F8FA] text-slate-900 flex flex-col antialiased relative">
      {/* Top Navbar */}
      <TopNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />

      {/* Persistent Offline Banner when network is offline */}
      {networkState === 'OFFLINE' && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-xs sticky top-16 z-30">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>
              OFFLINE MODE ACTIVE: All citizen registrations and vitals will be safely preserved locally in IndexedDB.
            </span>
          </div>
          <div className="flex items-center gap-3">
            {pendingSyncCount > 0 && (
              <span className="bg-amber-700/80 px-2 py-0.5 rounded-full text-[11px]">
                {pendingSyncCount} pending changes
              </span>
            )}
            <button
              onClick={toggleSimulatedOffline}
              className="text-xs underline hover:text-amber-100 font-bold"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex flex-1">
        {/* Sidebar for Desktop & Tablet */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content Viewport with pb-20 on mobile for BottomNav */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Floating Medical AI Assistant for Citizens & Patients */}
      {isPatientScope && <PatientChatbotWidget />}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Calling Notification Modal (vibrates + full-screen room notification) */}
      <CallingAlertModal />
    </div>
  );
};
