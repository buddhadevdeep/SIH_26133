import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { User, UserRole, StaffSubType } from '@/types/auth';
import {
  Users,
  Search,
  Plus,
  Phone,
  Building2,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UsersTabProps {
  users: User[];
  onAddUser?: (user: Partial<User>) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onAddUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add user form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Staff@123');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('DOCTOR');
  const [staffSubType, setStaffSubType] = useState<StaffSubType>('REGISTRATION_CLERK');
  const [facilityName, setFacilityName] = useState('Gandhinagar Civil Hospital');

  // Filter users
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.facilityName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const finalUsername = username.trim() || `${role.toLowerCase()}_${sanitized}`;
    const finalPassword = password.trim() || 'Staff@123';

    if (onAddUser) {
      onAddUser({
        name,
        phone,
        role,
        staffSubType: role === 'FACILITY_STAFF' ? staffSubType : undefined,
        facilityName,
        ...({ username: finalUsername, password: finalPassword } as any),
      });
    }

    setShowAddModal(false);
    setName('');
    setUsername('');
    setPassword('Staff@123');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Exclusive CDHO Provisioning Advisory */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-indigo-700 shrink-0" />
          <span>
            <strong>District Health Administrators (CDHOs)</strong> possess supreme territorial command and can ONLY be commissioned via the dedicated <strong>District Admins Console</strong>.
          </span>
        </div>
        <Link to="/super-admin/district-admins">
          <Button size="sm" variant="outline" className="text-[11px] h-7 px-2.5 border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-semibold gap-1 shrink-0 cursor-pointer">
            <UserCheck className="h-3.5 w-3.5" />
            <span>District Admins Console</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Top Search, Role Filter & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search by staff name, phone, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="flex min-h-[44px] rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="PATIENT">Patient</option>
            <option value="ASHA">ASHA Worker</option>
            <option value="DOCTOR">Doctor</option>
            <option value="FACILITY_STAFF">Facility Staff</option>
            <option value="DISTRICT_ADMIN">District Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          size="sm"
          className="gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table / List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No user accounts matched your search and filter criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedRole('ALL');
          }}
        />
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Facility / Jurisdiction</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {u.id}</div>
                    </td>
                    <td className="p-3.5">
                      <RoleBadge role={u.role} subType={u.staffSubType} />
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{u.phone}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{u.facilityName || 'Gandhinagar District Grid'}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add User Dialog */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal} maxWidth="xl">
          <DialogHeader>
            <DialogTitle>Add Healthcare User</DialogTitle>
            <DialogDescription>
              Create a new user profile with verified role permissions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser}>
            <DialogContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name</label>
                <Input
                  required
                  placeholder="e.g. Dr. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mobile Phone Number</label>
                <Input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="flex min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                  >
                    <option value="DOCTOR">Doctor</option>
                    <option value="FACILITY_STAFF">Facility Staff</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                {role === 'FACILITY_STAFF' && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Staff Subtype</label>
                    <select
                      value={staffSubType}
                      onChange={(e) => setStaffSubType(e.target.value as StaffSubType)}
                      className="flex min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                    >
                      <option value="REGISTRATION_CLERK">Registration Clerk</option>
                      <option value="PHARMACIST">Pharmacist</option>
                      <option value="FACILITY_OPERATIONS">Operations Manager</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Login Username</label>
                  <Input
                    placeholder={name ? `${role.toLowerCase()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'e.g. doc_priya'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Login Password</label>
                  <Input
                    placeholder="Staff@123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Assigned Facility</label>
                <Input
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="Facility name"
                />
              </div>
            </DialogContent>

            <DialogFooter>
              <Button onClick={() => setShowAddModal(false)} type="button" variant="secondary" size="sm" className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="cursor-pointer">
                Create User
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
};
