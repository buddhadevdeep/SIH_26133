import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { operationsApi } from '@/api/operationsApi';
import { facilityApi } from '@/api/facilityApi';
import { FacilityOperationsSummary } from '@/types/operations';
import { Facility } from '@/types/facility';
import {
  Building2,
  UsersRound,
  Stethoscope,
  Activity,
  BedDouble,
  Truck,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Clock,
  Sparkles,
  MapPin,
  Phone,
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [summary, setSummary] = useState<FacilityOperationsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHospitalData = async () => {
    if (!user?.facilityId) {
      setLoading(false);
      return;
    }

    try {
      const [facRes, sumRes] = await Promise.all([
        facilityApi.getById(user.facilityId).catch(() => null),
        operationsApi.getSummary(user.facilityId).catch(() => null),
      ]);

      if (facRes?.data) {
        setFacility(facRes.data);
      }
      if (sumRes?.data) {
        setSummary(sumRes.data);
      }
    } catch (err) {
      console.error('Failed to load hospital dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHospitalData();
    const interval = setInterval(loadHospitalData, 30000);
    return () => clearInterval(interval);
  }, [user?.facilityId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHospitalData();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 text-teal-700 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Connecting to Hospital Operations Command...</p>
      </div>
    );
  }

  if (!user?.facilityId) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm">
          <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold">STAFF_FACILITY_NOT_ASSIGNED</h2>
          <p className="text-sm text-amber-800 mt-2">
            Your Hospital Administrator account has not been assigned to a hospital facility.
            Please contact the State Health Authority or District Administrator to configure your facility posting.
          </p>
        </div>
      </div>
    );
  }

  const facilityName = facility?.name || user.facilityName || 'District Civil Hospital';
  const districtName = facility?.district || user.district || 'Assigned District';
  const totalBeds = summary?.telemetry?.bedsTotal ?? facility?.totalBeds ?? 0;
  const availableBeds = summary?.telemetry?.bedsAvailable ?? facility?.availableBeds ?? 0;
  const waitingTokens = summary?.telemetry?.totalWaitingQueue ?? 0;
  const onDutyStaff = summary?.telemetry?.staffOnDutyCount ?? 0;
  const ambulancesReady = summary?.telemetry?.ambulancesReady ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl border border-teal-200/90 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/80 border border-teal-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-200">
            <Building2 className="h-3.5 w-3.5" />
            Hospital Administration Command • {districtName} District
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{facilityName}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-teal-100/90 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Superintendent: <strong>{user?.name}</strong>
            </span>
            {facility?.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-teal-300" /> {facility.address}
              </span>
            )}
            {facility?.contactNumber && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-teal-300" /> {facility.contactNumber}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-teal-600 hover:bg-white/20"
            isLoading={refreshing}
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/hospital/staff')}
            variant="primary"
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-none"
          >
            <UsersRound className="h-4 w-4 mr-1.5" />
            Staff Management
          </Button>
        </div>
      </div>

      {/* KPI Command Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Beds */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Beds Capacity</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{availableBeds}</span>
                  <span className="text-xs font-semibold text-slate-500">/ {totalBeds} total</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <BedDouble className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600">
              {totalBeds === 0 ? (
                <span className="text-amber-600 font-semibold">No beds configured for this facility.</span>
              ) : (
                <span className="text-emerald-700 font-semibold">{Math.round((availableBeds / totalBeds) * 100)}% available for intake</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live OPD Queue */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Live OPD Waiting</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{waitingTokens}</span>
                  <span className="text-xs font-semibold text-slate-500">active tokens</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              {waitingTokens === 0 ? 'No patients currently waiting in OPD.' : `Estimated wait time: ~${waitingTokens * 6} mins`}
            </p>
          </CardContent>
        </Card>

        {/* Doctors & Staff */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">On-Duty Doctors</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{onDutyStaff}</span>
                  <span className="text-xs font-semibold text-slate-500">active</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Stethoscope className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              {onDutyStaff === 0 ? 'No doctors on duty currently.' : 'Clinical OPDs active & consulting'}
            </p>
          </CardContent>
        </Card>

        {/* Fleet & Emergency */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Ambulances</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{ambulancesReady}</span>
                  <span className="text-xs font-semibold text-slate-500">ready</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Truck className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              {ambulancesReady === 0 ? 'No fleet vehicles configured.' : '108 emergency intake ready'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Modules Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Staff Management */}
        <Card className="border-slate-200 hover:border-teal-400 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hospital Staff Management</h3>
                <p className="text-xs text-slate-500">Provision & manage auxiliary staff & doctors</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Create and manage hospital facility staff (Operations, Registration Clerk, Pharmacist, Lab Technician) and doctors. Permissions and facility scoping are strictly bound to this hospital.
            </p>
            <Button
              onClick={() => navigate('/hospital/staff')}
              variant="primary"
              size="sm"
              className="w-full justify-between"
            >
              <span>Manage Hospital Staff</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Module 2: Operations & Capacity */}
        <Card className="border-slate-200 hover:border-teal-400 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Facility Operations Hub</h3>
                <p className="text-xs text-slate-500">Live beds, fleet, alerts & departmental wings</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitor operational services, equipment downtime, bed allocation telemetry, ambulance dispatch status, and inter-facility emergency referrals in real time.
            </p>
            <Button
              onClick={() => navigate('/facility-operations')}
              variant="outline"
              size="sm"
              className="w-full justify-between"
            >
              <span>Open Operations Console</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Module 3: OPD Counter & Registration */}
        <Card className="border-slate-200 hover:border-teal-400 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">OPD & Token Counter</h3>
                <p className="text-xs text-slate-500">Patient check-in, token issuance & queue desk</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Supervise front desk check-in workflows, queue speeds, doctor token assignments, and patient registration throughput across all OPD counters.
            </p>
            <Button
              onClick={() => navigate('/registration-clerk')}
              variant="outline"
              size="sm"
              className="w-full justify-between"
            >
              <span>View Registration Desk</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
