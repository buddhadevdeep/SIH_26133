import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { INITIAL_ASHA_PATIENTS } from '@/mock/mockData';
import { AshaVisit, VisitStatus } from '@/types/asha';
import {
  getStoredAshaVisits,
  subscribeToAshaVisits,
  completeAshaVisit,
  createDoctorPrescribedVisit,
  calculateTargetDate,
} from '@/lib/ashaVisitStore';
import { useConnection } from '@/contexts/ConnectionContext';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Plus,
  Activity,
  ClipboardList,
  GitBranch,
  X,
  Check,
  Search,
  ChevronRight,
  ShieldAlert,
  Stethoscope,
  Building2,
  Filter,
  Sparkles,
  ArrowRight,
  User,
  HeartPulse,
} from 'lucide-react';

export const TodaysCheckupPage: React.FC = () => {
  const { refreshPendingCount } = useConnection();
  const [searchParams] = useSearchParams();

  // Load visits from shared reactive store
  const [visits, setVisits] = useState<AshaVisit[]>(() => getStoredAshaVisits());

  useEffect(() => {
    const unsubscribe = subscribeToAshaVisits((updatedVisits) => {
      setVisits(updatedVisits);
    });
    return unsubscribe;
  }, []);

  // Filter state
  const tabParam = searchParams.get('tab');
  const [filter, setFilter] = useState<'DUE_TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'ALL'>(
    tabParam === 'upcoming'
      ? 'UPCOMING'
      : tabParam === 'overdue'
      ? 'OVERDUE'
      : tabParam === 'completed'
      ? 'COMPLETED'
      : tabParam === 'all'
      ? 'ALL'
      : 'DUE_TODAY'
  );

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'URGENT' | 'NCD' | 'ANC' | 'CHILD'>('ALL');

  // Modal states
  const [selectedVisitForCompletion, setSelectedVisitForCompletion] = useState<AshaVisit | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionAction, setCompletionAction] = useState('');
  const [completionReferral, setCompletionReferral] = useState(false);
  const [completionReferralReason, setCompletionReferralReason] = useState('');

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // New Doctor Order Form state
  const [orderDoctorName, setOrderDoctorName] = useState('Dr. Rajesh Sharma');
  const [orderDoctorSpecialty, setOrderDoctorSpecialty] = useState('MD (Internal Medicine)');
  const [orderFacility, setOrderFacility] = useState('District Civil Hospital Gandhinagar');
  const [orderPatientId, setOrderPatientId] = useState(INITIAL_ASHA_PATIENTS[0].id);
  const [orderPrescribedDays, setOrderPrescribedDays] = useState(3);
  const [orderInstructions, setOrderInstructions] = useState('Check blood pressure seated, monitor blood sugar, verify medication adherence.');
  const [orderChecks, setOrderChecks] = useState<string[]>(['Blood Pressure', 'Blood Sugar', 'Medication Compliance']);
  const [orderPriority, setOrderPriority] = useState<'ROUTINE' | 'PRIORITY' | 'URGENT'>('PRIORITY');

  const todayStr = '2026-03-11'; // Demo anchor date

  // Dynamic counts
  const counts = useMemo(() => {
    const dueToday = visits.filter((v) => v.visitDate === todayStr && !v.isCompleted).length;
    const upcoming = visits.filter((v) => v.visitDate > todayStr && !v.isCompleted).length;
    const overdue = visits.filter(
      (v) => (v.visitDate < todayStr && !v.isCompleted) || v.status === 'MISSED'
    ).length;
    const completed = visits.filter((v) => v.isCompleted).length;
    const doctorPrescribed = visits.filter((v) => Boolean(v.prescribedByDoctorName)).length;

    return {
      dueToday,
      upcoming,
      overdue,
      completed,
      doctorPrescribed,
      total: visits.length,
    };
  }, [visits]);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // 1. Tab Filter
      if (filter === 'DUE_TODAY' && (v.visitDate !== todayStr || v.isCompleted)) return false;
      if (filter === 'UPCOMING' && (v.visitDate <= todayStr || v.isCompleted)) return false;
      if (filter === 'OVERDUE' && !((v.visitDate < todayStr && !v.isCompleted) || v.status === 'MISSED')) return false;
      if (filter === 'COMPLETED' && !v.isCompleted) return false;

      // 2. Category Filter
      if (categoryFilter === 'URGENT' && v.priority !== 'URGENT' && v.priority !== 'HIGH') return false;
      if (categoryFilter === 'NCD' && v.visitType !== 'NCD_MONITORING') return false;
      if (categoryFilter === 'ANC' && v.visitType !== 'ANC' && v.visitType !== 'PNC') return false;
      if (categoryFilter === 'CHILD' && v.visitType !== 'CHILD_IMMUNIZATION') return false;

      // 3. Search query
      if (search) {
        const q = search.toLowerCase();
        const docName = (v.prescribedByDoctorName || '').toLowerCase();
        const docNotes = (v.doctorInstructions || '').toLowerCase();
        const ptName = v.patientName.toLowerCase();
        const village = (v.village || '').toLowerCase();
        const purpose = (v.purpose || '').toLowerCase();
        const checks = (v.prescribedChecks || []).join(' ').toLowerCase();

        return (
          ptName.includes(q) ||
          docName.includes(q) ||
          docNotes.includes(q) ||
          village.includes(q) ||
          purpose.includes(q) ||
          checks.includes(q)
        );
      }

      return true;
    });
  }, [visits, filter, categoryFilter, search]);

  // Handle Completing a Checkup
  const handleOpenCompletionModal = (v: AshaVisit) => {
    setSelectedVisitForCompletion(v);
    setCompletionNotes(v.notes || '');
    setCompletionAction(v.actionTaken || 'Conducted clinical checkup, verified vitals and doctor prescription adherence.');
    setCompletionReferral(v.requiresReferral || false);
    setCompletionReferralReason(v.referralReason || '');
  };

  const handleSubmitCompletion = () => {
    if (!selectedVisitForCompletion) return;

    completeAshaVisit(selectedVisitForCompletion.id, {
      notes: completionNotes,
      actionTaken: completionAction,
      requiresReferral: completionReferral,
      referralReason: completionReferral ? completionReferralReason : undefined,
    });

    refreshPendingCount();
    setSelectedVisitForCompletion(null);
  };

  // Handle Prescribing New Doctor Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = INITIAL_ASHA_PATIENTS.find((p) => p.id === orderPatientId);

    createDoctorPrescribedVisit({
      patientId: orderPatientId,
      patientName: pat?.name || 'Citizen Beneficiary',
      patientPhone: pat?.phone || '9898011223',
      village: pat?.village || 'Pethapur Ward 1',
      address: pat?.address || 'Near Community Hall',
      prescribedDays: orderPrescribedDays,
      doctorName: orderDoctorName,
      doctorSpecialty: orderDoctorSpecialty,
      doctorFacility: orderFacility,
      doctorInstructions: orderInstructions,
      prescribedChecks: orderChecks,
      priority: orderPriority,
    });

    setIsNewOrderModalOpen(false);
  };

  const toggleOrderCheck = (chk: string) => {
    if (orderChecks.includes(chk)) {
      setOrderChecks(orderChecks.filter((c) => c !== chk));
    } else {
      setOrderChecks([...orderChecks, chk]);
    }
  };

  return (
    <div className="space-y-5 font-sans pb-12">
      {/* =====================================================
          1. HEADER WITH ACTIONS
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Today's Checkup & Doctor Prescriptions
              </h1>
              <p className="text-xs text-slate-500">
                Doctor-ordered community follow-ups & clinical checkup schedules for village citizens.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewOrderModalOpen(true)}
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Doctor Prescription</span>
          </Button>
        </div>
      </div>

      {/* =====================================================
          2. KPI SUMMARY METRICS
      ====================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setFilter('DUE_TODAY')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'DUE_TODAY'
              ? 'bg-teal-50 border-teal-500 shadow-xs ring-1 ring-teal-500'
              : 'bg-white border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800">Due Today</span>
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-950 mt-2">
            {counts.dueToday}
          </div>
          <p className="text-[11px] text-teal-700 mt-0.5">
            Prescribed checkups due for visit today
          </p>
        </div>

        <div
          onClick={() => setFilter('UPCOMING')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'UPCOMING'
              ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Upcoming (2-7 Days)</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2">
            {counts.upcoming}
          </div>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Doctor prescribed for next 2 to 7 days
          </p>
        </div>

        <div
          onClick={() => setFilter('OVERDUE')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'OVERDUE'
              ? 'bg-rose-50 border-rose-500 shadow-xs ring-1 ring-rose-500'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Overdue / Urgent</span>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-950 mt-2">
            {counts.overdue}
          </div>
          <p className="text-[11px] text-rose-700 mt-0.5">
            Missed or high-priority cases
          </p>
        </div>

        <div
          onClick={() => setFilter('COMPLETED')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'COMPLETED'
              ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Completed</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2">
            {counts.completed}
          </div>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Visits logged & synced to repository
          </p>
        </div>
      </div>

      {/* =====================================================
          3. FILTER TABS & SEARCH
      ====================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Main Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {[
            { key: 'DUE_TODAY', label: `Today's Checkup (${counts.dueToday})` },
            { key: 'UPCOMING', label: `Upcoming (${counts.upcoming})` },
            { key: 'OVERDUE', label: `Overdue (${counts.overdue})` },
            { key: 'COMPLETED', label: `Completed (${counts.completed})` },
            { key: 'ALL', label: `All Orders (${counts.total})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Category Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, doctor, clinical note, ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {[
              { key: 'ALL', label: 'All Cases' },
              { key: 'URGENT', label: 'Urgent / High Priority' },
              { key: 'NCD', label: 'NCD / Chronic' },
              { key: 'ANC', label: 'Maternal ANC' },
              { key: 'CHILD', label: 'Child Health' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  categoryFilter === cat.key
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================
          4. CHECKUP LIST ("SAB DIKHE" - EVERYTHING VISIBLE)
      ====================================================== */}
      <div className="space-y-3.5">
        {filteredVisits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Checkups Found</p>
            <p className="text-xs text-slate-500 mt-1">
              There are no doctor-prescribed checkups matching your selected filter.
            </p>
          </div>
        ) : (
          filteredVisits.map((visit) => {
            const isDueToday = visit.visitDate === todayStr && !visit.isCompleted;
            const isOverdue = (visit.visitDate < todayStr && !visit.isCompleted) || visit.status === 'MISSED';
            const isUpcoming = visit.visitDate > todayStr && !visit.isCompleted;

            return (
              <div
                key={visit.id}
                className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                  visit.isCompleted
                    ? 'border-slate-200 opacity-85'
                    : isOverdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : isDueToday
                    ? 'border-teal-400 ring-1 ring-teal-400/40'
                    : 'border-slate-200'
                }`}
              >
                {/* 1. DOCTOR PRESCRIPTION HEADER */}
                <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-teal-100 text-teal-800">
                      <Stethoscope className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {visit.prescribedByDoctorName || 'Dr. Medical Officer'}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5 hidden sm:inline">
                        ({visit.prescribedByDoctorSpecialty || 'General Medicine'} • {visit.prescribedByDoctorFacility || 'PHC'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Timeline Pill */}
                    <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      <Clock className="h-3 w-3 text-teal-700" />
                      <span>
                        {visit.prescribedDays
                          ? `Visit in ${visit.prescribedDays} Days (${visit.visitDate})`
                          : `Scheduled: ${visit.visitDate}`}
                      </span>
                    </div>

                    {/* Due / Overdue Status */}
                    {isDueToday && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-600 text-white animate-pulse">
                        Due Today
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white">
                        Overdue
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Upcoming
                      </span>
                    )}
                    {visit.isCompleted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Done
                      </span>
                    )}

                    {/* Priority Badge */}
                    {visit.priority && (
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          visit.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : visit.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {visit.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. BODY CONTENT */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: Patient Demographics */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">
                          {visit.patientName}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({visit.village || 'Pethapur'})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {visit.address || 'Village Sector'}
                        </span>
                        {visit.patientPhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            +91 {visit.patientPhone}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-700">
                          {visit.visitType?.replace(/_/g, ' ') || 'CHECKUP'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Call & Quick Contact */}
                    {visit.patientPhone && (
                      <div className="shrink-0 flex items-center gap-2">
                        <a
                          href={`tel:${visit.patientPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 text-teal-800 hover:bg-teal-50 text-xs font-bold transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call Beneficiary
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 3. DOCTOR'S CLINICAL ORDERS & INSTRUCTIONS */}
                  <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                      <Stethoscope className="h-4 w-4 text-teal-700" />
                      <span>Doctor Prescription & Clinical Instructions:</span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-medium pl-6">
                      {visit.doctorInstructions || visit.notes || 'Routine follow-up prescribed by medical officer.'}
                    </p>

                    {/* Prescribed Checks Pills */}
                    {visit.prescribedChecks && visit.prescribedChecks.length > 0 && (
                      <div className="pl-6 pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider mr-1">
                          Checks to perform:
                        </span>
                        {visit.prescribedChecks.map((check, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white border border-teal-300 text-teal-900 shadow-2xs"
                          >
                            <HeartPulse className="h-3 w-3 text-teal-700" />
                            {check}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. IF COMPLETED: ACTION TAKEN SUMMARY */}
                  {visit.isCompleted && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span>Visit Completed on {visit.completedAt ? new Date(visit.completedAt).toLocaleDateString() : 'Today'}</span>
                      </div>
                      <p className="text-slate-700 text-[11px] pl-5">
                        <strong>Action Taken:</strong> {visit.actionTaken || 'Checkup completed successfully.'}
                      </p>
                      {visit.requiresReferral && (
                        <p className="text-rose-700 text-[11px] pl-5 font-bold">
                          ⚠ Flagged for Referral: {visit.referralReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 5. 1-CLICK ACTION BUTTONS */}
                  {!visit.isCompleted && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        Prescription Date: <strong>{visit.prescriptionDate || '2026-03-08'}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Record Vitals & Screening Direct Link */}
                        <Link to={`/asha/vitals?patientId=${visit.patientId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold rounded-xl border-teal-300 text-teal-800 hover:bg-teal-50 gap-1.5 cursor-pointer"
                          >
                            <Activity className="h-3.5 w-3.5 text-teal-700" />
                            <span>Record Vitals & Screening</span>
                            <ArrowRight className="h-3 w-3 text-teal-700" />
                          </Button>
                        </Link>

                        {/* Complete Checkup Button */}
                        <Button
                          onClick={() => handleOpenCompletionModal(visit)}
                          variant="primary"
                          size="sm"
                          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark Completed</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =====================================================
          5. COMPLETE CHECKUP MODAL
      ====================================================== */}
      {selectedVisitForCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Complete Today's Checkup
                </h3>
                <p className="text-xs text-slate-500">
                  Beneficiary: <strong>{selectedVisitForCompletion.patientName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedVisitForCompletion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Doctor's Instructions:
                </label>
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-950 border border-teal-200 text-xs">
                  {selectedVisitForCompletion.doctorInstructions || selectedVisitForCompletion.notes}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Clinical Findings & Observations:
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. BP was 132/84, patient compliant with morning medicine, foot wound clean..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Action Taken during Checkup:
                </label>
                <input
                  type="text"
                  value={completionAction}
                  onChange={(e) => setCompletionAction(e.target.value)}
                  placeholder="e.g. Measured vitals, checked medicines, counselled on salt restriction..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Referral Toggle */}
              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Does this patient need Referral to PHC / Doctor?
                  </span>
                  <input
                    type="checkbox"
                    checked={completionReferral}
                    onChange={(e) => setCompletionReferral(e.target.checked)}
                    className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                </div>

                {completionReferral && (
                  <div>
                    <input
                      type="text"
                      value={completionReferralReason}
                      onChange={(e) => setCompletionReferralReason(e.target.value)}
                      placeholder="Reason for escalation (e.g. BP > 150/95, worsening foot lesion)..."
                      className="w-full p-2 rounded-lg border border-rose-300 bg-rose-50/40 text-rose-950 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedVisitForCompletion(null)}
                className="flex-1 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitCompletion}
                variant="primary"
                className="flex-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl"
              >
                Submit Checkup Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          6. NEW DOCTOR ORDER / SCHEDULE MODAL
      ====================================================== */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateOrder}
            className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  New Doctor-Prescribed Checkup
                </h3>
                <p className="text-xs text-slate-500">
                  Schedule an ASHA community checkup with specified interval in days
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Doctor Details */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Doctor Name:
                  </label>
                  <input
                    type="text"
                    value={orderDoctorName}
                    onChange={(e) => setOrderDoctorName(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Doctor Specialty / PHC:
                  </label>
                  <input
                    type="text"
                    value={orderDoctorSpecialty}
                    onChange={(e) => setOrderDoctorSpecialty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Beneficiary Select */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Citizen Beneficiary:
                </label>
                <select
                  value={orderPatientId}
                  onChange={(e) => setOrderPatientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white shadow-2xs cursor-pointer"
                >
                  {INITIAL_ASHA_PATIENTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.village} • {p.gender}, {p.age}y)
                    </option>
                  ))}
                </select>
              </div>

              {/* Interval in Days */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700">
                    Visit Interval (Kitne Din Baad Visit Kare?):
                  </span>
                  <span className="font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full text-[10px]">
                    Due Date: {calculateTargetDate('2026-03-11', orderPrescribedDays)}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[1, 2, 3, 5, 7, 14].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setOrderPrescribedDays(d)}
                      className={`py-1.5 px-2 rounded-lg font-bold border transition-all text-center cursor-pointer ${
                        orderPrescribedDays === d
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      In {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Instructions */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Doctor Clinical Instructions for ASHA:
                </label>
                <textarea
                  rows={2}
                  value={orderInstructions}
                  onChange={(e) => setOrderInstructions(e.target.value)}
                  placeholder="e.g. Measure BP in sitting posture, verify fasting glucose, inspect wound..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Required Checks */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Checks to Perform:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Blood Pressure',
                    'Pulse Rate',
                    'Blood Sugar',
                    'SpO2 Check',
                    'Temperature',
                    'Wound Dressing',
                    'Medication Compliance',
                    'Diet Advice',
                  ].map((chk) => {
                    const isSel = orderChecks.includes(chk);
                    return (
                      <button
                        key={chk}
                        type="button"
                        onClick={() => toggleOrderCheck(chk)}
                        className={`text-[11px] px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-teal-100 text-teal-900 border-teal-300 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSel ? '✓ ' : '+ '}
                        {chk}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-700">Urgency Priority:</span>
                <div className="flex gap-1.5">
                  {(['ROUTINE', 'PRIORITY', 'URGENT'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOrderPriority(p)}
                      className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-md border cursor-pointer ${
                        orderPriority === p
                          ? p === 'URGENT'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : p === 'PRIORITY'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="flex-1 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl"
              >
                Save Prescription Order
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
