import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_FACILITIES, INITIAL_BLOOD_INVENTORY } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';
import {
  Bed,
  Droplet,
  Ambulance,
  Wind,
  CheckCircle2,
  RefreshCw,
  Send,
} from 'lucide-react';

export const DistrictResourcesPage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Transfer Form State
  const [resourceType, setResourceType] = useState('OXYGEN_CYLINDERS');
  const [fromFacility, setFromFacility] = useState(INITIAL_FACILITIES[0]?.id || '');
  const [toFacility, setToFacility] = useState(INITIAL_FACILITIES[1]?.id || '');
  const [quantity, setQuantity] = useState('10');
  const [transferReason, setTransferReason] = useState('Emergency backup replenishment');

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setFacilities(res.data);
        setFromFacility(res.data[0].id);
        if (res.data.length > 1) {
          setToFacility(res.data[1].id);
        }
      }
    }).catch(console.warn);
  }, []);

  // Summary Metrics
  const totalBeds = facilities.reduce((acc, f) => acc + (f.totalBeds || 0), 0);
  const availableBeds = facilities.reduce((acc, f) => acc + (f.availableBeds || 0), 0);
  const totalIcu = facilities.reduce((acc, f) => acc + (f.icuBedsAvailable || 0), 0);
  const totalBloodUnits = INITIAL_BLOOD_INVENTORY.totalUnits;

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const fromName = facilities.find((f) => f.id === fromFacility)?.name || 'Central Store';
    const toName = facilities.find((f) => f.id === toFacility)?.name || 'Destination Facility';

    setTransferSuccess(
      `Dispatched ${quantity} units of ${resourceType.replace(/_/g, ' ')} from ${fromName} to ${toName}. Dispatch order generated.`
    );
    setShowTransferModal(false);

    setTimeout(() => {
      setTransferSuccess(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Resource Planning"
        subtitle={`Monitor beds, oxygen, blood, and ambulance reserves across ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Resource Planning' },
        ]}
        actions={
          <Button
            onClick={() => setShowTransferModal(true)}
            size="sm"
            className="gap-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Send className="h-4 w-4" />
            <span>Rebalance Resources</span>
          </Button>
        }
      />

      {/* Success Banner */}
      {transferSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
          <p className="font-semibold">{transferSuccess}</p>
        </div>
      )}

      {/* 4 Primary Resource Pillars Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Bed Capacity Pillar */}
        <Card className="p-5 bg-white border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Beds</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Bed className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {availableBeds} <span className="text-xs font-normal text-slate-500">/ {totalBeds}</span>
            </p>
            <p className="text-xs text-teal-700 font-medium mt-0.5">Beds available right now</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>General Wards:</span>
              <strong className="text-slate-900">{availableBeds - totalIcu} free</strong>
            </div>
            <div className="flex justify-between">
              <span>ICU Ventilator Beds:</span>
              <strong className="text-rose-700">{totalIcu} free</strong>
            </div>
          </div>
        </Card>

        {/* 2. Medical Oxygen Pillar */}
        <Card className="p-5 bg-white border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medical Oxygen</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Wind className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              98.4% <span className="text-xs font-normal text-slate-500">grid purity</span>
            </p>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">PSA & LMO Plants Normal</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>D-Type Cylinders:</span>
              <strong className="text-slate-900">340 filled</strong>
            </div>
            <div className="flex justify-between">
              <span>Manifold Line Pressure:</span>
              <strong className="text-emerald-700">4.2 bar (Safe)</strong>
            </div>
          </div>
        </Card>

        {/* 3. Blood Reserves Pillar */}
        <Card className="p-5 bg-white border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Bank Grid</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Droplet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {totalBloodUnits} <span className="text-xs font-normal text-slate-500">units</span>
            </p>
            <p className="text-xs text-rose-700 font-medium mt-0.5">District reserves tested</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>O-Positive Buffer:</span>
              <strong className="text-slate-900">42 units</strong>
            </div>
            <div className="flex justify-between">
              <span>Rare Group (AB- / O-):</span>
              <strong className="text-amber-700">14 units (Watch)</strong>
            </div>
          </div>
        </Card>

        {/* 4. Ambulances Pillar */}
        <Card className="p-5 bg-white border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">108 Ambulances</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Ambulance className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              18 <span className="text-xs font-normal text-slate-500">/ 24 active</span>
            </p>
            <p className="text-xs text-amber-700 font-medium mt-0.5">6 on emergency runs</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Avg Emergency Response:</span>
              <strong className="text-slate-900">14.2 min</strong>
            </div>
            <div className="flex justify-between">
              <span>ALS Advanced Units:</span>
              <strong className="text-teal-800">8 vehicles</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Facility Breakdown Table */}
      <Card className="p-5 bg-white border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Facility Resource Distribution</h3>
            <p className="text-xs text-slate-500">Available beds, ICU ventilators, and oxygen status per facility</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Facility</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Available Beds</th>
                <th className="py-2.5 px-3">ICU Ventilators</th>
                <th className="py-2.5 px-3">Oxygen Supply</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facilities.map((fac) => {
                const occ = Math.round(((fac.totalBeds - fac.availableBeds) / (fac.totalBeds || 1)) * 100);
                return (
                  <tr key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{fac.name}</span>
                      <span className="text-[11px] text-slate-400">{fac.address}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {fac.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">
                        {fac.availableBeds} <span className="font-normal text-slate-500">/ {fac.totalBeds}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 block">{occ}% occupied</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-rose-700">{fac.icuBedsAvailable || 0}</span>
                      <span className="text-[10px] text-slate-400 block">units free</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                        Normal (4.2 bar)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFromFacility(facilities[0]?.id || 'fac_civil_01');
                          setToFacility(fac.id);
                          setShowTransferModal(true);
                        }}
                        className="text-xs font-semibold"
                      >
                        Rebalance
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transfer Resources Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl sm:max-w-3xl p-6 sm:p-8 bg-white border-slate-200 shadow-xl space-y-4 rounded-3xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
                <RefreshCw className="h-5 w-5" />
                <h3>Inter-Facility Resource Rebalancing</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Resource Item</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700"
                >
                  <option value="OXYGEN_CYLINDERS">D-Type Oxygen Cylinders (46.7L)</option>
                  <option value="BLOOD_UNITS_O_POS">Blood Units (O-Positive PRBC)</option>
                  <option value="PORTABLE_VENTILATORS">Transport / Emergency Ventilator</option>
                  <option value="AMBULANCE_REASSIGNMENT">Temporary 108 Ambulance Relocation</option>
                  <option value="ANTISNAKE_VENOM">Anti-Snake Venom (ASV) Vials</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Source Facility (From)</label>
                  <select
                    value={fromFacility}
                    onChange={(e) => setFromFacility(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Facility (To)</label>
                  <select
                    value={toFacility}
                    onChange={(e) => setToFacility(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Authorization Priority</label>
                  <select className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700">
                    <option>High Priority (Immediate Dispatch)</option>
                    <option>Routine Rebalancing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Operational Rationale</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:border-teal-700"
                  placeholder="e.g. Surge preparedness or low buffer warning"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  Authorize & Dispatch
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
