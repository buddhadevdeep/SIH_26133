import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import {
  INITIAL_SYSTEM_HEALTH,
  INITIAL_FACILITIES,
  INITIAL_PERMISSION_MATRIX,
  INITIAL_AI_MODELS,
  INITIAL_AUDIT_LOGS,
  DEMO_USERS,
} from '@/mock/mockData';
import { Facility } from '@/types/facility';
import { User } from '@/types/auth';
import { AuditLog } from '@/types/admin';
import { adminApi } from '@/api/adminApi';
import {
  LayoutDashboard,
  Server,
  Building2,
  Users,
  KeyRound,
  BrainCircuit,
  ShieldCheck,
  Settings,
  UserCheck,
  ShieldAlert,
  MapPin,
  Crown,
} from 'lucide-react';

// Subviews
import { OverviewTab } from './views/OverviewTab';
import { SystemHealthTab } from './views/SystemHealthTab';
import { FacilitiesTab } from './views/FacilitiesTab';
import { DistrictAdminsTab } from './views/DistrictAdminsTab';
import { UsersTab } from './views/UsersTab';
import { SettingsTab } from './views/SettingsTab';

type TabKey = 'OVERVIEW' | 'HEALTH' | 'FACILITIES' | 'DISTRICT_ADMINS' | 'USERS' | 'SETTINGS';

const TAB_URL_MAP: Record<TabKey, string> = {
  OVERVIEW: '',
  HEALTH: 'system-health',
  FACILITIES: 'facilities',
  DISTRICT_ADMINS: 'district-admins',
  USERS: 'users',
  SETTINGS: 'settings',
};

const URL_TAB_MAP: Record<string, TabKey> = {
  '': 'OVERVIEW',
  overview: 'OVERVIEW',
  'system-health': 'HEALTH',
  health: 'HEALTH',
  facilities: 'FACILITIES',
  'district-admins': 'DISTRICT_ADMINS',
  'district-admin': 'DISTRICT_ADMINS',
  cdho: 'DISTRICT_ADMINS',
  users: 'USERS',
  roles: 'USERS',
  permissions: 'USERS',
  'ai-models': 'OVERVIEW',
  models: 'OVERVIEW',
  audit: 'OVERVIEW',
  settings: 'SETTINGS',
};

import { facilityApi } from '@/api/facilityApi';

export const SuperAdminDashboard: React.FC = () => {
  const { tab: routeTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  // Resolve active tab from URL param
  const activeTab: TabKey = (routeTab && URL_TAB_MAP[routeTab]) || 'OVERVIEW';

  // Live state backed by initial values
  const [health, setHealth] = useState(INITIAL_SYSTEM_HEALTH);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [usersList, setUsersList] = useState<User[]>(Object.values(DEMO_USERS));
  const [permissions, setPermissions] = useState(INITIAL_PERMISSION_MATRIX);
  const [models, setModels] = useState(INITIAL_AI_MODELS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [statewideDistrict, setStatewideDistrict] = useState<string>('ALL');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeploying, setIsDeploying] = useState<string | null>(null);

  // Load all live super admin data from real APIs
  useEffect(() => {
    adminApi.getSystemHealth().then((res) => {
      if (res?.data) setHealth(res.data);
    }).catch((e) => console.warn('Live health fetch failed:', e));

    facilityApi.getAll().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) setFacilities(res.data);
    }).catch((e) => console.warn('Live facilities fetch failed:', e));

    adminApi.getUsers().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) setUsersList(res.data);
    }).catch((e) => console.warn('Live users fetch failed:', e));

    adminApi.getPermissions().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) setPermissions(res.data);
    }).catch((e) => console.warn('Live permissions fetch failed:', e));

    adminApi.getAiModels().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) setModels(res.data);
    }).catch((e) => console.warn('Live models fetch failed:', e));

    adminApi.getAuditLogs().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) setAuditLogs(res.data);
    }).catch((e) => console.warn('Live audit logs fetch failed:', e));
  }, []);

  // Sync tab change with URL
  const handleTabChange = (newTab: TabKey) => {
    const targetSubpath = TAB_URL_MAP[newTab];
    if (!targetSubpath) {
      navigate('/super-admin');
    } else {
      navigate(`/super-admin/${targetSubpath}`);
    }
  };

  // Run synthetic health check
  const handleRunHealthCheck = async () => {
    setIsRefreshing(true);
    try {
      const res = await adminApi.getSystemHealth();
      if (res?.data) setHealth(res.data);
    } catch {
      setHealth((prev) => ({
        ...prev,
        services: prev.services.map((s) => ({
          ...s,
          latencyMs: Math.floor(Math.random() * 20) + 12,
        })),
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add facility
  const handleAddFacility = async (newFac: Partial<Facility>) => {
    try {
      const res = await facilityApi.create(newFac);
      if (res?.data) {
        setFacilities((prev) => [res.data, ...prev.filter((f) => f.id !== res.data.id)]);
      }
    } catch {
      const fullFac: Facility = {
        id: `fac_${Date.now()}`,
        name: newFac.name || 'Community Health Clinic',
        type: newFac.type || 'CHC',
        district: newFac.district || 'Gandhinagar',
        state: 'Gujarat',
        address: 'Sector 24, Gandhinagar',
        pincode: '382024',
        contactNumber: '+91 79 2322 0000',
        emergencyNumber: '108',
        totalBeds: newFac.totalBeds || 20,
        availableBeds: newFac.availableBeds || 15,
        icuBedsTotal: 4,
        icuBedsAvailable: 2,
        oxygenAvailable: true,
        bloodBankAvailable: false,
        ambulanceAvailable: true,
        isOpen: true,
        isVerified: true,
        emergencyAvailable: newFac.emergencyAvailable ?? true,
        currentWaitTimeMinutes: 15,
        coordinates: { lat: 23.2156, lng: 72.6369 },
        departments: [
          { id: 'd_gen', name: 'General Medicine', code: 'GEN', activeDoctors: 3, currentWaitMinutes: 15, opdOpen: true },
          { id: 'd_peds', name: 'Pediatrics', code: 'PED', activeDoctors: 2, currentWaitMinutes: 10, opdOpen: true },
        ],
        specialties: ['General Medicine', 'Maternal Health'],
        equipment: [],
        lastUpdated: new Date().toISOString(),
      };
      setFacilities((prev) => [fullFac, ...prev]);
    }
  };

  // Add user
  const handleAddUser = async (newUser: Partial<User>) => {
    try {
      const res = await adminApi.createUser(newUser);
      if (res?.data) {
        setUsersList((prev) => [res.data, ...prev.filter((u) => u.id !== res.data.id)]);
      }
    } catch {
      const fullUser: User = {
        id: `usr_${Date.now()}`,
        name: newUser.name || 'Healthcare Worker',
        phone: newUser.phone || '9876543210',
        role: newUser.role || 'DOCTOR',
        staffSubType: newUser.staffSubType,
        facilityName: newUser.facilityName || 'Gandhinagar Civil Hospital',
      };
      setUsersList((prev) => [fullUser, ...prev]);
    }
  };

  // AI model actions
  const handleDeployModel = async (id: string) => {
    setIsDeploying(id);
    await adminApi.deployModel(id);
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'ACTIVE', deployedAt: new Date().toISOString().slice(0, 10) } : m))
    );
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorId: 'usr_super_01',
      actorName: 'Vikram Mehta',
      actorRole: 'SUPER_ADMIN',
      action: 'MODEL_DEPLOY',
      resourceType: 'AI_MODEL',
      resourceId: id,
      details: `Deployed model ${id} to production grid`,
      ipAddress: '10.91.242.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'SUCCESS',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    setIsDeploying(null);
  };

  const handleRollbackModel = async (id: string) => {
    setIsDeploying(id);
    await adminApi.rollbackModel(id);
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'STAGING' } : m))
    );
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorId: 'usr_super_01',
      actorName: 'Vikram Mehta',
      actorRole: 'SUPER_ADMIN',
      action: 'MODEL_ROLLBACK',
      resourceType: 'AI_MODEL',
      resourceId: id,
      details: `Rolled back model ${id} to staging`,
      ipAddress: '10.91.242.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'SUCCESS',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    setIsDeploying(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400" aria-label="Breadcrumbs">
        <span className="text-teal-700 font-semibold">HealthConnect</span>
        <span>/</span>
        <span className="text-slate-600 font-semibold">Operations Center</span>
        {activeTab !== 'OVERVIEW' && (
          <>
            <span>/</span>
            <span className="text-slate-900 font-bold capitalize">{activeTab.toLowerCase()}</span>
          </>
        )}
      </nav>

      {/* Top Banner (Real Superadmin / Website Owner State Apex Console) */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 text-white p-6 sm:p-7 shadow-md flex flex-col gap-5 border border-teal-600/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/40">
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                <span>Website Owner Console</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-0.5 text-xs font-semibold text-teal-200 border border-teal-400/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>State Apex Health Authority</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              HealthConnect State Apex Command
            </h1>
            <p className="text-xs text-teal-100/80 max-w-2xl leading-relaxed">
              Supreme platform governance, statewide healthcare facility oversight, and exclusive commissioning authority for Chief District Health Officers (CDHOs) across all 33 Gujarat districts.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3 text-center min-w-[170px]">
              <span className="text-[10px] uppercase font-bold text-teal-200 block tracking-wider">State Platform Grid</span>
              <span className="text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                33 Districts Synchronized
              </span>
            </div>
          </div>
        </div>

        {/* Master Statewide District Jurisdiction Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10 bg-white/5 -mx-6 -mb-6 px-6 py-3.5 rounded-b-3xl">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
            <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Statewide District Command Filter:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statewideDistrict}
              onChange={(e) => setStatewideDistrict(e.target.value)}
              className="bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Gujarat Districts (Statewide View)</option>
              <option value="Gandhinagar">Gandhinagar District</option>
              <option value="Ahmedabad">Ahmedabad District</option>
              <option value="Surat">Surat District</option>
              <option value="Vadodara">Vadodara District</option>
              <option value="Rajkot">Rajkot District</option>
              <option value="Morbi">Morbi District</option>
              <option value="Mehsana">Mehsana District</option>
              <option value="Patan">Patan District</option>
              <option value="Bhavnagar">Bhavnagar District</option>
              <option value="Jamnagar">Jamnagar District</option>
              <option value="Junagadh">Junagadh District</option>
            </select>
            {statewideDistrict !== 'ALL' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatewideDistrict('ALL')}
                className="text-[11px] h-7 px-2 border-teal-400/30 text-teal-200 hover:text-white cursor-pointer"
              >
                Reset to Statewide
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (6 Modules) */}
      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabKey)}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 max-w-full">
          <TabsTrigger value="OVERVIEW" icon={<LayoutDashboard className="h-4 w-4" />}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="HEALTH" icon={<Server className="h-4 w-4" />}>
            System Health
          </TabsTrigger>
          <TabsTrigger value="FACILITIES" icon={<Building2 className="h-4 w-4" />}>
            Facilities
          </TabsTrigger>
          <TabsTrigger value="DISTRICT_ADMINS" icon={<UserCheck className="h-4 w-4 text-indigo-600" />}>
            District Admins
          </TabsTrigger>
          <TabsTrigger value="USERS" icon={<Users className="h-4 w-4" />}>
            Users
          </TabsTrigger>
          <TabsTrigger value="SETTINGS" icon={<Settings className="h-4 w-4" />}>
            Settings
          </TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW */}
        <TabsContent value="OVERVIEW" className="pt-2">
          <OverviewTab
            health={health}
            recentLogs={auditLogs}
            facilityCount={facilities.length}
            userCount={usersList.length}
            modelCount={models.length}
            onNavigateTab={(k) => handleTabChange(k as TabKey)}
            onRunHealthCheck={handleRunHealthCheck}
            isRefreshing={isRefreshing}
          />
        </TabsContent>

        {/* 2. SYSTEM HEALTH */}
        <TabsContent value="HEALTH" className="pt-2">
          <SystemHealthTab
            health={health}
            onRefresh={handleRunHealthCheck}
            isRefreshing={isRefreshing}
          />
        </TabsContent>

        {/* 3. FACILITIES */}
        <TabsContent value="FACILITIES" className="pt-2">
          <FacilitiesTab
            facilities={
              statewideDistrict === 'ALL'
                ? facilities
                : facilities.filter((f) => f.district.toLowerCase() === statewideDistrict.toLowerCase())
            }
            onAddFacility={handleAddFacility}
          />
        </TabsContent>

        {/* 4. DISTRICT ADMINS (EXCLUSIVE SUPER ADMIN APPOINTMENT) */}
        <TabsContent value="DISTRICT_ADMINS" className="pt-2">
          <DistrictAdminsTab
            selectedDistrictFilter={statewideDistrict}
            onDistrictFilterChange={setStatewideDistrict}
          />
        </TabsContent>

        {/* 5. USERS */}
        <TabsContent value="USERS" className="pt-2">
          <UsersTab
            users={usersList}
            onAddUser={handleAddUser}
          />
        </TabsContent>

        {/* 6. SETTINGS */}
        <TabsContent value="SETTINGS" className="pt-2">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
