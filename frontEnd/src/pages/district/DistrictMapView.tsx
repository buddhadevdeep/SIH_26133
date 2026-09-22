import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/BottomSheet';
import { MapView } from '@/components/map/MapView';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';
import { Building2, Navigation, Phone, ShieldCheck, Bed, Stethoscope, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DistrictMapView: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [facilityList, setFacilityList] = useState<Facility[]>(INITIAL_FACILITIES);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setFacilityList(res.data);
    }).catch(console.warn);
  }, []);

  const facilities = facilityList.filter((f) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'EMERGENCY') return f.emergencyAvailable;
    if (filterType === 'CRITICAL_BEDS') return (f.availableBeds || 0) <= 10;
    return f.type === filterType;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="District Health Map"
        subtitle={`Geographical view of healthcare facilities, bed status, and emergency casualty centres in ${selectedDistrict} District.`}
        breadcrumbs={[{ label: 'District Admin', to: '/district' }, { label: 'District Map' }]}
        actions={
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Units' },
              { id: 'EMERGENCY', label: '24/7 Casualty Only' },
              { id: 'CRITICAL_BEDS', label: 'Low Beds (≤10)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterType === tab.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <MapView
          facilities={facilities}
          selectedFacilityId={selectedFacility?.id}
          onSelectFacility={(fac) => setSelectedFacility(fac)}
          showHeatmap
          className="h-[620px]"
        />

        {/* Legend Box */}
        <div className="absolute top-4 right-4 z-20 rounded-2xl bg-white/95 backdrop-blur-md p-3.5 shadow-md border border-slate-200 text-xs space-y-2 pointer-events-auto">
          <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
            Bed Availability Status
          </span>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-teal-700" />
            <span className="text-slate-600">Optimal (&gt;15 beds free)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-slate-600">Busy (6–15 beds free)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-600" />
            <span className="text-slate-600">Critical (&le;5 beds free)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span className="h-3 w-3 rounded-full bg-amber-300 border border-amber-500" />
            <span className="text-slate-600">Fever Surveillance Cluster</span>
          </div>
        </div>
      </div>

      {/* Facility Detail Drawer on Pin Selection */}
      <Drawer
        open={!!selectedFacility}
        onOpenChange={(open) => !open && setSelectedFacility(null)}
        title={selectedFacility?.name}
      >
        {selectedFacility && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-sm">
                {selectedFacility.type.replace(/_/g, ' ')}
              </span>
              <p className="text-slate-600">{selectedFacility.address}</p>
              <p className="text-slate-500 pt-1">Distance: {selectedFacility.distanceKm} km</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Beds</span>
                <span className="text-lg font-black text-slate-900">
                  {selectedFacility.availableBeds} / {selectedFacility.totalBeds}
                </span>
                <span className="text-[10px] text-slate-500 block">beds free</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-rose-800 block text-[10px] uppercase font-bold">ICU Beds Free</span>
                <span className="text-lg font-black text-rose-700">
                  {selectedFacility.icuBedsAvailable || 0}
                </span>
                <span className="text-[10px] text-rose-600 block">with ventilators</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">Specialties Available:</span>
              <div className="flex flex-wrap gap-1">
                {selectedFacility.specialties.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <a
                href={`https://maps.google.com/?q=${selectedFacility.coordinates.lat},${selectedFacility.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  Get Directions
                </Button>
              </a>

              <Link to={`/district/facilities/${selectedFacility.id}`} className="flex-1">
                <Button size="sm" className="w-full text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white">
                  <span>Facility Profile</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
