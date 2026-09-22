import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_FACILITIES, INITIAL_DISTRICT_DOCTORS } from '@/mock/mockData';
import { mockState } from '@/mock/db';
import { DistrictDoctor } from '@/types/admin';
import { directoryApi } from '@/api/directoryApi';
import { facilityApi } from '@/api/facilityApi';
import {
  Stethoscope,
  Search,
  Building2,
  Phone,
  Video,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  UserCheck,
  AlertCircle,
  Mail,
  Plus,
  X,
  Activity,
  ShieldAlert,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';

export const DistrictDoctorsPage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [doctorsList, setDoctorsList] = useState<DistrictDoctor[]>(() => {
    return mockState?.doctors?.length ? mockState.doctors : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [facilities, setFacilities] = useState<any[]>([]);

  // Load doctors and facilities from backend
  useEffect(() => {
    directoryApi.getDoctors().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setDoctorsList(res.data);
      }
    }).catch((err) => {
      console.warn('Live doctors fetch failed, using local cache:', err);
    });

    facilityApi.getAll().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setFacilities(res.data);
        if (res.data.length > 0) {
          setFacilityId(res.data[0].id);
        }
      }
    }).catch((err) => {
      console.warn('Live facilities fetch failed:', err);
    });
  }, [selectedDistrict]);

  // Modals & Feedback
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DistrictDoctor | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingDoctor, setDeletingDoctor] = useState<DistrictDoctor | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add Form State
  const [docName, setDocName] = useState('');
  const [docUsername, setDocUsername] = useState('');
  const [docPassword, setDocPassword] = useState('Doctor@123');
  const [qualification, setQualification] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [facilityId, setFacilityId] = useState(INITIAL_FACILITIES[0]?.id || 'fac_civil_01');
  const [dutyStatus, setDutyStatus] = useState<DistrictDoctor['status']>('ON_DUTY');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [opdSchedule, setOpdSchedule] = useState('09:00 AM – 02:00 PM (Mon-Sat)');
  const [teleconsultEnabled, setTeleconsultEnabled] = useState(true);

  // Edit Form State
  const [editDocName, setEditDocName] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('General Medicine');
  const [editFacilityId, setEditFacilityId] = useState('');
  const [editDutyStatus, setEditDutyStatus] = useState<DistrictDoctor['status']>('ON_DUTY');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editOpdSchedule, setEditOpdSchedule] = useState('');
  const [editTeleconsultEnabled, setEditTeleconsultEnabled] = useState(true);
  const [editPatientsToday, setEditPatientsToday] = useState(0);

  const specialties = [
    'ALL',
    'Cardiology',
    'Pediatrics',
    'Obstetrics & Gynecology',
    'General Surgery',
    'Pulmonology',
    'Orthopedics',
    'General Medicine',
    'Pathology & Diagnostics',
    'Emergency & Trauma',
  ];

  const facilitiesInDistrict = facilities.filter(
    (f) => !selectedDistrict || selectedDistrict === 'ALL' || f.district === selectedDistrict
  );

  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      alert('Doctor full name is required.');
      return;
    }

    const trimmedUsername = docUsername.trim();
    const trimmedPassword = docPassword.trim();

    if (!trimmedUsername) {
      alert('Doctor Login Username / ID is strictly COMPULSORY. Please enter a login username for the doctor.');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 4) {
      alert('Doctor Login Password is strictly COMPULSORY (minimum 4 characters). Please enter a password for the doctor.');
      return;
    }

    const matchedFac = facilitiesInDistrict.find((f) => f.id === facilityId) || facilitiesInDistrict[0];
    if (!matchedFac) {
      alert(`No healthcare facilities found in ${selectedDistrict} District. Please register a facility in this district first before registering doctors.`);
      return;
    }

    const newDoctorData: any = {
      name: docName.trim(),
      username: trimmedUsername,
      password: trimmedPassword,
      qualification: qualification.trim() || 'MBBS',
      specialty,
      facilityId: matchedFac.id,
      facilityName: matchedFac.name,
      status: dutyStatus,
      phone: phone.trim() || '9876500000',
      email: email.trim() || `${trimmedUsername}@gujarat.health.gov.in`,
      opdSchedule: opdSchedule.trim() || '09:00 AM – 02:00 PM (Mon-Sat)',
      patientsToday: 0,
      teleconsultEnabled,
      district: matchedFac.district || selectedDistrict,
      districtId: matchedFac.districtId,
    };

    let created: DistrictDoctor;
    try {
      const res = await directoryApi.createDoctor(newDoctorData);
      if (res?.data) {
        created = res.data;
      } else {
        throw new Error('No data returned');
      }
    } catch {
      if (mockState && typeof mockState.addDoctor === 'function') {
        created = mockState.addDoctor(newDoctorData);
      } else {
        created = {
          ...newDoctorData,
          id: `doc_${Date.now()}`,
        } as DistrictDoctor;
      }
    }

    if (mockState && typeof mockState.addDoctor === 'function') {
      try { mockState.addDoctor(created); } catch {}
    }

    setDoctorsList((prev) => [created, ...prev.filter((d) => d.id !== created.id)]);
    setShowAddModal(false);

    // Reset Form
    setDocName('');
    setDocUsername('');
    setDocPassword('');
    setQualification('');
    setPhone('');
    setEmail('');

    setSuccessToast(`Successfully posted ${created.name} (${created.specialty}) to ${created.facilityName}. Login Username: "${trimmedUsername}" | Password: "${trimmedPassword}"`);
    setTimeout(() => setSuccessToast(null), 8000);
  };

  const handleStatusChange = async (docId: string, newStatus: DistrictDoctor['status']) => {
    try {
      await directoryApi.updateDoctorStatus(docId, newStatus);
    } catch (err) {
      console.warn('Could not update doctor status on backend:', err);
    }
    if (mockState && typeof mockState.updateDoctorStatus === 'function') {
      mockState.updateDoctorStatus(docId, newStatus);
    }
    setDoctorsList((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
    );
  };

  const handleOpenEdit = (doc: DistrictDoctor) => {
    setEditingDoctor(doc);
    setEditDocName(doc.name);
    setEditQualification(doc.qualification || '');
    setEditSpecialty(doc.specialty || 'General Medicine');
    setEditFacilityId(doc.facilityId || facilities[0]?.id || 'fac_civil_01');
    setEditDutyStatus(doc.status || 'ON_DUTY');
    setEditPhone(doc.phone || '');
    setEditEmail(doc.email || '');
    setEditOpdSchedule(doc.opdSchedule || '09:00 AM – 02:00 PM (Mon-Sat)');
    setEditTeleconsultEnabled(doc.teleconsultEnabled ?? true);
    setEditPatientsToday(doc.patientsToday ?? 0);
    setShowEditModal(true);
  };

  const handleEditDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor || !editDocName.trim()) return;

    setIsSaving(true);
    const matchedFac = facilitiesInDistrict.find((f) => f.id === editFacilityId) || facilitiesInDistrict[0];

    const updatedData: Partial<DistrictDoctor> = {
      name: editDocName.trim(),
      qualification: editQualification.trim() || 'MBBS',
      specialty: editSpecialty,
      facilityId: matchedFac?.id || editingDoctor.facilityId,
      facilityName: matchedFac?.name || editingDoctor.facilityName,
      status: editDutyStatus,
      phone: editPhone.trim(),
      email: editEmail.trim(),
      opdSchedule: editOpdSchedule.trim(),
      teleconsultEnabled: editTeleconsultEnabled,
      patientsToday: editPatientsToday,
    };

    try {
      const res = await directoryApi.updateDoctor(editingDoctor.id, updatedData);
      const updated = res?.data || { ...editingDoctor, ...updatedData };
      setDoctorsList((prev) => prev.map((d) => (d.id === editingDoctor.id ? { ...d, ...updated } : d)));
      if (mockState && typeof mockState.updateDoctor === 'function') {
        mockState.updateDoctor(editingDoctor.id, updated);
      }
      setShowEditModal(false);
      setSuccessToast(`Doctor details for ${updated.name} have been successfully updated.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error('Failed to update doctor:', err);
      // Fallback local update
      setDoctorsList((prev) => prev.map((d) => (d.id === editingDoctor.id ? { ...d, ...updatedData } : d)));
      setShowEditModal(false);
      setSuccessToast(`Doctor details for ${editDocName} updated.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (doc: DistrictDoctor) => {
    setDeletingDoctor(doc);
    setShowDeleteDialog(true);
  };

  const handleDeleteDoctorConfirm = async () => {
    if (!deletingDoctor) return;
    setIsDeleting(true);
    try {
      await directoryApi.deleteDoctor(deletingDoctor.id);
      setDoctorsList((prev) => prev.filter((d) => d.id !== deletingDoctor.id));
      if (mockState && typeof (mockState as any).deleteDoctor === 'function') {
        (mockState as any).deleteDoctor(deletingDoctor.id);
      }
      setShowDeleteDialog(false);
      setSuccessToast(`Doctor ${deletingDoctor.name} (${deletingDoctor.specialty}) has been deleted.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error('Failed to delete doctor:', err);
      setDoctorsList((prev) => prev.filter((d) => d.id !== deletingDoctor.id));
      setShowDeleteDialog(false);
      setSuccessToast(`Doctor ${deletingDoctor.name} removed from registry.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } finally {
      setIsDeleting(false);
      setDeletingDoctor(null);
    }
  };

  const filteredDoctors = doctorsList.filter((doc) => {
    const matchesDistrict = !selectedDistrict || selectedDistrict === 'ALL' || doc.district === selectedDistrict;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.facilityName.toLowerCase().includes(searchTerm.toLowerCase());

    const leaveCheck = mockState?.isDoctorOnLeave ? mockState.isDoctorOnLeave(doc.id) : { onLeave: false };
    const effectiveStatus = leaveCheck.onLeave ? 'ON_LEAVE' : doc.status;

    const matchesSpecialty = specialtyFilter === 'ALL' || doc.specialty === specialtyFilter;
    const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

    return matchesDistrict && matchesSearch && matchesSpecialty && matchesStatus;
  });

  const totalDoctors = doctorsList.length;
  const leaveCount = doctorsList.filter(
    (d) => d.status === 'ON_LEAVE' || (mockState?.isDoctorOnLeave && mockState.isDoctorOnLeave(d.id).onLeave)
  ).length;
  const onDutyCount = doctorsList.filter(
    (d) =>
      (d.status === 'ON_DUTY' || d.status === 'IN_OPD') &&
      !(mockState?.isDoctorOnLeave && mockState.isDoctorOnLeave(d.id).onLeave)
  ).length;
  const teleconsultCount = doctorsList.filter((d) => d.teleconsultEnabled).length;
  const totalPatientsToday = doctorsList.reduce((acc, d) => acc + d.patientsToday, 0);

  const getStatusBadge = (doc: DistrictDoctor) => {
    const leaveCheck = mockState?.isDoctorOnLeave ? mockState.isDoctorOnLeave(doc.id) : { onLeave: false };
    const effectiveStatus = leaveCheck.onLeave ? 'ON_LEAVE' : doc.status;

    switch (effectiveStatus) {
      case 'ON_LEAVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
            ON LEAVE (Not Available)
          </span>
        );
      case 'IN_OPD':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">In OPD Consultation</span>;
      case 'ON_DUTY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">On Duty</span>;
      case 'IN_SURGERY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">In Surgery (OT)</span>;
      case 'OFF_DUTY':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Off Duty</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Doctors & Medical Officers"
        subtitle={`Manage doctor postings, duty status, and OPD clinical coverage across ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Doctors' },
        ]}
        actions={
          <Button
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="gap-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Doctor / Specialist</span>
          </Button>
        }
      />

      {/* Success Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Registered Doctors</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalDoctors}</p>
          <span className="text-[11px] text-teal-700 font-medium">In {selectedDistrict} public grid</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active On Duty</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{onDutyCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Currently consulting in OPD & wards</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Doctors on Leave</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-900 mt-2">{leaveCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Out of office / Roster planned</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Consultations Today</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalPatientsToday}</p>
          <span className="text-[11px] text-amber-700 font-medium">{teleconsultCount} doctors teleconsult-enabled</span>
        </Card>
      </div>

      {/* District Aggregated Staffing Gap Telemetry */}
      {leaveCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              District Operations Monitoring • Staffing Gaps & Leave Roster ({leaveCount} Doctors Off Duty)
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Facility Operations coordinators have authorized leave schedules across district hospitals. Teleconsultation diversions and peer doctor handovers are active to prevent outpatient bottlenecks. (District governance: Monitoring capacity status).
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <Card className="p-4 bg-white border-slate-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by doctor name, specialty, or facility..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Status:</span>
          {[
            { key: 'ALL', label: 'All Statuses' },
            { key: 'ON_DUTY', label: 'On Duty' },
            { key: 'IN_OPD', label: 'In OPD' },
            { key: 'ON_LEAVE', label: 'On Leave (Unavailable)' },
            { key: 'OFF_DUTY', label: 'Off Duty' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st.key
                  ? st.key === 'ON_LEAVE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Specialty:</span>
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSpecialtyFilter(spec)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                specialtyFilter === spec
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {spec === 'ALL' ? 'All Specialties' : spec}
            </button>
          ))}
        </div>
      </Card>

      {/* Doctor Cards Grid */}
      {filteredDoctors.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <Stethoscope className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No doctors match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search term or clearing specialty filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoctors.map((doc) => (
            <Card
              key={doc.id}
              className="p-5 bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {doc.avatar ? (
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-sm">
                        {doc.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                      <p className="text-xs font-semibold text-teal-800">{doc.specialty}</p>
                      <p className="text-[11px] text-slate-400">{doc.qualification}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {getStatusBadge(doc)}
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        title="Edit Doctor"
                        className="p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(doc)}
                        title="Delete Doctor"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const leaveCheck = mockState?.isDoctorOnLeave ? mockState.isDoctorOnLeave(doc.id) : { onLeave: false };
                  const isLeave = doc.status === 'ON_LEAVE' || leaveCheck.onLeave;
                  const activeLeave = doc.currentLeave || leaveCheck.leave;

                  if (isLeave && activeLeave) {
                    return (
                      <div className="p-3 bg-rose-50/90 rounded-xl border border-rose-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-rose-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                            ON LEAVE • {activeLeave.category}
                          </span>
                          <span className="text-[10px] bg-rose-200/80 text-rose-950 px-2 py-0.5 rounded font-mono font-bold">
                            {activeLeave.startDate} to {activeLeave.endDate}
                          </span>
                        </div>
                        <p className="text-rose-800 text-[11px] font-semibold leading-tight">
                          "{activeLeave.reason}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-rose-700 pt-0.5 border-t border-rose-200/60">
                          <span>
                            {activeLeave.handoverDoctorName ? (
                              <>Covering OPD: <strong>{activeLeave.handoverDoctorName}</strong></>
                            ) : (
                              <>{doc.facilityName}</>
                            )}
                          </span>
                          <span className="font-bold text-rose-900">NOT ACCEPTING APPOINTMENTS</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{doc.facilityName}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {doc.opdSchedule}
                        </span>
                        <span className="font-bold text-slate-900">
                          {doc.patientsToday} patients seen
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <a href={`tel:${doc.phone}`} className="flex items-center gap-1 text-slate-600 hover:text-teal-700">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{doc.phone}</span>
                  </a>
                  {doc.teleconsultEnabled && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-[10px] flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      e-Consult
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-500 font-medium">Duty:</label>
                  <select
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value as DistrictDoctor['status'])}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
                  >
                    <option value="ON_DUTY">On Duty</option>
                    <option value="IN_OPD">In OPD</option>
                    <option value="IN_SURGERY">In Surgery</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="OFF_DUTY">Off Duty</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal} maxWidth="2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-700" />
              <span>Register Doctor / Medical Officer</span>
            </DialogTitle>
            <DialogDescription>
              Assign and post a qualified doctor or clinical specialist to a government facility in {selectedDistrict}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDoctorSubmit}>
            <DialogContent className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
              {/* Row 1: Doctor Name & Qualifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Dr. Rajesh Patel"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Qualifications *</label>
                  <Input
                    required
                    placeholder="e.g. MBBS, MD (Medicine)"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Specialty & Facility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Clinical Specialty *</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="flex min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    {specialties.filter((s) => s !== 'ALL').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Posting Public Facility *</label>
                  <select
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    className="flex min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    {facilitiesInDistrict.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Mobile Phone *</label>
                  <Input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Gov Email ID</label>
                  <Input
                    type="email"
                    placeholder="e.g. dr.rajesh@gujarat.health.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4: OPD Schedule & Initial Duty Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">OPD Timings</label>
                  <Input
                    placeholder="e.g. 09:00 AM – 01:00 PM (Daily)"
                    value={opdSchedule}
                    onChange={(e) => setOpdSchedule(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Current Duty Status</label>
                  <select
                    value={dutyStatus}
                    onChange={(e) => setDutyStatus(e.target.value as DistrictDoctor['status'])}
                    className="flex min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    <option value="ON_DUTY">On Duty</option>
                    <option value="IN_OPD">In OPD</option>
                    <option value="IN_SURGERY">In Surgery</option>
                    <option value="OFF_DUTY">Off Duty</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Login Credentials for Doctor OPD Portal */}
              <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    🔐 Doctor Portal Login Credentials <span className="text-rose-600 font-extrabold">* (Compulsory)</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">Mandatory for Doctor OPD Portal sign in</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Account Username / ID <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder={docName.trim() ? `doc_${docName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'e.g. doc_priya'}
                      value={docUsername}
                      onChange={(e) => setDocUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Account Password <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="text"
                      placeholder="Doctor@123"
                      value={docPassword}
                      onChange={(e) => setDocPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Teleconsultation toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={teleconsultEnabled}
                  onChange={(e) => setTeleconsultEnabled(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Enable Teleconsultation (e-Sanjeevani Integration)</span>
                  <span className="text-[11px] text-slate-500">Allows remote patient video triage and primary health centre consultations</span>
                </div>
              </label>
            </DialogContent>

            <DialogFooter>
              <Button
                onClick={() => setShowAddModal(false)}
                type="button"
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold cursor-pointer"
              >
                Post Doctor
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

      {/* EDIT DOCTOR MODAL */}
      {showEditModal && editingDoctor && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal} maxWidth="2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-teal-700" />
              <span>Edit Doctor Profile & Posting</span>
            </DialogTitle>
            <DialogDescription>
              Update credentials, clinical specialty, duty status, and facility posting in {selectedDistrict}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditDoctorSubmit}>
            <DialogContent className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
              {/* Row 1: Doctor Name & Qualifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Dr. Rajesh Patel"
                    value={editDocName}
                    onChange={(e) => setEditDocName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Qualifications *</label>
                  <Input
                    required
                    placeholder="e.g. MBBS, MD (Medicine)"
                    value={editQualification}
                    onChange={(e) => setEditQualification(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Specialty & Facility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Clinical Specialty *</label>
                  <select
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    className="flex min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    {specialties.filter((s) => s !== 'ALL').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Posting Public Facility *</label>
                  <select
                    value={editFacilityId}
                    onChange={(e) => setEditFacilityId(e.target.value)}
                    className="flex min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    {facilitiesInDistrict.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Mobile Phone *</label>
                  <Input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Gov Email ID</label>
                  <Input
                    type="email"
                    placeholder="e.g. dr.rajesh@gujarat.health.gov.in"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4: OPD Schedule, Duty Status, Patients Seen */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="font-semibold text-slate-700">OPD Timings</label>
                  <Input
                    placeholder="e.g. 09:00 AM – 01:00 PM (Daily)"
                    value={editOpdSchedule}
                    onChange={(e) => setEditOpdSchedule(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Duty Status</label>
                  <select
                    value={editDutyStatus}
                    onChange={(e) => setEditDutyStatus(e.target.value as DistrictDoctor['status'])}
                    className="flex min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    <option value="ON_DUTY">On Duty</option>
                    <option value="IN_OPD">In OPD</option>
                    <option value="IN_SURGERY">In Surgery</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="OFF_DUTY">Off Duty</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Patients Seen Today</label>
                  <Input
                    type="number"
                    min="0"
                    value={editPatientsToday}
                    onChange={(e) => setEditPatientsToday(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Row 5: Teleconsultation toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={editTeleconsultEnabled}
                  onChange={(e) => setEditTeleconsultEnabled(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Enable Teleconsultation (e-Sanjeevani Integration)</span>
                  <span className="text-[11px] text-slate-500">Allows remote patient video triage and primary health centre consultations</span>
                </div>
              </label>
            </DialogContent>

            <DialogFooter>
              <Button
                onClick={() => setShowEditModal(false)}
                type="button"
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold cursor-pointer gap-2"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteDialog && deletingDoctor && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} maxWidth="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <Trash2 className="h-5 w-5 text-rose-600" />
              <span>Delete Doctor Record</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold text-slate-900">{deletingDoctor.name}</span> ({deletingDoctor.specialty}) from the medical directory?
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-3 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <p className="font-bold text-rose-900">Warning: Permanent Deletion</p>
              <p className="text-rose-700">
                This doctor is currently assigned to <strong>{deletingDoctor.facilityName}</strong>. Removing their profile will detach them from active OPD queues and rosters in {selectedDistrict}.
              </p>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              onClick={() => setShowDeleteDialog(false)}
              type="button"
              variant="secondary"
              size="sm"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDoctorConfirm}
              type="button"
              size="sm"
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer gap-2"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Delete
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};
