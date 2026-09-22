import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Token } from '@/types/queue';

interface SocketContextType {
  isConnected: boolean;
  activeCalledToken: Token | null;
  dismissCallingAlert: () => void;
  simulateCallToken: (token?: Token) => void;
  subscribe: (event: string, callback: (data: unknown) => void) => () => void;
  emit: (event: string, data: unknown) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [activeCalledToken, setActiveCalledToken] = useState<Token | null>(null);
  const [eventListeners, setEventListeners] = useState<Map<string, Set<(data: unknown) => void>>>(new Map());

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    let s: Socket | null = null;
    try {
      s = io(socketUrl, {
        autoConnect: false,
        reconnectionAttempts: 2,
        timeout: 5000,
      });

      s.on('connect', () => setIsConnected(true));
      s.on('disconnect', () => setIsConnected(false));
      s.on('token:called', (data: Token) => {
        handleTokenCalled(data);
      });

      setSocket(s);
    } catch {
      setIsConnected(true); // Fallback to in-app event bus
    }

    return () => {
      s?.disconnect();
    };
  }, []);

  const handleTokenCalled = (token: Token) => {
    setActiveCalledToken(token);
    // Vibrate device if supported by browser (Section 9 token experience)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 500]);
      } catch {
        // ignore
      }
    }
  };

  const simulateCallToken = (token?: Token) => {
    const defaultToken: Token = token || {
      id: 'tok_042',
      tokenNumber: 'A-042',
      patientId: 'usr_pat_01',
      patientName: 'Rameshwar Sharma',
      patientAge: 48,
      patientGender: 'M',
      patientPhone: '9876543210',
      facilityId: 'fac_civil_01',
      facilityName: 'Gandhinagar Civil Hospital',
      departmentId: 'dep_med',
      departmentName: 'General Medicine OPD',
      roomNumber: 'Room 4',
      status: 'CALLED',
      priority: 'ROUTINE',
      positionInQueue: 0,
      estimatedWaitMinutes: 0,
      createdAt: new Date().toISOString(),
      calledAt: new Date().toISOString(),
    };
    handleTokenCalled(defaultToken);

    // Notify all queue:updated and token:called subscribers
    const listeners = eventListeners.get('token:called');
    listeners?.forEach((cb) => cb(defaultToken));
  };

  const dismissCallingAlert = () => {
    setActiveCalledToken(null);
  };

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    setEventListeners((prev) => {
      const copy = new Map(prev);
      if (!copy.has(event)) copy.set(event, new Set());
      copy.get(event)?.add(callback);
      return copy;
    });

    if (socket) {
      socket.on(event, callback);
    }

    return () => {
      setEventListeners((prev) => {
        const copy = new Map(prev);
        copy.get(event)?.delete(callback);
        return copy;
      });
      if (socket) {
        socket.off(event, callback);
      }
    };
  }, [socket]);

  const emit = useCallback((event: string, data: unknown) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
    // Also trigger local event bus listeners
    const listeners = eventListeners.get(event);
    listeners?.forEach((cb) => cb(data));
  }, [socket, eventListeners]);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        activeCalledToken,
        dismissCallingAlert,
        simulateCallToken,
        subscribe,
        emit,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
