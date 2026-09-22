import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { registrationApi } from '@/api/registrationApi';
import { queueApi } from '@/api/queueApi';
import { Appointment, LiveQueueState, Token } from '@/types/queue';
import { OpdTokenSlipModal } from './components/OpdTokenSlipModal';
import { AssignDoctorModal } from './components/AssignDoctorModal';
import {
  UserPlus,
  CalendarCheck2,
  Ticket,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  ArrowRight,
  Building2,
  AlertCircle,
  Volume2,
  UserCheck,
  RefreshCw,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const RegistrationClerkDashboard: React.FC = () => {
  const [queue, setQueue] = useState<LiveQueueState | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [activeSlipToken, setActiveSlipToken] = useState<Token | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Assign Doctor Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAppointmentForAssign, setSelectedAppointmentForAssign] = useState<Appointment | null>(null);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [queueRes, aptRes] = await Promise.all([
        queueApi.getLiveQueue('fac_civil_01'),
        registrationApi.getAppointments(),
      ]);
      if (queueRes.data) setQueue(queueRes.data);
      if (aptRes.data) setAppointments(aptRes.data);
    } catch (err) {
      console.error('Failed to load clerk dashboard data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-poll every 8 seconds so newly booked patient appointments appear live!
    const interval = setInterval(() => {
      loadData(false);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAssignModal = (apt: Appointment) => {
    setSelectedAppointmentForAssign(apt);
    setAssignModalOpen(true);
  };

  const handleDoctorAssigned = (updatedApt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updatedApt.id ? updatedApt : a))
    );
    setActionNotice(
      `Doctor ${updatedApt.doctorName} assigned to patient ${updatedApt.patientName}.`
    );
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleCallNext = async () => {
    try {
      setCallingNext(true);
      const res = await queueApi.callNext('fac_civil_01', 'dep_med');
      if (res.data?.queue) {
        setQueue(res.data.queue);
        setActionNotice(
          res.data.calledToken
            ? `Token ${res.data.calledToken.tokenNumber} (${res.data.calledToken.patientName}) called to Room 4`
            : 'No more waiting tokens in queue'
        );
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Failed to call next token:', err);
    } finally {
      setCallingNext(false);
    }
  };

  const handleQuickCheckIn = async (apt: Appointment) => {
    try {
      setCheckingInId(apt.id);
      const res = await registrationApi.checkInAppointment(apt.id, {
        doctorId: apt.doctorId,
        doctorName: apt.doctorName,
        roomNumber: apt.roomNumber,
      });

      if (res.data) {
        // Update local appointment state
        setAppointments((prev) =>
          prev.map((a) => (a.id === apt.id ? res.data!.appointment : a))
        );
        // Refresh queue
        const qRes = await queueApi.getLiveQueue('fac_civil_01');
        if (qRes.data) setQueue(qRes.data);

        // Open OPD Slip Modal
        setActiveSlipToken(res.data.token);
        setSlipModalOpen(true);
        setActionNotice(
          `Patient ${res.data.appointment.patientName} checked in. Token ${res.data.token.tokenNumber} issued.`
        );
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Failed to check in appointment:', err);
    } finally {
      setCheckingInId(null);
    }
  };

  const scheduledAppointments = appointments.filter((a) => a.status === 'SCHEDULED');
  const confirmedAppointments = appointments.filter((a) => a.status === 'CONFIRMED');
  const checkedInAppointments = appointments.filter((a) => a.status === 'CHECKED_IN');
  const waitingTokens = queue?.tokens.filter((t) => t.status === 'WAITING') || [];
  const currentCalledToken = queue?.tokens.find((t) => t.status === 'CALLED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-xs font-semibold text-teal-900 flex items-center justify-between animate-in fade-in-50 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-teal-700 hover:text-teal-950 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-teal-100 text-teal-900 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-teal-300">
              Counter 1 • OPD Front Desk
            </span>
            <span className="text-xs text-slate-500">Gandhinagar Civil Hospital & Medical College</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Front Desk Registration & Queue
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Live patient arrivals, assign hospital doctors, issue OPD consultation tokens, and manage counter flow.
          </p>
        </div>

        {/* Quick Action Shortcut */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            className="bg-white border-teal-300 text-teal-900 font-bold text-xs gap-1.5 min-h-[40px] px-3.5 rounded-xl cursor-pointer shadow-2xs hover:bg-teal-50"
          >
            <RefreshCw className={`h-4 w-4 text-teal-700 ${loading ? 'animate-spin' : ''}`} />
            Live Sync
          </Button>

          <Link to="/registration-clerk/register">
            <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 min-h-[40px] px-4 rounded-xl shadow-xs cursor-pointer">
              <UserPlus className="h-4 w-4 text-teal-200" />
              Register New Citizen
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Hospital Appointments</span>
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{appointments.length}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="font-bold text-teal-700">{checkedInAppointments.length} Checked In</span>
            <span className="text-slate-400">• {scheduledAppointments.length + confirmedAppointments.length} Pending</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tokens in Queue</span>
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-teal-700 mt-2">{waitingTokens.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">General Medicine OPD</span>
        </Card>

        <Card className="p-4 border-slate-200 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Counter</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">Counter 1</p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online & Ready
          </span>
        </Card>

        <Card className="p-4 border-slate-200 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Consult Time</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {queue?.averageConsultTimeMinutes || 8} mins
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Per patient consultation</span>
        </Card>
      </div>

      {/* Fast Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/registration-clerk/register"
          className="group rounded-2xl bg-white p-5 border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all flex items-start gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors shrink-0">
            <UserPlus className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-800 transition-colors">
                Patient Registration
              </h3>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              3-step registration with instant ABHA ID validation & duplicate detection.
            </p>
          </div>
        </Link>

        <Link
          to="/registration-clerk/appointments"
          className="group rounded-2xl bg-white p-5 border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all flex items-start gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors shrink-0">
            <CalendarCheck2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-800 transition-colors">
                Appointment Desk
              </h3>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {scheduledAppointments.length + confirmedAppointments.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assign doctors, manage scheduled arrivals, and issue OPD consultation slips.
            </p>
          </div>
        </Link>

        <Link
          to="/registration-clerk/queue"
          className="group rounded-2xl bg-white p-5 border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all flex items-start gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors shrink-0">
            <Ticket className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-800 transition-colors">
                OPD Token Counter
              </h3>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Call next token, issue walk-in OPD tokens, and monitor room status.
            </p>
          </div>
        </Link>
      </div>

      {/* Main Two-Column Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Queue Counter Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">OPD Counter Display</CardTitle>
                <p className="text-xs text-slate-500">General Medicine • Room 4</p>
              </div>
              <Link to="/registration-clerk/queue">
                <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-800 gap-1 p-0">
                  Full Monitor <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              {/* Current Token Callout */}
              <div className="rounded-xl bg-teal-50/80 border-2 border-teal-200 p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800">
                  <Volume2 className="h-4 w-4 text-teal-600 animate-pulse" />
                  Currently Calling
                </div>
                <div className="text-4xl font-black text-teal-900 my-1 font-mono">
                  {currentCalledToken?.tokenNumber || queue?.currentTokenNumber || '—'}
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  {currentCalledToken?.patientName || 'Govindbhai Prajapati'}
                </p>
                <span className="text-[11px] text-teal-700">Room 4 • Dr. Arvind Patel</span>
              </div>

              {/* Action: Call Next Token */}
              <Button
                onClick={handleCallNext}
                disabled={callingNext || waitingTokens.length === 0}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-2 min-h-[42px] cursor-pointer"
              >
                <Volume2 className="h-4 w-4" />
                {callingNext ? 'Calling...' : `Call Next Token (${waitingTokens.length} Waiting)`}
              </Button>

              {/* Waiting Tokens Preview */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Next in Waiting Line
                </span>
                {waitingTokens.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No patients currently waiting in queue</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                    {waitingTokens.slice(0, 4).map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 font-mono text-[11px]">#{idx + 1}</span>
                          <span className="font-mono font-bold text-xs bg-teal-100/70 text-teal-900 px-1.5 py-0.5 rounded">
                            {t.tokenNumber}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                              {t.patientName}
                            </span>
                            <span className="text-[10px] text-slate-500">{t.priority} Priority</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ~{t.estimatedWaitMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Scheduled Arrivals & Doctor Assignment (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Scheduled Arrivals & Doctor Desk</CardTitle>
                <p className="text-xs text-slate-500">Live citizen registrations, doctor assignment & 1-click token check-in</p>
              </div>
              <Link to="/registration-clerk/appointments">
                <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-800 gap-1 p-0">
                  View All ({appointments.length}) <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              {loading && appointments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading today's schedule...</div>
              ) : appointments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No appointments scheduled for today</div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {appointments.slice(0, 6).map((apt) => {
                    const isDoctorUnassigned =
                      !apt.doctorId || apt.doctorId === 'unassigned' || apt.doctorName?.includes('To be assigned');

                    return (
                      <div key={apt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Time Slot Pill */}
                          <div className="rounded-lg bg-teal-50 border border-teal-200 px-2 py-1 text-center min-w-[65px] shrink-0">
                            <span className="font-mono font-bold text-xs text-teal-950 block">
                              {apt.timeSlot}
                            </span>
                          </div>

                          {/* Patient & Doctor Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm truncate">
                                {apt.patientName}
                              </span>
                              <StatusBadge status={apt.status} />
                            </div>

                            <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-1.5">
                              {isDoctorUnassigned ? (
                                <button
                                  onClick={() => handleOpenAssignModal(apt)}
                                  className="text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1"
                                >
                                  <UserCheck className="h-3 w-3 text-amber-600" /> Assign Doctor
                                </button>
                              ) : (
                                <>
                                  <span className="font-bold text-slate-800">{apt.doctorName}</span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-teal-800 font-medium">{apt.specialty}</span>
                                  {apt.roomNumber && (
                                    <span className="font-mono text-slate-500">({apt.roomNumber})</span>
                                  )}
                                </>
                              )}
                            </div>

                            {apt.tokenNumber && (
                              <span className="inline-block mt-0.5 font-mono text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded font-bold">
                                Token {apt.tokenNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions (Assign / Check-In) */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {isDoctorUnassigned && (
                            <Button
                              onClick={() => handleOpenAssignModal(apt)}
                              variant="outline"
                              size="sm"
                              className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold text-xs gap-1 h-8 px-2.5 shadow-2xs"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-amber-700" />
                              Assign
                            </Button>
                          )}

                          {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                            <Button
                              onClick={() => handleQuickCheckIn(apt)}
                              disabled={checkingInId === apt.id}
                              size="sm"
                              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs gap-1.5 h-8 px-3 shadow-xs cursor-pointer"
                            >
                              <Ticket className="h-3.5 w-3.5" />
                              {checkingInId === apt.id ? 'Checking In...' : 'Check In'}
                            </Button>
                          ) : apt.status === 'CHECKED_IN' ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Checked In
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Completed</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Doctor Modal */}
      <AssignDoctorModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        appointment={selectedAppointmentForAssign}
        onDoctorAssigned={handleDoctorAssigned}
      />

      {/* OPD Token Slip Modal */}
      <OpdTokenSlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        token={activeSlipToken}
      />
    </div>
  );
};
