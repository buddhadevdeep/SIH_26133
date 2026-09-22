import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/BottomSheet';
import { useLocationContext } from '@/contexts/LocationContext';
import { referralApi } from '@/api/referralApi';
import { Referral } from '@/types/referral';
import {
  GitBranch,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  RefreshCw,
  BedDouble,
  HelpCircle,
  Stethoscope,
} from 'lucide-react';

export const ReferralMonitor: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  const loadDistrictReferrals = async () => {
    try {
      setLoading(true);
      const res = await referralApi.getAll();
      if (res.data) setReferrals(res.data);
    } catch (err) {
      console.error('Failed to load district referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistrictReferrals();
  }, [selectedDistrict]);

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fromFacilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.toFacilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.toSpecialty.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'NEEDS_REVIEW') {
      matchesStatus = ['CREATED', 'SENT', 'RECEIVED', 'UNDER_REVIEW'].includes(r.status);
    } else if (statusFilter === 'CLARIFICATION') {
      matchesStatus = ['CLARIFICATION_REQUIRED', 'CLARIFICATION_RECEIVED'].includes(r.status);
    } else if (statusFilter === 'ACCEPTED') {
      matchesStatus = ['ACCEPTED', 'APPOINTMENT_CONFIRMED', 'PATIENT_ARRIVED'].includes(r.status);
    } else if (statusFilter === 'COMPLETED') {
      matchesStatus = ['CONSULTED', 'OUTCOME_RECORDED', 'COMPLETED', 'CLOSED'].includes(r.status);
    } else if (statusFilter !== 'ALL') {
      matchesStatus = r.status === statusFilter;
    }

    const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalReferrals = referrals.length;
  const emergencyCount = referrals.filter((r) => r.priority === 'EMERGENCY').length;
  const pendingCount = referrals.filter((r) => ['CREATED', 'SENT', 'RECEIVED', 'UNDER_REVIEW'].includes(r.status)).length;
  const inFlightClarification = referrals.filter((r) => ['CLARIFICATION_REQUIRED', 'CLARIFICATION_RECEIVED'].includes(r.status)).length;
  const completedCount = referrals.filter((r) => ['CONSULTED', 'OUTCOME_RECORDED', 'COMPLETED', 'CLOSED'].includes(r.status)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="District Referrals Intelligence"
          subtitle={`Monitor patient transfers, bed reservations, and clinical outcomes across ${selectedDistrict} District.`}
          breadcrumbs={[
            { label: 'District Admin', to: '/district' },
            { label: 'Referrals' },
          ]}
        />

        <Button
          onClick={loadDistrictReferrals}
          variant="outline"
          className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-2 min-h-[40px] cursor-pointer shadow-xs self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh District Feed
        </Button>
      </div>

      {/* Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Network Referrals</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <GitBranch className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalReferrals}</p>
          <span className="text-[11px] text-teal-700 font-medium">Active across {selectedDistrict}</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Emergency & Urgent</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{emergencyCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Critical bed allocation monitored</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Triage / Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">{inFlightClarification} clarification active</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Closed-Loop Outcomes</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{completedCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Full clinical loop completed</span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by patient, referral ID, facility, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 shadow-2xs px-3 py-2 bg-white text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEEDS_REVIEW">Needs Review / Triage</option>
              <option value="CLARIFICATION">Clarification In-Flight</option>
              <option value="ACCEPTED">Accepted / En Route</option>
              <option value="COMPLETED">Outcome Consulted</option>
              <option value="REJECTED">Diverted / Rerouted</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 shadow-2xs px-3 py-2 bg-white text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="URGENT">Urgent</option>
              <option value="ROUTINE">Routine</option>
            </select>
          </div>
        </div>

        {/* Referrals Table */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-700" />
            Loading transfers...
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl">
            <p className="text-xs font-semibold text-slate-600">No transfers found matching filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-slate-500 text-[10px]">Referral ID</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-slate-500 text-[10px]">Patient</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-slate-500 text-[10px]">Origin Facility</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-slate-500 text-[10px]">Receiving Hospital</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-slate-500 text-[10px]">Specialty</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-slate-500 text-[10px]">Priority</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-slate-500 text-[10px]">Status</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-slate-500 text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReferrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900">{r.referralCode}</td>
                    <td className="px-3.5 py-3 font-semibold text-slate-800">
                      {r.patientName} <span className="text-[11px] text-slate-400 font-normal">({r.patientAge}y • {r.patientGender})</span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-600 font-medium">{r.fromFacilityName}</td>
                    <td className="px-3.5 py-3 text-teal-800 font-bold">{r.toFacilityName}</td>
                    <td className="px-3.5 py-3 text-slate-700">{r.toSpecialty}</td>
                    <td className="px-3.5 py-3">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-3.5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3.5 py-3">
                      <Button
                        onClick={() => setSelectedReferral(r)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] font-semibold"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Referral Detail Drawer */}
      <Drawer
        open={!!selectedReferral}
        onOpenChange={(open) => !open && setSelectedReferral(null)}
        title={selectedReferral ? `Transfer Dossier: ${selectedReferral.referralCode}` : ''}
      >
        {selectedReferral && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedReferral.patientName}</span>
                <PriorityBadge priority={selectedReferral.priority} />
              </div>
              <p className="text-slate-500">
                Age: {selectedReferral.patientAge} | Phone: {selectedReferral.patientPhone} | ABHA: {selectedReferral.abhaId || 'Verified'}
              </p>
              <div className="pt-2 border-t border-slate-200 text-slate-700">
                <span className="font-semibold block">Transfer Reason:</span>
                <p className="mt-0.5">{selectedReferral.reasonForReferral}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Originating Facility</span>
                <span className="font-bold text-slate-900 mt-1 block">{selectedReferral.fromFacilityName}</span>
                <span className="text-slate-500 text-[11px]">Referred by: Dr. {selectedReferral.fromDoctorName}</span>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                <span className="text-teal-800 block text-[10px] font-bold uppercase">Destination Facility</span>
                <span className="font-bold text-teal-950 mt-1 block">{selectedReferral.toFacilityName}</span>
                <span className="text-teal-700 text-[11px]">Specialty: {selectedReferral.toSpecialty}</span>
              </div>
            </div>

            {/* Bed & Appointment Allocation */}
            {selectedReferral.appointmentSlot && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-teal-700 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-800 block">Allocated Ward / Bed</span>
                  <span className="font-semibold">{selectedReferral.appointmentSlot}</span>
                </div>
              </div>
            )}

            {/* Clarification thread */}
            {selectedReferral.clarificationRequest && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <span className="font-bold text-[10px] uppercase text-amber-800 block">Hospital Clarification Request:</span>
                <p className="bg-white/80 p-2 rounded border border-amber-200">{selectedReferral.clarificationRequest.message}</p>
                {selectedReferral.clarificationResponse && (
                  <>
                    <span className="font-bold text-[10px] uppercase text-emerald-800 block mt-2">Doctor Response:</span>
                    <p className="bg-white/80 p-2 rounded border border-emerald-200">{selectedReferral.clarificationResponse.message}</p>
                  </>
                )}
              </div>
            )}

            {/* Specialist Outcome */}
            {selectedReferral.clinicalOutcomeNotes && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                <span className="font-bold text-[10px] uppercase text-blue-800 block">Specialist Clinical Outcome ({selectedReferral.consultedDoctorName}):</span>
                <p className="bg-white/80 p-2 rounded border border-blue-200">{selectedReferral.clinicalOutcomeNotes}</p>
              </div>
            )}

            {/* Clinical Summary */}
            <div className="p-3 rounded-xl bg-slate-50 border space-y-1">
              <span className="font-bold text-slate-700 block">Initial Clinical Findings & Vitals:</span>
              <p className="text-slate-600 leading-relaxed">{selectedReferral.clinicalSummary || 'Standard clinical summary.'}</p>
            </div>

            {/* Events Timeline */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block">Transfer Audit History:</span>
              <div className="space-y-2">
                {selectedReferral.events.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-slate-50 border text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{ev.status.replace(/_/g, ' ')}</span>
                      <span className="text-slate-400 font-normal">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-500">{ev.actorName} ({ev.facilityName})</p>
                    {ev.notes && <p className="text-slate-600 italic">"{ev.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReferral(null)}
                className="flex-1 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
