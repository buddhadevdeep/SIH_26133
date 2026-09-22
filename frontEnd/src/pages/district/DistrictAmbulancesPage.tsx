import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_AMBULANCES, INITIAL_FACILITIES } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { resourceApi } from '@/api/resourceApi';
import { Facility } from '@/types/facility';
import { Ambulance as AmbulanceType } from '@/types/resources';
import {
  Ambulance,
  Phone,
  Radio,
  Clock,
  CheckCircle2,
  Wrench,
  Search,
  Navigation,
} from 'lucide-react';

export const DistrictAmbulancesPage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [ambulances, setAmbulances] = useState<AmbulanceType[]>(INITIAL_AMBULANCES);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Form State
  const [patientLocation, setPatientLocation] = useState('Sector 7 Market, Gandhinagar');
  const [emergencySeverity, setEmergencySeverity] = useState('HIGH');
  const [destinationHospital, setDestinationHospital] = useState(INITIAL_FACILITIES[0]?.id || '');

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setFacilities(res.data);
        setDestinationHospital(res.data[0].id);
      }
    }).catch(console.warn);

    resourceApi.getAmbulances().then((res) => {
      if (res.data && res.data.length > 0) {
        setAmbulances(res.data);
      }
    }).catch(console.warn);
  }, []);

  // Filter ambulances
  const filteredAmbulances = ambulances.filter((amb) => {
    const matchesSearch =
      amb.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amb.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amb.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || amb.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || amb.type === typeFilter;
    const matchesFacility = facilityFilter === 'ALL' || amb.facilityId === facilityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesFacility;
  });

  const totalAmbulances = ambulances.length;
  const availableCount = ambulances.filter((a) => a.status === 'AVAILABLE').length;
  const inTransitCount = ambulances.filter((a) => a.status === 'IN_TRANSIT').length;
  const maintenanceCount = ambulances.filter((a) => a.status === 'MAINTENANCE').length;

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchSuccess(
      `Ambulance GJ-18-GA-1081 (ALS) dispatched to "${patientLocation}". ETA 8 minutes. Nearest receiving facility notified.`
    );
    setShowDispatchModal(false);

    setTimeout(() => {
      setDispatchSuccess(null);
    }, 6000);
  };

  const getStatusBadge = (status: AmbulanceType['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Available
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            On Mission
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            Maintenance
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="District 108 Ambulance Fleet"
        subtitle={`Track emergency ambulance locations, readiness status, and fleet dispatch across ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Ambulances' },
        ]}
        actions={
          <Button
            onClick={() => setShowDispatchModal(true)}
            size="sm"
            className="gap-2 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white"
          >
            <Radio className="h-4 w-4" />
            <span>Emergency Fleet Dispatch</span>
          </Button>
        }
      />

      {/* Success Notification */}
      {dispatchSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
          <p className="font-semibold">{dispatchSuccess}</p>
        </div>
      )}

      {/* 3 Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total 108 Fleet</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Ambulance className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalAmbulances} units</p>
          <span className="text-[11px] text-teal-700 font-medium">GVK EMRI Gujarat network</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available Ready</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{availableCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Ready for immediate dispatch</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Missions</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Navigation className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{inTransitCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">{maintenanceCount} vehicle in maintenance</span>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-white border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vehicle number, base facility, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold shadow-2xs focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Ambulance Types</option>
              <option value="ADVANCED_LIFE_SUPPORT">Advanced Life Support (ALS)</option>
              <option value="BASIC_LIFE_SUPPORT">Basic Life Support (BLS)</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {['ALL', 'AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Units' : st === 'IN_TRANSIT' ? 'On Mission' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </Card>

      {/* Ambulances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAmbulances.map((amb) => (
          <Card
            key={amb.id}
            className="p-5 bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {amb.vehicleNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        amb.type === 'ADVANCED_LIFE_SUPPORT' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {amb.type === 'ADVANCED_LIFE_SUPPORT' ? 'ALS' : 'BLS'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {amb.type === 'ADVANCED_LIFE_SUPPORT' ? 'Advanced Life Support (ICU on wheels)' : 'Basic Life Support'}
                  </span>
                </div>

                {getStatusBadge(amb.status)}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">Base Station:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[170px]">
                    {amb.facilityName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">Assigned Driver:</span>
                  <span className="font-semibold text-slate-800">{amb.driverName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">Emergency Contact:</span>
                  <a href={`tel:${amb.driverPhone}`} className="font-bold text-teal-700 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{amb.driverPhone}</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Avg Response: <strong>14 min</strong>
              </span>

              {amb.status === 'AVAILABLE' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDispatchModal(true)}
                  className="text-xs font-semibold text-teal-700 border-teal-200 hover:bg-teal-50"
                >
                  Dispatch
                </Button>
              ) : (
                <span className="text-[11px] font-medium text-amber-700">En Route</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl sm:max-w-3xl p-6 sm:p-8 bg-white border-slate-200 shadow-xl space-y-4 rounded-3xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                <Ambulance className="h-5 w-5" />
                <h3>Emergency Ambulance Dispatch</h3>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Incident Location</label>
                <input
                  type="text"
                  value={patientLocation}
                  onChange={(e) => setPatientLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:border-rose-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clinical Severity</label>
                  <select
                    value={emergencySeverity}
                    onChange={(e) => setEmergencySeverity(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-rose-600"
                  >
                    <option value="CRITICAL">Critical (Cardiac/Trauma)</option>
                    <option value="HIGH">High (Maternal/Pediatric)</option>
                    <option value="MODERATE">Moderate (Medical Transfer)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Required Unit</label>
                  <select className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-rose-600">
                    <option>Closest ALS Unit</option>
                    <option>Closest BLS Unit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Destination Hospital</label>
                <select
                  value={destinationHospital}
                  onChange={(e) => setDestinationHospital(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-rose-600"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.availableBeds} beds free)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDispatchModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-rose-700 hover:bg-rose-800 text-white font-semibold"
                >
                  Dispatch Ambulance Now
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
