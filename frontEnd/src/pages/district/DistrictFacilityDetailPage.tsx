import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { INITIAL_FACILITIES, INITIAL_REFERRALS, INITIAL_EQUIPMENT } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { referralApi } from '@/api/referralApi';
import { resourceApi } from '@/api/resourceApi';
import { Facility } from '@/types/facility';
import { Referral } from '@/types/referral';
import { EquipmentItem } from '@/types/resources';
import {
  Building2,
  Bed,
  MapPin,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  Activity,
  Ticket,
  Clock,
  FlaskConical,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export const DistrictFacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'BEDS' | 'DOCTORS' | 'EQUIPMENT' | 'REFERRALS'>('BEDS');

  const [facility, setFacility] = useState<Facility>(() => {
    return INITIAL_FACILITIES.find((f) => f.id === id) || INITIAL_FACILITIES[0];
  });
  const [referrals, setReferrals] = useState<Referral[]>(INITIAL_REFERRALS);
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT);

  useEffect(() => {
    if (!id) return;
    facilityApi.getById(id).then((res) => {
      if (res.data) setFacility(res.data);
    }).catch(() => {
      facilityApi.getAll().then((res) => {
        const found = res.data?.find((f) => f.id === id);
        if (found) setFacility(found);
      }).catch(console.warn);
    });

    referralApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setReferrals(res.data);
    }).catch(console.warn);

    resourceApi.getEquipment(id).then((res) => {
      if (res.data && res.data.length > 0) setEquipmentList(res.data);
    }).catch(console.warn);
  }, [id]);

  // Referrals involving this facility
  const facilityReferrals = referrals.filter(
    (r) => r.fromFacilityId === facility.id || r.toFacilityId === facility.id
  );

  // Equipment at this facility (filter or take subset)
  const facilityEquipment = equipmentList.filter(
    (eq) => eq.facilityId === facility.id || (eq.facilityName && eq.facilityName.toLowerCase().includes(facility.name.toLowerCase().slice(0, 8)))
  );

  // Bed breakdown calculations
  const totalBeds = facility.totalBeds || 0;
  const availableBeds = facility.availableBeds || 0;
  const occupiedBeds = totalBeds - availableBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const icuAvailable = facility.icuBedsAvailable || 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          to="/district/facilities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Facilities</span>
        </Link>

        {/* Facility Header Card */}
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-100">
                  {facility.type.replace(/_/g, ' ')}
                </span>
                {facility.emergencyAvailable && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    24/7 Casualty & Triage
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Operational
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">{facility.name}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{facility.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-semibold">{facility.contactNumber || '079-2322-1911'}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <a href={`tel:${facility.contactNumber || '079-2322-1911'}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                  <Phone className="h-4 w-4 text-slate-600" />
                  <span>Call Desk</span>
                </Button>
              </a>
              <Link to="/district/map">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                  <MapPin className="h-4 w-4 text-teal-700" />
                  <span>GIS Map</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bed Occupancy</span>
            <Bed className="h-4 w-4 text-teal-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {occupiedBeds} <span className="text-xs font-normal text-slate-500">/ {totalBeds}</span>
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                occupancyRate >= 90 ? 'bg-rose-500' : occupancyRate >= 75 ? 'bg-amber-500' : 'bg-teal-600'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{availableBeds} beds available ({occupancyRate}% full)</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ICU Ventilators</span>
            <Activity className="h-4 w-4 text-sky-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{icuAvailable}</p>
          <span className="text-[11px] text-sky-700 font-medium">Free for critical triage</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Specialty Units</span>
            <Stethoscope className="h-4 w-4 text-indigo-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{facility.specialties.length}</p>
          <span className="text-[11px] text-indigo-700 font-medium">Departments on site</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Referrals</span>
            <GitBranch className="h-4 w-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{facilityReferrals.length}</p>
          <span className="text-[11px] text-amber-700 font-medium">Inbound / Outbound</span>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'BEDS', label: 'Beds & Wards', icon: Bed },
          { id: 'DOCTORS', label: 'Departments & Doctors', icon: Stethoscope },
          { id: 'EQUIPMENT', label: 'Equipment & Labs', icon: FlaskConical },
          { id: 'REFERRALS', label: `Referrals (${facilityReferrals.length})`, icon: GitBranch },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-teal-700 text-teal-800 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Beds & Wards */}
      {activeTab === 'BEDS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-500">General Ward Beds</span>
              <p className="text-xl font-bold text-slate-900">
                {Math.max(0, availableBeds - icuAvailable)}{' '}
                <span className="text-xs font-normal text-slate-500">available</span>
              </p>
              <p className="text-[11px] text-slate-400">Regular inpatient care and post-op recovery</p>
            </Card>

            <Card className="p-4 bg-white border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-500">ICU & HDU Ventilator Beds</span>
              <p className="text-xl font-bold text-rose-700">
                {icuAvailable} <span className="text-xs font-normal text-slate-500">available</span>
              </p>
              <p className="text-[11px] text-slate-400">Equipped with invasive ventilators and multipara monitors</p>
            </Card>

            <Card className="p-4 bg-white border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Emergency & Triage Bays</span>
              <p className="text-xl font-bold text-amber-700">
                {facility.emergencyAvailable ? '6' : '0'}{' '}
                <span className="text-xs font-normal text-slate-500">casualty bays</span>
              </p>
              <p className="text-[11px] text-slate-400">Red and yellow zone initial stabilization</p>
            </Card>
          </div>

          <Card className="p-5 bg-white border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Facility Infrastructure Highlights</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Oxygen Supply</span>
                <span className="font-bold text-emerald-700">PSA Plant + Liquid O2</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Blood Storage</span>
                <span className="font-bold text-teal-800">Licensed Blood Bank on site</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Generator Backup</span>
                <span className="font-bold text-slate-800">100% 250 kVA DG Set</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Ambulance Base</span>
                <span className="font-bold text-sky-700">2 ALS / 1 BLS Stationed</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Departments & Doctors */}
      {activeTab === 'DOCTORS' && (
        <Card className="p-5 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clinical Specialties at this Facility</h3>
              <p className="text-xs text-slate-500">Departments open for outpatient consultation and inpatient admissions</p>
            </div>
            <Link to="/district/doctors">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                District Doctor Directory
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {facility.specialties.map((dept, idx) => (
              <div
                key={dept}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{dept}</span>
                    <span className="text-[11px] text-slate-500">OPD: 09:00 AM – 01:00 PM</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Equipment & Labs */}
      {activeTab === 'EQUIPMENT' && (
        <Card className="p-5 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Medical Equipment & Diagnostic Modalities</h3>
              <p className="text-xs text-slate-500">Condition, uptime, and last maintenance verification</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {facilityEquipment.length > 0 ? (
              facilityEquipment.map((eq) => (
                <div key={eq.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">{eq.name}</span>
                    <p className="text-slate-500 text-[11px]">
                      Model: {eq.model} • Dept: {eq.department} • Qty: {eq.quantity}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        eq.status === 'OPERATIONAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {eq.status}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Next Service: {eq.nextServiceDate}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                <FlaskConical className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>Standard diagnostic lab, digital X-Ray, and ultrasonography active.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tab 4: Referrals */}
      {activeTab === 'REFERRALS' && (
        <Card className="p-5 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Patient Transfers & Referrals</h3>
              <p className="text-xs text-slate-500">Inbound patients referred here or outbound escalations</p>
            </div>
            <Link to="/district/referrals">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                View All Referrals
              </Button>
            </Link>
          </div>

          {facilityReferrals.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <GitBranch className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>No active referrals currently pending for this facility.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {facilityReferrals.map((ref) => (
                <div key={ref.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{ref.referralCode}</span>
                      <PriorityBadge priority={ref.priority} />
                      <StatusBadge status={ref.status} />
                    </div>
                    <p className="font-bold text-slate-800">{ref.patientName} ({ref.patientAge}Y)</p>
                    <p className="text-slate-500 text-[11px]">
                      {ref.fromFacilityName} → {ref.toFacilityName} ({ref.toSpecialty})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">
                      Reason: {ref.reasonForReferral}
                    </span>
                    <span className={`text-[11px] font-semibold ${ref.slaBreached ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {ref.slaBreached ? 'SLA Delayed' : 'Within SLA'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
