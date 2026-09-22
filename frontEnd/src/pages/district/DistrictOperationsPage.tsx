import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_FACILITIES, INITIAL_LIVE_QUEUE } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { appointmentApi, queueApi } from '@/api/queueApi';
import { Facility } from '@/types/facility';
import { Appointment } from '@/types/queue';
import {
  Ticket,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  Stethoscope,
} from 'lucide-react';

interface OpdCounter {
  id: string;
  name: string;
  department: string;
  doctorName: string;
  nowServing: string;
  waitingCount: number;
  avgWaitMin: number;
  status: 'NORMAL' | 'BUSY' | 'CONGESTED';
}

const MOCK_OPD_COUNTERS: OpdCounter[] = [
  {
    id: 'cnt_01',
    name: 'Counter 1 (Room 4)',
    department: 'General Medicine',
    doctorName: 'Dr. Arvind Patel',
    nowServing: 'A-042',
    waitingCount: 7,
    avgWaitMin: 14,
    status: 'NORMAL',
  },
  {
    id: 'cnt_02',
    name: 'Counter 2 (Room 7)',
    department: 'Pediatrics',
    doctorName: 'Dr. Meena Parmar',
    nowServing: 'P-018',
    waitingCount: 5,
    avgWaitMin: 12,
    status: 'NORMAL',
  },
  {
    id: 'cnt_03',
    name: 'Counter 3 (Room 12)',
    department: 'Orthopedics',
    doctorName: 'Dr. Suresh Joshi',
    nowServing: 'O-015',
    waitingCount: 14,
    avgWaitMin: 36,
    status: 'CONGESTED',
  },
  {
    id: 'cnt_04',
    name: 'Counter 4 (Room 9)',
    department: 'Obstetrics & Gyn',
    doctorName: 'Dr. Neha Vaghela',
    nowServing: 'G-029',
    waitingCount: 8,
    avgWaitMin: 18,
    status: 'BUSY',
  },
  {
    id: 'cnt_05',
    name: 'Counter 5 (Room 3)',
    department: 'Pulmonology',
    doctorName: 'Dr. Anjali Mehta',
    nowServing: 'C-006',
    waitingCount: 4,
    avgWaitMin: 10,
    status: 'NORMAL',
  },
];

export const DistrictOperationsPage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('fac_civil_01');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<string>('ALL');

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setFacilities(res.data);
        setSelectedFacilityId(res.data[0].id);
      }
    }).catch(console.warn);

    appointmentApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setAppointments(res.data);
      }
    }).catch(console.warn);
  }, []);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];

  const filteredAppointments = appointments.filter((apt) => {
    if (appointmentFilter === 'ALL') return true;
    return apt.status === appointmentFilter;
  });

  const totalWaiting = MOCK_OPD_COUNTERS.reduce((acc, c) => acc + c.waitingCount, 0);
  const avgDistrictWait = Math.round(
    MOCK_OPD_COUNTERS.reduce((acc, c) => acc + c.avgWaitMin, 0) / MOCK_OPD_COUNTERS.length
  );
  const congestedCounters = MOCK_OPD_COUNTERS.filter((c) => c.status === 'CONGESTED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments & OPD Queues"
        subtitle={`Monitor outpatient queues, token progress, and wait times across district facilities.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Appointments & Queues' },
        ]}
      />

      {/* Congestion Notice if any counter is congested */}
      {congestedCounters.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900">OPD Backlog Alert</h4>
            <p className="text-amber-800">
              <strong>{congestedCounters[0].department}</strong> ({congestedCounters[0].name}) currently has{' '}
              {congestedCounters[0].waitingCount} waiting patients with an estimated wait time of{' '}
              {congestedCounters[0].avgWaitMin} minutes. Consider opening an overflow room.
            </p>
          </div>
        </div>
      )}

      {/* 3 Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tokens Issued Today</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">142</p>
          <span className="text-[11px] text-teal-700 font-medium">District OPD registrations today</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Waiting in Queue</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalWaiting} Patients</p>
          <span className="text-[11px] text-amber-700 font-medium">Average district wait: ~{avgDistrictWait} mins</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Congested Counters</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{congestedCounters.length}</p>
          <span className="text-[11px] text-rose-700 font-medium">Wait time exceeding 30 mins</span>
        </Card>
      </div>

      {/* Facility Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 px-1">
          Select Facility:
        </span>
        {INITIAL_FACILITIES.map((fac) => (
          <button
            key={fac.id}
            onClick={() => setSelectedFacilityId(fac.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFacilityId === fac.id
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {fac.name}
          </button>
        ))}
      </div>

      {/* Live OPD Counter Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Active OPD Counters at {selectedFacility.name}
          </h3>
          <span className="text-xs text-slate-500">Live token screen sync active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_OPD_COUNTERS.map((cnt) => (
            <Card
              key={cnt.id}
              className={`p-4 bg-white border transition-all ${
                cnt.status === 'CONGESTED'
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {cnt.name}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{cnt.department}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Stethoscope className="h-3 w-3 text-teal-700" />
                    <span>{cnt.doctorName}</span>
                  </p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cnt.status === 'CONGESTED'
                      ? 'bg-rose-100 text-rose-800'
                      : cnt.status === 'BUSY'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {cnt.status}
                </span>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Now Calling</span>
                  <span className="text-xl font-black text-teal-800 font-mono">{cnt.nowServing}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Waiting</span>
                  <span className="text-sm font-bold text-slate-900">{cnt.waitingCount} in line</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Est. Wait: <strong>{cnt.avgWaitMin} min</strong>
                </span>
                <span className="text-teal-700 font-medium">Counter Active</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Appointments List Section */}
      <Card className="p-5 bg-white border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today's Appointment Schedule</h3>
            <p className="text-xs text-slate-500">Booked patient visits, teleconsultations, and walk-ins</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'WAITING', 'IN_CONSULTATION', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setAppointmentFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  appointmentFilter === st
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {filteredAppointments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No appointments found for selected filter.
            </div>
          ) : (
            filteredAppointments.map((apt: any) => (
              <div key={apt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 font-mono font-bold text-teal-800 text-xs">
                    {apt.tokenNumber || 'A-01'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{apt.patientName}</span>
                      <span className="text-slate-400 font-normal">
                        ({apt.patientAge || apt.age || 45}Y • {apt.patientGender || apt.gender || 'M'})
                      </span>
                      {apt.type === 'TELECONSULT' && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-bold">
                          Video
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {apt.specialty || apt.department || 'General Medicine'} • {apt.doctorName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right text-[11px]">
                    <span className="text-slate-500 block">Slot Time</span>
                    <span className="font-semibold text-slate-800">{apt.timeSlot || apt.slot || '10:00 AM'}</span>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
