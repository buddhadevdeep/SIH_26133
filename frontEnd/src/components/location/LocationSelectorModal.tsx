import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import {
  useLocationContext,
  GUJARAT_DISTRICTS,
  AVAILABLE_HOSPITALS,
  LocationFacility,
} from '@/contexts/LocationContext';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Building2,
  Bed,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export const LocationSelectorModal: React.FC = () => {
  const {
    selectedDistrict,
    selectedFacility,
    isLocationModalOpen,
    closeLocationModal,
    setLocation,
    detectGpsLocation,
  } = useLocationContext();

  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Staged selection for preview before confirm
  const [stagedHospital, setStagedHospital] = useState<LocationFacility | null>(null);

  // Filter hospitals based on district chip and search query
  const filteredHospitals = AVAILABLE_HOSPITALS.filter((hospital) => {
    const matchesDistrict = filterDistrict === 'ALL' || hospital.district === filterDistrict;
    const matchesSearch =
      searchQuery.trim() === '' ||
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  const handleSelectCard = (hospital: LocationFacility) => {
    setStagedHospital(hospital);
  };

  const handleConfirm = () => {
    if (stagedHospital) {
      setLocation(stagedHospital.district, stagedHospital.name, stagedHospital.id);
    }
    closeLocationModal();
  };

  const handleGpsDetect = async () => {
    setIsDetectingGps(true);
    setGpsMessage(null);
    try {
      const result = await detectGpsLocation();
      if (result.success) {
        setGpsMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          closeLocationModal();
        }, 1200);
      } else {
        setGpsMessage({ type: 'error', text: result.message });
      }
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Find currently active or staged
  const activeHospitalName = stagedHospital?.name || selectedFacility;

  return (
    <Dialog open={isLocationModalOpen} onOpenChange={(open) => !open && closeLocationModal()} maxWidth="3xl">
      <div className="flex flex-col max-h-[85vh] -m-6 overflow-hidden bg-white rounded-2xl">
        {/* Modern Clean Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-white">
          <div className="flex items-start gap-3.5 pr-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Change Healthcare Location
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-100">
                  Gujarat Grid
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Select your district and default health facility for appointments, bed tracking, and queues.
              </p>
            </div>
          </div>

          {/* Quick GPS Auto-Detect Deck */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleGpsDetect}
              disabled={isDetectingGps}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Navigation className={`h-3.5 w-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
              <span>{isDetectingGps ? 'Detecting Location...' : 'Auto-Detect via GPS'}</span>
            </button>

            <div className="flex items-center justify-center sm:justify-end gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-slate-500 text-[11px]">
                Active: <strong className="text-slate-900">{selectedDistrict}</strong>{' '}
                <span className="text-slate-400">({selectedFacility.split('&')[0].trim()})</span>
              </span>
            </div>
          </div>

          {gpsMessage && (
            <div
              className={`mt-2.5 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in-50 ${
                gpsMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {gpsMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{gpsMessage.text}</span>
            </div>
          )}
        </div>

        {/* Search & District Horizontal Chips */}
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search hospital name, city, or block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-slate-900 placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* District Pills with Hidden Scrollbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setFilterDistrict('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                filterDistrict === 'ALL'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              All Districts ({AVAILABLE_HOSPITALS.length})
            </button>
            {GUJARAT_DISTRICTS.map((district) => (
              <button
                type="button"
                key={district}
                onClick={() => setFilterDistrict(district)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  filterDistrict === district
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {district}
              </button>
            ))}
          </div>
        </div>

        {/* Hospital Cards List */}
        <div className="p-4 sm:p-6 space-y-2.5 overflow-y-auto flex-1">
          {filteredHospitals.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Building2 className="h-9 w-9 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No hospitals match your search</p>
              <p className="text-slate-400 mt-1">Try typing a different keyword or selecting "All Districts".</p>
            </div>
          ) : (
            filteredHospitals.map((hospital) => {
              const isSelected = stagedHospital
                ? stagedHospital.id === hospital.id
                : selectedFacility === hospital.name ||
                  (selectedDistrict === hospital.district &&
                    selectedFacility.includes(hospital.name.split(' ')[0]));

              return (
                <div
                  key={hospital.id}
                  onClick={() => handleSelectCard(hospital)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                        {hospital.name}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-100">
                        {hospital.typeBadge}
                      </span>
                      {hospital.emergency24x7 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          24×7 Casualty
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{hospital.address}</span>
                    </p>

                    <div className="flex items-center gap-3 pt-0.5 text-[11px]">
                      {hospital.availableBeds !== undefined && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" />
                          <span>{hospital.availableBeds} Available Beds</span>
                        </span>
                      )}
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-medium">District: {hospital.district}</span>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div className="shrink-0 pt-0.5">
                    {isSelected ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white shadow-2xs">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-teal-400 transition-colors" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Polished Clean Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-[11px] text-slate-600 truncate">
            <span className="text-slate-400 font-medium">Selected Facility: </span>
            <strong className="text-slate-900 font-semibold">{activeHospitalName}</strong>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeLocationModal}
              className="text-xs font-semibold cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="text-xs font-semibold cursor-pointer bg-teal-700 hover:bg-teal-800 text-white shadow-xs gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Confirm Location</span>
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
