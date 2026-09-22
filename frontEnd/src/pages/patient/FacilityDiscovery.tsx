import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapView } from '@/components/map/MapView';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';
import { useLocationContext } from '@/contexts/LocationContext';
import { Link } from 'react-router-dom';

import {
  Search,
  MapPin,
  Building2,
  Stethoscope,
  Bed,
  Clock,
  Phone,
  Map as MapIcon,
  List,
  ShieldCheck,
  SlidersHorizontal,
  X,
  ChevronDown,
  Navigation,
  Crosshair,
  Loader2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Ticket,
  Radio,
} from 'lucide-react';

import { geocodeLocationQuery } from '@/services/geocodingService';
import { LocationPickerMap } from '@/components/map/LocationPickerMap';

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const FacilityDiscovery: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const {
    userCoords,
    selectedDistrict: ctxDistrict,
    detectGpsLocation,
    setExactCustomLocation,
    setUserCoords,
    isLiveTracking,
    toggleLiveTracking,
    gpsAccuracy,
  } = useLocationContext();

  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');

  const [openOnly, setOpenOnly] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [bedsOnly, setBedsOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [selectedMaxDistance, setSelectedMaxDistance] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('DISTANCE');
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [showNearestOnlyOnMap, setShowNearestOnlyOnMap] = useState(false);
  const [nearestHospitalInfo, setNearestHospitalInfo] = useState<{ facility: Facility; distanceKm: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // GPS & Custom Locality state
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);
  const [patientLocInput, setPatientLocInput] = useState('');
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [showPatientMapPin, setShowPatientMapPin] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // Load facilities from backend API on mount
  useEffect(() => {
    facilityApi
      .getAll()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setFacilities(res.data);
        }
      })
      .catch(console.warn);
  }, []);

  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    setGpsStatusMsg(null);
    try {
      const result = await detectGpsLocation();
      setGpsStatusMsg(result.message);
      setLocationLabel('Live Device GPS');
      setSortBy('DISTANCE');
    } catch {
      setGpsStatusMsg('Unable to retrieve GPS coordinates.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSearchPatientLocality = async (customQuery?: string) => {
    const q = customQuery || patientLocInput;
    if (!q.trim()) return;

    setIsSearchingLoc(true);
    try {
      const res = await geocodeLocationQuery(q);
      if (res) {
        setExactCustomLocation(res.lat, res.lng, res.displayName);
        setLocationLabel(res.displayName);
        setGpsStatusMsg(`📍 Location set: ${res.displayName}`);
        setSortBy('DISTANCE');
        setPatientLocInput('');
      }
    } catch (err) {
      console.warn('Locality search error:', err);
    } finally {
      setIsSearchingLoc(false);
    }
  };

  const handleClearGps = () => {
    setUserCoords(null);
    setGpsStatusMsg(null);
    setLocationLabel(null);
    setSelectedMaxDistance(null);
    setShowNearestOnlyOnMap(false);
    setShowPatientMapPin(false);
  };

  /* =====================================================
     CALCULATE DYNAMIC DISTANCES FROM USER LOCATION
  ====================================================== */
  const facilitiesWithDistances = useMemo(() => {
    return facilities.map((facility) => {
      if (userCoords && facility.coordinates) {
        const dist = calculateDistance(
          userCoords.lat,
          userCoords.lng,
          facility.coordinates.lat,
          facility.coordinates.lng
        );
        return { ...facility, distanceKm: dist };
      }
      return facility;
    });
  }, [facilities, userCoords]);

  /* =====================================================
     FACILITY TYPE LABEL
  ====================================================== */
  const getFacilityType = (type: string) => {
    switch (type) {
      case 'DISTRICT_HOSPITAL':
        return t('facilities.districtHospital', 'District Hospital');
      case 'SUB_DISTRICT_HOSPITAL':
        return t('facilities.subDistrictHospital', 'Sub-District Hospital');
      case 'CHC':
        return t('facilities.chc', 'Community Health Centre');
      case 'PHC':
        return t('facilities.phc', 'Primary Health Centre');
      default:
        return t('facilities.hospital', 'Hospital');
    }
  };

  /* =====================================================
     DYNAMIC DISTRICTS
  ====================================================== */
  const districts = useMemo(() => {
    return Array.from(
      new Set(
        facilitiesWithDistances
          .map((facility) => facility.district)
          .filter(Boolean)
      )
    ).sort();
  }, [facilitiesWithDistances]);

  /* =====================================================
     DYNAMIC SPECIALTIES
  ====================================================== */
  const specialties = useMemo(() => {
    return Array.from(
      new Set(
        facilitiesWithDistances.flatMap(
          (facility) => facility.specialties || []
        )
      )
    ).sort();
  }, [facilitiesWithDistances]);

  /* =====================================================
     FILTER + SORT
  ====================================================== */
  const filteredFacilities = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();

    const filtered = facilitiesWithDistances.filter((facility) => {
      /* -------------------------
         SEARCH
      -------------------------- */
      const matchesSearch =
        !search ||
        facility.name.toLowerCase().includes(search) ||
        facility.district.toLowerCase().includes(search) ||
        facility.address.toLowerCase().includes(search) ||
        (facility.specialties || []).some((specialty) =>
          specialty.toLowerCase().includes(search)
        );

      /* -------------------------
         TYPE
      -------------------------- */
      const matchesType =
        selectedType === 'ALL' ||
        facility.type === selectedType;

      /* -------------------------
         DISTRICT
      -------------------------- */
      const matchesDistrict =
        selectedDistrict === 'ALL' ||
        facility.district === selectedDistrict;

      /* -------------------------
         SPECIALTY
      -------------------------- */
      const matchesSpecialty =
        selectedSpecialty === 'ALL' ||
        (facility.specialties || []).includes(selectedSpecialty);

      /* -------------------------
         DISTANCE RADIUS
      -------------------------- */
      const matchesDistance =
        selectedMaxDistance === null ||
        (facility.distanceKm !== undefined && facility.distanceKm <= selectedMaxDistance);

      /* -------------------------
         OPEN
      -------------------------- */
      const matchesOpen =
        !openOnly || facility.isOpen;

      /* -------------------------
         EMERGENCY
      -------------------------- */
      const matchesEmergency =
        !emergencyOnly || facility.emergencyAvailable;

      /* -------------------------
         BEDS
      -------------------------- */
      const matchesBeds =
        !bedsOnly || facility.availableBeds > 0;

      /* -------------------------
         VERIFIED
      -------------------------- */
      const matchesVerified =
        !verifiedOnly || facility.isVerified;

      return (
        matchesSearch &&
        matchesType &&
        matchesDistrict &&
        matchesSpecialty &&
        matchesDistance &&
        matchesOpen &&
        matchesEmergency &&
        matchesBeds &&
        matchesVerified
      );
    });

    /* =====================================================
       SORT RESULTS
    ====================================================== */
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'DISTANCE':
          return (
            (a.distanceKm ?? Infinity) -
            (b.distanceKm ?? Infinity)
          );

        case 'WAITING':
          return (
            (a.currentWaitTimeMinutes ?? Infinity) -
            (b.currentWaitTimeMinutes ?? Infinity)
          );

        case 'BEDS':
          return (
            (b.availableBeds ?? 0) -
            (a.availableBeds ?? 0)
          );

        case 'NAME':
          return a.name.localeCompare(b.name);

        default:
          return 0;
      }
    });
  }, [
    facilitiesWithDistances,
    searchQuery,
    selectedType,
    selectedDistrict,
    selectedSpecialty,
    selectedMaxDistance,
    openOnly,
    emergencyOnly,
    bedsOnly,
    verifiedOnly,
    sortBy,
  ]);

  /* =====================================================
     ACTIVE FILTER COUNT
  ====================================================== */
  const activeFilterCount =
    (selectedType !== 'ALL' ? 1 : 0) +
    (selectedDistrict !== 'ALL' ? 1 : 0) +
    (selectedSpecialty !== 'ALL' ? 1 : 0) +
    (selectedMaxDistance !== null ? 1 : 0) +
    (openOnly ? 1 : 0) +
    (emergencyOnly ? 1 : 0) +
    (bedsOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  /* =====================================================
     CLEAR ALL FILTERS
  ====================================================== */
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedDistrict('ALL');
    setSelectedSpecialty('ALL');
    setSelectedMaxDistance(null);
    setOpenOnly(false);
    setEmergencyOnly(false);
    setBedsOnly(false);
    setVerifiedOnly(false);
    setSortBy('DISTANCE');
  };

  return (
    <div className="space-y-4">
      {/* =====================================================
          1. BREADCRUMBS & PAGE TITLE
      ====================================================== */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <Link to="/patient" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-medium">Hospitals</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Find a Hospital
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Find nearest public hospitals, CHCs, and PHCs with live distances and GPS navigation.
            </p>
          </div>

          {/* Location Quick Fix Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {userCoords ? (
              <Button
                type="button"
                size="sm"
                onClick={handleDetectGps}
                disabled={isDetectingGps}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 rounded-xl cursor-pointer shadow-xs"
              >
                <Navigation className={`h-3.5 w-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingGps ? 'Fixing GPS...' : '📍 Refresh Live Location'}</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleDetectGps}
                disabled={isDetectingGps}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 rounded-xl cursor-pointer shadow-xs animate-pulse"
              >
                <Navigation className={`h-3.5 w-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingGps ? 'Detecting Location...' : '📍 Use My Live Location (GPS)'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          1.5. PATIENT GPS LIVE LOCATION BANNER & RADIUS FILTERS
      ====================================================== */}
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/90 via-sky-50/80 to-emerald-50/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {userCoords
                    ? `📍 Your Current Coordinates: ${userCoords.lat.toFixed(4)}°N, ${userCoords.lng.toFixed(4)}°E`
                    : '📍 Patient Live Location'}
                </span>
                {isLiveTracking ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 text-[10px] font-extrabold animate-pulse">
                    <Radio className="h-3 w-3 text-emerald-600 animate-ping" />
                    LIVE GPS STREAM ACTIVE
                  </span>
                ) : userCoords ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    GPS Fixed {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                    Location not fixed yet
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {userCoords
                  ? 'Distances to all public hospitals are computed in real-time using Haversine GPS formula.'
                  : 'Click "Use My Live Location" to sort hospitals nearest first and view exact KM distance.'}
              </p>
            </div>
          </div>

          {/* Live Tracking, Pin Map, and Clear buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowPatientMapPin(!showPatientMapPin)}
              className="h-8 text-xs font-bold gap-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-300 rounded-xl cursor-pointer shadow-2xs"
            >
              <MapIcon className="h-3.5 w-3.5 text-teal-700" />
              <span>{showPatientMapPin ? 'Hide Map Pin' : '🗺️ Pin My Location'}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleLiveTracking}
              className={`h-8 text-xs font-bold gap-1.5 rounded-xl cursor-pointer shadow-2xs ${
                isLiveTracking
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${isLiveTracking ? 'animate-pulse text-white' : 'text-slate-500'}`} />
              <span>{isLiveTracking ? 'Tracking Live GPS' : '🛰️ Live Stream'}</span>
            </Button>

            {userCoords && (
              <button
                type="button"
                onClick={handleClearGps}
                className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
                title="Clear GPS Location"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Locality / Area Search Bar for Patient */}
        <div className="p-3 bg-white/90 rounded-xl border border-teal-100 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="relative flex-1 w-full">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-700" />
              <input
                type="text"
                placeholder="Or type your exact area/town (e.g. Kalol, Sector 21 Gandhinagar, Sola, Vastrapur, Mansa, Sanand)..."
                value={patientLocInput}
                onChange={(e) => setPatientLocInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchPatientLocality();
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSearchPatientLocality()}
              disabled={isSearchingLoc || !patientLocInput.trim()}
              className="h-8 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white px-3 rounded-lg cursor-pointer shrink-0 w-full sm:w-auto"
            >
              {isSearchingLoc ? 'Matching...' : 'Set Location'}
            </Button>
          </div>

          {/* Quick Locality Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-500">Quick Locations:</span>
            {['Gandhinagar Sector 12', 'Kalol', 'Mansa', 'Pethapur', 'Sola Ahmedabad', 'Asarwa Civil', 'Sanand', 'Kudasan', 'Vastrapur'].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handleSearchPatientLocality(loc)}
                className="text-[10px] font-semibold bg-slate-100 hover:bg-teal-100 hover:text-teal-900 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors border border-slate-200/60"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Location Picker Map for Patient */}
        {showPatientMapPin && (
          <div className="p-3 bg-white rounded-xl border border-teal-200 space-y-2">
            <LocationPickerMap
              lat={userCoords?.lat || 23.2156}
              lng={userCoords?.lng || 72.6369}
              onChangeLocation={(newLat, newLng) => {
                setExactCustomLocation(newLat, newLng);
                setLocationLabel(`Pin: [${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E]`);
                setGpsStatusMsg(`📍 Location pin placed at [${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E]`);
                setSortBy('DISTANCE');
              }}
              title="Click or drag pin to your exact current location/home"
              markerLabel="Your Current Location Pin"
              height="200px"
            />
          </div>
        )}

        {/* Distance Range Filter Chips */}
        <div className="pt-2 border-t border-teal-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
            <MapPin className="h-3 w-3 text-teal-700" /> Distance Radius:
          </span>
          {[
            { label: 'All Distances', value: null },
            { label: '< 5 km', value: 5 },
            { label: '< 10 km', value: 10 },
            { label: '< 25 km', value: 25 },
            { label: '< 50 km', value: 50 },
          ].map((item) => {
            const isSelected = selectedMaxDistance === item.value;
            return (
              <button
                type="button"
                key={item.label}
                onClick={() => setSelectedMaxDistance(item.value)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-teal-50 hover:border-teal-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================
          2. VIEW TOGGLE (LIST / MAP) & FILTERS BUTTON
      ====================================================== */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Toggle Pill */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setViewMode('LIST');
              setShowNearestOnlyOnMap(false);
            }}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'LIST'
                ? 'bg-[#1e40af] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('MAP');
              setShowNearestOnlyOnMap(false);
            }}
            className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'MAP'
                ? 'bg-[#1e40af] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map
          </button>
        </div>

        {/* Filters Toggle Button */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-700 px-1 text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
              showFilters ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* =====================================================
          3. FULL-WIDTH SEARCH BAR
      ====================================================== */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by hospital name, city, or specialty..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-full hover:bg-slate-100"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* =====================================================
          FILTER PANEL (COLLAPSIBLE)
      ====================================================== */}
      {showFilters && (
        <Card className="border-slate-200 shadow-sm animate-in fade-in-50 duration-150 rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* TYPE */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                  Hospital Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-500 shadow-2xs transition-colors cursor-pointer font-medium"
                >
                  <option value="ALL">All Hospitals</option>
                  <option value="DISTRICT_HOSPITAL">District Hospital</option>
                  <option value="SUB_DISTRICT_HOSPITAL">Sub-District Hospital</option>
                  <option value="CHC">Community Health Centre</option>
                  <option value="PHC">Primary Health Centre</option>
                </select>
              </div>

              {/* DISTRICT */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-500 shadow-2xs transition-colors cursor-pointer font-medium"
                >
                  <option value="ALL">All Districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              {/* SPECIALTY */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                  Specialty / Department
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-500 shadow-2xs transition-colors cursor-pointer font-medium"
                >
                  <option value="ALL">All Specialties</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* SORT */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-600">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-500 shadow-2xs transition-colors cursor-pointer font-medium"
                >
                  <option value="DISTANCE">Nearest First</option>
                  <option value="WAITING">Lowest Waiting Time</option>
                  <option value="BEDS">Most Beds Available</option>
                  <option value="NAME">Hospital Name</option>
                </select>
              </div>
            </div>

            {/* QUICK TOGGLE CHIPS */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOpenOnly(!openOnly)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    openOnly
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Open Now
                </button>
                <button
                  type="button"
                  onClick={() => setEmergencyOnly(!emergencyOnly)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    emergencyOnly
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Emergency Available
                </button>
                <button
                  type="button"
                  onClick={() => setBedsOnly(!bedsOnly)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    bedsOnly
                      ? 'bg-sky-50 text-sky-800 border-sky-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Beds Available
                </button>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          MAP VIEW
      ====================================================== */}
      {viewMode === 'MAP' && (
        <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl">
          <MapView
            facilities={filteredFacilities}
            userLocation={userCoords}
            showNearestOnly={showNearestOnlyOnMap}
            isLiveTracking={isLiveTracking}
            gpsAccuracy={gpsAccuracy}
            onNearestFound={(fac, dist) => setNearestHospitalInfo({ facility: fac, distanceKm: dist })}
            className="h-[560px]"
          />
        </Card>
      )}

      {/* =====================================================
          4. RESULTS SECTION HEADING
      ====================================================== */}
      {viewMode === 'LIST' && (
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Hospitals near you
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredFacilities.length} {filteredFacilities.length === 1 ? 'hospital found' : 'hospitals found'}
          </p>
        </div>
      )}

      {/* =====================================================
          5. HOSPITAL LIST (Exact layout matching reference)
      ====================================================== */}
      {viewMode === 'LIST' && filteredFacilities.length > 0 && (
        <div className="space-y-3">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                {/* Left Section: Icon + Details */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100/80">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Title + Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-[15px] leading-snug">
                        {facility.name}
                      </h3>
                      {facility.isVerified && (
                        <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600" />
                      )}
                      {facility.isOpen ? (
                        <span className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
                          Open Now
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                          Closed
                        </span>
                      )}
                      {facility.emergencyAvailable && (
                        <span className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-600">
                          Emergency 24/7
                        </span>
                      )}
                    </div>

                    {/* Facility Type • District (Distance) */}
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 font-normal flex-wrap">
                      <span className="font-semibold text-slate-700">{getFacilityType(facility.type)}</span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="h-3 w-3 text-sky-600 shrink-0" />
                        {facility.district}
                      </span>
                      {facility.distanceKm !== undefined && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                            <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                            {facility.distanceKm} km away (~{Math.max(2, Math.round(facility.distanceKm * 2.2))} min)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section: Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                  {facility.coordinates && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${facility.coordinates.lat},${facility.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                      title="Navigate to hospital in Google Maps"
                    >
                      <button
                        type="button"
                        className="h-9 px-3 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold shadow-2xs cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Navigation className="h-3.5 w-3.5 text-teal-700" />
                        <span>Directions</span>
                      </button>
                    </a>
                  )}

                  <Link
                    to={`/patient/facilities/${facility.id}`}
                    className="inline-block"
                  >
                    <button
                      type="button"
                      className="h-9 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
                    >
                      Get Details
                    </button>
                  </Link>

                  <Link
                    to={`/patient/tokens?facilityId=${facility.id}`}
                    className="inline-block"
                  >
                    <button
                      type="button"
                      className="h-9 px-4 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-2xs cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      Token
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          NO RESULTS EMPTY STATE
      ====================================================== */}
      {viewMode === 'LIST' && filteredFacilities.length === 0 && (
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search className="h-6 w-6" />
            </div>

            <h3 className="mt-3.5 text-sm font-bold text-slate-800">
              No hospitals found
            </h3>

            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              No public healthcare centers match your current search and filter criteria.
            </p>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs font-semibold cursor-pointer rounded-xl"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          6. BOTTOM CALLOUT BOX (Exact match)
      ====================================================== */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 flex items-start gap-3 mt-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 mt-0.5">
          <MapPin className="h-3.5 w-3.5" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-sky-950">
            {t('facilities.helpTitle', 'Looking for a hospital nearby?')}
          </h4>
          <p className="text-xs text-sky-800/80 mt-0.5">
            {t('facilities.helpSubtitle', 'Search by hospital, district, service or use the filters above.')}
          </p>
        </div>
      </div>
    </div>
  );
};
