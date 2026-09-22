import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { referralApi } from '@/api/referralApi';
import { Referral } from '@/types/referral';
import { ReferralCreationWizard } from './ReferralCreationWizard';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GitBranch,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  BedDouble,
  Building2,
  User,
  Stethoscope,
  ArrowRight,
  Search,
  RefreshCw,
  FileText,
  Phone,
  ShieldCheck,
  Activity,
  Plus,
  Calendar,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export const DoctorReferralHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'TRACKER' | 'CREATE' | 'INBOUND'
  const initialTab = searchParams.get('tab') === 'create' ? 'CREATE' : 'TRACKER';
  const [activeTab, setActiveTab] = useState<'TRACKER' | 'CREATE' | 'INBOUND'>(initialTab);

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Clarification Response Modal State
  const [activeClarificationRef, setActiveClarificationRef] = useState<Referral | null>(null);
  const [clarificationResponseText, setClarificationResponseText] = useState('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);

  // Selected Referral Details Modal
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const res = await referralApi.getAll();
      if (res.data) setReferrals(res.data);
    } catch (err) {
      console.error('Failed to load referrals for doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const handleOpenClarificationModal = (ref: Referral) => {
    setActiveClarificationRef(ref);
    setClarificationResponseText('');
  };

  const handleSubmitClarification = async () => {
    if (!activeClarificationRef || !clarificationResponseText.trim()) return;
    try {
      setIsSubmittingClarification(true);
      const res = await referralApi.respondClarification(
        activeClarificationRef.id,
        clarificationResponseText.trim()
      );
      if (res.data) {
        setReferrals((prev) =>
          prev.map((r) => (r.id === activeClarificationRef.id ? res.data : r))
        );
        setToastMsg(`Clarification sent to ${activeClarificationRef.toFacilityName}. Status updated to Clarification Received.`);
        setActiveClarificationRef(null);
        setTimeout(() => setToastMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to submit clarification:', err);
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  // Outbound referrals: Created by this doctor or facility
  const outboundReferrals = referrals.filter((r) => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referralCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.toFacilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.toSpecialty.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'CLARIFICATION') {
      matchesStatus = r.status === 'CLARIFICATION_REQUIRED';
    } else if (statusFilter === 'ACCEPTED') {
      matchesStatus = ['ACCEPTED', 'APPOINTMENT_CONFIRMED', 'PATIENT_ARRIVED'].includes(r.status);
    } else if (statusFilter === 'COMPLETED') {
      matchesStatus = ['CONSULTED', 'OUTCOME_RECORDED', 'COMPLETED', 'CLOSED'].includes(r.status);
    } else if (statusFilter === 'PENDING') {
      matchesStatus = ['CREATED', 'SENT', 'RECEIVED', 'UNDER_REVIEW'].includes(r.status);
    }

    return matchesSearch && matchesStatus;
  });

  // Inbound referrals directed to this doctor's facility or specialty
  const inboundReferrals = referrals.filter((r) => {
    const isTarget =
      r.toFacilityId === user?.facilityId ||
      r.toFacilityName.toLowerCase().includes('civil') ||
      r.toSpecialty.toLowerCase().includes('cardio');
    return isTarget;
  });

  const pendingClarificationCount = referrals.filter(
    (r) => r.status === 'CLARIFICATION_REQUIRED'
  ).length;

  const acceptedCount = referrals.filter((r) =>
    ['ACCEPTED', 'APPOINTMENT_CONFIRMED', 'PATIENT_ARRIVED'].includes(r.status)
  ).length;

  const outcomesReadyCount = referrals.filter((r) =>
    ['CONSULTED', 'OUTCOME_RECORDED', 'COMPLETED'].includes(r.status)
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
              Closed-Loop Clinical Referrals
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {user?.name || 'Dr. Arvind Patel'} • {user?.facilityName || 'Mansa Community Health Centre (CHC)'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Referral Coordination & Specialist Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create high-acuity transfers, respond to hospital clarification queries, and review specialist consultation outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setActiveTab('CREATE');
              setSearchParams({ tab: 'create' });
            }}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 h-10 px-4 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Create New Referral
          </Button>

          <Button
            onClick={loadReferrals}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-1.5 h-10 px-3 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Outbound
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{outboundReferrals.length}</p>
          <span className="text-[11px] text-slate-400">Total transferred patients</span>
        </Card>

        <Card className={`p-4 border transition-all ${
          pendingClarificationCount > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Clarification Required
            </span>
            {pendingClarificationCount > 0 && (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingClarificationCount}</p>
          <span className="text-[11px] text-amber-800 font-semibold">
            {pendingClarificationCount > 0 ? 'Action required by you' : 'No pending hospital queries'}
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
            Accepted & En Route
          </span>
          <p className="text-2xl font-black text-teal-700 mt-1">{acceptedCount}</p>
          <span className="text-[11px] text-teal-700 font-semibold">Beds allocated & confirmed</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
            Specialist Outcomes
          </span>
          <p className="text-2xl font-black text-blue-700 mt-1">{outcomesReadyCount}</p>
          <span className="text-[11px] text-blue-700 font-semibold">Closed-loop consultations</span>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveTab('TRACKER');
            setSearchParams({});
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'TRACKER'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          Outbound Transfer Tracker ({outboundReferrals.length})
          {pendingClarificationCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black text-[10px]">
              {pendingClarificationCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('CREATE');
            setSearchParams({ tab: 'create' });
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'CREATE'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Plus className="h-4 w-4" />
          Initiate New Referral
        </button>

        <button
          onClick={() => {
            setActiveTab('INBOUND');
            setSearchParams({ tab: 'inbound' });
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'INBOUND'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          Inbound Specialist Queue ({inboundReferrals.length})
        </button>
      </div>

      {/* TAB 1: OUTBOUND TRACKER */}
      {activeTab === 'TRACKER' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { label: 'All Transfers', value: 'ALL' },
                { label: 'Pending Clarification', value: 'CLARIFICATION' },
                { label: 'Under Review', value: 'PENDING' },
                { label: 'Accepted & En Route', value: 'ACCEPTED' },
                { label: 'Completed Outcomes', value: 'COMPLETED' },
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

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, hospital, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Referrals Cards List */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-700" />
              Loading referrals...
            </div>
          ) : outboundReferrals.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <GitBranch className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No referrals found in this view</p>
              <p className="text-xs text-slate-400 mt-1">
                You have not initiated any patient transfers matching this filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {outboundReferrals.map((ref) => {
                const isEmergency = ref.priority === 'EMERGENCY';
                const isUrgent = ref.priority === 'URGENT';
                const isClarificationNeeded = ref.status === 'CLARIFICATION_REQUIRED';
                const isAccepted = ['ACCEPTED', 'APPOINTMENT_CONFIRMED', 'PATIENT_ARRIVED'].includes(ref.status);
                const isOutcomeRecorded = ['CONSULTED', 'OUTCOME_RECORDED', 'COMPLETED'].includes(ref.status);

                return (
                  <Card
                    key={ref.id}
                    className={`p-4 border transition-all ${
                      isClarificationNeeded
                        ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
                        : isEmergency
                        ? 'border-rose-200 bg-rose-50/10'
                        : isOutcomeRecorded
                        ? 'border-blue-200 bg-blue-50/10'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {ref.referralCode}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isEmergency
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : isUrgent
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ref.priority} PRIORITY
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isClarificationNeeded
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isAccepted
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : isOutcomeRecorded
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
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
                        </div>

                        {/* Patient & Facility info */}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {ref.patientName}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              ({ref.patientAge}y • {ref.patientGender} • Ph: {ref.patientPhone})
                            </span>
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Referred to: <strong className="text-teal-800">{ref.toFacilityName}</strong> • Specialty: <strong className="text-slate-800">{ref.toSpecialty}</strong>
                          </p>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                            <strong>Reason:</strong> {ref.reasonForReferral}
                          </p>
                        </div>

                        {/* HIGH PRIORITY: CLARIFICATION STRIP */}
                        {isClarificationNeeded && (
                          <div className="rounded-xl bg-amber-100/70 border border-amber-300 p-3 text-xs text-amber-950 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900">
                              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                              <span>Clarification Requested by Receiving Facility Operations:</span>
                            </div>
                            <p className="text-xs font-medium bg-white/80 p-2 rounded-lg border border-amber-200">
                              "{ref.clarificationRequest?.message}"
                            </p>
                          </div>
                        )}

                        {/* Response already sent */}
                        {ref.clarificationResponse && (
                          <div className="rounded-xl bg-teal-50 border border-teal-200 p-2.5 text-xs text-teal-900">
                            <span className="font-bold block text-teal-950">Your Response Provided:</span>
                            <span className="text-teal-800">"{ref.clarificationResponse?.message}"</span>
                          </div>
                        )}

                        {/* Accepted Slot */}
                        {ref.appointmentSlot && (
                          <div className="text-xs text-teal-900 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 inline-flex items-center gap-2 font-semibold">
                            <BedDouble className="h-3.5 w-3.5 text-teal-700" />
                            <span>Hospital Assigned Bed & Slot: {ref.appointmentSlot}</span>
                          </div>
                        )}

                        {/* Specialist Outcome Report */}
                        {isOutcomeRecorded && ref.clinicalOutcomeNotes && (
                          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-950 space-y-1">
                            <div className="flex items-center justify-between font-bold text-blue-900">
                              <span>Specialist Consultation Findings ({ref.consultedDoctorName}):</span>
                              <span className="text-[10px] text-blue-600">Continuity of Care</span>
                            </div>
                            <p className="text-xs text-blue-900 bg-white/80 p-2 rounded-lg border border-blue-200">
                              {ref.clinicalOutcomeNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          SLA Target: {new Date(ref.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div className="flex items-center gap-2">
                          {isClarificationNeeded && (
                            <Button
                              onClick={() => handleOpenClarificationModal(ref)}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 h-9 px-3.5 cursor-pointer shadow-xs animate-pulse"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Respond to Query
                            </Button>
                          )}

                          <Button
                            onClick={() => setSelectedReferral(ref)}
                            variant="outline"
                            className="text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 h-9 px-3 cursor-pointer"
                          >
                            View Dossier
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE NEW REFERRAL */}
      {activeTab === 'CREATE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-teal-50/60 border border-teal-200 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-700" />
              <span className="text-xs font-bold text-teal-950">
                Authoritative Referral Dispatch Protocol Active
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('TRACKER');
                setSearchParams({});
              }}
              className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
            >
              ← Back to Outbound Tracker
            </button>
          </div>

          <ReferralCreationWizard />
        </div>
      )}

      {/* TAB 3: INBOUND SPECIALIST QUEUE */}
      {activeTab === 'INBOUND' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Inbound Transferred Patients for Consultation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients referred from peripheral health centers (CHCs/PHCs) to your clinical specialty.
            </p>
          </div>

          {inboundReferrals.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Stethoscope className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No inbound specialist referrals pending</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inboundReferrals.map((ref) => (
                <Card key={ref.id} className="p-4 border-slate-200 bg-white">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {ref.referralCode}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          {ref.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {ref.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {ref.patientName} ({ref.patientAge}y • {ref.patientGender})
                      </h4>
                      <p className="text-xs text-slate-600">
                        Originating Clinic: <strong className="text-teal-700">{ref.fromFacilityName}</strong> (Dr. {ref.fromDoctorName})
                      </p>
                      <p className="text-xs text-slate-500">
                        Clinical Context: {ref.reasonForReferral}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => navigate(`/doctor/patients/${ref.patientId || 'usr_pat_01'}?referralId=${ref.id}`)}
                        className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 h-9 px-4 cursor-pointer"
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        Open Clinical Consultation
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clarification Response Modal */}
      {activeClarificationRef && (
        <Dialog open={!!activeClarificationRef} onOpenChange={(open) => !open && setActiveClarificationRef(null)} maxWidth="lg">
          <div>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  CLARIFICATION REQUEST
                </span>
                <span className="text-xs font-mono text-slate-400">{activeClarificationRef.referralCode}</span>
              </div>
              <DialogTitle>Respond to Hospital Operations Query</DialogTitle>
              <DialogDescription>
                {activeClarificationRef.toFacilityName} requires additional clinical information before finalizing bed allocation.
              </DialogDescription>
            </DialogHeader>

            <DialogContent className="space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-950 space-y-1">
                <span className="font-bold block text-amber-900">Hospital Operations Query:</span>
                <p className="font-medium bg-white/70 p-2 rounded-lg border border-amber-200">
                  "{activeClarificationRef.clarificationRequest?.message}"
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Clinical Clarification Response <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={clarificationResponseText}
                  onChange={(e) => setClarificationResponseText(e.target.value)}
                  placeholder="Provide precise vital parameters, lab values, or transport stability notes..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Fast Clinical Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Patient is hemodynamically stable on 2L O2 nasal cannula; IV access established.',
                    'ABG results: pH 7.38, PaO2 88 mmHg, HCO3 22; Troponin T is positive.',
                    'Ambulance 108 dispatched with paramedic; estimated transit time 22 minutes.',
                    'No immediate intubation required; airway clear and vitals stable.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setClarificationResponseText(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </DialogContent>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActiveClarificationRef(null)}
                disabled={isSubmittingClarification}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitClarification}
                disabled={isSubmittingClarification || !clarificationResponseText.trim()}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmittingClarification ? 'Transmitting...' : 'Submit Clarification to Receiving Hospital'}
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}

      {/* Selected Referral Dossier Modal */}
      {selectedReferral && (
        <Dialog open={!!selectedReferral} onOpenChange={(open) => !open && setSelectedReferral(null)} maxWidth="lg">
          <div>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {selectedReferral.referralCode}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Status: {selectedReferral.status}
                </span>
              </div>
              <DialogTitle className="mt-1">Referral Dossier: {selectedReferral.patientName}</DialogTitle>
              <DialogDescription>
                Transferred to {selectedReferral.toFacilityName} • {selectedReferral.toSpecialty}
              </DialogDescription>
            </DialogHeader>

            <DialogContent className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1">
                <p><strong>Patient:</strong> {selectedReferral.patientName} ({selectedReferral.patientAge}y • {selectedReferral.patientGender})</p>
                <p><strong>Phone:</strong> {selectedReferral.patientPhone}</p>
                {selectedReferral.abhaId && <p><strong>ABHA ID:</strong> {selectedReferral.abhaId}</p>}
                <p><strong>Initiated By:</strong> Dr. {selectedReferral.fromDoctorName} ({selectedReferral.fromFacilityName})</p>
                <p><strong>Date / Time:</strong> {new Date(selectedReferral.createdAt).toLocaleString()}</p>
              </div>

              <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Reason for Referral:</span>
                <p className="text-slate-800">{selectedReferral.reasonForReferral}</p>
                {selectedReferral.clinicalSummary && (
                  <>
                    <span className="font-bold text-slate-700 block mt-2">Clinical Findings:</span>
                    <p className="text-slate-600">{selectedReferral.clinicalSummary}</p>
                  </>
                )}
              </div>

              {selectedReferral.appointmentSlot && (
                <div className="rounded-xl bg-teal-50 p-3 border border-teal-200 text-teal-900">
                  <strong>Assigned Bed / Slot:</strong> {selectedReferral.appointmentSlot}
                </div>
              )}

              {selectedReferral.clinicalOutcomeNotes && (
                <div className="rounded-xl bg-blue-50 p-3 border border-blue-200 text-blue-900 space-y-1">
                  <strong>Specialist Consultation Outcome ({selectedReferral.consultedDoctorName}):</strong>
                  <p>{selectedReferral.clinicalOutcomeNotes}</p>
                </div>
              )}
            </DialogContent>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReferral(null)} className="text-xs">
                Close
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </div>
  );
};
