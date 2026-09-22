import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { User, UserRole, StaffSubType } from '@/types/auth';
import { adminApi, RoleItem } from '@/api/adminApi';
import { facilityApi } from '@/api/facilityApi';
import { GUJARAT_DISTRICTS } from '@/contexts/LocationContext';
import {
  Users,
  Search,
  Plus,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Stethoscope,
  KeyRound,
  Shield,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const DOCTOR_SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Nephrology',
  'Oncology',
  'Pediatrics',
  'Orthopedics',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'Pulmonology',
  'General Surgery',
  'Dermatology',
  'ENT',
  'Psychiatry',
];

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);

  // Add/Edit Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('User@123');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('DOCTOR');
  const [staffSubType, setStaffSubType] = useState<StaffSubType>('REGISTRATION_CLERK');
  const [district, setDistrict] = useState('Gandhinagar');
  const [facilityId, setFacilityId] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [department, setDepartment] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [designation, setDesignation] = useState('');

  // Fetch initial data
  const loadData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    setError(null);

    try {
      const [usersRes, rolesRes, facsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getRoles().catch(() => ({ data: [] })),
        facilityApi.getAll().catch(() => ({ data: [] })),
      ]);

      if (usersRes?.data && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
      if (rolesRes?.data && Array.isArray(rolesRes.data)) {
        setRoles(rolesRes.data);
      }
      if (facsRes?.data && Array.isArray(facsRes.data)) {
        setFacilities(facsRes.data);
      }
    } catch (err: any) {
      console.warn('User management fetch error:', err);
      setError(err?.message || 'Could not fetch live users and roles.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter facilities based on currently chosen district in form
  const availableDistrictFacilities = useMemo(() => {
    return facilities.filter((f) => f.district === district || !district);
  }, [facilities, district]);

  // Handle District Change in Modal
  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const matchingFacs = facilities.filter((f) => f.district === newDist);
    if (matchingFacs.length > 0) {
      setFacilityId(matchingFacs[0].id);
      setFacilityName(matchingFacs[0].name);
    } else {
      setFacilityId('');
      setFacilityName('');
    }
  };

  // Handle Facility Change in Modal
  const handleFacilityChange = (fId: string) => {
    setFacilityId(fId);
    const matched = facilities.find((f) => f.id === fId);
    if (matched) {
      setFacilityName(matched.name);
      if (matched.district) setDistrict(matched.district);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query) ||
        (u as any).username?.toLowerCase().includes(query) ||
        u.facilityName?.toLowerCase().includes(query) ||
        u.district?.toLowerCase().includes(query);

      const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
      const matchesDistrict = selectedDistrictFilter === 'ALL' || u.district === selectedDistrictFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || (u as any).status === selectedStatusFilter || (!((u as any).status) && selectedStatusFilter === 'ACTIVE');

      return matchesSearch && matchesRole && matchesDistrict && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, selectedDistrictFilter, selectedStatusFilter]);

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('User@123');
    setEmail('');
    setPhone('');
    setRole('DOCTOR');
    setStaffSubType('REGISTRATION_CLERK');
    setDistrict('Gandhinagar');
    setFacilityId('');
    setFacilityName('');
    setDepartment('');
    setSpecialty('General Medicine');
    setQualification('MBBS, MD');
    setDesignation('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    if (facilities.length > 0) {
      const gFacs = facilities.filter((f) => f.district === 'Gandhinagar');
      if (gFacs.length > 0) {
        setFacilityId(gFacs[0].id);
        setFacilityName(gFacs[0].name);
      }
    }
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername((user as any).username || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setRole(user.role);
    setStaffSubType((user as any).staffSubType || 'REGISTRATION_CLERK');
    setDistrict(user.district || 'Gandhinagar');
    setFacilityId(user.facilityId || '');
    setFacilityName(user.facilityName || '');
    setDepartment((user as any).department || '');
    setSpecialty((user as any).specialty || 'General Medicine');
    setQualification((user as any).qualification || 'MBBS, MD');
    setDesignation((user as any).designation || '');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !username || !password) return;

    setIsSubmitting(true);
    const finalUsername = username.trim();
    const finalPassword = password.trim();

    const newUserData: any = {
      name: name.trim(),
      username: finalUsername,
      password: finalPassword,
      email: email.trim() || `${finalUsername}@gujarat.health.gov.in`,
      phone: phone.trim(),
      role,
      staffSubType: role === 'FACILITY_STAFF' ? staffSubType : undefined,
      district,
      facilityId: facilityId || undefined,
      facilityName: facilityName || undefined,
      department: department || (role === 'DOCTOR' ? `${specialty} OPD` : undefined),
      specialty: role === 'DOCTOR' ? specialty : undefined,
      qualification: role === 'DOCTOR' ? qualification : undefined,
      designation: designation || (role === 'DOCTOR' ? `Specialist (${specialty})` : role === 'FACILITY_STAFF' ? staffSubType : role),
    };

    try {
      const res = await adminApi.createUser(newUserData);
      if (res?.data) {
        setUsers((prev) => [res.data!, ...prev.filter((u) => u.id !== res.data!.id)]);
      }
      setShowAddModal(false);
      resetForm();
      setSuccessToast(`User "${name}" (${role}) created successfully! Username: "${finalUsername}" | Password: "${finalPassword}"`);
      setTimeout(() => setSuccessToast(null), 10000);
      loadData();
    } catch (err: any) {
      console.error('User creation failed:', err);
      setError(err?.message || 'Failed to create user. Please check if username is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    const updatedData: any = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      staffSubType: role === 'FACILITY_STAFF' ? staffSubType : undefined,
      district,
      facilityId: facilityId || undefined,
      facilityName: facilityName || undefined,
      department,
      specialty: role === 'DOCTOR' ? specialty : undefined,
      qualification: role === 'DOCTOR' ? qualification : undefined,
      designation,
    };

    try {
      const res = await adminApi.updateUser(editingUser.id, updatedData);
      if (res?.data) {
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...res.data } : u)));
      }
      setEditingUser(null);
      setSuccessToast(`User "${name}" updated successfully.`);
      setTimeout(() => setSuccessToast(null), 6000);
      loadData();
    } catch (err: any) {
      console.error('User update failed:', err);
      setError(err?.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = (user as any).status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      await adminApi.updateUser(user.id, { status: newStatus } as any);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } as any : u)));
      setSuccessToast(`User ${user.name} is now ${newStatus}.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Toggle status error:', err);
      setError('Could not update status');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateUser) return;
    try {
      await adminApi.deleteUser(deactivateUser.id);
      setUsers((prev) => prev.map((u) => (u.id === deactivateUser.id ? { ...u, status: 'INACTIVE' } as any : u)));
      setDeactivateUser(null);
      setSuccessToast(`User account deactivated.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setError('Failed to deactivate user');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Role Governance"
        subtitle="Provision and manage users across all Gujarat districts, apex hospitals, and clinical specialties."
        breadcrumbs={[
          { label: 'Technical Center', to: '/super-admin' },
          { label: 'User Governance' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => loadData(true)}
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-teal-700" />
              Refresh
            </Button>
            <Button
              onClick={handleOpenAddModal}
              variant="primary"
              size="sm"
              className="gap-1.5 text-xs font-semibold cursor-pointer bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Any User
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 shadow-xs animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => loadData(true)}>Retry</Button>
        </div>
      )}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 border-slate-200 bg-white">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{users.length}</p>
          <span className="text-[10px] text-slate-400">All Gujarat Accounts</span>
        </Card>

        <Card className="p-3.5 border-teal-200 bg-teal-50/50">
          <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Specialist Doctors</span>
          <p className="text-2xl font-black text-teal-700 mt-0.5">
            {users.filter((u) => u.role === 'DOCTOR').length}
          </p>
          <span className="text-[10px] text-teal-600">On-Duty Physicians</span>
        </Card>

        <Card className="p-3.5 border-indigo-200 bg-indigo-50/50">
          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">District CDHOs</span>
          <p className="text-2xl font-black text-indigo-700 mt-0.5">
            {users.filter((u) => u.role === 'DISTRICT_ADMIN').length}
          </p>
          <span className="text-[10px] text-indigo-600">Territorial Admins</span>
        </Card>

        <Card className="p-3.5 border-purple-200 bg-purple-50/50">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Hospital Admins</span>
          <p className="text-2xl font-black text-purple-700 mt-0.5">
            {users.filter((u) => u.role === 'HOSPITAL_ADMIN').length}
          </p>
          <span className="text-[10px] text-purple-600">Superintendents</span>
        </Card>

        <Card className="p-3.5 border-amber-200 bg-amber-50/50">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Facility Staff</span>
          <p className="text-2xl font-black text-amber-800 mt-0.5">
            {users.filter((u) => u.role === 'FACILITY_STAFF').length}
          </p>
          <span className="text-[10px] text-amber-600">Clerk, Pharm, Lab</span>
        </Card>

        <Card className="p-3.5 border-emerald-200 bg-emerald-50/50">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">ASHA & Patients</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">
            {users.filter((u) => u.role === 'ASHA' || u.role === 'PATIENT').length}
          </p>
          <span className="text-[10px] text-emerald-600">Community & Citizens</span>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search by name, username, phone, hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* District Filter */}
          <div>
            <select
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer shadow-2xs"
            >
              <option value="ALL">📍 All Districts ({GUJARAT_DISTRICTS.length})</option>
              {GUJARAT_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d} District
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer shadow-2xs"
            >
              <option value="ALL">🛡️ All Roles</option>
              <option value="SUPER_ADMIN">State Super Admin</option>
              <option value="DISTRICT_ADMIN">District Admin (CDHO)</option>
              <option value="HOSPITAL_ADMIN">Hospital Superintendent</option>
              <option value="DOCTOR">Doctor / Specialist</option>
              <option value="FACILITY_STAFF">Facility Staff</option>
              <option value="ASHA">ASHA Worker</option>
              <option value="PATIENT">Patient / Citizen</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">🟢 Active Accounts Only</option>
              <option value="INACTIVE">⚪ Inactive Accounts Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong>{filteredUsers.length}</strong> of {users.length} verified accounts in database</span>
          {(searchQuery || selectedRole !== 'ALL' || selectedDistrictFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('ALL');
                setSelectedDistrictFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="text-teal-700 font-bold hover:underline cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match your filters"
          description="Try clearing search queries or switching district/role filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedRole('ALL');
            setSelectedDistrictFilter('ALL');
            setSelectedStatusFilter('ALL');
          }}
        />
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="p-3.5">User & Contact</th>
                  <th className="p-3.5">Role / Designation</th>
                  <th className="p-3.5">District</th>
                  <th className="p-3.5">Hospital / Facility</th>
                  <th className="p-3.5">Credentials</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isActive = (u as any).status !== 'INACTIVE';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-950 text-sm">{u.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{u.phone}</span>
                          {u.email && <span className="text-slate-400">• {u.email}</span>}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <RoleBadge role={u.role} subType={u.staffSubType} />
                        {(u as any).specialty && (
                          <div className="text-[10px] font-semibold text-teal-800 mt-1">
                            🩺 {(u as any).specialty}
                          </div>
                        )}
                        {(u as any).designation && !(u as any).specialty && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {(u as any).designation}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {u.district || 'Gandhinagar'}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium text-[11px]" title={u.facilityName || 'Statewide'}>
                            {u.facilityName || 'Statewide / District Office'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono text-[11px] font-bold text-teal-900 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-100 inline-block">
                          @{(u as any).username || u.id}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title="Click to toggle active status"
                          className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                        >
                          {isActive ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() => setSelectedUser(u)}
                            variant="ghost"
                            size="sm"
                            title="View Full Profile"
                            className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleOpenEditModal(u)}
                            variant="ghost"
                            size="sm"
                            title="Edit User & Hospital"
                            className="h-7 px-2 text-[11px] text-teal-700 hover:text-teal-800 hover:bg-teal-50 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => setDeactivateUser(u)}
                            variant="ghost"
                            size="sm"
                            title="Deactivate User"
                            className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* USER DETAILS DIALOG */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)} maxWidth="lg">
          <DialogHeader>
            <DialogTitle>{selectedUser.name}</DialogTitle>
            <DialogDescription>
              Healthcare Account Profile & Live Credentials
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Role</span>
                <div className="mt-1">
                  <RoleBadge role={selectedUser.role} subType={selectedUser.staffSubType} />
                </div>
              </div>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> System Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[10px]">Username:</span>
                <span className="font-mono font-bold text-slate-900">@{(selectedUser as any).username || selectedUser.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Phone Contact:</span>
                <span className="font-semibold text-slate-900">{selectedUser.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Assigned District:</span>
                <span className="font-bold text-slate-900">{selectedUser.district || 'Gandhinagar'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Assigned Hospital:</span>
                <span className="font-semibold text-slate-900">{selectedUser.facilityName || 'Statewide'}</span>
              </div>
              {(selectedUser as any).specialty && (
                <div>
                  <span className="text-slate-500 block text-[10px]">Clinical Specialty:</span>
                  <span className="font-bold text-teal-800">{(selectedUser as any).specialty}</span>
                </div>
              )}
              {(selectedUser as any).department && (
                <div>
                  <span className="text-slate-500 block text-[10px]">OPD Department:</span>
                  <span className="font-semibold text-slate-900">{(selectedUser as any).department}</span>
                </div>
              )}
            </div>
          </DialogContent>

          <DialogFooter>
            <Button onClick={() => setSelectedUser(null)} variant="secondary" size="sm" className="cursor-pointer">
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* DEACTIVATE CONFIRMATION DIALOG */}
      {deactivateUser && (
        <Dialog open={!!deactivateUser} onOpenChange={() => setDeactivateUser(null)} maxWidth="sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Deactivate Account?</DialogTitle>
                <DialogDescription>
                  Revoke system login access for {deactivateUser.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogContent className="text-xs text-slate-600 space-y-2">
            <p>
              Deactivating this account will immediately revoke all portal sessions and prevent logging in.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 border text-[11px] font-mono">
              Role: {deactivateUser.role} • District: {deactivateUser.district} • Facility: {deactivateUser.facilityName}
            </div>
          </DialogContent>

          <DialogFooter>
            <Button onClick={() => setDeactivateUser(null)} variant="secondary" size="sm" className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleConfirmDeactivate} variant="destructive" size="sm" className="cursor-pointer">
              Confirm Deactivation
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* ADD / EDIT USER DIALOG */}
      {(showAddModal || editingUser) && (
        <Dialog
          open={showAddModal || !!editingUser}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddModal(false);
              setEditingUser(null);
            }
          }}
          maxWidth="2xl"
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 rounded-xl border border-teal-200">
                <Users className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <DialogTitle>{editingUser ? `Edit User: ${editingUser.name}` : 'Add Healthcare User (Super Admin Authority)'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Modify user role, hospital assignment, and district governance.' : 'Commission new healthcare personnel for any hospital and any district in Gujarat.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={editingUser ? handleSaveEditUser : handleCreateUser}>
            <DialogContent className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
              {/* 1. First Step: Choose User Role */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-950 flex items-center gap-1.5 text-xs">
                    <Shield className="h-4 w-4 text-teal-700" />
                    1. Role & Access Level *
                  </span>
                  <span className="text-[10px] bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded-md border border-teal-200">
                    Step 1
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Select User Role *</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setRole(newRole);
                      if (newRole === 'DISTRICT_ADMIN' || newRole === 'SUPER_ADMIN') {
                        setFacilityId('');
                        setFacilityName('');
                      } else if (!facilityId && availableDistrictFacilities.length > 0) {
                        setFacilityId(availableDistrictFacilities[0].id);
                        setFacilityName(availableDistrictFacilities[0].name);
                      }
                    }}
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                  >
                    <option value="DISTRICT_ADMIN">🏛️ District Admin (District Health Officer / CDHO)</option>
                    <option value="DOCTOR">👨‍⚕️ Doctor / Medical Specialist (OPD Physician)</option>
                    <option value="HOSPITAL_ADMIN">🏥 Hospital Admin (Superintendent / Medical Director)</option>
                    <option value="FACILITY_STAFF">🩺 Facility Staff (Clerk, Lab Tech, Pharmacist, Nurse)</option>
                    <option value="ASHA">👩‍⚕️ ASHA Worker (Community Healthcare Field)</option>
                    <option value="PATIENT">👤 Patient / Citizen (Self-Service Portal)</option>
                    <option value="SUPER_ADMIN">👑 Super Admin (Apex State Authority)</option>
                  </select>
                </div>

                {/* Sub-fields for Doctor */}
                {role === 'DOCTOR' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/80">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Medical Specialty *</label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                      >
                        {DOCTOR_SPECIALTIES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Qualification</label>
                      <Input
                        className="h-9 text-xs"
                        placeholder="e.g. MBBS, MD, DM"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">OPD Room / Dept</label>
                      <Input
                        className="h-9 text-xs"
                        placeholder="e.g. Room 4 (1st Floor)"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Sub-fields for Staff */}
                {role === 'FACILITY_STAFF' && (
                  <div className="space-y-1 pt-2 border-t border-slate-200/80">
                    <label className="font-semibold text-slate-700">Staff Subtype *</label>
                    <select
                      value={staffSubType}
                      onChange={(e) => setStaffSubType(e.target.value as StaffSubType)}
                      className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                    >
                      <option value="REGISTRATION_CLERK">Registration Clerk (OPD Counter)</option>
                      <option value="PHARMACIST">Pharmacist (Jan Aushadhi Dispensary)</option>
                      <option value="LAB_TECHNICIAN">Pathology Lab Technician</option>
                      <option value="NURSE">Triage Nurse / Ward Staff</option>
                      <option value="FACILITY_OPERATIONS">Hospital Operations Manager</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 2. Second Step: Conditional Jurisdiction / Hospital Binding */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-950 flex items-center gap-1.5 text-xs">
                    <Building2 className="h-4 w-4 text-teal-700" />
                    2. {role === 'DISTRICT_ADMIN' ? 'District Jurisdiction Assignment' : role === 'SUPER_ADMIN' ? 'State Authority Assignment' : 'Hospital & District Reference *'}
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-md">
                    Step 2
                  </span>
                </div>

                {role === 'DISTRICT_ADMIN' ? (
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Assigned District Governance *</label>
                      <select
                        value={district}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                      >
                        {GUJARAT_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d} District
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-lg text-[11px] text-indigo-950 flex items-start gap-2">
                      <span className="text-base">🏛️</span>
                      <div>
                        <p className="font-bold">District-Wide Administrative Scope</p>
                        <p className="text-indigo-800 text-[10px] leading-relaxed">
                          This District Admin will oversee all public health centers, CHCs, and hospitals in <strong>{district} District</strong>. No specific hospital binding is needed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : role === 'SUPER_ADMIN' ? (
                  <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg text-[11px] text-purple-950 flex items-start gap-2">
                    <span className="text-base">👑</span>
                    <div>
                      <p className="font-bold">State Apex Authority</p>
                      <p className="text-purple-800 text-[10px] leading-relaxed">
                        Super Administrator has state-level authority across all 33 Gujarat districts and all healthcare facilities.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Target District *</label>
                        <select
                          value={district}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                        >
                          {GUJARAT_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d} District
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">
                          Assigned Hospital / Facility * <span className="text-rose-600 font-bold">(Required)</span>
                        </label>
                        <select
                          required
                          value={facilityId}
                          onChange={(e) => handleFacilityChange(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                        >
                          <option value="">-- Select Hospital in {district} --</option>
                          {availableDistrictFacilities.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-[11px] text-emerald-950 flex items-center gap-2">
                      <span className="text-base">🏥</span>
                      <p className="text-[10px] text-emerald-900 leading-snug">
                        User will be linked directly to <strong>{facilityName || 'the selected hospital'}</strong> in {district} District.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Personal & Contact Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-950 flex items-center gap-1.5 text-xs">
                  <Phone className="h-4 w-4 text-teal-700" />
                  3. Personal & Contact Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Full Name *</label>
                    <Input
                      required
                      placeholder="e.g. Dr. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Phone Number *</label>
                    <Input
                      required
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Official Email</label>
                  <Input
                    type="email"
                    placeholder="e.g. priya.sharma@gujarat.health.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* 4. Login Credentials Box (Only in Add Mode) */}
              {!editingUser && (
                <div className="p-3.5 bg-teal-50/80 rounded-xl border border-teal-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4 text-teal-700" />
                      4. System Authentication Credentials
                    </span>
                    <span className="text-[10px] text-teal-800 font-medium">Used to sign in across portals</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Login Username *</label>
                      <Input
                        required
                        placeholder={name.trim() ? `usr_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'e.g. dr_priya'}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Initial Password *</label>
                      <Input
                        required
                        type="text"
                        placeholder="User@123"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                }}
                type="button"
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="cursor-pointer bg-teal-700 hover:bg-teal-800 text-white font-bold"
              >
                {editingUser ? 'Save Changes' : 'Create & Commission User'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
};
