import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { resourceApi } from '@/api/resourceApi';
import {
  BedSummary,
  BloodInventory,
  Ambulance,
  EquipmentItem,
} from '@/types/resources';
import {
  BedDouble,
  Droplet,
  Truck,
  Activity,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
  Phone,
} from 'lucide-react';

export const ResourceOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BEDS' | 'BLOOD' | 'AMBULANCES' | 'EQUIPMENT'>('BEDS');
  const [bedSummary, setBedSummary] = useState<BedSummary | null>(null);
  const [bloodInventory, setBloodInventory] = useState<BloodInventory | null>(null);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [updatingBed, setUpdatingBed] = useState<string | null>(null);

  const loadAllResources = async () => {
    try {
      setLoading(true);
      const [bedsRes, bloodRes, ambRes, eqRes] = await Promise.all([
        resourceApi.getBedSummary('fac_civil_01'),
        resourceApi.getBloodInventory('fac_civil_01'),
        resourceApi.getAmbulances('fac_civil_01'),
        resourceApi.getEquipment('fac_civil_01'),
      ]);
      if (bedsRes.data) setBedSummary(bedsRes.data);
      if (bloodRes.data) setBloodInventory(bloodRes.data);
      if (ambRes.data) setAmbulances(ambRes.data);
      if (eqRes.data) setEquipment(eqRes.data);
    } catch (err) {
      console.error('Failed to load operational resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllResources();
  }, []);

  const handleAdjustBed = async (category: string, delta: number) => {
    if (!bedSummary) return;
    const cat = bedSummary.categories.find((c) => c.type === category);
    if (!cat) return;

    const newAvail = Math.max(0, Math.min(cat.total, cat.available + delta));
    try {
      setUpdatingBed(category);
      await resourceApi.updateBedStatus('fac_civil_01', category, newAvail);
      setBedSummary((prev) => {
        if (!prev) return prev;
        const newCategories = prev.categories.map((c) =>
          c.type === category
            ? { ...c, available: newAvail, occupied: c.total - newAvail, lastUpdated: new Date().toISOString() }
            : c
        );
        const totalAvail = newCategories.reduce((sum, c) => sum + c.available, 0);
        const icuCat = newCategories.find((c) => c.type === 'ICU');
        return {
          ...prev,
          categories: newCategories,
          totalAvailable: totalAvail,
          totalOccupied: prev.totalBeds - totalAvail,
          icuAvailable: icuCat ? icuCat.available : prev.icuAvailable,
          lastUpdated: new Date().toISOString(),
        };
      });
      setToastMsg(`Bed availability updated for ${category} ward.`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update bed count:', err);
    } finally {
      setUpdatingBed(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 text-teal-700 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading Facility Resources & Live Inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-3.5 text-xs font-semibold text-teal-900 flex items-center justify-between animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-teal-700 font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Capacity Freshness Console
            </span>
            <span className="text-xs text-slate-400">Gandhinagar Civil Hospital</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Facility Resources & Live Capacity</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage bed allocations, monitor blood bank units, ambulance fleet telemetry, and critical biomedical machines.
          </p>
        </div>

        <Button
          onClick={loadAllResources}
          variant="outline"
          className="self-start sm:self-center border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-2 min-h-[40px] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
          Synchronize Resources
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('BEDS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'BEDS'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BedDouble className="h-4 w-4" />
          Inpatient Beds & Wards ({bedSummary?.totalAvailable || 0} Avail)
        </button>

        <button
          onClick={() => setActiveTab('BLOOD')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'BLOOD'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Droplet className="h-4 w-4 text-rose-500" />
          Blood Bank Reserves ({bloodInventory?.totalUnits || 0} Units)
        </button>

        <button
          onClick={() => setActiveTab('AMBULANCES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'AMBULANCES'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Truck className="h-4 w-4" />
          108 Ambulance Fleet ({ambulances.filter((a) => a.status === 'AVAILABLE').length} Ready)
        </button>

        <button
          onClick={() => setActiveTab('EQUIPMENT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'EQUIPMENT'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Activity className="h-4 w-4" />
          Biomedical Life Support ({equipment.length} Units)
        </button>
      </div>

      {/* TAB 1: BEDS */}
      {activeTab === 'BEDS' && (
        <div className="space-y-4">
          {/* Bed Summary Card */}
          <div className="rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-200 uppercase tracking-wider block">
                Total Hospital Inpatient Occupancy
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black">{bedSummary?.totalOccupied || 0}</span>
                <span className="text-slate-300 text-sm">/ {bedSummary?.totalBeds || 0} beds occupied</span>
                <span className="text-emerald-400 font-bold text-xs ml-2">
                  ({bedSummary?.totalAvailable || 0} Available)
                </span>
              </div>
              <p className="text-xs text-teal-100/70 mt-1">
                Freshness Contract: Last telemetry broadcast {new Date(bedSummary?.lastUpdated || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Synchronized with EMRI-108
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-teal-800/80 p-3 rounded-xl border border-teal-700/50 text-center min-w-[100px]">
                <span className="text-[10px] font-bold uppercase text-teal-200 block">Critical ICU</span>
                <span className="text-2xl font-black text-white">{bedSummary?.icuAvailable || 0}</span>
                <span className="text-[10px] text-teal-300 block">Available</span>
              </div>

              <div className="bg-teal-800/80 p-3 rounded-xl border border-teal-700/50 text-center min-w-[100px]">
                <span className="text-[10px] font-bold uppercase text-teal-200 block">Emergency</span>
                <span className="text-2xl font-black text-white">{bedSummary?.emergencyAvailable || 0}</span>
                <span className="text-[10px] text-teal-300 block">Available</span>
              </div>
            </div>
          </div>

          {/* Wards Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bedSummary?.categories.map((cat) => {
              const pct = Math.round((cat.occupied / cat.total) * 100);
              const isFull = cat.available === 0;

              return (
                <Card key={cat.type} className="p-4 border-slate-200 bg-white hover:shadow-xs transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{cat.type} WARD</h3>
                        <span className="text-[11px] text-slate-400">Total Capacity: {cat.total} beds</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          isFull
                            ? 'bg-rose-100 text-rose-800'
                            : pct > 80
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {pct}% FULL
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? 'bg-rose-600' : pct > 80 ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Occupied</span>
                        <span className="text-slate-800 font-black text-base">{cat.occupied}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Available</span>
                        <span className="text-emerald-700 font-black text-base">{cat.available}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ward Fast Adjust Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Updated {new Date(cat.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustBed(cat.type, -1)}
                        disabled={cat.available <= 0 || updatingBed === cat.type}
                        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
                        title="Decrement available bed (Admit)"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded">
                        {cat.available}
                      </span>

                      <button
                        onClick={() => handleAdjustBed(cat.type, 1)}
                        disabled={cat.available >= cat.total || updatingBed === cat.type}
                        className="h-8 w-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
                        title="Increment available bed (Discharge)"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BLOOD BANK */}
      {activeTab === 'BLOOD' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">District Blood Centre Inventory</h2>
              <p className="text-xs text-slate-500">
                Packed Red Blood Cells (PRBC) reserves • Buffer threshold: 5 units per blood group.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Total Units: <strong className="text-slate-900">{bloodInventory?.totalUnits || 0}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bloodInventory?.stock.map((item) => {
              const isCritical = item.status === 'CRITICAL' || item.unitsAvailable < 3;
              const isLow = item.status === 'LOW';

              return (
                <Card
                  key={item.bloodGroup}
                  className={`p-4 border transition-all ${
                    isCritical
                      ? 'border-rose-300 bg-rose-50/30'
                      : isLow
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-slate-900 font-mono">{item.bloodGroup}</span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800'
                          : isLow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{item.unitsAvailable}</span>
                      <span className="text-xs text-slate-500">PRBC Units</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Min Threshold: {item.minimumThreshold} units
                    </span>
                  </div>

                  {item.expiringIn7Days > 0 && (
                    <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                      {item.expiringIn7Days} units expiring in 7 days
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AMBULANCES */}
      {activeTab === 'AMBULANCES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">EMRI 108 Emergency Fleet Status</h2>
              <p className="text-xs text-slate-500">
                Gandhinagar sector base ambulances with driver and paramedic crew assignments.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Active Fleet: <strong className="text-slate-900">{ambulances.length} vehicles</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambulances.map((amb) => {
              const isAvail = amb.status === 'AVAILABLE';
              const isTransit = amb.status === 'IN_TRANSIT';
              const isOnCall = amb.status === 'ON_CALL';

              return (
                <Card key={amb.id} className="p-4 border border-slate-200 bg-white hover:shadow-xs transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {amb.vehicleNumber}
                      </span>
                      <p className="text-xs font-bold text-slate-700 mt-1">{amb.type.replace(/_/g, ' ')}</p>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isAvail
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isTransit
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : isOnCall
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {amb.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Driver:</span>
                      <span className="font-bold text-slate-800">{amb.driverName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="font-medium text-teal-700 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {amb.driverPhone}
                      </span>
                    </div>
                    {amb.currentLocationName && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Location:</span>
                        <span className="font-semibold text-slate-800">{amb.currentLocationName}</span>
                      </div>
                    )}
                    {amb.assignedPatientName && (
                      <div className="text-[11px] text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200 mt-2">
                        Assigned Patient: <strong>{amb.assignedPatientName}</strong>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BIOMEDICAL EQUIPMENT */}
      {activeTab === 'EQUIPMENT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Critical Biomedical Life Support Systems</h2>
              <p className="text-xs text-slate-500">
                Medical equipment operating uptime, calibration cycles, and maintenance schedules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((eq) => {
              const isOp = eq.status === 'OPERATIONAL';
              const isMaint = eq.status === 'MAINTENANCE';

              return (
                <Card key={eq.id} className="p-4 border border-slate-200 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{eq.name}</h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Dept: {eq.department} • Model: {eq.model}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                        isOp
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isMaint
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Operational</span>
                      <span className="font-bold text-slate-800">
                        {eq.operationalQuantity} / {eq.quantity} units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Next Servicing</span>
                      <span className="font-semibold text-slate-700">{eq.nextServiceDate}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};