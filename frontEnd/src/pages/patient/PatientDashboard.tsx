import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { MapView } from '@/components/map/MapView';
import {
  INITIAL_FACILITIES,
  INITIAL_LIVE_QUEUE,
  INITIAL_REFERRALS,
} from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { queueApi, appointmentApi } from '@/api/queueApi';
import { referralApi } from '@/api/referralApi';
import { clinicalApi } from '@/api/clinicalApi';
import { Facility } from '@/types/facility';
import { Token, LiveQueueState, Appointment } from '@/types/queue';
import { Referral } from '@/types/referral';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Ticket,
  Building2,
  GitBranch,
  ArrowRight,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Users,
  Pill,
  Sparkles,
  Percent,
  Search,
  Phone,
  MessageCircle,
  Navigation,
  X,
  ExternalLink,
  Bed,
  Mic,
  Radio,
} from 'lucide-react';
import { useFamily } from '@/contexts/FamilyContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { FamilyMemberSwitcher } from '@/components/patient/FamilyMemberSwitcher';
import { SmartHospitalAssistantModal } from '@/components/patient/SmartHospitalAssistantModal';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeMember } = useFamily();
  const { t } = useTranslation();
  const {
    userCoords,
    detectGpsLocation,
    isLiveTracking,
    toggleLiveTracking,
    gpsAccuracy,
  } = useLocationContext();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [liveQueue, setLiveQueue] = useState<LiveQueueState>(INITIAL_LIVE_QUEUE);
  const [referrals, setReferrals] = useState<Referral[]>(INITIAL_REFERRALS);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [mapNearestOnly, setMapNearestOnly] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [nearestHospitalInfo, setNearestHospitalInfo] = useState<{ facility: Facility; distanceKm: number } | null>(null);

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setFacilities(res.data);
    }).catch(console.warn);

    queueApi.getLiveQueue('fac_civil_01').then((res) => {
      if (res.data) setLiveQueue(res.data);
    }).catch(console.warn);

    referralApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setReferrals(res.data);
    }).catch(console.warn);

    appointmentApi.getAll(activeMember?.id).then((res) => {
      if (res.data && res.data.length > 0) setPatientAppointments(res.data);
    }).catch(console.warn);
  }, [activeMember?.id]);

  const handleLocatePatient = async () => {
    setIsLocating(true);
    try {
      await detectGpsLocation();
      setMapNearestOnly(true);
    } catch {
      // ignore
    } finally {
      setIsLocating(false);
    }
  };

  const activeToken =
    liveQueue.tokens.find(
      (t) => t.patientId === activeMember.id || t.patientPhone === activeMember.phone
    ) || liveQueue.tokens[0] || INITIAL_LIVE_QUEUE.tokens[3];

  const activeReferral =
    referrals.find((r) => r.patientId === activeMember.id) || referrals[0] || INITIAL_REFERRALS[0];

  const nearbyFacilities = facilities.slice(0, 3);

  // Voice & Facility Assistant Modal State
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'ASSISTANT' | 'STORES'>('ASSISTANT');

  return (
    <div className="space-y-7 font-sans">
      {/* ================================================== */}
      {/* CITIZEN HEALTH BAR / ABHA IDENTITY */}
      {/* ================================================== */}
      <div className="rounded-[1.5rem] border border-[#D5E6F3] bg-gradient-to-r from-[#E3EFF8] via-[#EAF4FB] to-[#EDF7FA] p-5 text-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D3E5F2] text-[#1D6394] shadow-xs">
              <ShieldCheck className="h-6 w-6 text-[#1D6394]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black tracking-tight text-[#1B365D] sm:text-base">
                  {t('patient.portalTitle', 'Ayushman Bharat Citizen Health Portal')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                  <CheckCircle2 className="h-3 w-3 text-[#15803D]" /> {t('patient.abhaVerified', 'ABHA Verified')}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-mono">
                ABHA ID: {activeMember.abhaId} • Active: {activeMember.name} ({activeMember.relation === 'SELF' ? 'Self' : activeMember.relationLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <FamilyMemberSwitcher variant="banner" />
            <div className="flex items-center gap-1.5 rounded-full bg-white/90 border border-slate-200/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t('patient.opdActiveToday', 'OPD Active Today')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* TOKEN + REFERRAL */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* ================================================== */}
        {/* MY TOKEN */}
        {/* ================================================== */}
        <div className="rounded-[1.5rem] border border-[#E2EDF3] bg-white p-5 shadow-2xs space-y-4 lg:col-span-3 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#0284C7]">
                <Ticket className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('patient.myToken', 'My Token')}
              </h3>
            </div>

            <span className="rounded-full bg-[#FEF3C7] text-[#D97706] text-[10px] font-black px-3 py-0.5 border border-amber-200">
              WAITING
            </span>
          </div>

          {/* Main Token Information */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                {t('patient.yourToken', 'Your Token')}
              </p>
              <p className="mt-0.5 text-3xl font-black text-[#1E3A5F]">
                {activeToken.tokenNumber}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400">
                {t('patient.nowServing', 'Now Serving')}
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {INITIAL_LIVE_QUEUE.currentTokenNumber}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400">
                {t('patient.beforeYou', 'Before You')}
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                7
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400">
                {t('patient.waitTime', 'Wait Time')}
              </p>
              <p className="mt-1 text-base font-bold text-[#D97706] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activeToken.estimatedWaitMinutes} min</span>
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {t('patient.turnCloser', 'Your turn is getting closer')}
              </span>
              <span className="font-bold text-[#5C8DB8]">
                45%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[45%] rounded-full bg-[#5C8DB8]" />
            </div>
          </div>

          {/* Hospital & View Live Queue Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#1D6394]" />
              <span className="text-xs font-semibold text-slate-700">
                {activeToken.facilityName}
              </span>
            </div>

            <Link to="/patient/tokens">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer gap-1"
              >
                <span>{t('patient.viewQueueHistory', 'View Live Queue & History')}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ================================================== */}
        {/* MY REFERRAL */}
        {/* ================================================== */}
        <div className="rounded-[1.5rem] border border-[#E2EDF3] bg-white p-5 shadow-2xs space-y-4 lg:col-span-2 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFEDD5] text-[#EA580C]">
                <GitBranch className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t('patient.myReferral', 'My Referral')}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {t('patient.referredVisit', 'Your referred visit')}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-[#FEE2E2] text-[#DC2626] text-[10px] font-black px-2.5 py-0.5 border border-red-200 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
              URGENT
            </span>
          </div>

          {/* Referral Details */}
          <div className="space-y-3 py-1 text-xs">
            <div>
              <p className="text-[10px] font-medium text-slate-400">
                {t('patient.hospital', 'Hospital')}
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {activeReferral.toFacilityName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-medium text-slate-400">
                  {t('patient.doctorFor', 'Doctor For')}
                </p>
                <p className="mt-0.5 text-xs font-bold text-slate-800">
                  {activeReferral.toSpecialty}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium text-slate-400">
                  {t('patient.visitTime', 'Visit Time')}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>{activeReferral.appointmentSlot || '2026-03-14 10:00 AM (OPD Room 6)'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* View Referral Button */}
          <div className="border-t border-slate-100 pt-3.5">
            <Link to="/patient/referrals" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>{t('patient.viewReferral', 'View Referral')}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* NEARBY HOSPITALS */}
      {/* ================================================== */}
      <section>
        {/* Section Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {t('patient.hospitalsNearYou', 'Hospitals Near You')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t('patient.checkAvailability', 'Check hospital location and availability')}
            </p>
          </div>

          {/* Find Hospital */}
          <Link to="/patient/facilities">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 border-slate-300 bg-white text-slate-700 text-xs hover:bg-slate-50 sm:w-auto font-bold rounded-xl cursor-pointer shadow-2xs"
            >
              <Building2 className="h-3.5 w-3.5 text-[#1D6394]" />
              <span>{t('patient.findHospital', 'Find Hospital')}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </Link>
        </div>

        {/* Map Header Controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-teal-50/70 via-sky-50/50 to-emerald-50/60 p-3 sm:p-4 rounded-2xl border border-teal-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs shrink-0">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  {mapNearestOnly ? '📍 Nearest Hospital to You (Map Only)' : 'All Nearby Public Hospitals'}
                </span>
                {isLiveTracking ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Live GPS Stream {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
                  </span>
                ) : userCoords ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    GPS Fixed ({userCoords.lat.toFixed(3)}°, {userCoords.lng.toFixed(3)}°)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 text-[10px] font-bold">
                    <Sparkles className="h-3 w-3 text-sky-600" />
                    Tap to locate
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLiveTracking
                  ? 'Real-time GPS coordinates stream is active. Nearest hospital and route update as you move.'
                  : userCoords
                  ? 'Showing route and live availability for the single closest public hospital.'
                  : 'Detect your location to see the nearest hospital directly on the map.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Live GPS Tracking Toggle */}
            <Button
              type="button"
              onClick={() => {
                toggleLiveTracking();
                setMapNearestOnly(true);
              }}
              size="sm"
              className={`text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                isLiveTracking
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${isLiveTracking ? 'animate-pulse text-white' : ''}`} />
              <span>{isLiveTracking ? '🟢 Tracking Live GPS...' : '🛰️ Track Live Location'}</span>
            </Button>

            <Button
              type="button"
              onClick={handleLocatePatient}
              disabled={isLocating}
              size="sm"
              variant="outline"
              className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : userCoords ? 'Refresh Fix' : '📍 One-Time GPS'}</span>
            </Button>

            <button
              type="button"
              onClick={() => setMapNearestOnly(!mapNearestOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                mapNearestOnly
                  ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {mapNearestOnly ? '✓ Nearest Only (Map)' : 'Show All'}
            </button>
          </div>
        </div>

        {/* Map + Hospital List */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* MAP */}
          <div className="overflow-hidden rounded-2xl lg:col-span-2 shadow-xs border border-slate-200">
            <MapView
              facilities={facilities}
              userLocation={userCoords}
              showNearestOnly={mapNearestOnly}
              isLiveTracking={isLiveTracking}
              gpsAccuracy={gpsAccuracy}
              onNearestFound={(fac, dist) => setNearestHospitalInfo({ facility: fac, distanceKm: dist })}
            />
          </div>

          {/* HOSPITALS */}
          <div className="space-y-3">
            {mapNearestOnly && nearestHospitalInfo ? (
              <Card className="border-teal-300 bg-gradient-to-b from-teal-50/50 to-white p-4 shadow-sm">
                <div className="inline-flex items-center gap-1 bg-teal-100 text-teal-900 px-2 py-0.5 rounded-full text-[10px] font-bold mb-2">
                  <Sparkles className="h-3 w-3 text-teal-700" /> Nearest Hospital
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {nearestHospitalInfo.facility.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  {nearestHospitalInfo.distanceKm} km from your location (~{Math.max(2, Math.round(nearestHospitalInfo.distanceKm * 2.2))} min)
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">GENERAL BEDS</span>
                    <strong className="text-slate-800 text-sm font-bold">
                      {nearestHospitalInfo.facility.availableBeds || 0}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-normal"> / {nearestHospitalInfo.facility.totalBeds || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">ICU BEDS</span>
                    <strong className="text-red-700 text-sm font-bold">
                      {nearestHospitalInfo.facility.icuBedsAvailable || 0} free
                    </strong>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${nearestHospitalInfo.facility.coordinates.lat},${nearestHospitalInfo.facility.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Get Directions
                  </a>

                  <Link
                    to={`/patient/tokens?facilityId=${nearestHospitalInfo.facility.id}`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold border-slate-300 hover:bg-slate-50"
                    >
                      <Ticket className="h-3.5 w-3.5 text-teal-700" />
                      Get OPD Token Here
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : null}

            {nearbyFacilities.map((facility) => (
              <Card
                key={facility.id}
                className="border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Hospital Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {facility.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {facility.distanceKm !== undefined ? `${facility.distanceKm} km away` : 'Nearby'}
                    </div>
                  </div>

                  {facility.isOpen ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      {t('status.open', 'Open')}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                      {t('status.closed', 'Closed')}
                    </span>
                  )}
                </div>

                {/* Availability */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-teal-700" />
                    <span className="text-[11px] text-slate-600">
                      <strong className="font-semibold text-slate-900">
                        {facility.availableBeds}
                      </strong>{' '}
                      {t('patient.beds', 'beds')}
                    </span>
                  </div>

                  <span className="text-[11px] text-red-700">
                    <strong className="font-semibold">
                      {facility.icuBedsAvailable}
                    </strong>{' '}
                    {t('patient.icu', 'ICU')}
                  </span>
                </div>

                {/* View Hospital */}
                <Link
                  to={`/patient/facilities/${facility.id}`}
                  className="mt-3 block"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full text-xs font-semibold cursor-pointer"
                  >
                    {t('patient.viewHospital', 'View Hospital')}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SANJEEVANI VOICE & HOSPITAL ASSISTANT MODAL */}
      {/* ================================================== */}
      <SmartHospitalAssistantModal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        defaultTab={activeModalTab}
      />
    </div>
  );
};
