import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { EmergencyButton } from '@/components/emergency/EmergencyButton';
import {
  INITIAL_FACILITIES,
  INITIAL_REFERRALS,
  INITIAL_MEDICINES,
  INITIAL_AMBULANCES,
} from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { referralApi } from '@/api/referralApi';
import { resourceApi } from '@/api/resourceApi';
import { pharmacyApi } from '@/api/pharmacyApi';
import { Facility } from '@/types/facility';
import { Referral } from '@/types/referral';
import { Ambulance as AmbulanceType, MedicineInventoryItem } from '@/types/resources';
import { Link } from 'react-router-dom';
import {
  Building2,
  GitBranch,
  Bed,
  Ambulance,
  MapPin,
  Pill,
  AlertOctagon,
  Activity,
  ArrowRight,
  Radar,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export const DistrictCommandDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedDistrict } = useLocationContext();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [ambulances, setAmbulances] = useState<AmbulanceType[]>([]);
  const [medicines, setMedicines] = useState<MedicineInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [facRes, refRes, ambRes, medRes] = await Promise.allSettled([
        facilityApi.getAll({ district: selectedDistrict }),
        referralApi.getAll(),
        resourceApi.getAmbulances(),
        pharmacyApi.getInventory(),
      ]);

      if (facRes.status === 'fulfilled' && Array.isArray(facRes.value?.data)) {
        setFacilities(facRes.value.data);
      }
      if (refRes.status === 'fulfilled' && Array.isArray(refRes.value?.data)) {
        setReferrals(refRes.value.data);
      }
      if (ambRes.status === 'fulfilled' && Array.isArray(ambRes.value?.data)) {
        setAmbulances(ambRes.value.data);
      }
      if (medRes.status === 'fulfilled' && Array.isArray(medRes.value?.data)) {
        setMedicines(medRes.value.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDistrict]);

  // Key operational counts calculated dynamically from live API data
  const totalBedsAvailable = facilities.reduce((acc, f) => acc + (f.availableBeds || 0), 0);
  const totalBeds = facilities.reduce((acc, f) => acc + (f.totalBeds || 0), 0);
  const totalIcuAvailable = facilities.reduce((acc, f) => acc + (f.icuBedsAvailable || 0), 0);
  const activeAmbulances = ambulances.filter((a) => a.status === 'AVAILABLE').length;
  const lowStockMedicines = medicines.filter((m) => m.status === 'OUT_OF_STOCK' || m.status === 'LOW_STOCK').length;
  const pendingReferrals = referrals.filter((r) => r.status === 'CREATED' || r.status === 'ACCEPTED' || r.status === 'SENT' || r.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="District Overview"
        subtitle={`Immediate hospital capacity, referral transfers, and urgent priorities across ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'HealthConnect', to: '/' },
          { label: 'District Admin', to: '/district' },
          { label: 'Overview' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="gap-1.5 text-xs font-semibold"
              title="Refresh live telemetry"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-700' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Link to="/district/resource-intelligence">
              <Button size="sm" className="gap-1.5 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white">
                <Radar className="h-4 w-4" />
                <span>Resource Intelligence</span>
              </Button>
            </Link>
            <Link to="/district/alerts">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <AlertOctagon className="h-4 w-4 text-amber-600" />
                <span>Action Center</span>
                <span className="ml-1 rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] font-bold">
                  3
                </span>
              </Button>
            </Link>
            <Link to="/district/map">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <MapPin className="h-4 w-4 text-teal-700" />
                <span>Map View</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Welcome & Operational Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-teal-800 text-white p-5 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-200">
              District Health Operations
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-800/80 border border-teal-600 px-2 py-0.5 text-[10px] font-medium text-teal-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live Telemetry Connected
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {selectedDistrict} District Operations
          </h1>
          <p className="text-xs text-teal-100/90">
            Administrator: <strong>{user?.name || 'Chief District Health Officer (CDHO)'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <EmergencyButton />
        </div>
      </div>

      {/* 4 Focused Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Hospital Beds Available"
          value={`${totalBedsAvailable} / ${totalBeds}`}
          subtitle={`${totalIcuAvailable} ICU free across ${facilities.length} centres`}
          icon={Bed}
          colorScheme="teal"
        />
        <StatCard
          title="Active Referrals"
          value={pendingReferrals.toString()}
          subtitle="Patient transfers in progress"
          icon={GitBranch}
          colorScheme="blue"
        />
        <StatCard
          title="Critical Alerts"
          value="3 Items"
          subtitle={`${lowStockMedicines} low medicines · O- blood low`}
          icon={AlertOctagon}
          colorScheme="amber"
        />
        <StatCard
          title="Ambulances Ready"
          value={`${activeAmbulances} / ${ambulances.length}`}
          subtitle="Ready for immediate dispatch"
          icon={Ambulance}
          colorScheme="teal"
        />
      </div>

      {/* What Needs My Attention Today? (Immediate Action Section) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Needs Attention Today
            </h2>
          </div>
          <Link to="/district/alerts" className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1">
            <span>Open Action Center (3)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Priority 1: Referral Bed Assignment */}
          <Card className="p-4 border-amber-200 bg-amber-50/50 space-y-3 hover:border-amber-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-amber-700" />
                  Referral Awaiting Inpatient Bed
                </span>
                <PriorityBadge priority="HIGH" />
              </div>
              <p className="text-xs font-semibold text-slate-900">
                Pethapur PHC → Gandhinagar Civil Hospital
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Acute cardiac transfer dispatched 1.5h ago. Inpatient cardiology bed reservation pending confirmation.
              </p>
            </div>
            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-800">SLA: 2.5h left</span>
              <Link to="/district/referrals">
                <Button size="sm" variant="outline" className="h-7 text-xs font-semibold bg-white border-amber-300 hover:bg-amber-100/50 text-amber-900">
                  Assign Bed →
                </Button>
              </Link>
            </div>
          </Card>

          {/* Priority 2: Critical Medicine Threshold */}
          <Card className="p-4 border-rose-200 bg-rose-50/50 space-y-3 hover:border-rose-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-rose-700" />
                  Medicine Supply Depletion
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                  Low Stock
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                Paracetamol Infusion 100ml (Mansa CHC)
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Stock is at 25 units (Safety limit: 50 units). Expected to reach stockout in 48 hours without warehouse dispatch.
              </p>
            </div>
            <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-800">48h until stockout</span>
              <Link to="/district/medicines">
                <Button size="sm" variant="outline" className="h-7 text-xs font-semibold bg-white border-rose-300 hover:bg-rose-100/50 text-rose-900">
                  Reorder Stock →
                </Button>
              </Link>
            </div>
          </Card>

          {/* Priority 3: Vector Case Spike */}
          <Card className="p-4 border-slate-200 bg-slate-50/70 space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-700" />
                  Public Health Surveillance
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                  Watch Active
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                Vector-Borne Clustering (Sector 24)
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                42 cases reported this week vs baseline of 15. ASHA field fogging verification is in progress.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Flagged 18h ago</span>
              <Link to="/district/disease-trends">
                <Button size="sm" variant="outline" className="h-7 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-100 text-slate-800">
                  View Trends →
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Operational Split: Facilities Summary & In-Transit Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Facilities Summary (2 cols) */}
        <Card className="lg:col-span-2 border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Healthcare Facilities Readiness
              </CardTitle>
              <p className="text-xs text-slate-500">Operational readiness and bed capacity</p>
            </div>
            <Link to="/district/facilities" className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1">
              <span>View All Facilities ({facilities.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {facilities.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-xs">No healthcare facilities registered in {selectedDistrict} yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Hospitals and health centres added to this district will appear here in real time.</p>
                <Link to="/district/facilities" className="mt-3 inline-block">
                  <Button size="sm" variant="outline" className="text-xs">
                    Register Facility
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {facilities.slice(0, 3).map((facility) => {
                  const occupancyRate = Math.round(
                    ((facility.totalBeds - facility.availableBeds) / facility.totalBeds) * 100
                  );
                  return (
                    <div
                      key={facility.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/district/facilities/${facility.id}`}
                            className="font-bold text-slate-900 hover:text-teal-700 transition-colors"
                          >
                            {facility.name}
                          </Link>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {facility.type.replace(/_/g, ' ')}
                          </span>
                          {facility.emergencyAvailable && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              24x7 Casualty
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{facility.address}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 sm:text-right shrink-0">
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {facility.availableBeds} Free
                          </span>
                          <span className="text-[10px] text-slate-500">{occupancyRate}% occupied</span>
                        </div>

                        <div>
                          <span className="font-bold text-teal-800 block">
                            ~{facility.currentWaitTimeMinutes}m
                          </span>
                          <span className="text-[10px] text-slate-500">OPD Wait</span>
                        </div>

                        <Link to={`/district/facilities/${facility.id}`}>
                          <Button variant="outline" size="sm" className="text-xs h-8 px-2.5 font-semibold">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Referral Transfers (1 col) */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Active Referrals
              </CardTitle>
              <p className="text-xs text-slate-500">Live inter-facility patient transfers</p>
            </div>
            <Link to="/district/referrals" className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1">
              <span>All ({referrals.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {referrals.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <GitBranch className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-xs">No active transfers</p>
                <p className="text-[11px] text-slate-400 mt-1">Inter-facility patient transfers will display here.</p>
              </div>
            ) : (
              referrals.slice(0, 3).map((ref) => (
                <div key={ref.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{ref.referralCode}</span>
                    <PriorityBadge priority={ref.priority} />
                  </div>
                  <p className="font-semibold text-slate-800 line-clamp-1">{ref.reasonForReferral}</p>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pt-2 border-t border-slate-200">
                    <span className="truncate max-w-[150px]">{ref.fromFacilityName.split(' ')[0]} → {ref.toFacilityName.split(' ')[0]}</span>
                    <StatusBadge status={ref.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
