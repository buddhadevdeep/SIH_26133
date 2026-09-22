import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INITIAL_ASHA_PATIENTS } from '@/mock/mockData';
import { AshaPatient } from '@/types/asha';
import { ashaApi } from '@/api/ashaApi';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Activity,
  ClipboardList,
  Phone,
  AlertOctagon,
  Home,
  CheckCircle2,
  Clock,
  Calendar,
  GitBranch,
  ShieldCheck,
  CloudOff,
} from 'lucide-react';

export const CitizenList: React.FC = () => {
  const [patients, setPatients] = useState<AshaPatient[]>(INITIAL_ASHA_PATIENTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    ashaApi.getPatients().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setPatients(res.data);
      }
    }).catch((err) => {
      console.warn('Live asha patients fetch failed:', err);
    });
  }, []);

  const counts = useMemo(() => {
    return {
      all: patients.length,
      maternal: patients.filter((p) => p.category === 'MATERNAL').length,
      infant: patients.filter((p) => p.category === 'INFANT').length,
      ncd: patients.filter((p) => p.category?.startsWith('NCD')).length,
      highRisk: patients.filter((p) => p.isHighRisk).length,
      offline: patients.filter((p) => p.registeredOffline || p.syncStatus === 'LOCAL_PENDING').length,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (categoryFilter === 'MATERNAL' && p.category !== 'MATERNAL') return false;
      if (categoryFilter === 'INFANT' && p.category !== 'INFANT') return false;
      if (categoryFilter === 'NCD' && !p.category?.startsWith('NCD')) return false;
      if (categoryFilter === 'HIGH_RISK' && !p.isHighRisk) return false;
      if (categoryFilter === 'OFFLINE' && !(p.registeredOffline || p.syncStatus === 'LOCAL_PENDING')) return false;

      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.village.toLowerCase().includes(q) ||
          p.phone.includes(search) ||
          (p.abhaId && p.abhaId.includes(search)) ||
          (p.address && p.address.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [patients, categoryFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Citizens & Household Cohort"
        subtitle="Community roster for your assigned jurisdiction (Pethapur Cluster). Includes maternal, child immunization, and chronic NCD registers."
        breadcrumbs={[{ label: 'ASHA Dashboard', to: '/asha' }, { label: 'Citizens Cohort' }]}
        actions={
          <Link to="/asha/patients/new">
            <Button variant="primary" size="sm" className="gap-1.5 bg-teal-700 hover:bg-teal-800">
              <UserPlus className="h-4 w-4" />
              <span>Register New Citizen</span>
            </Button>
          </Link>
        }
      />

      {/* Filter Category Pills & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { key: 'ALL', label: `All (${counts.all})` },
              { key: 'MATERNAL', label: `Maternal ANC (${counts.maternal})` },
              { key: 'INFANT', label: `Infants / UIP (${counts.infant})` },
              { key: 'NCD', label: `NCD Chronic (${counts.ncd})` },
              { key: 'HIGH_RISK', label: `Priority Risk (${counts.highRisk})` },
              { key: 'OFFLINE', label: `Local / Unsynced (${counts.offline})` },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setCategoryFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  categoryFilter === f.key
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, village, ABHA, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>
      </div>

      {/* Citizens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <Users className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-base">No Citizens Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No beneficiaries match the selected filter. Try resetting your search or registering a new citizen.
            </p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className={`p-5 flex flex-col justify-between hover:shadow-md transition-all border ${
                patient.isHighRisk
                  ? 'border-rose-300 bg-rose-50/15'
                  : patient.registeredOffline || patient.syncStatus === 'LOCAL_PENDING'
                  ? 'border-amber-300 bg-amber-50/15'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="space-y-2.5">
                {/* Top badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                      {patient.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {patient.age} Yrs • {patient.gender === 'F' ? 'Female' : 'Male'} • {patient.village}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {patient.isHighRisk && (
                      <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800 animate-pulse">
                        High Risk
                      </span>
                    )}

                    {patient.registeredOffline || patient.syncStatus === 'LOCAL_PENDING' ? (
                      <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 inline-flex items-center gap-1">
                        <CloudOff className="h-2.5 w-2.5" /> Local Only
                      </span>
                    ) : (
                      <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Grid Synced
                      </span>
                    )}
                  </div>
                </div>

                {/* Address & Household Head */}
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p className="line-clamp-1">{patient.address}</p>
                  {patient.householdHeadName && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Home className="h-3 w-3 text-slate-400" />
                      Family Head: <strong>{patient.householdHeadName}</strong>
                    </p>
                  )}
                </div>

                {/* Health Category & ABHA Box */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Category:</span>
                    <span className="font-bold text-slate-800">
                      {patient.category?.replace(/_/g, ' ')}
                      {patient.gestationalWeek && ` (${patient.gestationalWeek} wks)`}
                      {patient.immunizationStage && ` • ${patient.immunizationStage}`}
                    </span>
                  </div>

                  {patient.abhaId && (
                    <div className="text-[11px] text-teal-800 font-mono font-medium">
                      ABHA: {patient.abhaId}
                    </div>
                  )}

                  {patient.highRiskReasons && patient.highRiskReasons.length > 0 && (
                    <div className="pt-1 border-t border-slate-200/60 text-[11px] text-rose-800 font-semibold">
                      Alert: {patient.highRiskReasons[0]}
                    </div>
                  )}
                </div>

                {/* Schedule info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Last: {patient.lastVisitDate || 'Never'}</span>
                  <span>
                    Next Due: <strong className="text-teal-800">{patient.nextFollowUpDate || 'TBD'}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 mt-3">
                <a
                  href={`tel:${patient.phone}`}
                  className="rounded-xl border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 min-h-[42px] min-w-[42px] flex items-center justify-center transition-colors"
                  title="Call Citizen"
                >
                  <Phone className="h-4 w-4" />
                </a>

                <div className="flex gap-1.5 flex-1">
                  <Link to={`/asha/checkups?patientId=${patient.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs min-h-[42px] px-2">
                      Checkup
                    </Button>
                  </Link>
                  <Link to={`/asha/vitals?patientId=${patient.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs min-h-[42px] px-2">
                      Vitals
                    </Button>
                  </Link>
                  <Link to={`/asha/vitals?tab=screening&patientId=${patient.id}`} className="flex-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full text-xs min-h-[42px] px-2 bg-teal-700 hover:bg-teal-800 font-bold"
                    >
                      Screen
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

