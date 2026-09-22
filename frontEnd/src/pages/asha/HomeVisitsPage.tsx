import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { INITIAL_ASHA_VISITS, INITIAL_ASHA_PATIENTS } from '@/mock/mockData';
import { ashaApi } from '@/api/ashaApi';
import { AshaVisit, VisitType, VisitStatus, AshaPatient } from '@/types/asha';
import { saveOfflineVisit } from '@/lib/db';
import { useConnection } from '@/contexts/ConnectionContext';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export const HomeVisitsPage: React.FC = () => {
  const { refreshPendingCount } = useConnection();
  const [visits, setVisits] = useState<AshaVisit[]>(INITIAL_ASHA_VISITS);
  const [citizens, setCitizens] = useState<AshaPatient[]>(INITIAL_ASHA_PATIENTS);
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'>('TODAY');
  const [search, setSearch] = useState('');
  const [selectedVisitForLogging, setSelectedVisitForLogging] = useState<AshaVisit | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Quick logging state
  const [logNotes, setLogNotes] = useState('');
  const [logAction, setLogAction] = useState('');
  const [logNeedsReferral, setLogNeedsReferral] = useState(false);
  const [logReferralReason, setLogReferralReason] = useState('');

  // New Visit modal form state
  const [newPatientId, setNewPatientId] = useState(INITIAL_ASHA_PATIENTS[0].id);
  const [newVisitDate, setNewVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTimeSlot, setNewTimeSlot] = useState('10:00 AM - 10:45 AM');
  const [newVisitType, setNewVisitType] = useState<VisitType>('ANC');
  const [newPurpose, setNewPurpose] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const fetchLiveVisits = async () => {
    try {
      const res = await ashaApi.getVisits();
      if (res.data && res.data.length > 0) setVisits(res.data);
    } catch (err) {
      console.warn('Failed to fetch visits:', err);
    }
  };

  const fetchLiveCitizens = async () => {
    try {
      const res = await ashaApi.getCitizens();
      if (res.data && res.data.length > 0) {
        setCitizens(res.data);
        setNewPatientId(res.data[0].id);
      }
    } catch (err) {
      console.warn('Failed to fetch citizens:', err);
    }
  };

  useEffect(() => {
    fetchLiveVisits();
    fetchLiveCitizens();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const counts = useMemo(() => {
    return {
      all: visits.length,
      today: visits.filter((v) => v.visitDate === todayStr && !v.isCompleted).length,
      upcoming: visits.filter((v) => v.visitDate > todayStr && !v.isCompleted).length,
      overdue: visits.filter((v) => (v.visitDate < todayStr && !v.isCompleted) || v.status === 'MISSED').length,
      completed: visits.filter((v) => v.isCompleted).length,
    };
  }, [visits]);

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      // Filter by tab
      if (filter === 'TODAY' && (v.visitDate !== todayStr || v.isCompleted)) return false;
      if (filter === 'UPCOMING' && (v.visitDate <= todayStr || v.isCompleted)) return false;
      if (filter === 'OVERDUE' && !((v.visitDate < todayStr && !v.isCompleted) || v.status === 'MISSED')) return false;
      if (filter === 'COMPLETED' && !v.isCompleted) return false;

      // Filter by search
      if (search) {
        const q = search.toLowerCase();
        return (
          v.patientName.toLowerCase().includes(q) ||
          (v.village && v.village.toLowerCase().includes(q)) ||
          v.purpose.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [visits, filter, search]);

  const handleStartLogging = (v: AshaVisit) => {
    setSelectedVisitForLogging(v);
    setLogNotes(v.notes || '');
    setLogAction(v.actionTaken || '');
    setLogNeedsReferral(v.requiresReferral || false);
    setLogReferralReason(v.referralReason || '');
  };

  const handleCompleteVisit = async (visitId: string) => {
    const updated = visits.map((v) => {
      if (v.id === visitId) {
        return {
          ...v,
          isCompleted: true,
          status: 'COMPLETED' as VisitStatus,
          notes: logNotes || v.notes,
          actionTaken: logAction || 'Home visit completed. Beneficiary health condition checked.',
          requiresReferral: logNeedsReferral,
          referralReason: logNeedsReferral ? logReferralReason : undefined,
          completedAt: new Date().toISOString(),
        };
      }
      return v;
    });

    const targetVisit = updated.find((v) => v.id === visitId);
    if (targetVisit) {
      await saveOfflineVisit(targetVisit);
      await refreshPendingCount();
    }

    setVisits(updated);
    setSelectedVisitForLogging(null);
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = citizens.find((p) => p.id === newPatientId) || INITIAL_ASHA_PATIENTS.find((p) => p.id === newPatientId);
    if (!patient) return;

    const newVisit: AshaVisit = {
      id: `vis_${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      village: patient.village,
      address: patient.address,
      visitDate: newVisitDate,
      timeSlot: newTimeSlot,
      visitType: newVisitType,
      purpose: newPurpose || `${newVisitType} Scheduled Checkup`,
      notes: newNotes,
      status: 'SCHEDULED',
      isCompleted: false,
    };

    try {
      await ashaApi.createVisit(newVisit);
    } catch (err) {
      console.warn('Backend visit create sync deferred:', err);
    }

    await saveOfflineVisit(newVisit);
    await refreshPendingCount();

    setVisits([newVisit, ...visits]);
    setIsScheduleModalOpen(false);
    setNewPurpose('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Visits & Encounters"
        subtitle="Plan, conduct, and record community home visits for maternal ANC, newborn PNC, child immunization, and NCD care."
        breadcrumbs={[{ label: 'ASHA Dashboard', to: '/asha' }, { label: 'Home Visits' }]}
        actions={
          <Button
            onClick={() => setIsScheduleModalOpen(true)}
            variant="primary"
            size="sm"
            className="gap-1.5 bg-teal-700 hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule New Visit</span>
          </Button>
        }
      />

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <button
          type="button"
          onClick={() => setFilter('TODAY')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            filter === 'TODAY'
              ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Today's Visits
          </span>
          <p className="text-2xl sm:text-3xl font-black text-teal-800 mt-1">{counts.today}</p>
          <span className="text-[11px] text-teal-700 font-medium">Due for field visit</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('OVERDUE')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            filter === 'OVERDUE'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
            Overdue / Missed
          </span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{counts.overdue}</p>
          <span className="text-[11px] text-rose-600 font-semibold">Priority rescheduling</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('UPCOMING')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            filter === 'UPCOMING'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Upcoming
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{counts.upcoming}</p>
          <span className="text-[11px] text-slate-500">Later this week</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('COMPLETED')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            filter === 'COMPLETED'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Completed
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{counts.completed}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Logged & recorded</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { key: 'TODAY', label: `Today (${counts.today})` },
            { key: 'OVERDUE', label: `Overdue (${counts.overdue})` },
            { key: 'UPCOMING', label: `Upcoming (${counts.upcoming})` },
            { key: 'COMPLETED', label: `Completed (${counts.completed})` },
            { key: 'ALL', label: `All (${counts.all})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filter === tab.key
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search citizen or purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
      </div>

      {/* Visits List */}
      <div className="space-y-3">
        {filteredVisits.length === 0 ? (
          <Card className="p-8 text-center bg-white border-slate-200">
            <CheckCircle2 className="mx-auto h-10 w-10 text-teal-600 mb-2" />
            <h3 className="font-bold text-slate-900 text-base">No Visits in This Filter</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All scheduled visits for this category have been addressed or none are planned. You can schedule a new visit above.
            </p>
          </Card>
        ) : (
          filteredVisits.map((visit) => (
            <Card
              key={visit.id}
              className={`border transition-all hover:shadow-sm ${
                visit.isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : visit.status === 'MISSED' || visit.visitDate < todayStr
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Visit Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">
                      {visit.patientName}
                    </span>

                    <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                      {visit.visitType?.replace(/_/g, ' ') || 'Routine'}
                    </span>

                    {visit.isCompleted ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Completed
                      </span>
                    ) : visit.status === 'MISSED' || visit.visitDate < todayStr ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 inline-flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Overdue
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        Scheduled
                      </span>
                    )}

                    {visit.requiresReferral && (
                      <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                        Referral Required
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{visit.purpose}</p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-teal-700" />
                      {visit.visitDate}
                    </span>
                    {visit.timeSlot && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {visit.timeSlot}
                      </span>
                    )}
                    {visit.address && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {visit.address}
                      </span>
                    )}
                  </div>

                  {visit.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100 italic">
                      Notes: {visit.notes}
                    </p>
                  )}

                  {visit.actionTaken && (
                    <p className="text-xs text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 font-medium">
                      Action Logged: {visit.actionTaken}
                    </p>
                  )}
                </div>

                {/* Direct Action Controls */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {visit.patientPhone && (
                    <a
                      href={`tel:${visit.patientPhone}`}
                      className="rounded-xl border border-slate-300 p-2.5 text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                      title="Call Beneficiary"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}

                  <Link to={`/asha/vitals?patientId=${visit.patientId}`}>
                    <Button variant="outline" size="sm" className="text-xs min-h-[44px] gap-1">
                      <Activity className="h-3.5 w-3.5 text-teal-700" />
                      <span>Vitals</span>
                    </Button>
                  </Link>

                  <Link to={`/asha/vitals?tab=screening&patientId=${visit.patientId}`}>
                    <Button variant="outline" size="sm" className="text-xs min-h-[44px] gap-1">
                      <ClipboardList className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Screen</span>
                    </Button>
                  </Link>

                  {!visit.isCompleted ? (
                    <Button
                      onClick={() => handleStartLogging(visit)}
                      variant="primary"
                      size="sm"
                      className="text-xs min-h-[44px] bg-teal-700 hover:bg-teal-800 font-bold"
                    >
                      Log Encounter
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg">
                      Recorded ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Inline Encounter Logger Drawer */}
              {selectedVisitForLogging?.id === visit.id && (
                <div className="border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5 space-y-4 rounded-b-2xl animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-700" />
                      Log Field Encounter for {visit.patientName}
                    </h4>
                    <button
                      onClick={() => setSelectedVisitForLogging(null)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Field Observations & Clinical Notes
                      </label>
                      <textarea
                        rows={2}
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        placeholder="e.g. Beneficiary reported no dizziness, diet compliance checked, fetal kicks regular..."
                        className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Counseling / Action Taken
                      </label>
                      <input
                        type="text"
                        value={logAction}
                        onChange={(e) => setLogAction(e.target.value)}
                        placeholder="e.g. Supplied 30 Iron-Folic Acid tablets, demonstrated breastfeeding latch, scheduled ultrasound"
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>

                    {/* Referral requirement checkbox */}
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-rose-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={logNeedsReferral}
                          onChange={(e) => setLogNeedsReferral(e.target.checked)}
                          className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>Beneficiary requires Medical Officer / PHC Referral</span>
                      </label>

                      {logNeedsReferral && (
                        <Input
                          placeholder="State reason for referral (e.g. Severe headache, BP > 140/90, severe anemia)"
                          value={logReferralReason}
                          onChange={(e) => setLogReferralReason(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        onClick={() => setSelectedVisitForLogging(null)}
                        variant="secondary"
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleCompleteVisit(visit.id)}
                        variant="primary"
                        size="sm"
                        className="bg-teal-700 hover:bg-teal-800 font-bold"
                      >
                        Save & Mark Completed
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Schedule New Visit Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Schedule Home Field Visit</h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleVisit} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Beneficiary
                </label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium shadow-2xs cursor-pointer focus:ring-2 focus:ring-teal-700"
                >
                  {citizens.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.village || 'Village'}) • {p.category?.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visit Date</label>
                  <Input
                    type="date"
                    value={newVisitDate}
                    onChange={(e) => setNewVisitDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium shadow-2xs cursor-pointer"
                  >
                    <option value="09:00 AM - 09:45 AM">09:00 AM - 09:45 AM</option>
                    <option value="10:00 AM - 10:45 AM">10:00 AM - 10:45 AM</option>
                    <option value="11:30 AM - 12:15 PM">11:30 AM - 12:15 PM</option>
                    <option value="02:00 PM - 02:45 PM">02:00 PM - 02:45 PM</option>
                    <option value="04:00 PM - 04:45 PM">04:00 PM - 04:45 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Visit Type</label>
                <select
                  value={newVisitType}
                  onChange={(e) => setNewVisitType(e.target.value as VisitType)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium shadow-2xs cursor-pointer"
                >
                  <option value="ANC">Antenatal Care (ANC)</option>
                  <option value="PNC">Postnatal Care (PNC)</option>
                  <option value="CHILD_IMMUNIZATION">Child Growth & Immunization</option>
                  <option value="NCD_MONITORING">NCD Hypertension & Diabetes</option>
                  <option value="ROUTINE_CHECKUP">Routine Family Health Survey</option>
                  <option value="POST_DISCHARGE">Post-Hospital Discharge Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purpose of Visit
                </label>
                <Input
                  placeholder="e.g. 3rd Trimester BP check & IFA compliance"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preparation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring spare digital BP batteries and MUAC tape"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
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
                  Save & Schedule Visit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
