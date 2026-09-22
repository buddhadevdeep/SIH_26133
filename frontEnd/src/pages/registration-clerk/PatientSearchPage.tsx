import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registrationApi } from '@/api/registrationApi';
import { tokenApi } from '@/api/queueApi';
import { RegisteredPatient, Token } from '@/types/queue';
import { OpdTokenSlipModal } from './components/OpdTokenSlipModal';
import {
  Search,
  UserPlus,
  User,
  Phone,
  ShieldCheck,
  Calendar,
  Ticket,
  ChevronRight,
  Filter,
  CheckCircle2,
  Building2,
  X,
} from 'lucide-react';

export const PatientSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<RegisteredPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'ABHA' | 'SENIOR' | 'PEDIATRIC'>('ALL');

  // Quick Token Modal state
  const [selectedPatientForToken, setSelectedPatientForToken] = useState<RegisteredPatient | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('dep_med');
  const [selectedPriority, setSelectedPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [issuingToken, setIssuingToken] = useState(false);
  const [activeSlipToken, setActiveSlipToken] = useState<Token | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // Quick Appointment Modal state
  const [selectedPatientForApt, setSelectedPatientForApt] = useState<RegisteredPatient | null>(null);
  const [aptSpecialty, setAptSpecialty] = useState('General Medicine');
  const [aptDoctorName, setAptDoctorName] = useState('Dr. Arvind Patel');
  const [aptTimeSlot, setAptTimeSlot] = useState('11:30 AM');
  const [aptReason, setAptReason] = useState('Routine Consultation');
  const [bookingApt, setBookingApt] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchPatients = async (searchStr?: string) => {
    try {
      setLoading(true);
      const res = await registrationApi.searchPatients(searchStr);
      if (res.data) setPatients(res.data);
    } catch (err) {
      console.error('Failed to search patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter application
  const filteredPatients = patients.filter((p) => {
    if (filterType === 'ABHA') return p.abhaVerified;
    if (filterType === 'SENIOR') return p.age >= 60;
    if (filterType === 'PEDIATRIC') return p.age < 12;
    return true;
  });

  const handleIssueTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForToken) return;

    try {
      setIssuingToken(true);
      const res = await tokenApi.generateToken({
        patientName: selectedPatientForToken.name,
        patientPhone: selectedPatientForToken.phone,
        facilityId: 'fac_civil_01',
        departmentId: selectedDepartment,
        priority: selectedPriority,
      });

      if (res.data) {
        const t = res.data;
        t.patientAge = selectedPatientForToken.age;
        t.patientGender = selectedPatientForToken.gender;
        setActiveSlipToken(t);
        setSelectedPatientForToken(null);
        setSlipModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to generate token:', err);
      alert('Failed to generate OPD token.');
    } finally {
      setIssuingToken(false);
    }
  };

  const handleBookAptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForApt) return;

    try {
      setBookingApt(true);
      const res = await registrationApi.bookAppointment({
        patientId: selectedPatientForApt.id,
        patientName: selectedPatientForApt.name,
        patientPhone: selectedPatientForApt.phone,
        patientAge: selectedPatientForApt.age,
        patientGender: selectedPatientForApt.gender,
        facilityId: 'fac_civil_01',
        facilityName: 'Gandhinagar Civil Hospital',
        doctorId: 'usr_doc_01',
        doctorName: aptDoctorName,
        specialty: aptSpecialty,
        date: '2026-03-14',
        timeSlot: aptTimeSlot,
        reasonForVisit: aptReason,
      });

      if (res.data) {
        setActionNotice(`Appointment booked for ${selectedPatientForApt.name} on ${res.data.date} at ${res.data.timeSlot}`);
        setSelectedPatientForApt(null);
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Failed to book appointment:', err);
      alert('Failed to book appointment.');
    } finally {
      setBookingApt(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Action Notice */}
      {actionNotice && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-xs font-semibold text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-teal-700 font-bold">
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
              className="text-xs font-semibold text-slate-500 hover:text-teal-700"
            >
              ? Front Desk
            </Link>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">Patient Directory & Search</h1>
          <p className="text-xs text-slate-500">
            Search registered citizens by phone number, ABHA ID, name, or MRN.
          </p>
        </div>

        <Link to="/registration-clerk/register">
          <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 min-h-[42px] px-4 cursor-pointer shadow-sm">
            <UserPlus className="h-4 w-4" />
            Register New Citizen
          </Button>
        </Link>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by 10-digit Mobile, ABHA ID (14-XXXX-...), or Citizen Name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 h-12 text-xs bg-white border-slate-200 rounded-xl shadow-2xs font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3" /> Filters:
          </span>
          {[
            { id: 'ALL', label: `All Citizens (${patients.length})` },
            { id: 'ABHA', label: 'Verified ABHA' },
            { id: 'SENIOR', label: 'Senior Citizens (60+)' },
            { id: 'PEDIATRIC', label: 'Pediatric (<12)' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shrink-0 cursor-pointer ${
                filterType === f.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Searching citizen directory...</div>
      ) : filteredPatients.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300">
          <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No Matching Citizens Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            No citizen found matching "{query}". You can register them as a new citizen in seconds.
          </p>
          <Link to="/registration-clerk/register">
            <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2">
              <UserPlus className="h-4 w-4" /> Register New Citizen
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((p) => (
            <Card
              key={p.id}
              className="border-slate-200 hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                {/* Top: Name & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm hover:text-teal-800 transition-colors">
                      <Link to={`/registration-clerk/patients/${p.id}`}>
                        {p.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.age} Years � {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}
                    </p>
                  </div>

                  {p.abhaVerified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 border border-emerald-200/60">
                      <ShieldCheck className="h-3 w-3" /> ABHA Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      Walk-in
                    </span>
                  )}
                </div>

                {/* Info Pills */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mobile:</span>
                    <span className="font-mono text-slate-800 font-bold">+91 {p.phone}</span>
                  </div>

                  {p.abhaId && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ABHA ID:</span>
                      <span className="font-mono text-teal-800 text-[11px] font-bold">{p.abhaId}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-700 truncate max-w-[150px]">{p.address || p.district}</span>
                  </div>
                </div>

                {/* Emergency Contact */}
                {p.emergencyContact && (
                  <div className="text-[11px] text-slate-500">
                    Attendant: <span className="font-semibold text-slate-700">{p.emergencyContact.name}</span> ({p.emergencyContact.relationship})
                  </div>
                )}
              </div>

              {/* Bottom Quick Action Bar */}
              <div className="bg-slate-50/70 px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedPatientForToken(p);
                    setSelectedPriority(p.age >= 60 ? 'URGENT' : 'ROUTINE');
                  }}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold h-8 px-2.5 shadow-2xs cursor-pointer gap-1"
                >
                  <Ticket className="h-3 w-3" /> Issue Token
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPatientForApt(p)}
                  className="text-xs font-semibold h-8 px-2.5 gap-1"
                >
                  <Calendar className="h-3 w-3" /> Book
                </Button>

                <Link to={`/registration-clerk/patients/${p.id}`}>
                  <Button size="sm" variant="ghost" className="text-xs text-slate-600 hover:text-teal-800 h-8 px-2">
                    Profile <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Walk-in Token Generation Modal */}
      {selectedPatientForToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-teal-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-teal-200" />
                <h3 className="font-bold text-sm">Issue Walk-in OPD Token</h3>
              </div>
              <button
                onClick={() => setSelectedPatientForToken(null)}
                className="rounded-lg p-1 text-teal-100 hover:bg-teal-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleIssueTokenSubmit} className="p-6 space-y-4">
              <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs">
                <span className="text-slate-500 block">Issuing token for:</span>
                <span className="font-bold text-teal-950 text-sm block">{selectedPatientForToken.name}</span>
                <span className="text-teal-800 text-[11px]">
                  {selectedPatientForToken.age}Y � +91 {selectedPatientForToken.phone}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 font-semibold"
                >
                  <option value="dep_med">General Medicine OPD (Room 4 � Dr. Arvind Patel)</option>
                  <option value="dep_cardio">Cardiology Clinic (Room 6 � Dr. Arvind Patel)</option>
                  <option value="dep_ortho">Orthopedics Clinic (Room 8 � Dr. Rajesh Mehta)</option>
                  <option value="dep_peds">Pediatrics Clinic (Room 2 � Dr. Sneha Desai)</option>
                  <option value="dep_gyn">Gynecology Clinic (Room 5 � Dr. Bhavna Joshi)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Queue Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ROUTINE', 'URGENT', 'EMERGENCY'] as const).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setSelectedPriority(pr)}
                      className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                        selectedPriority === pr
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedPatientForToken(null)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={issuingToken}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5"
                >
                  {issuingToken ? 'Issuing...' : 'Generate Token & Print Slip'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Appointment Booking Modal */}
      {selectedPatientForApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-teal-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-200" />
                <h3 className="font-bold text-sm">Book Doctor Appointment</h3>
              </div>
              <button
                onClick={() => setSelectedPatientForApt(null)}
                className="rounded-lg p-1 text-teal-100 hover:bg-teal-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBookAptSubmit} className="p-6 space-y-4">
              <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs">
                <span className="text-slate-500 block">Booking for:</span>
                <span className="font-bold text-teal-950 text-sm block">{selectedPatientForApt.name}</span>
                <span className="text-teal-800 text-[11px]">
                  {selectedPatientForApt.age}Y � +91 {selectedPatientForApt.phone}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Specialty & Doctor</label>
                <select
                  value={aptDoctorName}
                  onChange={(e) => {
                    setAptDoctorName(e.target.value);
                    if (e.target.value.includes('Arvind')) setAptSpecialty('Cardiology / General Medicine');
                    else if (e.target.value.includes('Rajesh')) setAptSpecialty('Orthopedics');
                    else if (e.target.value.includes('Bhavna')) setAptSpecialty('Gynecology & ANC');
                    else if (e.target.value.includes('Sneha')) setAptSpecialty('Pediatrics');
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 font-semibold"
                >
                  <option value="Dr. Arvind Patel">Dr. Arvind Patel (Cardiology / Medicine)</option>
                  <option value="Dr. Rajesh Mehta">Dr. Rajesh Mehta (Orthopedics)</option>
                  <option value="Dr. Bhavna Joshi">Dr. Bhavna Joshi (Gynecology & ANC)</option>
                  <option value="Dr. Sneha Desai">Dr. Sneha Desai (Pediatrics)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Time Slot (Today, March 14)</label>
                <select
                  value={aptTimeSlot}
                  onChange={(e) => setAptTimeSlot(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 font-semibold"
                >
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="12:30 PM">12:30 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reason for Visit</label>
                <Input
                  value={aptReason}
                  onChange={(e) => setAptReason(e.target.value)}
                  placeholder="e.g. Chest pain follow-up, Routine check"
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedPatientForApt(null)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={bookingApt}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5"
                >
                  {bookingApt ? 'Booking...' : 'Confirm Appointment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPD Token Slip Modal */}
      <OpdTokenSlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        token={activeSlipToken}
      />
    </div>
  );
};
