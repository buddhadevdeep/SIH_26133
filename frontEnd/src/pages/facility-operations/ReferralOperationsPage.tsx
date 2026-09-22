import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { referralApi } from '@/api/referralApi';
import { Referral } from '@/types/referral';
import { ReferralCoordinationModal } from './components/ReferralCoordinationModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight,
  ArrowLeftRight,
  Clock,
  BedDouble,
  CheckCircle2,
  Hospital,
  UserCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Stethoscope,
  Activity,
  FileCheck2,
  Calendar,
  Filter,
} from 'lucide-react';

export const ReferralOperationsPage: React.FC = () => {
  const { user } = useAuth();
  const currentFacilityId = user?.facilityId || 'fac_civil_01';
  const currentFacilityName = user?.facilityName || 'Gandhinagar Civil Hospital';

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<'INBOUND' | 'OUTBOUND' | 'ALL'>('INBOUND');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [initialModalTab, setInitialModalTab] = useState<'OVERVIEW' | 'FEASIBILITY' | 'CLARIFICATION' | 'ACCEPT' | 'DIVERT'>('OVERVIEW');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [facilityScope, setFacilityScope] = useState<string>('MY_FACILITY'); // 'MY_FACILITY' | 'ALL_FACILITIES'

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const res = await referralApi.getAll();
      if (res.data) setReferrals(res.data);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const handleConfirmArrival = async (refId: string, patientName: string) => {
    try {
      const res = await referralApi.confirmArrival(refId);
      const updatedRef = res.data;
      setReferrals((prev) =>
        prev.map((r) => (r.id === refId ? (updatedRef || { ...r, status: 'PATIENT_ARRIVED' }) : r))
      );
      setToastMsg(`Arrival confirmed for ${patientName}! Live OPD/Casualty Token issued.`);
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err) {
      console.error('Failed to confirm arrival:', err);
    }
  };

  const openModalWithTab = (ref: Referral, tab: 'OVERVIEW' | 'FEASIBILITY' | 'CLARIFICATION' | 'ACCEPT' | 'DIVERT') => {
    setSelectedReferral(ref);
    setInitialModalTab(tab);
  };

  // Filter based on Inbound vs Outbound relative to operator's facility
  const filteredReferrals = referrals.filter((r) => {
    const isTargetFacility =
      facilityScope === 'ALL_FACILITIES' ||
      r.toFacilityId === currentFacilityId ||
      r.toFacilityName.toLowerCase().includes('civil') ||
      r.toFacilityName.toLowerCase().includes(currentFacilityName.toLowerCase());

    const isSourceFacility =
      r.fromFacilityId === currentFacilityId ||
      r.fromFacilityName.toLowerCase().includes(currentFacilityName.toLowerCase());

    let matchesDirection = true;
    if (facilityScope === 'MY_FACILITY') {
      if (direction === 'INBOUND') matchesDirection = isTargetFacility;
      else if (direction === 'OUTBOUND') matchesDirection = isSourceFacility && !isTargetFacility;
    }

    let matchesStatus = true;
    if (statusFilter === 'NEEDS_REVIEW') {
      matchesStatus = ['CREATED', 'SENT', 'RECEIVED', 'UNDER_REVIEW'].includes(r.status);
    } else if (statusFilter === 'URGENT_EMERGENCY') {
      matchesStatus = r.priority === 'EMERGENCY' || r.priority === 'URGENT';
    } else if (statusFilter === 'CLARIFICATION') {
      matchesStatus = ['CLARIFICATION_REQUIRED', 'CLARIFICATION_RECEIVED'].includes(r.status);
    } else if (statusFilter === 'ACCEPTED_SCHEDULED') {
      matchesStatus = ['ACCEPTED', 'APPOINTMENT_PENDING', 'APPOINTMENT_CONFIRMED', 'CHECKED_IN', 'PATIENT_ARRIVED'].includes(r.status);
    } else if (statusFilter === 'CONSULTED_CLOSED') {
      matchesStatus = ['CONSULTED', 'OUTCOME_RECORDED', 'COMPLETED', 'CLOSED'].includes(r.status);
    } else if (statusFilter === 'DIVERTED') {
      matchesStatus = ['REJECTED', 'REROUTED'].includes(r.status);
    } else if (statusFilter !== 'ALL') {
      matchesStatus = r.status === statusFilter;
    }

    const matchesSearch =
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referralCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fromFacilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.toFacilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.toSpecialty.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDirection && matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const needsReviewCount = referrals.filter((r) =>
    ['CREATED', 'SENT', 'RECEIVED', 'UNDER_REVIEW'].includes(r.status)
  ).length;

  const urgentEmergencyCount = referrals.filter(
    (r) => r.priority === 'EMERGENCY' || r.priority === 'URGENT'
  ).length;

  const clarificationCount = referrals.filter((r) =>
    ['CLARIFICATION_REQUIRED', 'CLARIFICATION_RECEIVED'].includes(r.status)
  ).length;

  const acceptedScheduledCount = referrals.filter((r) =>
    ['ACCEPTED', 'APPOINTMENT_PENDING', 'APPOINTMENT_CONFIRMED', 'CHECKED_IN', 'PATIENT_ARRIVED'].includes(r.status)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-3.5 text-xs font-semibold text-teal-900 flex items-center justify-between animate-in fade-in-50 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-teal-700 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Receiving Facility Operations
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {currentFacilityName} • Gandhinagar Healthcare Network
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inter-Facility Referral & Bed Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time referral triage, ICU/HDU bed reservations, clinician clarification dialogue, and patient intake coordination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Facility Scope Selector */}
          <select
            value={facilityScope}
            onChange={(e) => setFacilityScope(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-700 cursor-pointer shadow-2xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option value="MY_FACILITY">{currentFacilityName} (Active)</option>
            <option value="ALL_FACILITIES">All Gandhinagar Network Facilities</option>
          </select>

          <Button
            onClick={loadReferrals}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-2 min-h-[40px] cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 Targeted Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Needs Review */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'NEEDS_REVIEW' ? 'ALL' : 'NEEDS_REVIEW')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'NEEDS_REVIEW'
              ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200'
              : 'border-slate-200 bg-white hover:border-indigo-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Needs Review / Triage
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{needsReviewCount}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Awaiting bed & intake authorization
          </span>
        </button>

        {/* Card 2: Urgent / Emergency */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'URGENT_EMERGENCY' ? 'ALL' : 'URGENT_EMERGENCY')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'URGENT_EMERGENCY'
              ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-200'
              : 'border-slate-200 bg-white hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Urgent & Emergency
            </span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{urgentEmergencyCount}</p>
          <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">
            Immediate critical response SLA
          </span>
        </button>

        {/* Card 3: Clarification In-Flight */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'CLARIFICATION' ? 'ALL' : 'CLARIFICATION')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'CLARIFICATION'
              ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-200'
              : 'border-slate-200 bg-white hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Clarification In-Flight
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <HelpCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{clarificationCount}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Clinical queries active with doctor
          </span>
        </button>

        {/* Card 4: Accepted / Scheduled */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'ACCEPTED_SCHEDULED' ? 'ALL' : 'ACCEPTED_SCHEDULED')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ACCEPTED_SCHEDULED'
              ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-200'
              : 'border-slate-200 bg-white hover:border-teal-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Accepted & Scheduled
            </span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-teal-700 mt-2">{acceptedScheduledCount}</p>
          <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
            Beds reserved & en route
          </span>
        </button>
      </div>

      {/* Direction & Status Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Direction Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setDirection('INBOUND')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              direction === 'INBOUND'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Inbound Intake
          </button>
          <button
            onClick={() => setDirection('OUTBOUND')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              direction === 'OUTBOUND'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Outbound Transfers
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Needs Review', value: 'NEEDS_REVIEW' },
            { label: 'Urgent', value: 'URGENT_EMERGENCY' },
            { label: 'Clarification', value: 'CLARIFICATION' },
            { label: 'Accepted', value: 'ACCEPTED_SCHEDULED' },
            { label: 'Consulted / Done', value: 'CONSULTED_CLOSED' },
            { label: 'Diverted', value: 'DIVERTED' },
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full lg:w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, code, facility..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
        </div>
      </div>

      {/* Referrals List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-700" />
          Loading authoritative transfer manifests...
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Hospital className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No transfers found in this view</p>
          <p className="text-xs text-slate-400 mt-1">
            All patient referrals in this category are cleared or accounted for.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReferrals.map((ref) => {
            const isEmergency = ref.priority === 'EMERGENCY';
            const isUrgent = ref.priority === 'URGENT';
            const isPendingReview = ['CREATED', 'SENT', 'RECEIVED', 'UNDER_REVIEW'].includes(ref.status);
            const isClarificationRequired = ref.status === 'CLARIFICATION_REQUIRED';
            const isClarificationReceived = ref.status === 'CLARIFICATION_RECEIVED';
            const isAccepted = ref.status === 'ACCEPTED' || ref.status === 'APPOINTMENT_CONFIRMED';
            const isArrived = ref.status === 'PATIENT_ARRIVED';
            const isConsulted = ['CONSULTED', 'OUTCOME_RECORDED', 'COMPLETED', 'CLOSED'].includes(ref.status);
            const isRejected = ['REJECTED', 'REROUTED'].includes(ref.status);

            return (
              <Card
                key={ref.id}
                className={`p-4 border transition-all hover:shadow-sm ${
                  isPendingReview
                    ? 'border-indigo-300 ring-1 ring-indigo-200/60 bg-indigo-50/15'
                    : isEmergency
                    ? 'border-rose-200 bg-rose-50/10'
                    : isClarificationRequired
                    ? 'border-amber-300 bg-amber-50/15'
                    : isClarificationReceived
                    ? 'border-teal-300 bg-teal-50/20 ring-1 ring-teal-200'
                    : isAccepted
                    ? 'border-teal-200 bg-teal-50/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Patient Details & Origin/Dest */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {ref.referralCode}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isEmergency
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isUrgent
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {ref.priority} PRIORITY
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isPendingReview
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : isClarificationRequired
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isClarificationReceived
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : isAccepted
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : isArrived
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isConsulted
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ref.status.replace(/_/g, ' ')}
                      </span>

                      {ref.requiredIcu && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <BedDouble className="h-3 w-3" /> ICU Bed Required
                        </span>
                      )}

                      {ref.abhaId && (
                        <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          ABHA: {ref.abhaId}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {ref.patientName}
                        <span className="text-xs font-normal text-slate-500">
                          ({ref.patientAge}y • {ref.patientGender} • Ph: {ref.patientPhone || '9825011122'})
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        Target Specialty: <span className="font-bold text-slate-900">{ref.toSpecialty}</span> • Originating From:{' '}
                        <span className="text-teal-700 font-semibold">{ref.fromFacilityName}</span> (Dr. {ref.fromDoctorName})
                      </p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        <strong className="text-slate-700">Reason:</strong> {ref.reasonForReferral}
                      </p>
                    </div>

                    {/* Clarification Alert Strip */}
                    {isClarificationRequired && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-amber-950">
                            Clarification Query Pending with Dr. {ref.fromDoctorName}:
                          </span>
                          <span>"{ref.clarificationRequest?.message}"</span>
                        </div>
                      </div>
                    )}

                    {isClarificationReceived && (
                      <div className="rounded-lg bg-teal-50 border border-teal-200 p-2.5 text-xs text-teal-900 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-teal-950">
                            Dr. {ref.fromDoctorName} Provided Clarification:
                          </span>
                          <span>"{ref.clarificationResponse?.message}"</span>
                        </div>
                      </div>
                    )}

                    {/* Allocated Bed / Slot Info */}
                    {ref.appointmentSlot && (
                      <div className="text-xs text-teal-900 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 inline-flex items-center gap-2 font-semibold">
                        <BedDouble className="h-3.5 w-3.5 text-teal-700" />
                        <span>Assigned Bed / Slot: {ref.appointmentSlot}</span>
                      </div>
                    )}

                    {/* Arrived / Token Info */}
                    {isArrived && (
                      <div className="text-xs text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Patient Checked In at Casualty (Live Token: {ref.tokenNumber || 'A-035'})</span>
                      </div>
                    )}

                    {/* Clinical Outcome info */}
                    {ref.clinicalOutcomeNotes && (
                      <div className="text-xs text-blue-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 space-y-0.5">
                        <span className="font-bold block">
                          Consulted by {ref.consultedDoctorName || 'Specialist Consultant'}:
                        </span>
                        <p className="text-blue-800">{ref.clinicalOutcomeNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions and SLA Countdown */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      SLA Target: {new Date(ref.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isPendingReview && (
                        <>
                          <Button
                            onClick={() => openModalWithTab(ref, 'ACCEPT')}
                            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 h-9 px-3.5 cursor-pointer shadow-xs"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Coordinate Intake
                          </Button>
                          <Button
                            onClick={() => openModalWithTab(ref, 'CLARIFICATION')}
                            variant="outline"
                            className="text-xs font-semibold text-amber-800 border-amber-300 hover:bg-amber-50 h-9 px-3 cursor-pointer"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                            Ask Doctor
                          </Button>
                        </>
                      )}

                      {isClarificationReceived && (
                        <Button
                          onClick={() => openModalWithTab(ref, 'ACCEPT')}
                          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 h-9 px-3.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Review & Accept
                        </Button>
                      )}

                      {isAccepted && (
                        <Button
                          onClick={() => handleConfirmArrival(ref.id, ref.patientName)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-9 px-3.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirm Arrival
                        </Button>
                      )}

                      <Button
                        onClick={() => openModalWithTab(ref, 'OVERVIEW')}
                        variant="outline"
                        className="text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 h-9 px-3 cursor-pointer"
                      >
                        Full Dossier
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Coordination Modal */}
      <ReferralCoordinationModal
        open={!!selectedReferral}
        onOpenChange={(open) => !open && setSelectedReferral(null)}
        referral={selectedReferral}
        initialTab={initialModalTab}
        onReferralUpdated={(updated) => {
          setReferrals((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          setToastMsg(`Transfer ${updated.referralCode} updated to ${updated.status.replace(/_/g, ' ')}.`);
          setTimeout(() => setToastMsg(null), 4000);
        }}
      />
    </div>
  );
};