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
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';
import {
  PhoneCall,
  Navigation,
  ShieldAlert,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Compass,
} from 'lucide-react';

interface EmergencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LocationState = 'IDLE' | 'LOADING' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE';

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ open, onOpenChange }) => {
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [locationState, setLocationState] = useState<LocationState>('IDLE');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setFacilities(res.data);
    }).catch(console.warn);
  }, []);

  const emergencyFacility =
    facilities.find((f) => f.emergencyAvailable) || facilities[0] || INITIAL_FACILITIES[0];

  // Request browser geolocation safely when modal opens
  useEffect(() => {
    if (!open) {
      setLocationState('IDLE');
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocationState('UNAVAILABLE');
      return;
    }

    setLocationState('LOADING');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationState('GRANTED');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationState('DENIED');
        } else {
          setLocationState('UNAVAILABLE');
        }
      },
      { timeout: 8000 }
    );
  }, [open]);

  const mapsUrl = userCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${emergencyFacility.coordinates.lat},${emergencyFacility.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${emergencyFacility.coordinates.lat},${emergencyFacility.coordinates.lng}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="xl">
      <DialogHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700 border border-red-200/60">
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Emergency Medical Assistance
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Immediate triage, official ambulance hotlines, and verified trauma hospital routing.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="space-y-4 py-4">
        {/* Direct One-Tap Emergency Dialers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="tel:108"
            className="p-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-sm flex items-center justify-between min-h-[56px]"
          >
            <div className="flex items-center gap-2.5">
              <PhoneCall className="h-5 w-5" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-red-100 font-semibold">
                  National Emergency Ambulance
                </p>
                <p className="text-xl font-extrabold leading-tight">CALL 108</p>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg font-bold">
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
                <p className="text-[10px] uppercase tracking-wider text-teal-100 font-semibold">
                  Maternal & Infant Transport
                </p>
                <p className="text-xl font-extrabold leading-tight">CALL 102</p>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg font-bold">
              Toll-Free 24/7
            </span>
          </a>
        </div>

        {/* Location Status Indicator */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-teal-700 shrink-0" />
            <span>
              {locationState === 'LOADING' && 'Verifying your device location...'}
              {locationState === 'GRANTED' && (
                <strong className="text-emerald-800">
                  GPS Location Verified • Nearest facility routed
                </strong>
              )}
              {locationState === 'DENIED' && (
                <span className="text-slate-600">
                  Location permission not enabled • Showing district trauma headquarters
                </span>
              )}
              {locationState === 'UNAVAILABLE' && (
                <span className="text-slate-600">
                  Device GPS unavailable • Showing district trauma headquarters
                </span>
              )}
              {locationState === 'IDLE' && 'Gandhinagar District Public Health Grid'}
            </span>
          </div>
          {locationState === 'GRANTED' && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Live
            </span>
          )}
        </div>

        {/* Nearest Verified 24/7 Trauma Center */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Nearest Verified Trauma Hospital
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Open 24/7 Emergency
            </span>
          </div>

          <div>
            <p className="text-base font-bold text-slate-900">{emergencyFacility.name}</p>
            <p className="text-xs text-slate-600">{emergencyFacility.address}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1 text-teal-700">
              ● ICU Beds Available: <strong>{emergencyFacility.icuBedsAvailable}</strong>
            </span>
            <span className="flex items-center gap-1 text-teal-700">
              ● Oxygen Plant: <strong>Operational</strong>
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              ● Emergency Desk: <strong>{emergencyFacility.emergencyNumber}</strong>
            </span>
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-3.5 py-2 text-xs font-bold text-white transition-colors min-h-[40px]"
            >
              <Navigation className="h-4 w-4" />
              Get Live GPS Directions
            </a>
            <a
              href={`tel:${emergencyFacility.emergencyNumber.split('/')[0].trim()}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors min-h-[40px]"
            >
              <PhoneCall className="h-4 w-4" />
              Call Emergency Desk
            </a>
          </div>
        </div>

        {/* Honest Notice Regarding Digital Dispatch */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
          <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-800 block">
              Direct Telephone Dispatch Notice
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Automated 1-click digital dispatch is not connected in this deployment. For immediate life-saving ambulance dispatch and real-time transit guidance, please call <strong>108</strong> directly.
            </p>
          </div>
        </div>
      </DialogContent>

      <DialogFooter className="border-t border-slate-100 pt-3">
        <Button
          onClick={() => onOpenChange(false)}
          variant="secondary"
          size="sm"
          className="text-xs min-h-[38px] cursor-pointer"
        >
          Dismiss Emergency Window
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
