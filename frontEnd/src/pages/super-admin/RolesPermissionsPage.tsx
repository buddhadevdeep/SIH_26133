import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from '@/components/ui/Badge';
import { INITIAL_PERMISSION_MATRIX, DEMO_USERS } from '@/mock/mockData';
import { UserRole } from '@/types/auth';
import { PermissionMatrixItem } from '@/types/admin';
import { adminApi } from '@/api/adminApi';
import {
  KeyRound,
  Download,
  Search,
  Info,
  Shield,
  Users,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const RolesPermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionMatrixItem[]>(INITIAL_PERMISSION_MATRIX);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('DOCTOR');

  const fetchPermissions = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    setError(null);
    try {
      const res = await adminApi.getPermissions();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setPermissions(res.data);
      }
    } catch (err: any) {
      console.warn('Roles permission fetch error:', err);
      setError(err?.message || 'Could not fetch live permissions matrix.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const users = Object.values(DEMO_USERS);

  const filtered = permissions.filter((p) =>
    p.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(permissions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `healthconnect-permissions-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const renderCaps = (caps?: { read?: boolean; write?: boolean; create?: boolean; delete?: boolean }) => {
    if (!caps) return <span className="text-slate-300 text-xs">—</span>;

    const tags: React.ReactNode[] = [];
    if (caps.read) {
      tags.push(
        <span key="r" className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold" title="Read">
          Read
        </span>
      );
    }
    if (caps.write) {
      tags.push(
        <span key="w" className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold" title="Write">
          Write
        </span>
      );
    }
    if (caps.create) {
      tags.push(
        <span key="c" className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold" title="Create">
          Create
        </span>
      );
    }
    if (caps.delete) {
      tags.push(
        <span key="d" className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold" title="Delete">
          Delete
        </span>
      );
    }

    if (tags.length === 0) return <span className="text-slate-300 text-xs">—</span>;
    return <div className="flex flex-wrap items-center justify-center gap-1">{tags}</div>;
  };

  const roleList: Array<{ role: UserRole; name: string; desc: string }> = [
    { role: 'PATIENT', name: 'Patient / Citizen', desc: 'Personal health records, token booking, and teleconsultations' },
    { role: 'ASHA', name: 'ASHA Worker', desc: 'Community citizen registration, vitals telemetry, offline sync' },
    { role: 'DOCTOR', name: 'Doctor / Specialist', desc: 'Clinical queue management, EHR prescriptions, and diagnostic orders' },
    { role: 'FACILITY_STAFF', name: 'Facility Staff', desc: 'Hospital registration, bed tracking, pharmacy stock, and labs' },
    { role: 'HOSPITAL_ADMIN', name: 'Hospital Admin', desc: 'Facility superintendent, bed allocation, and specialist rostering' },
    { role: 'DISTRICT_ADMIN', name: 'District Admin', desc: 'District resource intelligence, referral monitor, and disease alerts' },
    { role: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Platform operations, system health, and cross-district governance' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Review role capabilities and access permissions across clinical and operational modules."
        breadcrumbs={[
          { label: 'Technical Center', to: '/super-admin' },
          { label: 'Roles & Permissions' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchPermissions(true)}
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-teal-700" />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Export Permissions
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchPermissions(true)}>Retry</Button>
        </div>
      )}

      {/* Role Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {roleList.map((r) => {
          const userCount = users.filter((u) => u.role === r.role).length;
          const isSelected = selectedRole === r.role;
          return (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Role Profile
              </span>
              <span className="font-bold text-xs text-slate-900 block mt-1 truncate">
                {r.name.split('/')[0]}
              </span>
              <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
                {userCount} staff assigned
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Role Card */}
      {(() => {
        const activeRoleObj = roleList.find((r) => r.role === selectedRole);
        return (
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{activeRoleObj?.name}</h3>
                  <RoleBadge role={selectedRole} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activeRoleObj?.desc}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Assigned users: <strong>{users.filter((u) => u.role === selectedRole).length}</strong>
            </span>
          </div>
        );
      })()}

      {/* Capability Legend */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <span className="font-bold text-slate-700 flex items-center gap-1">
          <Info className="h-3.5 w-3.5 text-teal-700" />
          Capability Legend:
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">Read</span> View records
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">Write</span> Modify existing
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">Create</span> Author new
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px]">Delete</span> Revoke access
        </span>
      </div>

      {/* Search & Permissions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Module Access Capabilities</h3>
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white text-xs"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="p-3.5">Healthcare Module</th>
                  <th className="p-3.5 text-center">Patient</th>
                  <th className="p-3.5 text-center">ASHA</th>
                  <th className="p-3.5 text-center">Doctor</th>
                  <th className="p-3.5 text-center">Staff</th>
                  <th className="p-3.5 text-center">District Admin</th>
                  <th className="p-3.5 text-center">Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((perm) => (
                  <tr key={perm.module} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{perm.module}</td>
                    <td className="p-3.5 text-center">{renderCaps(perm.patient)}</td>
                    <td className="p-3.5 text-center">{renderCaps(perm.asha)}</td>
                    <td className="p-3.5 text-center">{renderCaps(perm.doctor)}</td>
                    <td className="p-3.5 text-center">{renderCaps(perm.staff)}</td>
                    <td className="p-3.5 text-center">{renderCaps(perm.districtAdmin)}</td>
                    <td className="p-3.5 text-center">
                      <span className="rounded bg-teal-50 px-2 py-0.5 font-bold text-teal-800 text-[11px]">
                        Full Admin
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile View: Card Stack */}
        <div className="md:hidden space-y-3">
          {filtered.map((perm) => (
            <Card key={perm.module} className="p-4 border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900">{perm.module}</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient</span>
                  <div className="mt-1">{renderCaps(perm.patient)}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ASHA</span>
                  <div className="mt-1">{renderCaps(perm.asha)}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Doctor</span>
                  <div className="mt-1">{renderCaps(perm.doctor)}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff</span>
                  <div className="mt-1">{renderCaps(perm.staff)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
