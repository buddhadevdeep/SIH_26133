import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/Button';
import { INITIAL_ASHA_PATIENTS } from '@/mock/mockData';
import { ashaApi } from '@/api/ashaApi';
import { AshaPatient } from '@/types/asha';
import { getStoredAshaVisits, subscribeToAshaVisits } from '@/lib/ashaVisitStore';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Activity,
  AlertOctagon,
  RefreshCw,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Baby,
  Heart,
  WifiOff,
} from 'lucide-react';

export const AshaDashboard: React.FC = () => {
  const { user } = useAuth();
  const { pendingSyncCount, isOnline } = useConnection();

  const todayStr = new Date().toISOString().split('T')[0];
  const [visits, setVisits] = useState<any[]>(() => getStoredAshaVisits());
  const [citizens, setCitizens] = useState<AshaPatient[]>(INITIAL_ASHA_PATIENTS);

  useEffect(() => {
    ashaApi.getCitizens().then((res) => {
      if (res.data && res.data.length > 0) setCitizens(res.data);
    }).catch(console.warn);

    return subscribeToAshaVisits((updated) => setVisits(updated));
  }, []);

  const todayVisits = useMemo(
    () => visits.filter((v) => (v.visitDate === todayStr || v.status === 'IN_PROGRESS') && !v.isCompleted),
    [visits, todayStr]
  );
  const highRiskPatients = useMemo(
    () => citizens.filter((p) => p.isHighRisk),
    [citizens]
  );

  return (
    <div className="space-y-5 font-sans w-full">
      {/* =====================================================
          1. SLEEK ASHA GREETING & STATUS BAR
      ====================================================== */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
              <Activity className="h-3 w-3 text-teal-600" />
              ASHA Frontline Console
            </span>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              Pethapur Village (Ward 1–4)
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Namaste, {user?.name || 'Sunita Devi'}
          </h1>

          <p className="text-xs text-slate-500">
            Sub-Centre: <strong className="text-slate-700">Pethapur</strong> • Primary Health Centre: <strong className="text-slate-700">Pethapur PHC</strong> • Dist: Gandhinagar
          </p>
        </div>

        {/* Connectivity & Fast Action */}
        <div className="flex items-center gap-3 self-start md:self-center shrink-0 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <WifiOff className="h-3.5 w-3.5" />
                Offline
              </span>
            )}
            <span className="text-slate-300">|</span>
            <span className="text-xs font-medium text-slate-600">
              {pendingSyncCount > 0 ? `${pendingSyncCount} queued` : 'Synced'}
            </span>
          </div>

          <Link to="/asha/patients/new">
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs gap-1.5 rounded-xl cursor-pointer shadow-xs">
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Register Citizen</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* =====================================================
          2. TOP 4 ESSENTIAL FIELD KPIS
      ====================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/asha/checkups">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Checkup</span>
              <Calendar className="h-4 w-4 text-teal-700 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {todayVisits.length}
            </div>
            <p className="text-[11px] text-teal-700 font-medium mt-0.5">Doctor-prescribed checkups due today</p>
          </div>
        </Link>

        <Link to="/asha/high-risk">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer group">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">High-Risk Cases</span>
              <AlertOctagon className="h-4 w-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
              {highRiskPatients.length}
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Urgent maternal & elder cases</p>
          </div>
        </Link>

        <Link to="/asha/patients">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Village Cohort</span>
              <Users className="h-4 w-4 text-teal-700 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {INITIAL_ASHA_PATIENTS.length}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Families under your care</p>
          </div>
        </Link>

        <Link to="/asha/sync">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-cyan-500 hover:shadow-xs transition-all cursor-pointer group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Offline Sync</span>
              <RefreshCw className={`h-4 w-4 text-cyan-600 group-hover:scale-110 transition-transform ${pendingSyncCount > 0 ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {pendingSyncCount}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {pendingSyncCount > 0 ? 'Pending to sync with PHC' : 'All records up to date'}
            </p>
          </div>
        </Link>
      </div>

      {/* =====================================================
          3. HIGH-RISK EMERGENCY ALERT BANNER (If Any)
      ====================================================== */}
      {highRiskPatients.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
                  Priority Health Attention
                </span>
                <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.2 rounded-full">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-rose-950 mt-0.5">
                <strong>{highRiskPatients[0]?.name}</strong> ({highRiskPatients[0]?.category?.replace(/_/g, ' ')}) has high-risk markers: <em>{highRiskPatients[0]?.highRiskReasons?.join(', ')}</em>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {highRiskPatients[0]?.phone && (
              <a
                href={`tel:${highRiskPatients[0]?.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 text-rose-900 hover:bg-rose-100 text-xs font-bold transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
            )}
            <Link to="/asha/high-risk">
              <Button size="sm" className="bg-rose-700 hover:bg-rose-800 text-white text-xs rounded-xl font-bold cursor-pointer">
                Refer to PHC
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* =====================================================
          4. 4 DIRECT FIELD ACTION BUTTONS
      ====================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/asha/checkups">
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-xs transition-all text-left group">
            <Calendar className="h-5 w-5 text-teal-700 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 block">Today's Checkup</span>
            <span className="text-[10px] text-slate-500">Doctor orders & field checks</span>
          </div>
        </Link>

        <Link to="/asha/vitals">
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-red-400 hover:shadow-xs transition-all text-left group">
            <Activity className="h-5 w-5 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 block">Vitals & Screening</span>
            <span className="text-[10px] text-slate-500">Physical Vitals & CBAC</span>
          </div>
        </Link>

        <Link to="/asha/patients">
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-xs transition-all text-left group">
            <Users className="h-5 w-5 text-teal-700 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 block">Village Register</span>
            <span className="text-[10px] text-slate-500">Citizens & ABHA Cards</span>
          </div>
        </Link>

        <Link to="/asha/high-risk">
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-rose-400 hover:shadow-xs transition-all text-left group">
            <AlertOctagon className="h-5 w-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-900 block">High-Risk & Referrals</span>
            <span className="text-[10px] text-slate-500">Priority cases & PHC link</span>
          </div>
        </Link>
      </div>

      {/* =====================================================
          5. TODAY'S CHECKUP QUEUE (DOCTOR PRESCRIBED)
      ====================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-teal-700" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Today's Checkups ({todayVisits.length})
              </h2>
              <p className="text-xs text-slate-500">
                Doctor-prescribed clinical checkups due today in your village ward.
              </p>
            </div>
          </div>

          <Link to="/asha/checkups" className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {todayVisits.map((visit) => (
            <div
              key={visit.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-400 hover:shadow-2xs transition-all gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900">
                    {visit.patientName}
                  </span>
                  <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                    {visit.visitType?.replace(/_/g, ' ') || 'CHECKUP'}
                  </span>
                  {visit.prescribedByDoctorName && (
                    <span className="text-[10px] font-bold text-teal-900 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-full">
                      Prescribed by {visit.prescribedByDoctorName}
                    </span>
                  )}
                  {visit.prescribedDays && (
                    <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      In {visit.prescribedDays} Days
                    </span>
                  )}
                </div>
                {visit.doctorInstructions ? (
                  <p className="text-xs text-slate-800 font-medium">
                    🩺 <em>{visit.doctorInstructions}</em>
                  </p>
                ) : (
                  <p className="text-xs text-slate-700 font-medium">
                    {visit.purpose}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{visit.address || 'Pethapur Village'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {visit.patientPhone && (
                  <a
                    href={`tel:${visit.patientPhone}`}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                    title="Call Beneficiary"
                  >
                    <Phone className="h-4 w-4 text-teal-700" />
                  </a>
                )}
                <Link to={`/asha/vitals?patientId=${visit.patientId}`}>
                  <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg cursor-pointer">
                    Vitals & Screen
                  </Button>
                </Link>
                <Link to="/asha/checkups">
                  <Button size="sm" className="text-xs h-8 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg cursor-pointer">
                    Checkup Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          6. VILLAGE HEALTH COHORT BREAKDOWN
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Maternal & Child Health */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-900">
              <Baby className="h-4 w-4 text-teal-700" />
              <span className="font-bold text-xs uppercase tracking-wider">Maternal & Child Health</span>
            </div>
            <Link to="/asha/patients" className="text-[11px] font-bold text-teal-700 hover:underline">
              View Cohort →
            </Link>
          </div>
          <p className="text-xs text-slate-600">
            <strong>3 Pregnant Mothers</strong> due for IFA tablets & Td booster this week. <strong>2 Infants</strong> due for UIP immunization.
          </p>
        </div>

        {/* NCD & Elderly Care */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-900">
              <Heart className="h-4 w-4 text-teal-700" />
              <span className="font-bold text-xs uppercase tracking-wider">Chronic NCD & Elderly Care</span>
            </div>
            <Link to="/asha/vitals" className="text-[11px] font-bold text-teal-700 hover:underline">
              Check Vitals →
            </Link>
          </div>
          <p className="text-xs text-slate-600">
            <strong>8 Hypertensive / Diabetic Patients</strong> monitored in Pethapur Sector 2. Monthly digital cuff BP checks due.
          </p>
        </div>
      </div>
    </div>
  );
};

