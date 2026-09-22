import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { INITIAL_DISTRICT_ADMINS } from '@/mock/mockData';
import { mockState } from '@/mock/db';
import { DistrictAdminProfile } from '@/types/admin';
import { directoryApi } from '@/api/directoryApi';
import { districtApi } from '@/api/districtApi';
import { District } from '@/types/district';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Lock,
  MapPin,
  Calendar,
  XCircle,
  Eye,
  X,
} from 'lucide-react';

const GUJARAT_DISTRICTS = [
  'Gandhinagar',
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Bhavnagar',
  'Jamnagar',
  'Junagadh',
  'Morbi',
  'Mehsana',
  'Patan',
  'Anand',
  'Bharuch',
  'Kutch',
  'Navsari',
  'Valsad',
  'Surendranagar',
  'Panchmahal',
  'Dahod',
  'Amreli',
  'Porbandar',
  'Gir Somnath',
  'Botad',
  'Devbhumi Dwarka',
  'Aravalli',
  'Mahisagar',
  'Chhota Udaipur',
  'Narmada',
  'Tapi',
  'Dang',
];

interface DistrictAdminsTabProps {
  selectedDistrictFilter?: string;
  onDistrictFilterChange?: (district: string) => void;
}

export const DistrictAdminsTab: React.FC<DistrictAdminsTabProps> = ({
  selectedDistrictFilter = 'ALL',
}) => {
  const [adminsList, setAdminsList] = useState<DistrictAdminProfile[]>(() => {
    return mockState?.districtAdmins?.length ? mockState.districtAdmins : INITIAL_DISTRICT_ADMINS;
  });
  const [dbDistricts, setDbDistricts] = useState<District[]>([]);

  // Load district admins and registered districts from live MongoDB backend
  useEffect(() => {
    directoryApi.getDistrictAdmins().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setAdminsList(res.data as any);
      }
    }).catch((err) => {
      console.warn('Live district admins fetch failed, using local cache:', err);
    });

    districtApi.getAll().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setDbDistricts(res.data);
      }
    }).catch((err) => {
      console.warn('Live districts fetch failed:', err);
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED'>('ALL');
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<DistrictAdminProfile | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Appoint Form State
  const [officerName, setOfficerName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [designation, setDesignation] = useState('Chief District Health Officer (CDHO)');
  const [district, setDistrict] = useState('Gandhinagar');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [facilityCount, setFacilityCount] = useState('14');
  const [privileges, setPrivileges] = useState<string[]>([
    'FACILITY_MANAGEMENT',
    'DOCTOR_POSTINGS',
    'BLOOD_BANK_OVERSIGHT',
    'AI_RESOURCE_INTELLIGENCE',
  ]);

  const togglePrivilege = (priv: string) => {
    setPrivileges((prev) =>
      prev.includes(priv) ? prev.filter((p) => p !== priv) : [...prev, priv]
    );
  };

  const handleAppointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim() || !district) {
      alert('Officer Name and District are required.');
      return;
    }

    const trimmedUsername = adminUsername.trim();
    const trimmedPassword = adminPassword.trim();

    if (!trimmedUsername) {
      alert('District Admin Login Username / ID is strictly COMPULSORY.');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 4) {
      alert('District Admin Login Password is strictly COMPULSORY (minimum 4 characters).');
      return;
    }

    const matchedDistrict = dbDistricts.find(
      (d) => d.name.toLowerCase() === district.toLowerCase() || d.id === district
    );
    const districtId = matchedDistrict?.id;
    const finalDistrictName = matchedDistrict?.name || district;

    const newAdminData: any = {
      name: officerName.trim(),
      username: trimmedUsername,
      password: trimmedPassword,
      designation: designation.trim() || 'Chief District Health Officer (CDHO)',
      district: finalDistrictName,
      districtId,
      email: email.trim() || `${trimmedUsername}@gujarat.health.gov.in`,
      phone: phone.trim() || '9876500000',
      status: 'ACTIVE',
      appointedAt: new Date().toISOString().slice(0, 10),
      appointedBy: 'State Health Authority (Super Admin Vikram Mehta)',
      jurisdictionFacilitiesCount: parseInt(facilityCount, 10) || 12,
      privileges: privileges.length > 0 ? privileges : ['FACILITY_MANAGEMENT', 'DOCTOR_POSTINGS'],
    };

    let created: DistrictAdminProfile;
    try {
      const res = await directoryApi.createDistrictAdmin(newAdminData as any);
      if (res?.data) {
        created = res.data as any;
      } else {
        throw new Error('No data returned');
      }
    } catch {
      if (mockState && typeof mockState.provisionDistrictAdmin === 'function') {
        created = mockState.provisionDistrictAdmin(newAdminData);
      } else {
        created = {
          ...newAdminData,
          id: `da_${Date.now()}`,
        } as DistrictAdminProfile;
      }
    }

    if (mockState && typeof mockState.provisionDistrictAdmin === 'function') {
      try { mockState.provisionDistrictAdmin(created); } catch {}
    }

    setAdminsList((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
    setShowAppointModal(false);

    // Reset Form
    setOfficerName('');
    setAdminUsername('');
    setAdminPassword('');
    setEmail('');
    setPhone('');

    setSuccessToast(`Successfully issued official state appointment for ${created.name} (${created.district}). Login Username: "${trimmedUsername}" | Password: "${trimmedPassword}"`);
    setTimeout(() => setSuccessToast(null), 10000);
  };

  const handleToggleStatus = async (adminId: string, currentStatus: DistrictAdminProfile['status']) => {
    const newStatus: DistrictAdminProfile['status'] =
      currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      await directoryApi.updateDistrictAdminStatus(adminId, newStatus);
    } catch (err) {
      console.warn('Could not update admin status on backend:', err);
    }

    if (mockState && typeof mockState.updateDistrictAdminStatus === 'function') {
      mockState.updateDistrictAdminStatus(adminId, newStatus);
    }

    setAdminsList((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, status: newStatus } : a))
    );

    const target = adminsList.find((a) => a.id === adminId);
    setSuccessToast(
      newStatus === 'ACTIVE'
        ? `Reactivated district administrative authority for ${target?.name} in ${target?.district}.`
        : `Suspended district administrative authority for ${target?.name} in ${target?.district}.`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Filter list
  const filteredAdmins = useMemo(() => {
    return adminsList.filter((admin) => {
      const matchesDistrictFilter =
        selectedDistrictFilter === 'ALL' || admin.district === selectedDistrictFilter;

      const matchesStatus =
        statusFilter === 'ALL' || admin.status === statusFilter;

      const matchesSearch =
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDistrictFilter && matchesStatus && matchesSearch;
    });
  }, [adminsList, selectedDistrictFilter, statusFilter, searchQuery]);

  // Counts
  const totalAppointed = adminsList.length;
  const activeCount = adminsList.filter((a) => a.status === 'ACTIVE').length;
  const suspendedCount = adminsList.filter((a) => a.status === 'SUSPENDED').length;
  const totalJurisdictionFacilities = adminsList.reduce((acc, a) => acc + a.jurisdictionFacilitiesCount, 0);

  return (
    <div className="space-y-6">
      {/* State Apex Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start justify-between gap-3 text-xs text-indigo-950">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-indigo-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-indigo-900 text-sm">
              Exclusive State Authority Provisioning Console
            </h4>
            <p className="text-indigo-800 mt-0.5 leading-relaxed">
              District Health Administrators (CDHOs) hold statutory administrative command over public hospitals, doctors, and healthcare assets within their district.
              <strong> Under HealthConnect security rules, District Administrators can ONLY be appointed, transferred, or revoked by the Super Admin (Website Owner / State Apex Authority).</strong>
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAppointModal(true)}
          size="sm"
          className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Appoint District Admin</span>
        </Button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 State Apex Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Appointed CDHOs</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalAppointed}</p>
          <span className="text-[11px] text-indigo-700 font-medium">Chief District Health Officers</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Commands</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Districts with active leadership</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Supervised Facilities</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalJurisdictionFacilities}</p>
          <span className="text-[11px] text-teal-700 font-medium">Public hospitals under active CDHOs</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Suspended Commands</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{suspendedCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Revoked / Pending appointment</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by officer name, district, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <div className="flex gap-1">
              {(['ALL', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* District Admins Master Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Commissioned District Health Administrators</h3>
            <p className="text-xs text-slate-500">
              State-appointed Chief District Health Officers holding exclusive jurisdictional governance
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {filteredAdmins.length} Officers Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500">
              <tr>
                <th className="p-3.5">Appointed Officer</th>
                <th className="p-3.5">District Jurisdiction</th>
                <th className="p-3.5">Contact Channels</th>
                <th className="p-3.5">State Authority Appointed</th>
                <th className="p-3.5">Jurisdiction Scale</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Apex Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.map((admin) => {
                const isActive = admin.status === 'ACTIVE';
                const isSuspended = admin.status === 'SUSPENDED';

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{admin.name}</div>
                      <div className="text-[11px] text-indigo-700 font-semibold">{admin.designation}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {admin.id}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-100">
                        <MapPin className="h-3 w-3 text-teal-600" />
                        {admin.district} District
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate max-w-[180px]">{admin.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{admin.phone}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-600">
                      <div className="font-semibold text-slate-800 text-[11px]">{admin.appointedBy}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {admin.appointedAt}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 text-sm">{admin.jurisdictionFacilitiesCount}</span>{' '}
                      <span className="text-slate-500 text-[11px]">Hospitals / Centres</span>
                    </td>

                    <td className="p-3.5">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Active Commission
                        </span>
                      ) : isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="h-3 w-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          On Leave
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAdmin(admin)}
                        className="text-[11px] h-7 px-2 cursor-pointer font-semibold"
                      >
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant={isActive ? 'destructive' : 'primary'}
                        onClick={() => handleToggleStatus(admin.id, admin.status)}
                        className="text-[11px] h-7 px-2.5 cursor-pointer font-semibold"
                      >
                        {isActive ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* APPOINT NEW DISTRICT ADMIN MODAL */}
      {showAppointModal && (
        <Dialog open={showAppointModal} onOpenChange={setShowAppointModal} maxWidth="2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900">
              <ShieldCheck className="h-5 w-5 text-indigo-700" />
              <span>Appoint District Health Administrator (CDHO)</span>
            </DialogTitle>
            <DialogDescription>
              Commission an official District Health Administrator under State Health Authority mandate.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAppointSubmit}>
            <DialogContent className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
              {/* Row 1: Target District & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target District Jurisdiction *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="flex min-h-[40px] w-full rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 cursor-pointer"
                  >
                    {dbDistricts.map((d) => (
                      <option key={d.id} value={d.name}>
                        ★ {d.name} District (Active Database Entity)
                      </option>
                    ))}
                    {GUJARAT_DISTRICTS.filter((gd) => !dbDistricts.some((db) => db.name.toLowerCase() === gd.toLowerCase())).map((d) => (
                      <option key={d} value={d}>
                        {d} District
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Official Title / Designation *</label>
                  <Input
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Chief District Health Officer (CDHO)"
                  />
                </div>
              </div>

              {/* Row 2: Officer Name & Facility Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Officer Full Name (MD / MS / Senior Public Health Specialist) *</label>
                  <Input
                    required
                    placeholder="e.g. Dr. Rameshchandra Patel"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Facilities Under Command</label>
                  <Input
                    type="number"
                    min="1"
                    value={facilityCount}
                    onChange={(e) => setFacilityCount(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Official Government Email *</label>
                  <Input
                    type="email"
                    required
                    placeholder={`e.g. cdho.${district.toLowerCase()}@gujarat.health.gov.in`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Official Mobile / Direct Line *</label>
                  <Input
                    type="tel"
                    required
                    placeholder="e.g. 9876501234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4: District Health Authority Login Credentials */}
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    🔐 District Admin Portal Login Credentials <span className="text-rose-600 font-extrabold">* (Compulsory)</span>
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium">Used to sign in to District Command Dashboard</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Official Username / ID <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder={officerName.trim() ? `admin_${officerName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'e.g. admin_morbi'}
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Initial Password <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="text"
                      placeholder="Admin@123"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Privileges Granted */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block">Jurisdictional Privileges Granted</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'FACILITY_MANAGEMENT', label: 'Manage Government Hospitals & CHCs' },
                    { key: 'DOCTOR_POSTINGS', label: 'Doctor Transfers & Duty Rosters' },
                    { key: 'BLOOD_BANK_OVERSIGHT', label: 'Blood Banks & Storage Units Governance' },
                    { key: 'AI_RESOURCE_INTELLIGENCE', label: 'AI Resource Intelligence & Gap Mapping' },
                    { key: 'REFERRAL_TRIAGE_OVERSIGHT', label: 'District Referral & Ambulance Command' },
                  ].map((priv) => {
                    const checked = privileges.includes(priv.key);
                    return (
                      <label
                        key={priv.key}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePrivilege(priv.key)}
                          className="rounded text-indigo-700 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="font-medium text-slate-800 text-[11px]">{priv.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>This appointment will be timestamped and permanently recorded in the State Health Security Audit Log.</span>
              </div>
            </DialogContent>

            <DialogFooter>
              <Button
                onClick={() => setShowAppointModal(false)}
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
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold cursor-pointer"
              >
                Appoint & Commission CDHO
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

      {/* VIEW ADMIN DETAILS MODAL */}
      {selectedAdmin && (
        <Dialog open={!!selectedAdmin} onOpenChange={() => setSelectedAdmin(null)} maxWidth="lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-bold text-[10px]">
                {selectedAdmin.district} District
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-500">Appointed: {selectedAdmin.appointedAt}</span>
            </div>
            <DialogTitle className="mt-1">{selectedAdmin.name}</DialogTitle>
            <DialogDescription>{selectedAdmin.designation}</DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Government Email:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedAdmin.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Helpline:</span>
                <span className="font-semibold text-slate-800">{selectedAdmin.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supervised Facilities:</span>
                <span className="font-bold text-teal-700">{selectedAdmin.jurisdictionFacilitiesCount} Health Centers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Appointed By:</span>
                <span className="font-semibold text-slate-800">{selectedAdmin.appointedBy}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-700">Commissioned Privileges:</span>
              <div className="flex flex-wrap gap-1">
                {selectedAdmin.privileges.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[10px] border border-indigo-100"
                  >
                    {p.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              onClick={() => setSelectedAdmin(null)}
              variant="secondary"
              size="sm"
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};
