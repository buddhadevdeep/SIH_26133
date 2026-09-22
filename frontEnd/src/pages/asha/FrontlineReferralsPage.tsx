import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { INITIAL_FRONTLINE_REFERRALS, INITIAL_ASHA_PATIENTS, INITIAL_FACILITIES } from '@/mock/mockData';
import { FrontlineReferral, AshaPatient } from '@/types/asha';
import { ashaApi } from '@/api/ashaApi';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Building2,
  Ambulance,
  Phone,
  Clock,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Search,
  ArrowRight,
  ShieldCheck,
  Navigation,
} from 'lucide-react';

export const FrontlineReferralsPage: React.FC = () => {
  const [referrals, setReferrals] = useState<FrontlineReferral[]>(INITIAL_FRONTLINE_REFERRALS);
  const [patients, setPatients] = useState<AshaPatient[]>(INITIAL_ASHA_PATIENTS);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COUNTER_REFERRED'>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Referral Form
  const [patientId, setPatientId] = useState(INITIAL_ASHA_PATIENTS[0]?.id || 'asha_p_01');
  const [selectedFacilityId, setSelectedFacilityId] = useState(INITIAL_FACILITIES[0]?.id || 'fac_civil_01');
  const [department, setDepartment] = useState('Maternal & Obstetric Care');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('URGENT');
  const [ambulanceReq, setAmbulanceReq] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    ashaApi.getReferrals().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setReferrals(res.data);
      }
    }).catch((err) => {
      console.warn('Live asha referrals fetch failed:', err);
    });

    ashaApi.getPatients().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setPatients(res.data);
        if (res.data[0]?.id) setPatientId(res.data[0].id);
      }
    }).catch(() => {});

    facilityApi.getAll().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setFacilities(res.data);
        setSelectedFacilityId(res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  const counts = useMemo(() => {
    return {
      all: referrals.length,
      active: referrals.filter((r) => r.status !== 'COUNTER_REFERRED').length,
      counterReferred: referrals.filter((r) => r.status === 'COUNTER_REFERRED').length,
      ambulance: referrals.filter((r) => r.ambulanceRequested).length,
    };
  }, [referrals]);

  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      if (statusFilter === 'ACTIVE' && r.status === 'COUNTER_REFERRED') return false;
      if (statusFilter === 'COUNTER_REFERRED' && r.status !== 'COUNTER_REFERRED') return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.patientName.toLowerCase().includes(q) ||
          r.referralNumber.toLowerCase().includes(q) ||
          r.targetFacilityName.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [referrals, statusFilter, search]);

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === patientId) || patients[0];
    if (!patient) return;

    const matchedFac = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];

    const newRef: FrontlineReferral = {
      id: `ref_fl_${Date.now()}`,
      referralNumber: `REF-PET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientPhone: patient.phone,
      village: patient.village,
      targetFacilityId: matchedFac?.id || 'fac_civil_01',
      targetFacilityName: matchedFac?.name || 'Gandhinagar Civil Hospital',
      targetFacilityType: (matchedFac?.type as any) || 'DISTRICT_HOSPITAL',
      department,
      reason,
      priority,
      ambulanceRequested: ambulanceReq,
      ambulanceStatus: ambulanceReq ? 'DISPATCHED' : 'NOT_REQUIRED',
      status: 'INITIATED',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await ashaApi.createReferral(newRef);
      if (res?.data) {
        setReferrals([res.data, ...referrals.filter((r) => r.id !== res.data.id)]);
      } else {
        setReferrals([newRef, ...referrals]);
      }
    } catch {
      setReferrals([newRef, ...referrals]);
    }
    setIsModalOpen(false);
    setReason('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Referrals & Counter-Referrals"
        subtitle="Initiate care escalation from rural hamlets to PHC, CHC, and District Hospitals. Track transport and doctor follow-up instructions."
        breadcrumbs={[{ label: 'ASHA Dashboard', to: '/asha' }, { label: 'Referrals' }]}
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="sm"
            className="gap-1.5 bg-teal-700 hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            <span>Create Frontline Referral</span>
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            Active Referrals
          </span>
          <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-1">{counts.active}</p>
          <span className="text-[11px] text-amber-700 font-medium">In transit or at PHC</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('COUNTER_REFERRED')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'COUNTER_REFERRED'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            Doctor Counter-Referrals
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{counts.counterReferred}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Advice returned to ASHA</span>
        </button>

        <Card className="p-4 bg-white border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
            Ambulance Dispatches
          </span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{counts.ambulance}</p>
          <span className="text-[11px] text-rose-600 font-medium">108 Emergency Fleet</span>
        </Card>

        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
            Total Cohort Referrals
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{counts.all}</p>
          <span className="text-[11px] text-teal-700 font-medium">Full referral pipeline</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-teal-800 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Referrals ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-teal-800 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Active In Transit ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COUNTER_REFERRED')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'COUNTER_REFERRED'
                ? 'bg-teal-800 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Doctor Feedback ({counts.counterReferred})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search referrals by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
      </div>

      {/* Referral Cards */}
      <div className="space-y-4">
        {filteredReferrals.map((ref) => (
          <Card key={ref.id} className="border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Header bar */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                  {ref.referralNumber}
                </span>

                <PriorityBadge priority={ref.priority} />

                {ref.status === 'COUNTER_REFERRED' ? (
                  <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Counter-Referred by Doctor
                  </span>
                ) : ref.status === 'IN_TRANSIT' ? (
                  <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 animate-spin" /> In Transit
                  </span>
                ) : (
                  <span className="rounded-full bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                    {ref.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500">
                Created: {new Date(ref.createdAt).toLocaleDateString()}
              </div>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-extrabold text-base text-slate-900">
                    {ref.patientName} ({ref.patientAge} Yrs, {ref.patientGender})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Village: <strong>{ref.village}</strong> • Mobile: +91 {ref.patientPhone}
                  </p>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs space-y-1 mt-2">
                    <span className="font-bold text-slate-700 block">Escalation Reason:</span>
                    <p className="text-slate-700">{ref.reason}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 space-y-2 md:w-80 shrink-0">
                  <div className="flex items-center gap-2 text-teal-900">
                    <Building2 className="h-4 w-4 text-teal-700 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                        Target Facility
                      </span>
                      <strong className="text-xs text-slate-900 block">{ref.targetFacilityName}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 pl-6">
                    Dept: <strong>{ref.department}</strong>
                  </p>

                  {ref.ambulanceRequested && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 flex items-center gap-2 text-rose-900 text-xs">
                      <Ambulance className="h-4 w-4 text-rose-600 shrink-0 animate-pulse" />
                      <div>
                        <span className="font-bold block text-[11px]">108 Ambulance Requested</span>
                        <span className="text-[10px] text-rose-700">Status: {ref.ambulanceStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Counter-Referral Feedback Box */}
              {ref.doctorFeedback && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <Stethoscope className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Medical Officer Clinical Counter-Referral Advice
                    </span>
                  </div>
                  <p className="text-xs text-emerald-950 font-medium pl-6 leading-relaxed">
                    {ref.doctorFeedback}
                  </p>
                </div>
              )}

              {/* Direct Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`tel:${ref.patientPhone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                >
                  <Phone className="h-4 w-4 text-slate-500" />
                  Call Beneficiary
                </a>

                <div className="flex items-center gap-2">
                  <Link to="/asha/facilities">
                    <Button variant="outline" size="sm" className="text-xs min-h-[44px]">
                      Hospital Directory
                    </Button>
                  </Link>
                  <Link to="/asha/visits">
                    <Button variant="primary" size="sm" className="text-xs min-h-[44px] bg-teal-700 hover:bg-teal-800">
                      Schedule Follow-up Visit
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Referral Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Initiate Health Facility Referral</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Citizen to Refer
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium shadow-2xs cursor-pointer"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age}Y, {p.village}) • {p.category?.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Healthcare Facility
                </label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium shadow-2xs cursor-pointer"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialty / Dept</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium shadow-2xs cursor-pointer"
                  >
                    <option value="Maternal & Obstetric Care">Maternal & Obstetric Care</option>
                    <option value="Pediatrics & Nutrition">Pediatrics & Nutrition</option>
                    <option value="NCD & Diabetic Foot Clinic">NCD & Diabetic Foot Clinic</option>
                    <option value="Chest & Respiratory (TB)">Chest & Respiratory (TB)</option>
                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium shadow-2xs cursor-pointer"
                  >
                    <option value="URGENT">Urgent (Within 24 Hours)</option>
                    <option value="EMERGENCY">Emergency (Immediate)</option>
                    <option value="ROUTINE">Routine (Next 3–5 Days)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Referral & Danger Signs
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Severe anemia (Hb 7.2) with headache, fetal heart sounds weak, blood sugar > 280..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-700"
                  required
                />
              </div>

              {/* Ambulance Request Checkbox */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                <label className="flex items-center gap-2 text-xs font-bold text-rose-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ambulanceReq}
                    onChange={(e) => setAmbulanceReq(e.target.checked)}
                    className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Dispatch 108 Emergency Ambulance for Transport</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 font-bold"
                >
                  Confirm & Dispatch Referral
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
