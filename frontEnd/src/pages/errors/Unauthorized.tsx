import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const Unauthorized: React.FC = () => {
  const { role } = useAuth();

  const getHomeLink = () => {
    switch (role) {
      case 'DOCTOR': return '/doctor';
      case 'FACILITY_STAFF': return '/staff';
      case 'DISTRICT_ADMIN': return '/district';
      case 'SUPER_ADMIN': return '/super-admin';
      default: return '/patient';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">403 - Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your current healthcare role does not have authorization to access this clinical or administrative resource.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={getHomeLink()}>
            <Button variant="primary" className="gap-2 bg-teal-700 hover:bg-teal-800">
              <ArrowLeft className="h-4 w-4" />
              Return to Your Role Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
        <h1 className="text-5xl font-black text-teal-800">404</h1>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Page Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The requested healthcare page or endpoint could not be found.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button variant="primary" className="bg-teal-700 hover:bg-teal-800">
              Back to HealthConnect Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
