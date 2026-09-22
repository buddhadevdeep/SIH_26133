import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { appointmentApi } from '@/api/queueApi';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  FileText,
  Hash,
  RefreshCw,
  Ticket,
  AlertCircle,
} from 'lucide-react';

interface AppointmentDetailItem {
  id: string;
  facilityId: string;
  hospital: string;
  department: string;
  doctor: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  room: string;
  bookingDate: string;
  patientName: string;
  patientPhone: string;
  tokenNumber?: string;
}

const DEMO_APPOINTMENTS: AppointmentDetailItem[] = [
  {
    id: 'APT-2026-001',
    facilityId: 'fac_civil_01',
    hospital: 'Gandhinagar Civil Hospital & Medical College',
    department: 'General Medicine',
    doctor: 'Dr. Arvind Patel',
    date: '2026-09-15',
    time: '10:30 AM',
    reason: 'Routine blood sugar and blood pressure review',
    status: 'CONFIRMED',
    room: 'Room 4',
    bookingDate: '2026-09-10',
    patientName: 'Rameshwar Sharma',
    patientPhone: '9876543210',
  },
  {
    id: 'APT-2026-002',
    facilityId: 'fac_mansa_02',
    hospital: 'Mansa Community Health Centre',
    department: 'General Medicine',
    doctor: 'Dr. Mehta',
    date: '2026-08-28',
    time: '11:00 AM',
    reason: 'Fever and weakness',
    status: 'COMPLETED',
    room: 'OPD Room 2',
    bookingDate: '2026-08-25',
    patientName: 'Rameshwar Sharma',
    patientPhone: '9876543210',
  },
  {
    id: 'APT-2026-003',
    facilityId: 'fac_kalol_03',
    hospital: 'Kalol Sub-District Hospital',
    department: 'Orthopedics',
    doctor: 'Dr. Shah',
    date: '2026-07-12',
    time: '02:30 PM',
    reason: 'Knee pain check-up',
    status: 'CANCELLED',
    room: 'OPD Room 5',
    bookingDate: '2026-07-08',
    patientName: 'Rameshwar Sharma',
    patientPhone: '9876543210',
  },
];

export const AppointmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);

  // Re-fetch from API if available
  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setFacilities(res.data);
    }).catch(() => {});
  }, []);

  const [appointment, setAppointment] = useState<AppointmentDetailItem>(() => {
    // 1. Try finding in localStorage first
    const stored = localStorage.getItem('healthconnect_appointments');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const match = parsed.find((item: any) => item.id === id);
        if (match) {
          return {
            id: match.id,
            facilityId: match.facilityId || 'fac_civil_01',
            hospital: match.facilityName || 'Gandhinagar Civil Hospital & Medical College',
            department: match.specialty || 'General Medicine',
            doctor: match.doctorName || 'Dr. Arvind Patel',
            date: match.date,
            time: match.timeSlot,
            reason: match.reasonForVisit || 'Routine Consultation',
            status: match.status || 'CONFIRMED',
            room: match.room || 'Room 4',
            bookingDate: match.createdAt ? match.createdAt.split('T')[0] : '2026-09-12',
            patientName: match.patientName || 'Rameshwar Sharma',
            patientPhone: match.patientPhone || '9876543210',
            tokenNumber: match.tokenNumber,
          };
        }
      } catch (e) {}
    }

    // 2. Demo fallback
    const matchDemo = DEMO_APPOINTMENTS.find((item) => item.id === id);
    if (matchDemo) return matchDemo;

    return {
      id: id || 'APT-2026-001',
      facilityId: 'fac_civil_01',
      hospital: 'Gandhinagar Civil Hospital & Medical College',
      department: 'General Medicine',
      doctor: 'Dr. Arvind Patel',
      date: '2026-09-15',
      time: '10:30 AM',
      reason: 'Routine blood sugar and blood pressure review',
      status: 'CONFIRMED',
      room: 'Room 4',
      bookingDate: '2026-09-10',
      patientName: 'Rameshwar Sharma',
      patientPhone: '9876543210',
      tokenNumber: undefined,
    };
  });

  // Re-fetch from API if available
  useEffect(() => {
    if (!id) return;
    appointmentApi
      .getById(id)
      .then((res) => {
        if (res.data) {
          const found = res.data;
          setAppointment({
            id: found.id,
            facilityId: found.facilityId || 'fac_civil_01',
            hospital: found.facilityName || 'Gandhinagar Civil Hospital & Medical College',
            department: found.specialty || found.departmentName || 'General Medicine',
            doctor: found.doctorName || 'Dr. Arvind Patel',
            date: found.date,
            time: found.timeSlot,
            reason: found.reasonForVisit || 'Routine Consultation',
            status: found.status || 'CONFIRMED',
            room: (found as any).roomNumber || (found as any).room || 'Room 4',
            bookingDate: found.createdAt ? found.createdAt.split('T')[0] : '2026-09-12',
            patientName: found.patientName || 'Rameshwar Sharma',
            patientPhone: found.patientPhone || '9876543210',
            tokenNumber: found.tokenNumber,
          });
        }
      })
      .catch(() => {
        appointmentApi.getAll().then((res) => {
          if (res.data) {
            const found = res.data.find((a) => a.id === id);
            if (found) {
              setAppointment({
                id: found.id,
                facilityId: found.facilityId || 'fac_civil_01',
                hospital: found.facilityName || 'Gandhinagar Civil Hospital & Medical College',
                department: found.specialty || found.departmentName || 'General Medicine',
                doctor: found.doctorName || 'Dr. Arvind Patel',
                date: found.date,
                time: found.timeSlot,
                reason: found.reasonForVisit || 'Routine Consultation',
                status: found.status || 'CONFIRMED',
                room: (found as any).roomNumber || (found as any).room || 'Room 4',
                bookingDate: found.createdAt ? found.createdAt.split('T')[0] : '2026-09-12',
                patientName: found.patientName || 'Rameshwar Sharma',
                patientPhone: found.patientPhone || '9876543210',
                tokenNumber: found.tokenNumber,
              });
            }
          }
        }).catch(console.warn);
      });
  }, [id]);

  const handleCheckIn = async () => {
    if (!appointment.id) return;
    setIsCheckingIn(true);
    try {
      const res = await appointmentApi.checkIn(appointment.id);
      if (res.data) {
        setAppointment((prev: any) => ({
          ...prev,
          status: 'CHECKED_IN',
          tokenNumber: res.data.token.tokenNumber,
        }));
      }
    } catch (err) {
      console.warn('Check-in failed', err);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const facility = facilities.find(
    (item) => item.id === appointment.facilityId
  ) || INITIAL_FACILITIES.find((item) => item.id === appointment.facilityId);

  const getStatus = () => {
    switch (appointment.status) {
      case 'CHECKED_IN':
        return {
          label: 'Active in Hospital',
          text: `Checked in. OPD Queue Token #${appointment.tokenNumber || 'A-042'} is active.`,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };

      case 'CONFIRMED':
        return {
          label: 'Confirmed (Awaiting Hospital Check-in)',
          text: 'Your appointment is booked on the hospital schedule. Check in upon arrival to receive your OPD token.',
          className: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: Clock,
        };

      case 'COMPLETED':
        return {
          label: 'Completed',
          text: 'You have completed this appointment.',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: CheckCircle2,
        };

      case 'CANCELLED':
        return {
          label: 'Cancelled',
          text: 'This appointment was cancelled.',
          className: 'bg-red-50 text-red-700 border-red-200',
          icon: CheckCircle2,
        };

      default:
        return {
          label: 'Scheduled',
          text: 'Appointment details',
          className: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: CalendarDays,
        };
    }
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* =========================
          PAGE HEADER
      ========================== */}

      <PageHeader
        title="Appointment Details"
        subtitle="See all information about your hospital appointment."
        breadcrumbs={[
          { label: 'Dashboard', to: '/patient' },
          { label: 'Appointments', to: '/patient/appointments' },
          { label: 'Appointment Details' },
        ]}
        actions={
          <Link to="/patient/appointments">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      {/* =========================
          STATUS
      ========================== */}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 sm:p-5">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div className="flex items-center gap-3">

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  appointment.status === 'CONFIRMED'
                    ? 'bg-emerald-100'
                    : appointment.status === 'COMPLETED'
                    ? 'bg-blue-100'
                    : 'bg-red-100'
                }`}
              >
                <StatusIcon
                  className={`h-5 w-5 ${
                    appointment.status === 'CONFIRMED'
                      ? 'text-emerald-700'
                      : appointment.status === 'COMPLETED'
                      ? 'text-blue-700'
                      : 'text-red-600'
                  }`}
                />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Appointment Status
                </p>

                <h2 className="text-base font-bold text-slate-900">
                  {status.label}
                </h2>

                <p className="text-xs text-slate-500 mt-0.5">
                  {status.text}
                </p>
              </div>

            </div>

            <div
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
            >
              {status.label}
            </div>

          </div>

        </CardContent>
      </Card>


      {/* =========================
          APPOINTMENT DATE & TIME
      ========================== */}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 sm:p-5">

          <div className="flex items-center gap-2 mb-4">

            <CalendarDays className="h-5 w-5 text-teal-700" />

            <h2 className="text-sm font-bold text-slate-900">
              When to Visit
            </h2>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="rounded-xl bg-teal-50 border border-teal-100 p-4">

              <div className="flex items-center gap-2">

                <CalendarDays className="h-4 w-4 text-teal-700" />

                <span className="text-xs text-teal-700 font-medium">
                  Date
                </span>

              </div>

              <p className="mt-1 text-base font-bold text-slate-900">
                {appointment.date}
              </p>

            </div>


            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">

              <div className="flex items-center gap-2">

                <Clock className="h-4 w-4 text-amber-700" />

                <span className="text-xs text-amber-700 font-medium">
                  Time
                </span>

              </div>

              <p className="mt-1 text-base font-bold text-slate-900">
                {appointment.time}
              </p>

            </div>

          </div>

        </CardContent>
      </Card>


      {/* =========================
          HOSPITAL INFORMATION
      ========================== */}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 sm:p-5">

          <div className="flex items-center gap-2 mb-4">

            <Building2 className="h-5 w-5 text-teal-700" />

            <h2 className="text-sm font-bold text-slate-900">
              Hospital Information
            </h2>

          </div>

          <div className="space-y-3">

            <div>

              <p className="text-[11px] text-slate-500">
                Hospital
              </p>

              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {appointment.hospital}
              </p>

            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">

                <div className="flex items-center gap-2">

                  <Stethoscope className="h-4 w-4 text-teal-700" />

                  <div>

                    <p className="text-[10px] text-slate-400">
                      Department
                    </p>

                    <p className="text-xs font-bold text-slate-800">
                      {appointment.department}
                    </p>

                  </div>

                </div>

              </div>


              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">

                <div className="flex items-center gap-2">

                  <User className="h-4 w-4 text-teal-700" />

                  <div>

                    <p className="text-[10px] text-slate-400">
                      Doctor
                    </p>

                    <p className="text-xs font-bold text-slate-800">
                      {appointment.doctor}
                    </p>

                  </div>

                </div>

              </div>

            </div>


            <div className="flex items-center gap-2 text-xs text-slate-600">

              <MapPin className="h-4 w-4 text-teal-600 shrink-0" />

              <span>
                {facility?.address || 'Hospital address available at facility'}
              </span>

            </div>

          </div>

        </CardContent>
      </Card>


      {/* =========================
          PATIENT & VISIT DETAILS
      ========================== */}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 sm:p-5">

          <div className="flex items-center gap-2 mb-4">

            <FileText className="h-5 w-5 text-teal-700" />

            <h2 className="text-sm font-bold text-slate-900">
              Visit Details
            </h2>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">

              <p className="text-[10px] text-slate-400">
                Patient Name
              </p>

              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {appointment.patientName}
              </p>

            </div>


            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">

              <p className="text-[10px] text-slate-400">
                Phone Number
              </p>

              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {appointment.patientPhone}
              </p>

            </div>


            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">

              <p className="text-[10px] text-slate-400">
                Room / Counter
              </p>

              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {appointment.room}
              </p>

            </div>


            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">

              <p className="text-[10px] text-slate-400">
                Appointment ID
              </p>

              <div className="flex items-center gap-1.5 mt-0.5">

                <Hash className="h-3.5 w-3.5 text-slate-400" />

                <p className="text-sm font-semibold text-slate-800">
                  {appointment.id}
                </p>

              </div>

            </div>

          </div>


          {/* Reason */}

          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-3">

            <p className="text-[10px] text-slate-400">
              Reason for Visit
            </p>

            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {appointment.reason}
            </p>

          </div>

        </CardContent>
      </Card>


      {/* =========================
          SIMPLE INSTRUCTIONS
      ========================== */}

      {/* =========================
          INSTRUCTIONS & STATUS GUIDANCE
      ========================== */}

      {appointment.status === 'CONFIRMED' && (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-950">
                  Hospital Arrival & OPD Self Check-in
                </p>
                <p className="text-xs text-amber-800">
                  Your appointment slot is confirmed on the hospital roster. When you arrive at the hospital, click <strong>"Hospital Self Check-in"</strong> below to instantly receive your live OPD queue token without standing in lines.
                </p>
                <ul className="mt-2 space-y-1 text-xs text-amber-900">
                  <li>• Arrive 15 minutes before your time slot ({appointment.time}).</li>
                  <li>• Bring your ABHA card and past prescriptions if available.</li>
                  <li>• Consultation room: {appointment.room}.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {appointment.status === 'CHECKED_IN' && (
        <Card className="border-emerald-200 bg-emerald-50/70">
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-950">
                  Active in Hospital OPD Queue
                </p>
                <p className="text-xs text-emerald-800">
                  You are checked in! Live Token <strong>#{appointment.tokenNumber || 'A-042'}</strong> has been issued. Head toward <strong>{appointment.room}</strong>.
                </p>
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  Keep an eye on the waiting area displays or track live wait times using the Live Token tracker.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================
          ACTIONS
      ========================== */}

      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
        {appointment.status === 'CONFIRMED' && (
          <Button
            size="md"
            onClick={handleCheckIn}
            isLoading={isCheckingIn}
            className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold gap-1.5 cursor-pointer shadow-xs"
          >
            <Ticket className="h-4 w-4" />
            Hospital Self Check-in
          </Button>
        )}

        {appointment.status === 'CHECKED_IN' && (
          <Link to="/patient/tokens" className="flex-1">
            <Button
              size="md"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              <Ticket className="h-4 w-4" />
              Track Live Queue Token ↗
            </Button>
          </Link>
        )}

        {facility && (
          <a
            href={`tel:${facility.contactNumber}`}
            className="flex-1"
          >
            <Button
              variant="outline"
              size="md"
              className="w-full gap-1.5"
            >
              <Phone className="h-4 w-4" />
              Call Hospital
            </Button>
          </a>
        )}

        {facility && (
          <a
            href={`https://maps.google.com/?q=${facility.coordinates.lat},${facility.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              variant="outline"
              size="md"
              className="w-full gap-1.5"
            >
              <Navigation className="h-4 w-4 text-teal-700" />
              Get Directions
            </Button>
          </a>
        )}

        <Link
          to="/patient/appointments"
          className="flex-1"
        >
          <Button
            variant="outline"
            size="md"
            className="w-full gap-1.5 text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Button>
        </Link>
      </div>


      {/* Book Again */}

      {appointment.status !== 'CONFIRMED' && (

        <div className="flex justify-center pb-2">

          <Link to="/patient/appointments">

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
            >

              <RefreshCw className="h-4 w-4" />

              Book Another Appointment

            </Button>

          </Link>

        </div>

      )}

    </div>
  );
};