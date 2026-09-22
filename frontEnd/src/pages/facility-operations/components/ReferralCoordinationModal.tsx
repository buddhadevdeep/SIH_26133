import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Referral } from '@/types/referral';
import { referralApi } from '@/api/referralApi';
import {
  BedDouble,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Stethoscope,
  Send,
  Building2,
  Calendar,
  Sparkles,
  FileText,
  Activity,
  User,
  Phone,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface ReferralCoordinationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referral: Referral | null;
  onReferralUpdated: (updated: Referral) => void;
  initialTab?: 'OVERVIEW' | 'FEASIBILITY' | 'CLARIFICATION' | 'ACCEPT' | 'DIVERT';
}

export const ReferralCoordinationModal: React.FC<ReferralCoordinationModalProps> = ({
  open,
  onOpenChange,
  referral,
  onReferralUpdated,
  initialTab = 'OVERVIEW',
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FEASIBILITY' | 'CLARIFICATION' | 'ACCEPT' | 'DIVERT'>('OVERVIEW');
  const [assignedWard, setAssignedWard] = useState('Acute Emergency Bay 3');
  const [etaWindow, setEtaWindow] = useState('Immediate / In Transit');
  const [assignedDoctor, setAssignedDoctor] = useState('Dr. Arvind Patel (Cardiology)');
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [diversionReason, setDiversionReason] = useState('');
  const [suggestedFacility, setSuggestedFacility] = useState('GMERS Medical College Dharpur-Patan');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (referral) {
      setActiveTab(initialTab);
      setAssignedWard(referral.requiredIcu ? 'ICU Bed 04 (Cardiac Critical Care)' : 'Acute Emergency Bay 3');
      setEtaWindow('Immediate / In Transit');
      setAssignedDoctor(
        referral.toSpecialty.toLowerCase().includes('cardio')
          ? 'Dr. Arvind Patel (Senior Interventional Cardiologist)'
          : 'Dr. Neha Sharma (Emergency Medicine Specialist)'
      );
      setClarificationMessage('');
      setDiversionReason('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [referral, initialTab]);

  if (!referral) return null;

  const handleAccept = async () => {
    try {
      setSaving(true);
      setError(null);
      const slot = `${assignedWard} • ${assignedDoctor} • ETA: ${etaWindow}`;
      const res = await referralApi.accept(referral.id, slot);
      if (res.data) {
        onReferralUpdated(res.data);
        setSuccessMsg('Transfer accepted successfully! Admission and bed hold confirmed.');
        setTimeout(() => {
          onOpenChange(false);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Failed to accept transfer:', err);
      setError(err?.message || 'Failed to accept transfer referral.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestClarification = async () => {
    if (!clarificationMessage.trim()) {
      setError('Please provide a specific clinical question or clarification requirement.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const res = await referralApi.requestClarification(referral.id, clarificationMessage.trim());
      if (res.data) {
        onReferralUpdated(res.data);
        setSuccessMsg('Clarification request sent to referring doctor.');
        setTimeout(() => {
          onOpenChange(false);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Failed to request clarification:', err);
      setError(err?.message || 'Failed to send clarification request.');
    } finally {
      setSaving(false);
    }
  };

  const handleDivert = async () => {
    if (!diversionReason.trim()) {
      setError('Please provide a specific clinical or bed capacity reason for diverting this transfer.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const finalReason = `${diversionReason.trim()}${suggestedFacility ? ` [Recommended Reroute: ${suggestedFacility}]` : ''}`;
      const res = await referralApi.reject(referral.id, finalReason);
      if (res.data) {
        onReferralUpdated(res.data);
        setSuccessMsg('Patient diversion order recorded. Notification dispatched to referring facility.');
        setTimeout(() => {
          onOpenChange(false);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Failed to divert transfer:', err);
      setError(err?.message || 'Failed to divert transfer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="2xl">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  referral.priority === 'EMERGENCY'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : referral.priority === 'URGENT'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-teal-100 text-teal-800 border border-teal-300'
                }`}
              >
                {referral.priority} TRANSFER
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {referral.referralCode}
              </span>
            </div>

            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              SLA Deadline: {new Date(referral.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <DialogTitle className="text-lg font-bold text-slate-900 mt-1">
            Referral Triage & Bed Allocation Workspace
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Evaluating patient inbound from <strong className="text-slate-800">{referral.fromFacilityName}</strong> (Dr. {referral.fromDoctorName}) to <strong className="text-teal-700">{referral.toFacilityName}</strong>
          </DialogDescription>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'OVERVIEW'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1. Patient & Clinical Dossier
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('FEASIBILITY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'FEASIBILITY'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2. Facility Feasibility Check
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CLARIFICATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'CLARIFICATION'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3. Clarification Thread
              {(referral.clarificationRequest || referral.clarificationResponse) && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ACCEPT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ACCEPT'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
              }`}
            >
              4. Accept & Reserve Bed
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DIVERT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'DIVERT'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              5. Divert / Reject
            </button>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <DialogContent className="space-y-4 overflow-y-auto max-h-[58vh] py-4 pr-1">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: PATIENT & CLINICAL DOSSIER */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Patient Demographics & Identity */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-teal-700" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Patient Demographics & Identity
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    ABHA ID: {referral.abhaId || '91-4829-1029-4820'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Patient Name</span>
                    <span className="font-bold text-slate-900">{referral.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Age & Gender</span>
                    <span className="font-semibold text-slate-800">
                      {referral.patientAge} Years • {referral.patientGender}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Contact Phone</span>
                    <span className="font-mono text-slate-800">{referral.patientPhone || '9825011122'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">District / Area</span>
                    <span className="font-semibold text-slate-800">Gandhinagar, Gujarat</span>
                  </div>
                </div>
              </div>

              {/* Clinical Transfer Context */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-indigo-700" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Clinical Reason & Diagnostic Summary
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Specialty: {referral.toSpecialty}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Primary Reason for Referral
                  </span>
                  <p className="text-xs text-slate-900 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {referral.reasonForReferral}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Clinical Notes & Diagnostic Findings
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {referral.clinicalSummary || 'Patient presenting with signs requiring advanced secondary/tertiary evaluation and diagnostic workup.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {referral.requiredIcu && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                      <BedDouble className="h-3.5 w-3.5 text-rose-600" /> ICU Bed Mandatory
                    </span>
                  )}
                  {referral.requiredEquipment?.map((eq, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Req: {eq}
                    </span>
                  ))}
                  <span className="text-[11px] font-medium text-slate-500 ml-auto self-center">
                    Initiated: {new Date(referral.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quick Action Navigation */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  onClick={() => setActiveTab('FEASIBILITY')}
                  variant="outline"
                  className="text-xs font-bold text-slate-700 gap-1.5"
                >
                  Proceed to Feasibility Check <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: FACILITY FEASIBILITY CHECK */}
          {activeTab === 'FEASIBILITY' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-teal-50/50 border border-teal-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-teal-700" />
                  <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                    Live Operational Feasibility at {referral.toFacilityName}
                  </h4>
                </div>
                <p className="text-xs text-teal-900 leading-relaxed">
                  Real-time bed, equipment, and specialist availability matched against referral requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Emergency / OPD Beds</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xl font-black text-slate-900 mt-1">48 Available</p>
                  <span className="text-[10px] text-slate-400">Total 450 capacity (10.6% free)</span>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">ICU / HDU Critical Beds</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xl font-black text-emerald-700 mt-1">6 Available</p>
                  <span className="text-[10px] text-slate-400">40 total ICU beds (Ready for hold)</span>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Specialist On Duty</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xl font-black text-teal-700 mt-1">2 Active</p>
                  <span className="text-[10px] text-slate-400">{referral.toSpecialty} Unit Ready</span>
                </div>
              </div>

              {/* Equipment Verification List */}
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Key Equipment Status
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">128-Slice CT Scanner (Emergency Radiodiagnosis)</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Operational (Queue: 2)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Cath Lab / 2D Echocardiography</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Operational & On-Call
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">Mechanical Ventilators & High-Flow Oxygen</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      8 Free in Stock
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={() => setActiveTab('CLARIFICATION')}
                  variant="outline"
                  className="text-xs font-semibold text-slate-600 gap-1.5"
                >
                  <HelpCircle className="h-3.5 w-3.5" /> Need Clarification?
                </Button>

                <Button
                  onClick={() => setActiveTab('ACCEPT')}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5"
                >
                  Proceed to Accept & Reserve <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: CLARIFICATION THREAD */}
          {activeTab === 'CLARIFICATION' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="h-5 w-5 text-amber-700" />
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Inter-Facility Clarification Dialogue
                  </h4>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Ask clinical or logistical questions directly to referring doctor <strong className="text-amber-950">Dr. {referral.fromDoctorName}</strong> at {referral.fromFacilityName}.
                </p>
              </div>

              {/* History / Messages Thread */}
              <div className="space-y-3">
                {referral.clarificationRequest ? (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Hospital Operations Query Sent:</span>
                      <span className="text-slate-400">
                        {referral.clarificationRequest.requestedAt
                          ? new Date(referral.clarificationRequest.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Earlier'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
                      "{referral.clarificationRequest.message}"
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No clarification query has been requested yet.
                  </div>
                )}

                {referral.clarificationResponse && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-900">Dr. {referral.fromDoctorName}'s Response:</span>
                      <span className="text-emerald-700 font-semibold">Verified Clinical Response</span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium bg-white p-2.5 rounded-lg border border-emerald-200">
                      "{referral.clarificationResponse.message}"
                    </p>
                  </div>
                )}
              </div>

              {/* New Query Composer */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Compose Query for Referring Clinician
                </label>
                <textarea
                  rows={3}
                  value={clarificationMessage}
                  onChange={(e) => setClarificationMessage(e.target.value)}
                  placeholder="e.g., Please clarify if patient is on high-flow oxygen, and provide latest blood pressure and arterial blood gas values before ambulance departure."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />

                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Fast Preset Clinical Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Confirm hemodynamic stability and current inotrope/oxygen requirement.',
                      'Please share latest 12-lead ECG and troponin values.',
                      'Confirm if intravenous access (18G or central line) is established.',
                      'Does patient require immediate emergency hemodialysis upon intake?',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setClarificationMessage(preset)}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleRequestClarification}
                    disabled={saving || !clarificationMessage.trim()}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {saving ? 'Transmitting...' : 'Send Clarification Request to Doctor'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCEPT & RESERVE BED */}
          {activeTab === 'ACCEPT' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-teal-50 border border-teal-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-teal-700" />
                  <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                    Confirm Inbound Intake & Bed Allocation
                  </h4>
                </div>
                <p className="text-xs text-teal-900 leading-relaxed">
                  Accepting this transfer automatically notifies {referral.fromFacilityName}, confirms bed hold in the hospital management system, and creates an intake appointment slot.
                </p>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Allocated Ward / Bed Designation <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={assignedWard}
                    onChange={(e) => setAssignedWard(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 text-slate-900 font-semibold"
                    placeholder="e.g. Acute Emergency Bay 3 / ICU Bed 04"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'Acute Emergency Bay 3 (Resuscitation Area)',
                      'ICU Bed 04 (Cardiac Intensive Care)',
                      'Cardiology Step-down Ward Bed 12',
                      'Trauma Observation Bay 2',
                    ].map((w, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAssignedWard(w)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Attending Consultant / Department Unit
                    </label>
                    <input
                      type="text"
                      value={assignedDoctor}
                      onChange={(e) => setAssignedDoctor(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Expected Inbound Window / Transit Time
                    </label>
                    <input
                      type="text"
                      value={etaWindow}
                      onChange={(e) => setEtaWindow(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Sparkles className="h-4 w-4 text-teal-700" />
                    <span>Automated Actions on Acceptance:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600">
                    <li>Civil Hospital admission bed reservation confirmed.</li>
                    <li>Ambulance dispatch & transit tracking notified of destination readiness.</li>
                    <li>Patient SMS & ABHA record updated with assigned Ward ({assignedWard}).</li>
                    <li>Receiving doctor ({assignedDoctor}) receives case summary on clinical queue.</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleAccept}
                  disabled={saving || !assignedWard.trim()}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-2 px-5 py-2.5 cursor-pointer shadow-xs min-h-[42px]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {saving ? 'Authorizing...' : 'Authorize Acceptance & Reserve Bed Hold'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: DIVERT / REJECT */}
          {activeTab === 'DIVERT' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-5 w-5 text-rose-700" />
                  <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                    Divert Transfer to Alternate Facility
                  </h4>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">
                  If {referral.toFacilityName} cannot safely accommodate this patient due to bed exhaustion or critical equipment failure, issue an authorized diversion order.
                </p>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Clinical / Capacity Diversion Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={diversionReason}
                    onChange={(e) => setDiversionReason(e.target.value)}
                    placeholder="Provide specific medical reason for divert (e.g. ICU beds 100% saturated with ventilated patients; Cath lab emergency maintenance)."
                    className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'ICU critical beds currently at 100% capacity',
                      'Cardiac Cath lab under emergency technical repair',
                      'Requires tertiary Pediatric ECMO care not available here',
                      'Emergency Department at critical surge diversion protocol',
                    ].map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDiversionReason(chip)}
                        className="text-[10px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Recommended Alternate District Facility
                  </label>
                  <select
                    value={suggestedFacility}
                    onChange={(e) => setSuggestedFacility(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 font-semibold cursor-pointer shadow-2xs"
                  >
                    <option value="GMERS Medical College Dharpur-Patan">
                      GMERS Medical College Dharpur-Patan (28 km • 14 ICU Beds Available)
                    </option>
                    <option value="Kalol General Hospital">
                      Kalol General Hospital (12 km • 24 Emergency Beds Available)
                    </option>
                    <option value="UN Mehta Institute of Cardiology & Research Centre">
                      UN Mehta Institute of Cardiology & Research Centre (Ahmedabad - 32 km • Super-specialty)
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleDivert}
                  disabled={saving || !diversionReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-2 px-5 py-2.5 cursor-pointer shadow-xs min-h-[42px]"
                >
                  <XCircle className="h-4 w-4" />
                  {saving ? 'Transmitting Diversion...' : 'Issue Immediate Diversion Order'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>

        {/* Footer */}
        <DialogFooter className="border-t border-slate-200 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-xs font-semibold cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
};