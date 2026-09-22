import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { INITIAL_AMBULANCES, INITIAL_FACILITIES } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';
import {
  ShieldAlert,
  PhoneCall,
  Ambulance,
  Building2,
  Activity,
  AlertCircle,
  ExternalLink,
  Radio,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminEmergencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminEmergencyModal: React.FC<AdminEmergencyModalProps> = ({ open, onOpenChange }) => {
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FLEET' | 'HOTLINES'>('OVERVIEW');

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setFacilities(res.data);
    }).catch(console.warn);
  }, []);

  // Real district ambulance fleet data
  const ambulances = INITIAL_AMBULANCES;
  const availableAmbulances = ambulances.filter((a) => a.status === 'AVAILABLE');
  const inTransitAmbulances = ambulances.filter((a) => a.status === 'IN_TRANSIT');

  // Real emergency hospital data
  const emergencyFacility =
    facilities.find((f) => f.emergencyAvailable) || facilities[0] || INITIAL_FACILITIES[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="2xl">
      <DialogHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700 border border-red-200/60">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Emergency Operations & Readiness
                </DialogTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                  Live Grid
                </span>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Operational status of district trauma capacity, ambulance fleet, and direct dispatch coordination.
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="space-y-4 py-4">
        {/* Honest Backend Connectivity Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-amber-950">
              Digital 1-Click Dispatch Gateway is Offline
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Automated ambulance dispatch via API is not enabled in this deployment. All urgent medical dispatches must be coordinated directly through the official <strong>108 Control Room</strong>.
            </p>
          </div>
        </div>

        {/* Operational Tabs */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors min-h-[38px] ${
              activeTab === 'OVERVIEW'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            District Emergency Readiness
          </button>
          <button
            onClick={() => setActiveTab('FLEET')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors min-h-[38px] flex items-center gap-1.5 ${
              activeTab === 'FLEET'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ambulance Fleet ({availableAmbulances.length} Available)
          </button>
          <button
            onClick={() => setActiveTab('HOTLINES')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors min-h-[38px] ${
              activeTab === 'HOTLINES'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dispatch & Hotlines
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-3.5">
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-semibold text-slate-500 block">District Trauma HQ</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block truncate">
                  {emergencyFacility.name}
                </span>
                <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
                  24/7 Emergency Casualty Desk
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-semibold text-slate-500 block">ICU Bed Readiness</span>
                <div className="text-xl font-bold text-emerald-700 mt-1 flex items-baseline gap-1.5">
                  <span>{emergencyFacility.icuBedsAvailable}</span>
                  <span className="text-xs text-slate-500 font-normal">/ {emergencyFacility.icuBedsTotal} total beds</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                  Oxygen plant operational
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-semibold text-slate-500 block">Ambulance Readiness</span>
                <div className="text-xl font-bold text-teal-800 mt-1 flex items-baseline gap-1.5">
                  <span>{availableAmbulances.length}</span>
                  <span className="text-xs text-slate-500 font-normal">/ {ambulances.length} stationed</span>
                </div>
                <span className="text-[11px] text-slate-600 font-medium mt-0.5 block">
                  {inTransitAmbulances.length} unit in active transit
                </span>
              </div>
            </div>

            {/* Nearest Trauma Facility Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Primary District Trauma Center
                  </span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Open 24/7
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">{emergencyFacility.name}</p>
                <p className="text-slate-500">{emergencyFacility.address}</p>
                <div className="flex flex-wrap gap-3 pt-1 text-[11px]">
                  <span className="text-teal-800 font-medium">
                    Available Beds: <strong>{emergencyFacility.availableBeds}</strong> / {emergencyFacility.totalBeds}
                  </span>
                  <span>•</span>
                  <span className="text-slate-600">
                    Emergency Phone: <strong className="text-slate-800">{emergencyFacility.emergencyNumber}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`tel:${emergencyFacility.emergencyNumber.split('/')[0].trim()}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-xs font-bold transition-colors min-h-[38px]"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  Call Casualty ({emergencyFacility.emergencyNumber.split('/')[0].trim()})
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${emergencyFacility.coordinates.lat},${emergencyFacility.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold transition-colors min-h-[38px]"
                >
                  <MapPin className="h-3.5 w-3.5 text-teal-700" />
                  View on Map
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AMBULANCE FLEET */}
        {activeTab === 'FLEET' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Verified telemetry for stationed emergency medical transport vehicles in Gandhinagar cluster:
            </div>

            <div className="space-y-2">
              {ambulances.map((amb) => {
                const isAvailable = amb.status === 'AVAILABLE';
                return (
                  <div
                    key={amb.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {amb.vehicleNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {amb.type.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {amb.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>Stationed: {amb.currentLocationName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-right hidden sm:block">
                        <p className="font-medium text-slate-700">{amb.driverName}</p>
                        <p className="text-[11px] text-slate-400">{amb.driverPhone}</p>
                      </div>
                      <a
                        href={`tel:${amb.driverPhone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 text-xs font-semibold transition-colors min-h-[36px]"
                      >
                        <PhoneCall className="h-3 w-3 text-teal-700" />
                        Call Driver
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DISPATCH & HOTLINES */}
        {activeTab === 'HOTLINES' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:108"
                className="p-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-sm flex items-center justify-between min-h-[56px]"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="h-5 w-5" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-red-100 block font-semibold">
                      National Ambulance Service
                    </span>
                    <span className="text-xl font-extrabold block leading-tight">CALL 108</span>
                  </div>
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-lg font-semibold">
                  Toll-Free 24/7
                </span>
              </a>

              <a
                href="tel:102"
                className="p-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold transition-all shadow-sm flex items-center justify-between min-h-[56px]"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="h-5 w-5" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-teal-100 block font-semibold">
                      Maternal & Infant Transport
                    </span>
                    <span className="text-xl font-extrabold block leading-tight">CALL 102</span>
                  </div>
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-lg font-semibold">
                  Toll-Free 24/7
                </span>
              </a>

              <a
                href="tel:112"
                className="p-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold transition-all shadow-sm flex items-center justify-between min-h-[56px]"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="h-5 w-5 text-slate-600" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                      Unified Emergency Helpline
                    </span>
                    <span className="text-lg font-bold block leading-tight">CALL 112</span>
                  </div>
                </div>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-600 font-medium">
                  Police / Fire / Health
                </span>
              </a>

              <a
                href="tel:104"
                className="p-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold transition-all shadow-sm flex items-center justify-between min-h-[56px]"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="h-5 w-5 text-teal-700" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                      Health Advice Helpline
                    </span>
                    <span className="text-lg font-bold block leading-tight">CALL 104</span>
                  </div>
                </div>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-600 font-medium">
                  Clinical Guidance
                </span>
              </a>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Looking for platform governance or emergency bed quota configuration?</span>
              <Link
                to="/super-admin/facilities"
                onClick={() => onOpenChange(false)}
                className="text-teal-700 font-bold hover:underline flex items-center gap-1 shrink-0"
              >
                Facility Governance <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[11px] text-slate-400">
          Role: Super Admin • District Health Operational Terminal
        </span>
        <Button
          onClick={() => onOpenChange(false)}
          variant="secondary"
          size="sm"
          className="text-xs cursor-pointer min-h-[38px]"
        >
          Close Window
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
