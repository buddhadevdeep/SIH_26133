import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { adminApi } from '@/api/adminApi';
import { User, UserRole, StaffSubType } from '@/types/auth';
import {
  UsersRound,
  UserPlus,
  Stethoscope,
  Activity,
  ClipboardList,
  Pill,
  FlaskConical,
  ShieldCheck,
  Search,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building2,
} from 'lucide-react';

const SUBTYPE_DEFAULT_PERMISSIONS: Record<StaffSubType, string[]> = {
  FACILITY_OPERATIONS: [
    'VIEW_FACILITY',
    'VIEW_BEDS',
    'MANAGE_BEDS',
    'VIEW_FLEET',
    'MANAGE_FLEET',
    'VIEW_RESOURCES',
    'MANAGE_RESOURCES',
  ],
  REGISTRATION_CLERK: [
    'VIEW_PATIENT',
    'REGISTER_PATIENT',
    'VIEW_APPOINTMENT',
    'CHECK_IN',
    'ASSIGN_DOCTOR',
    'MANAGE_QUEUE',
  ],
  PHARMACIST: [
    'VIEW_MEDICINES',
    'MANAGE_INVENTORY',
    'DISPENSE_MEDICINE',
  ],
  LAB_TECHNICIAN: [
    'VIEW_LAB_ORDERS',
    'MANAGE_SAMPLES',
    'MANAGE_RESULTS',
  ],
  NURSE: [
    'VIEW_PATIENT',
    'RECORD_VITALS',
    'VIEW_BEDS',
  ],
};

export const HospitalStaffManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('Health@123');
  const [formRole, setFormRole] = useState<'FACILITY_STAFF' | 'DOCTOR'>('FACILITY_STAFF');
  const [formSubType, setFormSubType] = useState<StaffSubType>('FACILITY_OPERATIONS');
  const [formSpecialty, setFormSpecialty] = useState('General Medicine');
  const [formQualification, setFormQualification] = useState('MBBS, MD');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    SUBTYPE_DEFAULT_PERMISSIONS.FACILITY_OPERATIONS
  );

  const loadStaff = async () => {
    if (!user?.facilityId) {
      setLoading(false);
      return;
    }

    try {
      const res = await adminApi.getUsers({
        facilityId: user.facilityId,
      });
      if (res.data) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error('Failed to load facility staff:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [user?.facilityId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStaff();
  };

  const handleRoleChange = (role: 'FACILITY_STAFF' | 'DOCTOR') => {
    setFormRole(role);
    if (role === 'FACILITY_STAFF') {
      setSelectedPermissions(SUBTYPE_DEFAULT_PERMISSIONS[formSubType]);
    } else {
      setSelectedPermissions(['CLINICAL_CONSULTATION', 'PRESCRIPTION_ISSUE', 'DIAGNOSIS_ENTRY', 'EMR_READ_WRITE']);
    }
  };

  const handleSubTypeChange = (subType: StaffSubType) => {
    setFormSubType(subType);
    setSelectedPermissions(SUBTYPE_DEFAULT_PERMISSIONS[subType]);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      setSubmitError('Please enter both name and phone number.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        username: formUsername.trim() || undefined,
        password: formPassword.trim() || 'Health@123',
        role: formRole,
        staffSubType: formRole === 'FACILITY_STAFF' ? formSubType : undefined,
        facilityId: user?.facilityId,
        facilityName: user?.facilityName,
        districtId: user?.districtId,
        district: user?.district,
        permissions: selectedPermissions,
        specialty: formRole === 'DOCTOR' ? formSpecialty : undefined,
        qualification: formRole === 'DOCTOR' ? formQualification : undefined,
      };

      await adminApi.createUser(payload);
      setSubmitSuccess(`Staff member "${formName}" created successfully and bound to this hospital.`);
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setFormUsername('');
      loadStaff();
      setTimeout(() => {
        setModalOpen(false);
        setSubmitSuccess(null);
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to create staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (roleFilter !== 'ALL') {
      if (roleFilter === 'DOCTOR' && s.role !== 'DOCTOR') return false;
      if (roleFilter === 'FACILITY_STAFF' && s.role !== 'FACILITY_STAFF') return false;
      if (roleFilter === 'FACILITY_OPERATIONS' && s.staffSubType !== 'FACILITY_OPERATIONS') return false;
      if (roleFilter === 'REGISTRATION_CLERK' && s.staffSubType !== 'REGISTRATION_CLERK') return false;
      if (roleFilter === 'PHARMACIST' && s.staffSubType !== 'PHARMACIST') return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.username && s.username.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term)) ||
      (s.staffSubType && s.staffSubType.toLowerCase().includes(term)) ||
      (s.specialty && s.specialty.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/hospital')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Hospital Command
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UsersRound className="h-6 w-6 text-teal-700" />
            Hospital Staff & Doctor Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Facility: <strong>{user?.facilityName || 'Assigned Hospital'}</strong> • District: <strong>{user?.district || 'Assigned District'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            isLoading={refreshing}
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500">Filter:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Hospital Personnel</option>
              <option value="DOCTOR">Doctors / Specialists</option>
              <option value="FACILITY_OPERATIONS">Facility Operations (Beds & Fleet)</option>
              <option value="REGISTRATION_CLERK">Registration / Counter Staff</option>
              <option value="PHARMACIST">Pharmacists</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3 px-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assigned Personnel ({filteredStaff.length})
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Strictly isolated to {user?.facilityName}
            </span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role & Subtype</th>
                <th className="py-3 px-4">Contact / Username</th>
                <th className="py-3 px-4">Assigned Permissions</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin text-teal-700 mx-auto mb-2" />
                    Loading hospital staff registry...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <p className="font-semibold">No staff members found matching the selected criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "Add Staff Member" to provision operations, registration, or clinical personnel for this hospital.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-bold ${
                          staff.role === 'DOCTOR'
                            ? 'bg-blue-600'
                            : staff.staffSubType === 'FACILITY_OPERATIONS'
                            ? 'bg-teal-700'
                            : staff.staffSubType === 'PHARMACIST'
                            ? 'bg-amber-600'
                            : 'bg-violet-600'
                        }`}>
                          {staff.role === 'DOCTOR' ? (
                            <Stethoscope className="h-4 w-4" />
                          ) : staff.staffSubType === 'FACILITY_OPERATIONS' ? (
                            <Activity className="h-4 w-4" />
                          ) : staff.staffSubType === 'PHARMACIST' ? (
                            <Pill className="h-4 w-4" />
                          ) : (
                            <ClipboardList className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{staff.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {staff.designation || (staff.specialty ? `Specialist (${staff.specialty})` : staff.role)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                          {staff.role}
                        </span>
                        {staff.staffSubType && (
                          <p className="text-[11px] font-semibold text-teal-800">
                            {staff.staffSubType.replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">Phone: {staff.phone}</p>
                      <p className="text-[11px] text-slate-500 font-mono">User: {staff.username || '—'}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(staff.permissions || []).slice(0, 3).map((p, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[9px] font-medium text-teal-800"
                          >
                            {p}
                          </span>
                        ))}
                        {(staff.permissions || []).length > 3 && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                            +{(staff.permissions || []).length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {staff.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Provision Hospital Personnel</h2>
                <p className="text-xs text-slate-500">
                  Hospital: <strong>{user?.facilityName}</strong> • District: <strong>{user?.district}</strong>
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Operational Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('FACILITY_STAFF')}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                      formRole === 'FACILITY_STAFF'
                        ? 'border-teal-600 bg-teal-50/80 font-bold text-teal-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Activity className="h-4 w-4 mb-1 text-teal-700" />
                    <p className="font-bold">Hospital Facility Staff</p>
                    <p className="text-[10px] text-slate-500 font-normal">Operations, counter, pharmacy, lab</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('DOCTOR')}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                      formRole === 'DOCTOR'
                        ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Stethoscope className="h-4 w-4 mb-1 text-blue-700" />
                    <p className="font-bold">Doctor / Specialist</p>
                    <p className="text-[10px] text-slate-500 font-normal">OPD consultations & triage</p>
                  </button>
                </div>
              </div>

              {/* Subtype for Facility Staff */}
              {formRole === 'FACILITY_STAFF' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Staff Subtype & Functional Wing
                  </label>
                  <select
                    value={formSubType}
                    onChange={(e) => handleSubTypeChange(e.target.value as StaffSubType)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="FACILITY_OPERATIONS">Facility Operations (Beds, Fleet & Resources)</option>
                    <option value="REGISTRATION_CLERK">Registration Clerk (Counter & Tokens)</option>
                    <option value="PHARMACIST">Pharmacist (Prescription & Stock)</option>
                    <option value="LAB_TECHNICIAN">Laboratory Technician (Diagnostic Orders)</option>
                  </select>
                </div>
              )}

              {/* Doctor Details */}
              {formRole === 'DOCTOR' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Specialty</label>
                    <input
                      type="text"
                      value={formSpecialty}
                      onChange={(e) => setFormSpecialty(e.target.value)}
                      placeholder="e.g. Cardiology, Pediatrics"
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Qualification</label>
                    <input
                      type="text"
                      value={formQualification}
                      onChange={(e) => setFormQualification(e.target.value)}
                      placeholder="e.g. MBBS, MD"
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Login Username</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. vikram.ops or auto-generated"
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              {/* Permissions Preview */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Assigned RBAC Permissions
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  {selectedPermissions.map((perm, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-teal-100 border border-teal-300 px-2 py-0.5 text-[10px] font-bold text-teal-900"
                    >
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  Create & Assign to Hospital
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
