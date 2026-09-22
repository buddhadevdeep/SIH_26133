import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { useLocationContext } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { mockState } from '@/mock/db';
import { Facility } from '@/types/facility';
import { facilityApi } from '@/api/facilityApi';
import {
  Building2,
  Search,
  Bed,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  Activity,
  Map,
  Plus,
  CheckCircle2,
  Eye,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  Navigation,
} from 'lucide-react';

const COMMON_SPECIALTIES = [
  'General Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'General Surgery',
  'Orthopedics',
  'Cardiology',
  'Emergency & Trauma',
  'Ophthalmology',
  'Dental',
  'AYUSH',
  'Pathology & Lab',
];

export const GUJARAT_COORDINATE_PRESETS = [
  { name: 'Gandhinagar Sector 12 (Apex Civil)', district: 'Gandhinagar', lat: 23.2156, lng: 72.6369 },
  { name: 'Kalol Sub-District Hospital', district: 'Gandhinagar', lat: 23.2435, lng: 72.4965 },
  { name: 'Mansa Community Health Centre', district: 'Gandhinagar', lat: 23.4283, lng: 72.6611 },
  { name: 'Pethapur Primary Health Centre', district: 'Gandhinagar', lat: 23.2750, lng: 72.6580 },
  { name: 'Dehgam Community Health Centre', district: 'Gandhinagar', lat: 23.1670, lng: 72.8120 },
  { name: 'Ahmedabad Asarwa Civil Hospital', district: 'Ahmedabad', lat: 23.0525, lng: 72.5950 },
  { name: 'Ahmedabad Sola GMERS Hospital', district: 'Ahmedabad', lat: 23.0805, lng: 72.5245 },
  { name: 'Ahmedabad LG Municipal Hospital', district: 'Ahmedabad', lat: 22.9985, lng: 72.6025 },
  { name: 'Ahmedabad Sanand CHC', district: 'Ahmedabad', lat: 22.9868, lng: 72.3812 },
  { name: 'Surat New Civil Hospital (Majura)', district: 'Surat', lat: 21.1702, lng: 72.8311 },
  { name: 'Surat SMIMER Hospital', district: 'Surat', lat: 21.1960, lng: 72.8420 },
  { name: 'Vadodara SSG Hospital', district: 'Vadodara', lat: 22.3072, lng: 73.1812 },
  { name: 'Rajkot PDU Civil Hospital', district: 'Rajkot', lat: 22.3039, lng: 70.8022 },
  { name: 'Bhavnagar Sir T Civil Hospital', district: 'Bhavnagar', lat: 21.7645, lng: 72.1519 },
  { name: 'Jamnagar GG Hospital', district: 'Jamnagar', lat: 22.4707, lng: 70.0577 },
  { name: 'Junagadh Civil Hospital', district: 'Junagadh', lat: 21.5222, lng: 70.4579 },
];

import { geocodeLocationQuery, resolveHospitalLocation, GUJARAT_DISTRICT_CENTERS } from '@/services/geocodingService';
import { LocationPickerMap } from '@/components/map/LocationPickerMap';

export const DistrictFacilitiesPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedDistrict } = useLocationContext();
  const [facilitiesList, setFacilitiesList] = useState<Facility[]>(() => {
    return mockState?.facilities?.length ? mockState.facilities : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [onlyAvailableBeds, setOnlyAvailableBeds] = useState(false);

  // Fetch facilities from live MongoDB backend
  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setFacilitiesList(res.data);
      }
    }).catch((err) => {
      console.warn('Live facilities fetch failed, using local cache:', err);
    });
  }, [selectedDistrict]);

  // Modals & Feedback
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingFacility, setDeletingFacility] = useState<Facility | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inspectFacility, setInspectFacility] = useState<Facility | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State (used for Add and Edit)
  const [facName, setFacName] = useState('');
  const [clerkUsername, setClerkUsername] = useState('');
  const [clerkPassword, setClerkPassword] = useState('Clerk@123');
  const [facType, setFacType] = useState<Facility['type']>('CHC');
  const [blockName, setBlockName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('382010');
  const [facLat, setFacLat] = useState('23.2156');
  const [facLng, setFacLng] = useState('72.6369');
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isAutoGeocoding, setIsAutoGeocoding] = useState(false);
  const [geocodeMatchMsg, setGeocodeMatchMsg] = useState<string | null>(null);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('108');
  const [totalBeds, setTotalBeds] = useState('50');
  const [availableBeds, setAvailableBeds] = useState('20');
  const [icuBedsTotal, setIcuBedsTotal] = useState('6');
  const [icuBedsAvailable, setIcuBedsAvailable] = useState('2');
  const [emergencyAvailable, setEmergencyAvailable] = useState(true);
  const [oxygenAvailable, setOxygenAvailable] = useState(true);
  const [bloodBankAvailable, setBloodBankAvailable] = useState(false);
  const [ambulanceAvailable, setAmbulanceAvailable] = useState(true);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    'General Medicine',
    'Emergency & Trauma',
  ]);

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleAutoGeocodeAddress = async (customQuery?: string) => {
    const q = customQuery || `${address} ${facName} ${pincode} ${selectedDistrict}`;
    if (!q.trim()) return;

    setIsAutoGeocoding(true);
    setGeocodeMatchMsg(null);
    try {
      const res = await geocodeLocationQuery(q, selectedDistrict);
      if (res) {
        setFacLat(res.lat.toFixed(6));
        setFacLng(res.lng.toFixed(6));
        setGeocodeMatchMsg(`🎯 Matched Location: ${res.displayName}`);
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      setIsAutoGeocoding(false);
    }
  };

  const handleDetectGpsForFacility = async () => {
    setIsLocatingGps(true);
    setGeocodeMatchMsg('🛰️ Resolving location...');
    try {
      const res = await resolveHospitalLocation({
        address,
        facilityName: facName,
        district: selectedDistrict,
        pincode,
      });
      setFacLat(res.lat.toFixed(6));
      setFacLng(res.lng.toFixed(6));
      setGeocodeMatchMsg(res.message);
    } catch (err: any) {
      console.warn('Location resolution fallback error:', err);
      const districtCentroid = GUJARAT_DISTRICT_CENTERS[selectedDistrict] || GUJARAT_DISTRICT_CENTERS['Gandhinagar'];
      setFacLat(districtCentroid.lat.toFixed(6));
      setFacLng(districtCentroid.lng.toFixed(6));
      setGeocodeMatchMsg(`📌 Set to ${selectedDistrict} District Hub [${districtCentroid.lat.toFixed(4)}°N, ${districtCentroid.lng.toFixed(4)}°E]`);
    } finally {
      setIsLocatingGps(false);
    }
  };

  const handleOpenAddModal = () => {
    const districtCentroid = GUJARAT_DISTRICT_CENTERS[selectedDistrict] || GUJARAT_DISTRICT_CENTERS['Gandhinagar'];
    setFacLat(districtCentroid.lat.toFixed(6));
    setFacLng(districtCentroid.lng.toFixed(6));
    setGeocodeMatchMsg(`📌 Location initialized to ${selectedDistrict} District Center`);
    setShowAddModal(true);
  };

  const handleApplyCoordinatePreset = (presetName: string) => {
    const matched = GUJARAT_COORDINATE_PRESETS.find((p) => p.name === presetName);
    if (matched) {
      setFacLat(matched.lat.toFixed(6));
      setFacLng(matched.lng.toFixed(6));
      setGeocodeMatchMsg(`📌 Selected Preset: ${matched.name}`);
    }
  };

  // Open Edit Modal with pre-filled facility data
  const handleOpenEdit = (fac: Facility) => {
    setEditingFacility(fac);
    setFacName(fac.name || '');
    setFacType(fac.type || 'CHC');
    setAddress(fac.address || '');
    setPincode(fac.pincode || '382010');
    setFacLat(String(fac.coordinates?.lat ?? 23.2156));
    setFacLng(String(fac.coordinates?.lng ?? 72.6369));
    setContactPhone(fac.contactNumber || '');
    setEmergencyPhone(fac.emergencyNumber || '108');
    setTotalBeds(String(fac.totalBeds || 50));
    setAvailableBeds(String(fac.availableBeds || 20));
    setIcuBedsTotal(String(fac.icuBedsTotal || 6));
    setIcuBedsAvailable(String(fac.icuBedsAvailable || 2));
    setEmergencyAvailable(fac.emergencyAvailable ?? true);
    setOxygenAvailable(fac.oxygenAvailable ?? true);
    setBloodBankAvailable(fac.bloodBankAvailable ?? false);
    setAmbulanceAvailable(fac.ambulanceAvailable ?? true);
    setSelectedSpecialties(fac.specialties?.length ? fac.specialties : ['General Medicine']);
    setShowEditModal(true);
  };

  // Submit Edit Facility
  const handleEditFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility || !facName.trim()) return;

    setIsSaving(true);
    const tBeds = parseInt(totalBeds, 10) || 30;
    const aBeds = Math.min(parseInt(availableBeds, 10) || 10, tBeds);
    const icuTotal = parseInt(icuBedsTotal, 10) || 4;
    const icuAvail = Math.min(parseInt(icuBedsAvailable, 10) || 2, icuTotal);
    const latNum = parseFloat(facLat) || 23.2156;
    const lngNum = parseFloat(facLng) || 72.6369;

    const updatedData: Partial<Facility> = {
      name: facName.trim(),
      type: facType,
      address: address.trim(),
      pincode: pincode.trim(),
      coordinates: { lat: latNum, lng: lngNum },
      contactNumber: contactPhone.trim(),
      emergencyNumber: emergencyPhone.trim(),
      totalBeds: tBeds,
      availableBeds: aBeds,
      icuBedsTotal: icuTotal,
      icuBedsAvailable: icuAvail,
      emergencyAvailable,
      oxygenAvailable,
      bloodBankAvailable,
      ambulanceAvailable,
      specialties: selectedSpecialties.length > 0 ? selectedSpecialties : ['General Medicine'],
      lastUpdated: new Date().toISOString(),
    };

    try {
      const res = await facilityApi.update(editingFacility.id, updatedData);
      const updated = res.data || { ...editingFacility, ...updatedData };
      setFacilitiesList((prev) =>
        prev.map((f) => (f.id === editingFacility.id ? { ...f, ...updated } : f))
      );
      setShowEditModal(false);
      setEditingFacility(null);
      setSuccessToast(`Successfully updated details & exact location coordinates for ${updated.name}.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      // Fallback local update
      setFacilitiesList((prev) =>
        prev.map((f) => (f.id === editingFacility.id ? { ...f, ...updatedData } : f))
      );
      setShowEditModal(false);
      setEditingFacility(null);
      setSuccessToast(`Updated ${facName.trim()} locally.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Open Delete Confirmation Dialog
  const handleOpenDelete = (fac: Facility) => {
    setDeletingFacility(fac);
    setShowDeleteDialog(true);
  };

  // Confirm Delete Facility
  const handleDeleteFacilityConfirm = async () => {
    if (!deletingFacility) return;

    setIsDeleting(true);
    try {
      await facilityApi.delete(deletingFacility.id);
    } catch (err) {
      console.warn('Backend delete fallback:', err);
    }

    setFacilitiesList((prev) => prev.filter((f) => f.id !== deletingFacility.id));
    setShowDeleteDialog(false);
    setSuccessToast(`Government facility ${deletingFacility.name} was removed from the district network.`);
    setDeletingFacility(null);
    setIsDeleting(false);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Submit Add Facility
  const handleAddFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim()) {
      alert('Hospital / Facility Name is compulsory.');
      return;
    }

    const trimmedUsername = clerkUsername.trim();
    const trimmedPassword = clerkPassword.trim();

    if (!trimmedUsername) {
      alert('Registration Counter Clerk Username / ID is strictly COMPULSORY. You must provide a login username for the counter desk.');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 4) {
      alert('Registration Counter Clerk Password is strictly COMPULSORY (minimum 4 characters). You must provide a password for the counter desk.');
      return;
    }

    setIsSaving(true);
    const tBeds = parseInt(totalBeds, 10) || 30;
    const aBeds = Math.min(parseInt(availableBeds, 10) || 10, tBeds);
    const icuTotal = parseInt(icuBedsTotal, 10) || 4;
    const icuAvail = Math.min(parseInt(icuBedsAvailable, 10) || 2, icuTotal);
    const latNum = parseFloat(facLat) || 23.2156;
    const lngNum = parseFloat(facLng) || 72.6369;

    const newFacData: any = {
      name: facName.trim(),
      username: trimmedUsername,
      password: trimmedPassword,
      type: facType,
      district: selectedDistrict,
      districtId: (user as any)?.districtId || undefined,
      state: 'Gujarat',
      address: address.trim() || `${blockName ? blockName + ' Block, ' : ''}${selectedDistrict}`,
      pincode: pincode.trim() || '382000',
      coordinates: { lat: latNum, lng: lngNum },
      contactNumber: contactPhone.trim() || '+91 79 2320 0000',
      emergencyNumber: emergencyPhone.trim() || '108',
      totalBeds: tBeds,
      availableBeds: aBeds,
      icuBedsTotal: icuTotal,
      icuBedsAvailable: icuAvail,
      emergencyAvailable,
      oxygenAvailable,
      bloodBankAvailable,
      ambulanceAvailable,
      isOpen: true,
      isVerified: true,
      currentWaitTimeMinutes: 15,
      departments: selectedSpecialties.map((spec, idx) => ({
        id: `d_${idx}`,
        name: spec,
        code: spec.slice(0, 3).toUpperCase(),
        activeDoctors: 2,
        currentWaitMinutes: 15,
        opdOpen: true,
      })),
      specialties: selectedSpecialties.length > 0 ? selectedSpecialties : ['General Medicine'],
      equipment: [],
      lastUpdated: new Date().toISOString(),
    };

    let created: Facility;
    try {
      const res = await facilityApi.create(newFacData);
      if (res?.data) {
        created = res.data;
      } else {
        throw new Error('No data returned');
      }
    } catch {
      if (mockState && typeof mockState.addFacility === 'function') {
        created = mockState.addFacility(newFacData);
      } else {
        created = {
          ...newFacData,
          id: `fac_${Date.now()}`,
        } as Facility;
      }
    }

    if (mockState && typeof mockState.addFacility === 'function') {
      try { mockState.addFacility(created); } catch {}
    }

    setFacilitiesList((prev) => [created, ...prev.filter((f) => f.id !== created.id)]);
    setShowAddModal(false);
    setIsSaving(false);

    // Reset Form
    setFacName('');
    setClerkUsername('');
    setClerkPassword('');
    setBlockName('');
    setAddress('');
    setContactPhone('');
    setFacLat('23.2156');
    setFacLng('72.6369');

    // Feedback
    setSuccessToast(`Successfully registered ${created.name} into ${selectedDistrict} District. Counter Clerk Login Username: "${trimmedUsername}" | Password: "${trimmedPassword}"`);
    setTimeout(() => setSuccessToast(null), 10000);
  };

  // Filter facilities based on search, type, and availability
  const facilities = facilitiesList.filter((f) => {
    const matchesDistrict = !selectedDistrict || selectedDistrict === 'ALL' || f.district === selectedDistrict;
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || f.type === typeFilter;
    const matchesBeds = !onlyAvailableBeds || f.availableBeds > 0;

    return matchesDistrict && matchesSearch && matchesType && matchesBeds;
  });

  // Calculate high-level KPIs
  const totalFacilities = facilities.length;
  const totalBedsCount = facilities.reduce((acc, f) => acc + f.totalBeds, 0);
  const availableBedsCount = facilities.reduce((acc, f) => acc + f.availableBeds, 0);
  const totalIcuFree = facilities.reduce((acc, f) => acc + (f.icuBedsAvailable || 0), 0);
  const emergencyReady = facilities.filter((f) => f.emergencyAvailable).length;

  const facilityTypeLabels: Record<string, string> = {
    ALL: 'All Facilities',
    DISTRICT_HOSPITAL: 'District Hospitals',
    CHC: 'Community Health Centres (CHC)',
    PHC: 'Primary Health Centres (PHC)',
    SUB_DISTRICT_HOSPITAL: 'Sub-District Hospitals',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Healthcare Facilities"
        subtitle={`Manage government hospitals, CHCs, and PHCs across ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Facilities' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/district/map">
              <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold">
                <Map className="h-4 w-4 text-teal-700" />
                <span>View Map</span>
              </Button>
            </Link>
            <Button
              onClick={handleOpenAddModal}
              size="sm"
              className="gap-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Facility / Hospital</span>
            </Button>
          </div>
        }
      />

      {/* Success Banner */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3 Clear Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Facilities</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalFacilities}</p>
          <span className="text-[11px] text-teal-700 font-medium">Hospitals & health centres in {selectedDistrict}</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available Beds</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Bed className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {availableBedsCount} <span className="text-xs font-normal text-slate-500">/ {totalBedsCount}</span>
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">
            {totalIcuFree} ICU beds free district-wide
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Emergency & Casualty</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{emergencyReady}</p>
          <span className="text-[11px] text-rose-700 font-medium">
            24/7 trauma & casualty units active
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by facility name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 self-start sm:self-center">
            <input
              type="checkbox"
              checked={onlyAvailableBeds}
              onChange={(e) => setOnlyAvailableBeds(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
            />
            <span>Show only facilities with free beds</span>
          </label>
        </div>

        {/* Facility Type Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {Object.entries(facilityTypeLabels).map(([typeKey, label]) => (
            <button
              key={typeKey}
              onClick={() => setTypeFilter(typeKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === typeKey
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Facilities Grid */}
      {facilities.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No facilities match your filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or resetting the facility type filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('ALL');
              setOnlyAvailableBeds(false);
            }}
            className="mt-4 text-xs font-semibold"
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map((fac) => {
            const occupancyRate =
              fac.totalBeds > 0
                ? Math.round(((fac.totalBeds - fac.availableBeds) / fac.totalBeds) * 100)
                : 0;

            const isHighOccupancy = occupancyRate >= 90;
            const isMediumOccupancy = occupancyRate >= 75 && occupancyRate < 90;

            return (
              <Card
                key={fac.id}
                className="p-5 bg-white border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top: Name, Badge, Type */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
                          {fac.type.replace(/_/g, ' ')}
                        </span>
                        {fac.emergencyAvailable && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                            24/7 Casualty
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{fac.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{fac.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bed Occupancy Bar */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <Bed className="h-3.5 w-3.5 text-slate-400" />
                        Bed Occupancy
                      </span>
                      <span className="font-bold text-slate-900">
                        {fac.availableBeds} Free{' '}
                        <span
                          className={`text-[11px] font-semibold ${
                            isHighOccupancy
                              ? 'text-rose-600'
                              : isMediumOccupancy
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          ({occupancyRate}% full)
                        </span>
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isHighOccupancy
                            ? 'bg-rose-500'
                            : isMediumOccupancy
                            ? 'bg-amber-500'
                            : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>{fac.totalBeds} total beds</span>
                      <span className="font-semibold text-teal-800">
                        {fac.icuBedsAvailable || 0} ICU Free
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    OPD Wait: <strong className="text-slate-800">~{fac.currentWaitTimeMinutes}m</strong>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInspectFacility(fac)}
                      className="gap-1 text-xs font-semibold text-slate-700 cursor-pointer h-8 px-2.5"
                      title="Quick View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(fac)}
                      className="gap-1 text-xs font-semibold text-slate-700 hover:text-teal-800 hover:border-teal-300 cursor-pointer h-8 px-2.5"
                      title="Edit Hospital Details"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDelete(fac)}
                      className="gap-1 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 cursor-pointer h-8 px-2.5"
                      title="Delete Hospital"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>

                    <Link to={`/district/facilities/${fac.id}`}>
                      <Button size="sm" className="gap-1 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white cursor-pointer h-8 px-3">
                        <span>Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ADD GOVERNMENT FACILITY MODAL */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal} maxWidth="2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-700" />
              <span>Add Government Healthcare Facility</span>
            </DialogTitle>
            <DialogDescription>
              Register a new public hospital, CHC, or PHC under {selectedDistrict} District Health Authority.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFacilitySubmit}>
            <DialogContent className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
              {/* Row 1: Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Facility / Hospital Name *</label>
                  <Input
                    required
                    placeholder="e.g. Sub-District Hospital Kalol"
                    value={facName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFacName(val);
                      if (!clerkUsername || clerkUsername.startsWith('clerk_')) {
                        setClerkUsername(val.trim() ? `clerk_${val.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '');
                      }
                    }}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Facility Category *</label>
                  <select
                    value={facType}
                    onChange={(e) => setFacType(e.target.value as Facility['type'])}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                  >
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                    <option value="SUB_DISTRICT_HOSPITAL">Sub-District Hospital</option>
                    <option value="CHC">Community Health Centre (CHC)</option>
                    <option value="PHC">Primary Health Centre (PHC)</option>
                    <option value="MEDICAL_COLLEGE">Medical College Hospital</option>
                    <option value="SPECIALTY_HOSPITAL">Specialty Supercare Centre</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Full Physical Address *</label>
                    <button
                      type="button"
                      onClick={() => handleAutoGeocodeAddress()}
                      disabled={isAutoGeocoding || !address.trim()}
                      className="text-[10px] font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1"
                    >
                      <Search className="h-2.5 w-2.5" />
                      <span>{isAutoGeocoding ? 'Matching...' : 'Auto-Match Address GPS'}</span>
                    </button>
                  </div>
                  <Input
                    required
                    placeholder="e.g. Near Bus Station, Sector 12, Gandhinagar"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                    }}
                    onBlur={() => {
                      if (address.trim() && !facLat) handleAutoGeocodeAddress();
                    }}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Pincode</label>
                  <Input
                    placeholder="382010"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    onBlur={() => {
                      if (pincode.trim().length === 6) handleAutoGeocodeAddress(`${pincode} ${address}`);
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Row 2.5: Exact Geo-Coordinates & Location Pin */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50/90 to-sky-50/90 rounded-xl border border-teal-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <MapPin className="h-4 w-4 text-teal-700 shrink-0" />
                    <span>Exact Geo-Location Coordinates (for Patient Distance & Directions)</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowInteractiveMap(!showInteractiveMap)}
                      className="h-7 text-[11px] font-bold gap-1 bg-white border-teal-300 text-teal-800 hover:bg-teal-50 cursor-pointer shadow-2xs px-2"
                    >
                      <Map className="h-3 w-3 text-teal-700" />
                      <span>{showInteractiveMap ? 'Hide Map' : '🗺️ Pin on Map'}</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleDetectGpsForFacility}
                      disabled={isLocatingGps}
                      className="h-7 text-[11px] font-bold gap-1 bg-white border-teal-300 text-teal-800 hover:bg-teal-50 cursor-pointer shadow-2xs px-2"
                      title="Auto-detect via GPS or hospital address / district center"
                    >
                      <Navigation className={`h-3 w-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
                      <span>{isLocatingGps ? 'Locating...' : '📍 Auto-Locate / GPS'}</span>
                    </Button>
                  </div>
                </div>

                {geocodeMatchMsg && (
                  <div className="p-2 rounded-lg bg-white border border-teal-200 text-[11px] font-semibold text-teal-900 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{geocodeMatchMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Latitude (°N) *</label>
                    <Input
                      required
                      type="number"
                      step="any"
                      placeholder="23.2156"
                      value={facLat}
                      onChange={(e) => setFacLat(e.target.value)}
                      className="text-xs bg-white h-8 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Longitude (°E) *</label>
                    <Input
                      required
                      type="number"
                      step="any"
                      placeholder="72.6369"
                      value={facLng}
                      onChange={(e) => setFacLng(e.target.value)}
                      className="text-xs bg-white h-8 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Quick Presets</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleApplyCoordinatePreset(e.target.value);
                      }}
                      className="w-full h-8 rounded-lg border border-teal-200 bg-white px-2 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium cursor-pointer"
                    >
                      <option value="">-- Choose Known Locality --</option>
                      {GUJARAT_COORDINATE_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Interactive Map Pin Selector */}
                {showInteractiveMap && (
                  <div className="pt-2">
                    <LocationPickerMap
                      lat={parseFloat(facLat) || 23.2156}
                      lng={parseFloat(facLng) || 72.6369}
                      onChangeLocation={(newLat, newLng) => {
                        setFacLat(newLat.toFixed(6));
                        setFacLng(newLng.toFixed(6));
                        setGeocodeMatchMsg(`📍 Pin Moved: [${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E]`);
                      }}
                      title="Click on the exact hospital building/gate to set location"
                      height="180px"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-[10px] text-teal-800/90 pt-0.5 gap-1">
                  <span>🛰️ Exact location is used to calculate KM distance and Google Maps directions for citizens.</span>
                  <span className="font-mono font-bold bg-teal-100/90 px-2 py-0.5 rounded text-teal-950">
                    Coords: [{Number(facLat).toFixed(4)}°N, {Number(facLng).toFixed(4)}°E]
                  </span>
                </div>
              </div>

              {/* Row 3: Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Reception Contact Number</label>
                  <Input
                    placeholder="e.g. 079-2322-1010"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Emergency / Casualty Hotline</label>
                  <Input
                    placeholder="108"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Row 4: Bed Capacity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">Total Beds</label>
                  <Input
                    type="number"
                    min="1"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">Available Free</label>
                  <Input
                    type="number"
                    min="0"
                    value={availableBeds}
                    onChange={(e) => setAvailableBeds(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">Total ICU Beds</label>
                  <Input
                    type="number"
                    min="0"
                    value={icuBedsTotal}
                    onChange={(e) => setIcuBedsTotal(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">ICU Free</label>
                  <Input
                    type="number"
                    min="0"
                    value={icuBedsAvailable}
                    onChange={(e) => setIcuBedsAvailable(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Row 5: Emergency & Key Infrastructure */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={emergencyAvailable}
                    onChange={(e) => setEmergencyAvailable(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">24/7 Casualty</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={oxygenAvailable}
                    onChange={(e) => setOxygenAvailable(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Oxygen Plant</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={bloodBankAvailable}
                    onChange={(e) => setBloodBankAvailable(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Blood Bank</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={ambulanceAvailable}
                    onChange={(e) => setAmbulanceAvailable(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Ambulance Base</span>
                </label>
              </div>

              {/* Row 6: Specialties Offered */}
              <div className="space-y-1.5 pt-1">
                <label className="font-semibold text-slate-700">Active Clinical Specialties</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SPECIALTIES.map((spec) => {
                    const isSelected = selectedSpecialties.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Row 7: Registration Counter & Desk Clerk Login Credentials */}
              <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    🔐 Hospital Registration Counter & Clerk Login <span className="text-rose-600 font-extrabold">* (Compulsory)</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">Mandatory for counter clerk login & OPD queue management</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Counter Username / ID <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder={facName.trim() ? `clerk_${facName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'e.g. clerk_civil'}
                      value={clerkUsername}
                      onChange={(e) => setClerkUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Counter Password <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="text"
                      placeholder="Clerk@123"
                      value={clerkPassword}
                      onChange={(e) => setClerkPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>

            <DialogFooter>
              <Button
                onClick={() => setShowAddModal(false)}
                type="button"
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="bg-teal-700 hover:bg-teal-800 text-white cursor-pointer font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Registering...
                  </>
                ) : (
                  'Register Government Facility'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

      {/* EDIT GOVERNMENT FACILITY MODAL */}
      {showEditModal && editingFacility && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal} maxWidth="2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-teal-700" />
              <span>Edit Healthcare Facility: {editingFacility.name}</span>
            </DialogTitle>
            <DialogDescription>
              Update operational capacity, bed numbers, and emergency configurations for this hospital.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditFacilitySubmit}>
            <DialogContent className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
              {/* Row 1: Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Facility / Hospital Name *</label>
                  <Input
                    required
                    placeholder="Hospital name"
                    value={facName}
                    onChange={(e) => setFacName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Facility Category *</label>
                  <select
                    value={facType}
                    onChange={(e) => setFacType(e.target.value as Facility['type'])}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                  >
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                    <option value="SUB_DISTRICT_HOSPITAL">Sub-District Hospital</option>
                    <option value="CHC">Community Health Centre (CHC)</option>
                    <option value="PHC">Primary Health Centre (PHC)</option>
                    <option value="MEDICAL_COLLEGE">Medical College Hospital</option>
                    <option value="SPECIALTY_HOSPITAL">Specialty Supercare Centre</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Full Physical Address</label>
                    <button
                      type="button"
                      onClick={() => handleAutoGeocodeAddress()}
                      disabled={isAutoGeocoding || !address.trim()}
                      className="text-[10px] font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1"
                    >
                      <Search className="h-2.5 w-2.5" />
                      <span>{isAutoGeocoding ? 'Matching...' : 'Auto-Match Address GPS'}</span>
                    </button>
                  </div>
                  <Input
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Pincode</label>
                  <Input
                    placeholder="382010"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Row 2.5: Exact Geo-Coordinates & Location Pin */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50/90 to-sky-50/90 rounded-xl border border-teal-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <MapPin className="h-4 w-4 text-teal-700 shrink-0" />
                    <span>Exact Geo-Location Coordinates (for Patient Distance & Directions)</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowInteractiveMap(!showInteractiveMap)}
                      className="h-7 text-[11px] font-bold gap-1 bg-white border-teal-300 text-teal-800 hover:bg-teal-50 cursor-pointer shadow-2xs px-2"
                    >
                      <Map className="h-3 w-3 text-teal-700" />
                      <span>{showInteractiveMap ? 'Hide Map' : '🗺️ Pin on Map'}</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleDetectGpsForFacility}
                      disabled={isLocatingGps}
                      className="h-7 text-[11px] font-bold gap-1 bg-white border-teal-300 text-teal-800 hover:bg-teal-50 cursor-pointer shadow-2xs px-2"
                      title="Auto-detect via GPS or hospital address / district center"
                    >
                      <Navigation className={`h-3 w-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
                      <span>{isLocatingGps ? 'Locating...' : '📍 Auto-Locate / GPS'}</span>
                    </Button>
                  </div>
                </div>

                {geocodeMatchMsg && (
                  <div className="p-2 rounded-lg bg-white border border-teal-200 text-[11px] font-semibold text-teal-900 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{geocodeMatchMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Latitude (°N) *</label>
                    <Input
                      required
                      type="number"
                      step="any"
                      placeholder="23.2156"
                      value={facLat}
                      onChange={(e) => setFacLat(e.target.value)}
                      className="text-xs bg-white h-8 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Longitude (°E) *</label>
                    <Input
                      required
                      type="number"
                      step="any"
                      placeholder="72.6369"
                      value={facLng}
                      onChange={(e) => setFacLng(e.target.value)}
                      className="text-xs bg-white h-8 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Quick Presets</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleApplyCoordinatePreset(e.target.value);
                      }}
                      className="w-full h-8 rounded-lg border border-teal-200 bg-white px-2 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium cursor-pointer"
                    >
                      <option value="">-- Choose Known Locality --</option>
                      {GUJARAT_COORDINATE_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Interactive Map Pin Selector */}
                {showInteractiveMap && (
                  <div className="pt-2">
                    <LocationPickerMap
                      lat={parseFloat(facLat) || 23.2156}
                      lng={parseFloat(facLng) || 72.6369}
                      onChangeLocation={(newLat, newLng) => {
                        setFacLat(newLat.toFixed(6));
                        setFacLng(newLng.toFixed(6));
                        setGeocodeMatchMsg(`📍 Pin Moved: [${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E]`);
                      }}
                      title="Click on the exact hospital building/gate to set location"
                      height="180px"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-[10px] text-teal-800/90 pt-0.5 gap-1">
                  <span>🛰️ Real-time Haversine distance in KM will update accurately for patients.</span>
                  <span className="font-mono font-bold bg-teal-100/90 px-2 py-0.5 rounded text-teal-950">
                    Coords: [{Number(facLat).toFixed(4)}°N, {Number(facLng).toFixed(4)}°E]
                  </span>
                </div>
              </div>

              {/* Row 3: Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Reception Contact Number</label>
                  <Input
                    placeholder="Contact number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Emergency / Casualty Hotline</label>
                  <Input
                    placeholder="108"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Row 4: Bed Capacity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">Total Beds</label>
                  <Input
                    type="number"
                    min="1"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">Available Free</label>
                  <Input
                    type="number"
                    min="0"
                    value={availableBeds}
                    onChange={(e) => setAvailableBeds(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">Total ICU Beds</label>
                  <Input
                    type="number"
                    min="0"
                    value={icuBedsTotal}
                    onChange={(e) => setIcuBedsTotal(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px]">ICU Free</label>
                  <Input
                    type="number"
                    min="0"
                    value={icuBedsAvailable}
                    onChange={(e) => setIcuBedsAvailable(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Row 5: Emergency & Key Infrastructure */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={emergencyAvailable}
                    onChange={(e) => setEmergencyAvailable(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">24/7 Casualty</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={oxygenAvailable}
                    onChange={(e) => setOxygenAvailable(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Oxygen Plant</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={bloodBankAvailable}
                    onChange={(e) => setBloodBankAvailable(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Blood Bank</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={ambulanceAvailable}
                    onChange={(e) => setAmbulanceAvailable(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Ambulance Base</span>
                </label>
              </div>

              {/* Row 6: Specialties Offered */}
              <div className="space-y-1.5 pt-1">
                <label className="font-semibold text-slate-700">Active Clinical Specialties</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SPECIALTIES.map((spec) => {
                    const isSelected = selectedSpecialties.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>
            </DialogContent>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingFacility(null);
                }}
                type="button"
                variant="secondary"
                size="sm"
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="bg-teal-700 hover:bg-teal-800 text-white cursor-pointer font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Facility Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteDialog && deletingFacility && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} maxWidth="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <span>Delete Government Facility</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingFacility.name}</strong> from the {selectedDistrict} District Healthcare Network?
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-3 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <p className="font-semibold">⚠️ Irreversible Administrative Action</p>
              <p className="text-[11px] mt-1 text-rose-700">
                Removing this facility will delist its {deletingFacility.totalBeds} beds, OPD departments, and emergency unit from district dispatch and public discovery.
              </p>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingFacility(null);
              }}
              variant="secondary"
              size="sm"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteFacilityConfirm}
              disabled={isDeleting}
              size="sm"
              className="bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Confirm Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* QUICK INSPECT MODAL */}
      {inspectFacility && (
        <Dialog open={!!inspectFacility} onOpenChange={() => setInspectFacility(null)} maxWidth="xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
                {inspectFacility.type.replace(/_/g, ' ')}
              </span>
              {inspectFacility.emergencyAvailable && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                  24/7 Casualty
                </span>
              )}
            </div>
            <DialogTitle className="mt-1">{inspectFacility.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{inspectFacility.address}, PIN: {inspectFacility.pincode}</span>
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Beds</span>
                <span className="text-xl font-bold text-slate-900">{inspectFacility.totalBeds}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Available Free</span>
                <span className="text-xl font-bold text-emerald-800">{inspectFacility.availableBeds}</span>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-center">
                <span className="text-sky-700 block text-[10px] uppercase font-bold">ICU Free</span>
                <span className="text-xl font-bold text-sky-800">{inspectFacility.icuBedsAvailable || 0} / {inspectFacility.icuBedsTotal || 0}</span>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-center">
                <span className="text-teal-700 block text-[10px] uppercase font-bold">OPD Wait Time</span>
                <span className="text-xl font-bold text-teal-800">~{inspectFacility.currentWaitTimeMinutes}m</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700">Contact Channels:</span>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>Reception: {inspectFacility.contactNumber}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-rose-500" />
                  <span>Emergency Helpline: {inspectFacility.emergencyNumber}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700">Clinical Specialties:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {inspectFacility.specialties.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              onClick={() => setInspectFacility(null)}
              variant="secondary"
              size="sm"
              className="cursor-pointer"
            >
              Close
            </Button>
            <Link to={`/district/facilities/${inspectFacility.id}`}>
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white font-semibold cursor-pointer">
                Open Full Facility Console
              </Button>
            </Link>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};
