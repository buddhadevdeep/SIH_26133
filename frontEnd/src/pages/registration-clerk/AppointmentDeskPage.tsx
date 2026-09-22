import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { registrationApi } from '@/api/registrationApi';
import { Appointment, Token } from '@/types/queue';
import { OpdTokenSlipModal } from './components/OpdTokenSlipModal';
import { AssignDoctorModal } from './components/AssignDoctorModal';
import {
  CalendarCheck2,
  Search,
  Ticket,
  CheckCircle2,
  Clock,
  User,
  Filter,
  Printer,
  ChevronRight,
  Phone,
  Building2,
  X,
  UserCheck,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const AppointmentDeskPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED'>('ALL');

  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [activeSlipToken, setActiveSlipToken] = useState<Token | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Doctor Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAppointmentForAssign, setSelectedAppointmentForAssign] = useState<Appointment | null>(null);

  const fetchAppointments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await registrationApi.getAppointments();
      if (res.data) setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Auto-poll every 10 seconds to catch newly booked appointments from patients
    const interval = setInterval(() => {
      fetchAppointments(false);
    }, 10000);
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

  const handleCheckIn = async (apt: Appointment) => {
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
        setActiveSlipToken(res.data.token);
        setSlipModalOpen(true);
        setActionNotice(
          `Checked in ${res.data.appointment.patientName}. Token ${res.data.token.tokenNumber} issued for ${res.data.token.doctorName || 'Doctor'} (${res.data.token.roomNumber || 'Room 4'}).`
        );
        setTimeout(() => setActionNotice(null), 6000);
      }
    } catch (err) {
      console.error('Check-in failed:', err);
      alert('Failed to check in appointment.');
    } finally {
      setCheckingInId(null);
    }
  };

  // Filter & Search Logic
  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.patientName.toLowerCase().includes(q);
      const matchPhone = a.patientPhone.includes(q.replace(/\D/g, ''));
      const matchDoctor = (a.doctorName || '').toLowerCase().includes(q);
      const matchSpecialty = (a.specialty || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchDoctor || matchSpecialty;
    }
    return true;
  });

  const scheduledCount = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const checkedInCount = appointments.filter((a) => a.status === 'CHECKED_IN').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const pendingTotal = scheduledCount + confirmedCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-xs font-semibold text-teal-900 flex items-center justify-between shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-teal-700 font-bold hover:text-teal-950">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/registration-clerk"
              className="text-xs font-semibold text-slate-500 hover:text-teal-700 flex items-center gap-1"
            >
              ← Front Desk Dashboard
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <CalendarCheck2 className="h-6 w-6 text-teal-700" />
            OPD Appointment & Doctor Assignment Desk
          </h1>
          <p className="text-xs text-slate-500">
            View booked citizen appointments, assign hospital doctors, and check-in patients with instant OPD token generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAppointments(true)}
            className="text-xs gap-1.5 h-9 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-teal-700 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            {pendingTotal} Pending Arrivals
          </span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by patient name, mobile, consulting doctor, or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 h-12 text-xs bg-white border-slate-200 rounded-xl shadow-2xs font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3" /> Status:
          </span>
          {[
            { id: 'ALL', label: `All Appointments (${appointments.length})` },
            { id: 'SCHEDULED', label: `Newly Booked (${scheduledCount})` },
            { id: 'CONFIRMED', label: `Doctor Assigned (${confirmedCount})` },
            { id: 'CHECKED_IN', label: `Checked In (${checkedInCount})` },
            { id: 'COMPLETED', label: `Completed (${completedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shrink-0 cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Schedule List */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">
              Hospital OPD Appointments Schedule
            </span>
            <span className="text-slate-500 font-mono">
              Showing {filteredAppointments.length} of {appointments.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && appointments.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No appointments found matching current filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {filteredAppointments.map((apt) => {
                const isDoctorUnassigned =
                  !apt.doctorId || apt.doctorId === 'unassigned' || apt.doctorName?.includes('To be assigned');

                return (
                  <div
                    key={apt.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Left: Time & Patient Identity */}
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Time Slot Badge */}
                      <div className="rounded-xl bg-teal-50 border border-teal-200 p-2.5 text-center min-w-[84px] shrink-0">
                        <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                          {apt.date || 'Today'}
                        </span>
                        <span className="font-mono font-black text-sm text-teal-950 block mt-0.5">
                          {apt.timeSlot}
                        </span>
                      </div>

                      {/* Patient & Clinic Info */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/registration-clerk/patients/${apt.patientId}`}
                            className="font-bold text-slate-900 text-sm hover:text-teal-800 transition-colors"
                          >
                            {apt.patientName}
                          </Link>
                          {apt.patientAge && (
                            <span className="text-slate-500 font-medium text-xs">
                              ({apt.patientAge}Y, {apt.patientGender === 'M' ? 'M' : 'F'})
                            </span>
                          )}
                          <StatusBadge status={apt.status} />

                          {isDoctorUnassigned && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-700" /> Needs Doctor Assignment
                            </span>
                          )}
                        </div>

                        {/* Doctor & Room Assignment Row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-500 font-medium">Doctor:</span>
                          {isDoctorUnassigned ? (
                            <button
                              onClick={() => handleOpenAssignModal(apt)}
                              className="text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="h-3 w-3 text-amber-700" />
                              Assign Hospital Doctor Now
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{apt.doctorName}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-teal-800 font-semibold">{apt.specialty}</span>
                              {apt.roomNumber && (
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-slate-400" /> {apt.roomNumber}
                                </span>
                              )}
                              {apt.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleOpenAssignModal(apt)}
                                  className="text-[11px] text-teal-700 hover:text-teal-900 font-bold underline ml-1 cursor-pointer"
                                >
                                  Change
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Contact & Reason */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="font-mono flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" /> +91 {apt.patientPhone}
                          </span>
                          <span>
                            Reason: <span className="text-slate-700 font-medium">{apt.reasonForVisit}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Doctor Assignment / Check-In / Token Status) */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      {isDoctorUnassigned && (
                        <Button
                          onClick={() => handleOpenAssignModal(apt)}
                          variant="outline"
                          size="sm"
                          className="border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold text-xs gap-1.5 h-9 px-3 cursor-pointer shadow-2xs"
                        >
                          <UserCheck className="h-4 w-4 text-amber-700" />
                          Assign Doctor
                        </Button>
                      )}

                      {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                        <Button
                          onClick={() => handleCheckIn(apt)}
                          disabled={checkingInId === apt.id}
                          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-1.5 h-9 px-4 cursor-pointer shadow-xs"
                        >
                          <Ticket className="h-4 w-4" />
                          {checkingInId === apt.id ? 'Checking In...' : 'Check In & Issue Token'}
                        </Button>
                      ) : apt.status === 'CHECKED_IN' ? (
                        <div className="flex items-center gap-2">
                          {apt.tokenNumber && (
                            <span className="font-mono font-black text-sm bg-teal-100/80 text-teal-900 px-2.5 py-1 rounded-lg border border-teal-200">
                              {apt.tokenNumber}
                            </span>
                          )}
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Checked In
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium text-xs">Consultation Done</span>
                      )}

                      <Link to={`/registration-clerk/patients/${apt.patientId}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-teal-800 h-9">
                          Details <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
