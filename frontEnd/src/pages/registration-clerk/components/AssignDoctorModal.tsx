import React, { useState, useEffect } from 'react';
import { Appointment } from '@/types/queue';
import { DistrictDoctor } from '@/types/admin';
import { directoryApi } from '@/api/directoryApi';
import { registrationApi } from '@/api/registrationApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  X,
  Stethoscope,
  Building2,
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface AssignDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onDoctorAssigned: (updatedAppointment: Appointment) => void;
}

export const AssignDoctorModal: React.FC<AssignDoctorModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onDoctorAssigned,
}) => {
  const [doctors, setDoctors] = useState<DistrictDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [customRoom, setCustomRoom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBySpecialty, setFilterBySpecialty] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && appointment) {
      fetchDoctors();
      setSelectedDoctorId(appointment.doctorId && appointment.doctorId !== 'unassigned' ? appointment.doctorId : '');
      setCustomRoom(appointment.roomNumber || '');
      setErrorMsg(null);
    }
  }, [isOpen, appointment]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await directoryApi.getDoctors({
        facilityId: appointment?.facilityId,
      });
      if (res.data && res.data.length > 0) {
        setDoctors(res.data);
      } else {
        // Fallback: fetch all active district hospital doctors
        const allRes = await directoryApi.getDoctors();
        if (allRes.data) {
          setDoctors(allRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch hospital doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  // Filter doctors list
  const filteredDoctors = doctors.filter((doc) => {
    if (filterBySpecialty && appointment.specialty) {
      const matchSpecialty = doc.specialty?.toLowerCase().includes(appointment.specialty.toLowerCase());
      if (!matchSpecialty) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchSpec = doc.specialty?.toLowerCase().includes(q);
      const matchRoom = (doc.opdRoom || '').toLowerCase().includes(q);
      return matchName || matchSpec || matchRoom;
    }
    return true;
  });

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleAssign = async () => {
    if (!selectedDoctor) {
      setErrorMsg('Please select a doctor to assign.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const assignedRoom = customRoom || selectedDoctor.opdRoom || 'Room 4 (1st Floor)';

      const res = await registrationApi.assignDoctor(appointment.id, {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty || appointment.specialty,
        roomNumber: assignedRoom,
        departmentName: selectedDoctor.specialty || appointment.specialty,
      });

      if (res.data) {
        onDoctorAssigned(res.data);
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to assign doctor:', err);
      setErrorMsg(err.message || 'Failed to assign doctor to appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Assign Attending Doctor</h2>
              <p className="text-xs text-slate-300">
                Hospital OPD Counter • {appointment.facilityName || 'Gandhinagar Civil Hospital'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Patient Appointment Overview Banner */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-900 text-sm">{appointment.patientName}</span>
            {appointment.patientAge && (
              <span className="text-slate-600 font-medium">
                ({appointment.patientAge}Y, {appointment.patientGender || 'M'})
              </span>
            )}
            <span className="bg-teal-100 text-teal-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
              {appointment.timeSlot}
            </span>
          </div>
          <div className="text-slate-600 font-medium">
            Department:{' '}
            <span className="font-bold text-teal-900">{appointment.specialty || 'General Medicine'}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search doctor by name, specialty, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 bg-slate-50 border-slate-200 rounded-xl"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterBySpecialty(!filterBySpecialty)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filterBySpecialty
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filterBySpecialty
                ? `Filtered: ${appointment.specialty || 'Department'}`
                : 'Show All Hospital Doctors'}
            </button>
          </div>

          {/* Doctors List */}
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading available hospital doctors...
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                <p className="text-xs text-slate-500 font-medium">
                  No doctors found for specialty "{appointment.specialty}".
                </p>
                <button
                  type="button"
                  onClick={() => setFilterBySpecialty(false)}
                  className="mt-2 text-xs font-bold text-teal-700 hover:underline"
                >
                  View all doctors in hospital
                </button>
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoctorId(doc.id);
                      if (doc.opdRoom) setCustomRoom(doc.opdRoom);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-600 shadow-xs ring-1 ring-teal-600'
                        : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {doc.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">{doc.name}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {doc.status || 'ON_DUTY'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {doc.qualification || 'MBBS, MD'} • <span className="font-semibold text-teal-800">{doc.specialty}</span>
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                          <span className="font-mono flex items-center gap-1 text-slate-600">
                            <MapPin className="h-3 w-3 text-slate-400" /> {doc.opdRoom || 'Room 4'}
                          </span>
                          <span>Patients Today: {doc.patientsToday || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="h-6 w-6 rounded-full bg-teal-700 text-white flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border border-slate-300"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Assigned Room Customization */}
          {selectedDoctor && (
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consultation Room / Counter Assignment
              </label>
              <Input
                type="text"
                placeholder="e.g. Room 4 (1st Floor) or General OPD Wing"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                className="text-xs h-9 bg-white border-slate-200 rounded-xl"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This room will be printed on the patient's OPD token slip.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-600">
            Cancel
          </Button>

          <Button
            onClick={handleAssign}
            disabled={!selectedDoctorId || submitting}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 h-10 rounded-xl shadow-xs gap-2 cursor-pointer"
          >
            <UserCheck className="h-4 w-4" />
            {submitting ? 'Assigning Doctor...' : selectedDoctor ? `Assign ${selectedDoctor.name}` : 'Select Doctor'}
          </Button>
        </div>
      </div>
    </div>
  );
};
