import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';
import { Link } from 'react-router-dom';
import {
  Building2,
  Phone,
  MapPin,
  Ambulance,
  HeartPulse,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GitBranch,
} from 'lucide-react';

interface FrontlineFacilityInfo {
  id: string;
  name: string;
  type: 'SUBCENTRE' | 'PHC' | 'CHC' | 'DISTRICT_HOSPITAL' | string;
  distanceKm: number;
  address: string;
  phone: string;
  medicalOfficer: string;
  officerPhone: string;
  is24x7DeliveryPoint: boolean;
  hasBloodStorage: boolean;
  hasColdChain: boolean;
  ambulanceAvailable: boolean;
  totalBeds: number;
  availableBeds: number;
  services: string[];
}

const FRONTLINE_FACILITY_DIRECTORY: FrontlineFacilityInfo[] = [
  {
    id: 'fac_sub_01',
    name: 'Pethapur Subcentre & Ayushman Arogya Mandir',
    type: 'SUBCENTRE',
    distanceKm: 0.8,
    address: 'Near Gram Panchayat Office, Pethapur, Gandhinagar - 382610',
    phone: '079-23214401',
    medicalOfficer: 'Geeta Parmar (CHO) & Rekhaben (ANM)',
    officerPhone: '9898012345',
    is24x7DeliveryPoint: false,
    hasBloodStorage: false,
    hasColdChain: true,
    ambulanceAvailable: false,
    totalBeds: 2,
    availableBeds: 2,
    services: ['NCD Screening', 'Immunization Days (VHSND)', 'Antenatal Checkups', 'IFA Dispensing', 'Teleconsultation Hub'],
  },
  {
    id: 'fac_phc_01',
    name: 'Pethapur Primary Health Centre (PHC)',
    type: 'PHC',
    distanceKm: 2.1,
    address: 'Main Road, Near Bus Stand, Pethapur - 382610',
    phone: '079-23214455',
    medicalOfficer: 'Dr. Neha Vaghela (Medical Officer)',
    officerPhone: '9898023456',
    is24x7DeliveryPoint: true,
    hasBloodStorage: false,
    hasColdChain: true,
    ambulanceAvailable: false,
    totalBeds: 12,
    availableBeds: 5,
    services: ['24x7 Normal Delivery', 'OPD Consultations', 'Basic Lab (CBC, Malaria, Dengue)', 'Emergency First Aid', 'Family Planning Services'],
  },
  {
    id: 'fac_chc_01',
    name: 'Kalol Community Health Centre (CHC / Sub-District)',
    type: 'CHC',
    distanceKm: 9.4,
    address: 'Highway Crossroad, Kalol, Gandhinagar - 382721',
    phone: '02764-223344',
    medicalOfficer: 'Dr. Meena Swamy (Superintendent)',
    officerPhone: '9898066770',
    is24x7DeliveryPoint: true,
    hasBloodStorage: true,
    hasColdChain: true,
    ambulanceAvailable: true,
    totalBeds: 50,
    availableBeds: 18,
    services: ['Emergency Obstetric Care (CEmONC)', 'Blood Storage Unit', 'Pediatric Care', 'Surgical Theatre', 'Nutritional Rehabilitation Centre (NRC)'],
  },
  {
    id: 'fac_civil_01',
    name: 'Gandhinagar Civil Hospital & Medical College',
    type: 'DISTRICT_HOSPITAL',
    distanceKm: 18.0,
    address: 'Sector 12, Near Pathikashram, Gandhinagar - 382012',
    phone: '079-23222222',
    medicalOfficer: 'Dr. K. N. Vyas (Chief District Medical Officer)',
    officerPhone: '079-23222220',
    is24x7DeliveryPoint: true,
    hasBloodStorage: true,
    hasColdChain: true,
    ambulanceAvailable: true,
    totalBeds: 350,
    availableBeds: 72,
    services: ['Tertiary Specialty Care', 'Full Blood Bank (Components)', 'Neonatal ICU (NICU)', 'Trauma Center Level 2', 'Dialysis Center', 'Advanced Radiology & CT'],
  },
];

export const FrontlineFacilitiesPage: React.FC = () => {
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [facilities, setFacilities] = useState<FrontlineFacilityInfo[]>(FRONTLINE_FACILITY_DIRECTORY);

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        const liveDirectory: FrontlineFacilityInfo[] = res.data.map((f, idx) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          distanceKm: f.distanceKm || (idx + 1) * 2.5,
          address: f.address,
          phone: f.contactNumber || f.emergencyNumber || '079-23222222',
          medicalOfficer: 'Medical Superintendent / MO Incharge',
          officerPhone: f.emergencyNumber || f.contactNumber || '9898000000',
          is24x7DeliveryPoint: f.emergencyAvailable || true,
          hasBloodStorage: f.departments?.some((d) => d.name.toLowerCase().includes('blood')) || true,
          hasColdChain: true,
          ambulanceAvailable: f.emergencyAvailable || true,
          totalBeds: f.totalBeds || 50,
          availableBeds: f.availableBeds || 12,
          services: f.specialties || ['General Medicine', 'OPD', 'Emergency Care'],
        }));
        setFacilities(liveDirectory);
      }
    }).catch(console.warn);
  }, []);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (tierFilter !== 'ALL' && f.type !== tierFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.medicalOfficer.toLowerCase().includes(q) ||
          f.services.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [facilities, tierFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nearby Health Facilities & Emergency Directory"
        subtitle="Offline-accessible directory of Subcentres, Primary Health Centres (PHCs), CHCs, Delivery Points, and 108 Emergency Contacts."
        breadcrumbs={[{ label: 'ASHA Dashboard', to: '/asha' }, { label: 'Facilities Directory' }]}
        actions={
          <Link to="/asha/referrals">
            <Button variant="outline" size="sm" className="gap-1.5 border-teal-700 text-teal-800">
              <GitBranch className="h-4 w-4" />
              <span>View Active Referrals</span>
            </Button>
          </Link>
        }
      />

      {/* Emergency Hotlines Strip */}
      <div className="rounded-3xl bg-gradient-to-r from-red-800 via-rose-800 to-teal-900 p-5 sm:p-6 text-white shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Emergency Medical Dispatch Lines
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold">Instant Frontline Emergency Contacts</h2>
            <p className="text-xs text-rose-100/90">
              Toll-free emergency numbers accessible without mobile balance across Gujarat.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="tel:108"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-rose-800 px-4 py-2.5 text-xs font-extrabold hover:bg-rose-50 shadow-md min-h-[44px]"
            >
              <Ambulance className="h-4 w-4 text-rose-600 animate-bounce" />
              <span>Call 108 Ambulance</span>
            </a>
            <a
              href="tel:104"
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-700/80 border border-white/20 text-white px-3 py-2 text-xs font-bold hover:bg-rose-700 min-h-[44px]"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>104 Health Help</span>
            </a>
          </div>
        </div>

        {/* Local Emergency numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/15 text-xs">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5">
            <Building2 className="h-4 w-4 text-rose-200 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-rose-200 block">Pethapur PHC ER Desk</span>
              <a href="tel:07923214455" className="font-bold underline hover:text-rose-100">
                079-23214455
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5">
            <HeartPulse className="h-4 w-4 text-rose-200 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-rose-200 block">Civil Hospital Blood Bank</span>
              <a href="tel:07923222222" className="font-bold underline hover:text-rose-100">
                079-23222222 Ext 104
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5">
            <ShieldCheck className="h-4 w-4 text-rose-200 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-rose-200 block">Maternal High-Risk Desk</span>
              <a href="tel:18002334455" className="font-bold underline hover:text-rose-100">
                1800-233-4455
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { key: 'ALL', label: 'All Levels' },
            { key: 'SUBCENTRE', label: 'Subcentre / HWC' },
            { key: 'PHC', label: 'Primary Health Centre' },
            { key: 'CHC', label: 'Community Health Centre' },
            { key: 'DISTRICT_HOSPITAL', label: 'District Civil Hospital' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTierFilter(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                tierFilter === t.key
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search facilities or services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
      </div>

      {/* Facility Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFacilities.map((fac) => (
          <Card key={fac.id} className="border-slate-200 bg-white shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      {fac.type.replace(/_/g, ' ')}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {fac.distanceKm} km from cluster
                    </span>
                    {fac.is24x7DeliveryPoint && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        24x7 Delivery
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{fac.name}</h3>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{fac.address}</span>
              </div>

              {/* Incharge / MO Info */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1 text-xs">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  Medical Incharge:
                </span>
                <p className="font-bold text-slate-800">{fac.medicalOfficer}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Contact: +91 {fac.officerPhone}</span>
                  <a
                    href={`tel:${fac.officerPhone}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 underline"
                  >
                    <Phone className="h-3 w-3" /> Call Incharge
                  </a>
                </div>
              </div>

              {/* Bed & Cold Chain features */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-teal-50/50 p-2 border border-teal-100">
                  <span className="text-[10px] uppercase text-teal-700 block font-semibold">Available Beds</span>
                  <span className="text-sm font-extrabold text-teal-900">
                    {fac.availableBeds} / {fac.totalBeds} Beds
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-500 block font-semibold">Cold Chain</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {fac.hasColdChain ? 'ILR & Deep Freezer' : 'Vaccine Carrier Only'}
                  </span>
                </div>
              </div>

              {/* Services Badges */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Key Healthcare Services:
                </span>
                <div className="flex flex-wrap gap-1">
                  {fac.services.map((svc, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={`tel:${fac.phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
              >
                <Phone className="h-4 w-4 text-slate-500" />
                Call Facility
              </a>

              <Link to="/asha/referrals">
                <Button variant="primary" size="sm" className="text-xs min-h-[44px] bg-teal-700 hover:bg-teal-800">
                  Refer Citizen Here
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
