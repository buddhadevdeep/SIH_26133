import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { Facility } from '@/types/facility';
import { facilityApi } from '@/api/facilityApi';
import { resolveHospitalLocation, GUJARAT_DISTRICT_CENTERS } from '@/services/geocodingService';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Eye,
  CheckCircle2,
  Bed,
  MapPin,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const FacilityGovernancePage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // Modals
  const [inspectFacility, setInspectFacility] = useState<Facility | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Facility Form
  const [newFacName, setNewFacName] = useState('');
  const [newFacUsername, setNewFacUsername] = useState('');
  const [newFacPassword, setNewFacPassword] = useState('Clerk@123');
  const [newFacPhone, setNewFacPhone] = useState('9876543210');
  const [newFacAddress, setNewFacAddress] = useState('Main Civil Road');
  const [newFacType, setNewFacType] = useState<Facility['type']>('CHC');
  const [newFacDistrict, setNewFacDistrict] = useState('Gandhinagar');
  const [newFacBeds, setNewFacBeds] = useState('30');
  const [newFacEmergency, setNewFacEmergency] = useState(true);
  const [newFacLat, setNewFacLat] = useState('23.2156');
  const [newFacLng, setNewFacLng] = useState('72.6369');
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const handleDetectGps = async () => {
    setIsLocatingGps(true);
    try {
      const res = await resolveHospitalLocation({
        address: newFacAddress,
        facilityName: newFacName,
        district: newFacDistrict,
      });
      setNewFacLat(res.lat.toFixed(6));
      setNewFacLng(res.lng.toFixed(6));
    } catch (err: any) {
      console.warn('GPS fallback error:', err);
      const centroid = GUJARAT_DISTRICT_CENTERS[newFacDistrict] || GUJARAT_DISTRICT_CENTERS['Gandhinagar'];
      setNewFacLat(centroid.lat.toFixed(6));
      setNewFacLng(centroid.lng.toFixed(6));
    } finally {
      setIsLocatingGps(false);
    }
  };

  const fetchFacilities = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    setError(null);
    try {
      const res = await facilityApi.getAll();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setFacilities(res.data);
      }
    } catch (err: any) {
      console.warn('Facility list fetch error:', err);
      setError(err?.message || 'Failed to retrieve live health facilities.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Filter facilities
  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'ALL' || f.type === selectedType;
      const matchesEmergency = !emergencyOnly || f.emergencyAvailable;
      return matchesSearch && matchesType && matchesEmergency;
    });
  }, [facilities, searchQuery, selectedType, emergencyOnly]);

  const totalBeds = facilities.reduce((acc, f) => acc + (f.totalBeds || 0), 0);
  const availableBeds = facilities.reduce((acc, f) => acc + (f.availableBeds || 0), 0);
  const emergencyCount = facilities.filter((f) => f.emergencyAvailable).length;

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName.trim()) {
      alert('Facility Name is required');
      return;
    }

    const trimmedUsername = newFacUsername.trim();
    const trimmedPassword = newFacPassword.trim();

    if (!trimmedUsername) {
      alert('Registration Counter Clerk Login Username / ID is strictly COMPULSORY.');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 4) {
      alert('Registration Counter Clerk Password is strictly COMPULSORY (minimum 4 characters).');
      return;
    }

    setIsSubmitting(true);
    const latNum = parseFloat(newFacLat) || 23.2156;
    const lngNum = parseFloat(newFacLng) || 72.6369;

    const finalPhone = newFacPhone.trim() || '9876543210';
    const finalAddress = newFacAddress.trim() || `Main Civil Road, ${newFacDistrict}`;

    const newFacPayload: any = {
      name: newFacName.trim(),
      type: newFacType,
      district: newFacDistrict,
      state: 'Gujarat',
      address: finalAddress,
      pincode: '382024',
      contactNumber: finalPhone,
      phone: finalPhone,
      username: trimmedUsername,
      password: trimmedPassword,
      emergencyNumber: '108',
      totalBeds: parseInt(newFacBeds, 10) || 20,
      availableBeds: parseInt(newFacBeds, 10) || 15,
      icuBedsTotal: 4,
      icuBedsAvailable: 2,
      oxygenAvailable: true,
      bloodBankAvailable: false,
      ambulanceAvailable: true,
      isOpen: true,
      isVerified: true,
      emergencyAvailable: newFacEmergency,
      currentWaitTimeMinutes: 15,
      coordinates: { lat: latNum, lng: lngNum },
      departments: [
        { id: 'd_gen', name: 'General Medicine', code: 'GEN', activeDoctors: 3, currentWaitMinutes: 15, opdOpen: true },
        { id: 'd_peds', name: 'Pediatrics', code: 'PED', activeDoctors: 2, currentWaitMinutes: 10, opdOpen: true },
      ],
      specialties: ['General Medicine', 'Maternal Health'],
    };

    try {
      const res = await facilityApi.create(newFacPayload);
      const createdFac = res?.data || {
        ...newFacPayload,
        id: `fac_${Date.now()}`,
        equipment: [],
        lastUpdated: new Date().toISOString(),
      } as Facility;

      setFacilities((prev) => [createdFac, ...prev.filter((f) => f.id !== createdFac.id)]);
      setShowAddModal(false);
      setNewFacName('');
      setNewFacUsername('');
      setNewFacPassword('');
      setSuccessToast(`Facility "${createdFac.name}" commissioned successfully! Hospital Registration Clerk Login Username: "${trimmedUsername}" | Password: "${trimmedPassword}"`);
      setTimeout(() => setSuccessToast(null), 8000);
    } catch (err: any) {
      console.warn('Create facility failed:', err);
      // Fallback
      const fallbackFac: Facility = {
        ...newFacPayload,
        id: `fac_${Date.now()}`,
        equipment: [],
        lastUpdated: new Date().toISOString(),
      } as Facility;
      setFacilities((prev) => [fallbackFac, ...prev]);
      setShowAddModal(false);
      setNewFacName('');
      setSuccessToast(`Facility "${fallbackFac.name}" added to local cache.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Governance"
        subtitle="Manage public hospitals, community health centres, and verified primary clinics across the district."
        breadcrumbs={[
          { label: 'Technical Center', to: '/super-admin' },
          { label: 'Facilities' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchFacilities(true)}
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-teal-700" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="primary"
              size="sm"
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Facility
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchFacilities(true)}>Retry</Button>
        </div>
      )}

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facilities</span>
          <p className="text-3xl font-black text-slate-900 mt-1">{facilities.length}</p>
          <span className="text-xs text-slate-500">Public health facilities</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bed Capacity</span>
          <p className="text-3xl font-black text-teal-700 mt-1">{totalBeds}</p>
          <span className="text-xs text-slate-500">{availableBeds} beds currently available</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">24/7 Emergency</span>
          <p className="text-3xl font-black text-emerald-700 mt-1">{emergencyCount}</p>
          <span className="text-xs text-slate-500">Trauma & ICU ready</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reporting Grid</span>
          <p className="text-3xl font-black text-slate-900 mt-1">100%</p>
          <span className="text-xs text-emerald-700 font-semibold">Active digital sync</span>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search facilities by name or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 text-xs"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex min-h-[44px] rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
          >
            <option value="ALL">All Facility Types</option>
            <option value="DISTRICT_HOSPITAL">District Hospital</option>
            <option value="SUB_DISTRICT_HOSPITAL">Sub-District Hospital</option>
            <option value="CHC">Community Health Centre</option>
            <option value="PHC">Primary Health Centre</option>
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={(e) => setEmergencyOnly(e.target.checked)}
              className="h-4 w-4 rounded text-teal-700 focus:ring-teal-700"
            />
            <span>24/7 Emergency Only</span>
          </label>
        </div>

        <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Showing {filtered.length} of {facilities.length} units
        </span>
      </div>

      {/* Facilities List / Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No facilities found"
          description="No healthcare facilities matched your search and filter criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedType('ALL');
            setEmergencyOnly(false);
          }}
        />
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="p-3.5">Facility Name</th>
                  <th className="p-3.5">Type & Level</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Beds Available</th>
                  <th className="p-3.5">Emergency Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{fac.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {fac.contactNumber || fac.emergencyNumber || '+91 79 2322 2333'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-800 text-[11px]">
                        {fac.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="font-medium text-slate-800">{fac.district}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{fac.address}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 text-sm">{fac.availableBeds}</span>
                      <span className="text-slate-400 text-[11px]"> / {fac.totalBeds}</span>
                    </td>
                    <td className="p-3.5">
                      {fac.emergencyAvailable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 24/7 Ready
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Day Hours</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        onClick={() => setInspectFacility(fac)}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 gap-1 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Facility Inspection Dialog */}
      {inspectFacility && (
        <Dialog open={!!inspectFacility} onOpenChange={() => setInspectFacility(null)} maxWidth="xl">
          <DialogHeader>
            <DialogTitle>{inspectFacility.name}</DialogTitle>
            <DialogDescription>
              {inspectFacility.type.replace(/_/g, ' ')} • {inspectFacility.district} District
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Beds</span>
                <span className="text-base font-black text-slate-900">{inspectFacility.totalBeds}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Now</span>
                <span className="text-base font-black text-teal-700">{inspectFacility.availableBeds}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">Departments & Clinical Services</h4>
              <div className="flex flex-wrap gap-1.5">
                {inspectFacility.departments?.map((d) => (
                  <span key={d.id} className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-medium">
                    {d.name} ({d.activeDoctors} doctors)
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">Clinical Specialties</h4>
              <div className="flex flex-wrap gap-1.5">
                {inspectFacility.specialties?.map((s) => (
                  <span key={s} className="rounded-full bg-teal-50 text-teal-800 px-2.5 py-1 text-xs font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              <p>Address: {inspectFacility.address || 'Civil Hospital Campus, Sector 12, Gandhinagar'}</p>
              <p className="mt-1">Contact: {inspectFacility.contactNumber || inspectFacility.emergencyNumber || '+91 79 2322 2333'}</p>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button onClick={() => setInspectFacility(null)} variant="secondary" size="sm" className="cursor-pointer">
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Add Facility Dialog */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal} maxWidth="xl">
          <DialogHeader>
            <DialogTitle>Add Healthcare Facility</DialogTitle>
            <DialogDescription>
              Register a new public hospital, CHC, or primary clinic into the health grid.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateFacility}>
            <DialogContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Facility Name</label>
                <Input
                  required
                  placeholder="e.g. Kalol Community Health Centre"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Type</label>
                  <select
                    value={newFacType}
                    onChange={(e) => setNewFacType(e.target.value as Facility['type'])}
                    className="flex min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
                  >
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                    <option value="SUB_DISTRICT_HOSPITAL">Sub-District Hospital</option>
                    <option value="CHC">Community Health Centre (CHC)</option>
                    <option value="PHC">Primary Health Centre (PHC)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">District</label>
                  <Input
                    value={newFacDistrict}
                    onChange={(e) => {
                      const d = e.target.value;
                      setNewFacDistrict(d);
                      const centroid = GUJARAT_DISTRICT_CENTERS[d];
                      if (centroid) {
                        setNewFacLat(centroid.lat.toFixed(6));
                        setNewFacLng(centroid.lng.toFixed(6));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Bed Capacity</label>
                <Input
                  type="number"
                  min="5"
                  max="1000"
                  value={newFacBeds}
                  onChange={(e) => setNewFacBeds(e.target.value)}
                />
              </div>

              {/* Exact Geo-Coordinates */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-teal-700" />
                    Exact Geo-Coordinates (for Patient Nearest Hospital Routing)
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isLocatingGps}
                    className="text-[10px] font-bold text-teal-700 bg-white border border-teal-300 hover:bg-teal-50 px-2 py-1 rounded-md cursor-pointer"
                  >
                    {isLocatingGps ? 'Locating...' : '📍 GPS Fix'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Latitude (°N)</label>
                    <Input
                      type="number"
                      step="any"
                      value={newFacLat}
                      onChange={(e) => setNewFacLat(e.target.value)}
                      className="text-xs h-8 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600">Longitude (°E)</label>
                    <Input
                      type="number"
                      step="any"
                      value={newFacLng}
                      onChange={(e) => setNewFacLng(e.target.value)}
                      className="text-xs h-8 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Hospital Registration Clerk & Counter Login Credentials */}
              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 text-[11px] flex items-center gap-1">
                    🔐 Hospital Registration Clerk Login <span className="text-rose-600 font-extrabold">* (Compulsory)</span>
                  </span>
                  <span className="text-[10px] text-teal-700">Required for Staff & Counter OPD Login</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700">
                      Login Username / ID <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder={newFacName ? `clerk_${newFacName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'e.g. clerk_kalol'}
                      value={newFacUsername}
                      onChange={(e) => setNewFacUsername(e.target.value)}
                      className="text-xs h-8 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700">
                      Login Password <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Clerk@123"
                      value={newFacPassword}
                      onChange={(e) => setNewFacPassword(e.target.value)}
                      className="text-xs h-8 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700">
                      Contact Phone <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="9876543210"
                      value={newFacPhone}
                      onChange={(e) => setNewFacPhone(e.target.value)}
                      className="text-xs h-8 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700">
                      Hospital Address <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Main Civil Road"
                      value={newFacAddress}
                      onChange={(e) => setNewFacAddress(e.target.value)}
                      className="text-xs h-8 bg-white"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={newFacEmergency}
                  onChange={(e) => setNewFacEmergency(e.target.checked)}
                  className="h-4 w-4 rounded text-teal-700 focus:ring-teal-700"
                />
                <span>24/7 Emergency & Trauma Care Available</span>
              </label>
            </DialogContent>

            <DialogFooter>
              <Button onClick={() => setShowAddModal(false)} type="button" variant="secondary" size="sm" className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="cursor-pointer">
                Save Facility
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
};
