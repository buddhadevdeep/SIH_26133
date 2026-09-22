import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StaffSubType } from '@/types/auth';
import { PharmacistDashboard } from '@/pages/pharmacist/PharmacistDashboard';
import { RegistrationClerkDashboard } from '@/pages/registration-clerk/RegistrationClerkDashboard';
import { FacilityOperationsDashboard } from '@/pages/facility-operations/FacilityOperationsDashboard';

export const StaffDashboard: React.FC = () => {
  const { user, staffSubType } = useAuth();
  const activeSubType: StaffSubType = staffSubType || 'FACILITY_OPERATIONS';

  return (
    <div className="space-y-6">
      {/* Staff Header */}
      <div className="rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
            Hospital Facility Staff Station • {user?.facilityName || 'Gandhinagar Civil Hospital'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">{user?.name}</h1>
          <p className="text-xs text-teal-100">
            Department:{' '}
            <strong className="text-white">{activeSubType.replace(/_/g, ' ')}</strong> • Sector 12 Base
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. REGISTRATION CLERK EXPERIENCE */}
      {/* ========================================================================= */}
      {activeSubType === 'REGISTRATION_CLERK' && (
        <RegistrationClerkDashboard />
      )}

      {/* ========================================================================= */}
      {/* 2. PHARMACIST EXPERIENCE */}
      {/* ========================================================================= */}
      {activeSubType === 'PHARMACIST' && (
        <PharmacistDashboard />
      )}

      {/* ========================================================================= */}
      {/* 3. FACILITY OPERATIONS (Live Control Center) */}
      {/* ========================================================================= */}
      {activeSubType === 'FACILITY_OPERATIONS' && (
        <FacilityOperationsDashboard />
      )}
    </div>
  );
};
