import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage, supportedLanguages } from '@/locales/i18n';
import { mockState } from '@/mock/db';
import { operationsApi } from '@/api/operationsApi';
import { directoryApi } from '@/api/directoryApi';
import { authApi } from '@/api/authApi';
import { DoctorLeave, DistrictDoctor } from '@/types/admin';
import { AVAILABLE_HOSPITALS } from '@/contexts/LocationContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import {
  UserCheck,
  Calendar,
  CalendarDays,
  Clock,
  Shield,
  Stethoscope,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
  Heart,
  FileText,
  Save,
  Check,
  Loader2,
  FileEdit,
  XCircle,
  CalendarX,
  Users,
  Activity,
  Pill,
  Award,
  Layers,
  Sparkles,
  QrCode,
  Landmark,
  FileSpreadsheet,
} from 'lucide-react';

// District Metadata for realistic administrative profiles
interface DistrictProfileMeta {
  headquarters: string;
  talukas: string[];
  officeAddress: string;
  population: string;
  facilitiesCount: number;
  doctorsCount: number;
  janAushadhiCount: number;
  phcCount: number;
  cadreCode: string;
}

const DISTRICT_PROFILES: Record<string, DistrictProfileMeta> = {
  Rajkot: {
    headquarters: 'Rajkot City',
    talukas: [
      'Rajkot City',
      'Gondal',
      'Jetpur',
      'Jasdan',
      'Dhoraji',
      'Upleta',
      'Kotda Sangani',
      'Lodhika',
      'Paddhari',
      'Jamkandorna',
      'Vinchhiya',
    ],
    officeAddress: 'District Health Society, CDHO Office, Jilla Panchayat Bhavan, Race Course Road, Rajkot - 360001',
    population: '3,842,000',
    facilitiesCount: 8,
    doctorsCount: 42,
    janAushadhiCount: 18,
    phcCount: 64,
    cadreCode: 'GJ-CDHO-RJK-01',
  },
  Gandhinagar: {
    headquarters: 'Gandhinagar (Sector 11)',
    talukas: ['Gandhinagar', 'Kalol', 'Mansa', 'Dehgam', 'Pethapur'],
    officeAddress: 'District Health Society, Block 1, Jilla Seva Sadan, Sector 11, Gandhinagar - 382011',
    population: '1,438,000',
    facilitiesCount: 14,
    doctorsCount: 86,
    janAushadhiCount: 24,
    phcCount: 52,
    cadreCode: 'GJ-CDHO-GND-01',
  },
  Ahmedabad: {
    headquarters: 'Ahmedabad (Asarwa / Old City)',
    talukas: ['Ahmedabad City', 'Daskroi', 'Sanand', 'Bavla', 'Dholka', 'Viramgam', 'Mandal', 'Detroj', 'Dhandhuka'],
    officeAddress: 'Chief District Health Office, Jilla Panchayat Bhavan, Lal Darwaja, Ahmedabad - 380001',
    population: '8,450,000',
    facilitiesCount: 28,
    doctorsCount: 240,
    janAushadhiCount: 68,
    phcCount: 120,
    cadreCode: 'GJ-CDHO-AHD-01',
  },
  Surat: {
    headquarters: 'Surat (Majura Gate)',
    talukas: ['Surat City', 'Bardoli', 'Choryasi', 'Kamrej', 'Mahuva', 'Mandvi', 'Mangrol', 'Olpad', 'Palsana', 'Umarpada'],
    officeAddress: 'District Health Society, CDHO Office, Ring Road, Surat - 395002',
    population: '6,520,000',
    facilitiesCount: 22,
    doctorsCount: 180,
    janAushadhiCount: 45,
    phcCount: 98,
    cadreCode: 'GJ-CDHO-SRT-01',
  },
  Vadodara: {
    headquarters: 'Vadodara (Sayajigunj)',
    talukas: ['Vadodara City', 'Padra', 'Dabhoi', 'Karjan', 'Sinor', 'Savli', 'Vaghodia', 'Desar'],
    officeAddress: 'Chief District Health Office, Jilla Panchayat, Kothi Compound, Vadodara - 390001',
    population: '4,210,000',
    facilitiesCount: 16,
    doctorsCount: 125,
    janAushadhiCount: 32,
    phcCount: 76,
    cadreCode: 'GJ-CDHO-VDR-01',
  },
  Bhavnagar: {
    headquarters: 'Bhavnagar (Kalanala)',
    talukas: ['Bhavnagar', 'Sihor', 'Umrala', 'Gadhada', 'Botad', 'Palitana', 'Talaja', 'Mahuva', 'Vallabhipur', 'Jesar'],
    officeAddress: 'CDHO Office, Jilla Panchayat, Kalanala, Bhavnagar - 364001',
    population: '2,880,000',
    facilitiesCount: 10,
    doctorsCount: 68,
    janAushadhiCount: 20,
    phcCount: 58,
    cadreCode: 'GJ-CDHO-BHV-01',
  },
  Jamnagar: {
    headquarters: 'Jamnagar (GG Hospital Road)',
    talukas: ['Jamnagar', 'Lalpur', 'Jamjodhpur', 'Jodiya', 'Dhrol', 'Kalavad'],
    officeAddress: 'District Health Society, Jilla Panchayat, Jamnagar - 361001',
    population: '2,160,000',
    facilitiesCount: 9,
    doctorsCount: 56,
    janAushadhiCount: 16,
    phcCount: 48,
    cadreCode: 'GJ-CDHO-JAM-01',
  },
  Junagadh: {
    headquarters: 'Junagadh (Zanzarda Road)',
    talukas: ['Junagadh', 'Keshod', 'Mangrol', 'Manavadar', 'Maliya Hatina', 'Mendarda', 'Visavadar', 'Bhesan', 'Vanthali'],
    officeAddress: 'CDHO Office, Jilla Seva Sadan, Junagadh - 362001',
    population: '1,980,000',
    facilitiesCount: 8,
    doctorsCount: 48,
    janAushadhiCount: 14,
    phcCount: 44,
    cadreCode: 'GJ-CDHO-JND-01',
  },
};

export const UserProfilePage: React.FC = () => {
  const { user, role, staffSubType, updateUser } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isDoctor = role === 'DOCTOR';
  const isDistrictAdmin = role === 'DISTRICT_ADMIN';
  const isFacilityStaff = role === 'FACILITY_STAFF' || role === 'HOSPITAL_ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isPatient = role === 'PATIENT';
  const isAsha = role === 'ASHA';

  // Active user's district with fallback
  const userDistrict = user?.district || 'Rajkot';
  const districtMeta: DistrictProfileMeta = DISTRICT_PROFILES[userDistrict] || {
    headquarters: `${userDistrict} City`,
    talukas: [`${userDistrict} Central`, `${userDistrict} Rural`, `${userDistrict} North`, `${userDistrict} South`],
    officeAddress: `District Health Society, CDHO Office, Jilla Panchayat Bhavan, ${userDistrict}, Gujarat`,
    population: '2,500,000',
    facilitiesCount: 10,
    doctorsCount: 55,
    janAushadhiCount: 16,
    phcCount: 50,
    cadreCode: `GJ-CDHO-${userDistrict.slice(0, 3).toUpperCase()}-01`,
  };

  // Facilities in the user's district
  const districtFacilities = useMemo(() => {
    return AVAILABLE_HOSPITALS.filter((h) => h.district.toLowerCase() === userDistrict.toLowerCase());
  }, [userDistrict]);

  // Initial Tab selection
  const initialTab =
    location.pathname.includes('/roster') || searchParams.get('tab') === 'roster'
      ? 'roster'
      : searchParams.get('tab') || 'personal';

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // FORM STATE: Personal & Demographics
  // -------------------------------------------------------------
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState<number | string>(user?.age || '');
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>((user?.gender as any) || 'M');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'B+');
  const [address, setAddress] = useState(
    user?.address ||
      (isDistrictAdmin
        ? districtMeta.officeAddress
        : `${userDistrict}, Gujarat`)
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    user?.emergencyContactName || ''
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    user?.emergencyContactPhone || ''
  );
  const [bio, setBio] = useState(
    user?.bio ||
      (isDistrictAdmin
        ? `Chief District Health Officer (CDHO) leading public health infrastructure, disease surveillance, PM-JAY & ABHA implementation, and emergency response across ${userDistrict} District.`
        : isDoctor
        ? 'Senior Consultant Medical Officer serving public healthcare with dedication.'
        : isFacilityStaff
        ? `Hospital operations and clinical management officer at ${user?.facilityName || 'District Healthcare Facility'}.`
        : isSuperAdmin
        ? 'Apex State Health Command Officer governing the digital healthcare grid across Gujarat.'
        : 'Registered public health portal citizen user.')
  );

  // -------------------------------------------------------------
  // FORM STATE: Professional Credentials & Governance
  // -------------------------------------------------------------
  const [qualification, setQualification] = useState(
    user?.qualification ||
      (isDistrictAdmin
        ? 'MBBS, MD (Community Medicine / Public Health), PGDHM'
        : isDoctor
        ? 'MBBS, MD (Medicine), DM (Cardiology)'
        : '')
  );
  const [specialty, setSpecialty] = useState(
    user?.specialty ||
      (isDistrictAdmin
        ? 'Public Health Administration & Epidemiology'
        : isDoctor
        ? 'Cardiology & Internal Medicine'
        : '')
  );
  const [licenseNumber, setLicenseNumber] = useState(
    user?.licenseNumber ||
      (isDistrictAdmin
        ? `GMC-PUB-${userDistrict.slice(0, 3).toUpperCase()}-2012-9021`
        : isDoctor
        ? 'GMC-MED-2018-88421'
        : 'GOV-ID-99214')
  );
  const [employeeId, setEmployeeId] = useState(
    user?.employeeId || (isDistrictAdmin ? districtMeta.cadreCode : 'GJ-HFW-8491')
  );
  const [designation, setDesignation] = useState(
    user?.designation ||
      (isDistrictAdmin
        ? 'Chief District Health Officer (CDHO)'
        : isDoctor
        ? 'Senior Consultant & Medical Officer'
        : isFacilityStaff
        ? staffSubType ? staffSubType.replace('_', ' ') : 'Operations Officer'
        : isSuperAdmin
        ? 'State Apex Administrator'
        : 'Registered Citizen')
  );
  const [opdRoom, setOpdRoom] = useState('Room 104 (Ground Floor OPD)');
  const [teleconsultEnabled, setTeleconsultEnabled] = useState(true);

  // -------------------------------------------------------------
  // DOCTOR DUTY & ROSTER STATE
  // -------------------------------------------------------------
  const doctorKey = user?.id || 'usr_doc_01';
  const [dutyStatus, setDutyStatus] = useState<DistrictDoctor['status']>(() => {
    if (!isDoctor) return 'ON_DUTY';
    const check = mockState.isDoctorOnLeave(doctorKey);
    return check.onLeave ? 'ON_LEAVE' : 'ON_DUTY';
  });

  const [leaves, setLeaves] = useState<DoctorLeave[]>(() => {
    return mockState.getDoctorLeaves(doctorKey);
  });

  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 8, 1)); // September 2026

  // Leave Declaration Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [leaveEndDate, setLeaveEndDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [leaveCategory, setLeaveCategory] = useState<DoctorLeave['category']>('CASUAL');
  const [leaveReason, setLeaveReason] = useState('');
  const [handoverDoctor, setHandoverDoctor] = useState('Dr. Meena Parmar');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.phone || '9876505678');
  const [leaveNotes, setLeaveNotes] = useState('');
  const [applyingLeave, setApplyingLeave] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [leaveImpactPreview, setLeaveImpactPreview] = useState<{
    loading: boolean;
    affectedAppointmentsCount: number;
    coverageStatus: string;
    doctorsRemaining: number;
  }>({
    loading: false,
    affectedAppointmentsCount: 0,
    coverageStatus: 'ADEQUATE',
    doctorsRemaining: 1,
  });

  // Pre-submission impact preview
  useEffect(() => {
    if (!showLeaveModal || !leaveStartDate || !leaveEndDate) return;
    let isMounted = true;
    setLeaveImpactPreview((prev) => ({ ...prev, loading: true }));
    operationsApi
      .getLeaveImpact(doctorKey, leaveStartDate, leaveEndDate, user?.facilityId || 'fac_civil_01')
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setLeaveImpactPreview({
            loading: false,
            affectedAppointmentsCount: res.data.affectedAppointments?.length || 0,
            coverageStatus: res.data.coverageStatus,
            doctorsRemaining: res.data.availableDoctorsDuringPeriod,
          });
        }
      })
      .catch(() => {
        if (isMounted) setLeaveImpactPreview((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      isMounted = false;
    };
  }, [showLeaveModal, leaveStartDate, leaveEndDate, doctorKey, user?.facilityId]);

  // Weekly OPD Schedule
  const [weeklySchedule] = useState({
    monday: '09:00 AM – 01:00 PM',
    tuesday: '09:00 AM – 01:00 PM',
    wednesday: '09:00 AM – 01:00 PM',
    thursday: '09:00 AM – 01:00 PM',
    friday: '09:00 AM – 01:00 PM',
    saturday: '09:00 AM – 12:30 PM',
  });

  // Sync user changes when auth context updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      if (user.age) setAge(user.age);
      if (user.gender) setGender(user.gender);
      if (user.bloodGroup) setBloodGroup(user.bloodGroup);
      if (user.qualification) setQualification(user.qualification);
      if (user.specialty) setSpecialty(user.specialty);
      if (user.licenseNumber) setLicenseNumber(user.licenseNumber);
      if (user.employeeId) setEmployeeId(user.employeeId);
      if (user.designation) setDesignation(user.designation);
      if (user.bio) setBio(user.bio);
      if (user.address) setAddress(user.address);
      if (user.emergencyContactName) setEmergencyContactName(user.emergencyContactName);
      if (user.emergencyContactPhone) setEmergencyContactPhone(user.emergencyContactPhone);
    }
  }, [user]);

  const refreshDoctorRoster = () => {
    const activeLeaves = mockState.getDoctorLeaves(doctorKey);
    setLeaves([...activeLeaves]);
    const check = mockState.isDoctorOnLeave(doctorKey);
    setDutyStatus(check.onLeave ? 'ON_LEAVE' : 'ON_DUTY');
  };

  // -------------------------------------------------------------
  // SAVE PERSONAL PROFILE HANDLER
  // -------------------------------------------------------------
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const updates = {
      name,
      phone,
      email,
      age: Number(age) || undefined,
      gender: gender as any,
      bloodGroup,
      address,
      emergencyContactName,
      emergencyContactPhone,
      bio,
      designation,
    };

    updateUser(updates);

    try {
      await authApi.updateProfile(updates);
      if (isDoctor) {
        await directoryApi.updateDoctor(doctorKey, { name, phone, email }).catch(console.warn);
        mockState.updateDoctor(doctorKey, { name, phone, email });
      }
      showToast('Profile information successfully saved & synchronized with health registry.');
    } catch (err) {
      console.warn('Backend sync note:', err);
      showToast('Profile updated locally.');
    } finally {
      setSavingProfile(false);
    }
  };

  // -------------------------------------------------------------
  // SAVE CREDENTIALS HANDLER
  // -------------------------------------------------------------
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const updates = {
      qualification,
      specialty,
      licenseNumber,
      employeeId,
      designation,
    };

    updateUser(updates);

    try {
      await authApi.updateProfile(updates);
      if (isDoctor) {
        await directoryApi.updateDoctor(doctorKey, {
          qualification,
          specialty,
          teleconsultEnabled,
        }).catch(console.warn);
        mockState.updateDoctor(doctorKey, {
          qualification,
          specialty,
          teleconsultEnabled,
        });
      }
      showToast('Official credentials & governance records updated successfully.');
    } catch (err) {
      console.warn('Backend sync note:', err);
      showToast('Credentials saved locally.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Doctor Quick Duty Status Toggle
  const handleDutyToggle = (newStatus: DistrictDoctor['status']) => {
    setDutyStatus(newStatus);
    directoryApi.updateDoctorStatus(doctorKey, newStatus).catch(console.warn);
    mockState.updateDoctorStatus(doctorKey, newStatus);
    showToast(`Duty status updated to: ${newStatus.replace('_', ' ')}`);
  };

  // Leave Submit
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      alert('Please specify both start and end dates for your leave.');
      return;
    }
    if (!leaveReason.trim()) {
      alert('Please provide a reason / description for your leave.');
      return;
    }

    setApplyingLeave(true);
    try {
      const res = await operationsApi.applyLeave({
        doctorId: doctorKey,
        doctorName: user?.name || 'Dr. Arvind Patel',
        facilityId: user?.facilityId || 'fac_civil_01',
        facilityName: user?.facilityName || 'Civil Hospital',
        department: user?.specialty || 'Cardiology',
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        category: leaveCategory,
        reason: leaveReason.trim(),
        status: 'PENDING',
        handoverDoctorName: handoverDoctor,
        emergencyContact: emergencyPhone,
        notes: leaveNotes.trim(),
      });

      if (res.success) {
        setShowLeaveModal(false);
        setLeaveReason('');
        setLeaveNotes('');
        refreshDoctorRoster();
        showToast('Leave request submitted to Facility Operations for coverage review.');
      } else {
        alert(res.message || 'Failed to submit leave request');
      }
    } catch (err: any) {
      alert(err?.message || 'Error submitting leave request');
    } finally {
      setApplyingLeave(false);
    }
  };

  // Cancel Leave
  const handleCancelLeave = async (leaveId: string) => {
    if (window.confirm('Are you sure you want to cancel / withdraw this leave? Your OPD clinical availability will be restored.')) {
      try {
        await operationsApi.cancelLeave(leaveId, user?.name || 'Doctor');
        refreshDoctorRoster();
        showToast('Leave schedule withdrawn. OPD availability restored.');
      } catch (err: any) {
        alert(err?.message || 'Failed to cancel leave schedule.');
      }
    }
  };

  // Calendar generation logic
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const changeMonth = (offset: number) => {
    setCalendarDate(new Date(year, month + offset, 1));
  };

  const getDayLeaveInfo = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.find((l) => {
      if (l.status === 'CANCELLED') return false;
      return dateStr >= l.startDate && dateStr <= l.endDate;
    });
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const handleCalendarDateClick = (dateStr: string) => {
    if (dateStr > todayStr) {
      setLeaveStartDate(dateStr);
      setLeaveEndDate(dateStr);
      setShowLeaveModal(true);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-3 animate-fadeIn border border-emerald-400">
          <CheckCircle2 className="h-5 w-5 text-emerald-100 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* HERO PROFILE HEADER (Role-Customized Banner)                */}
      {/* ----------------------------------------------------------- */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border ${
          isDistrictAdmin
            ? 'bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 border-indigo-700/50'
            : isDoctor
            ? 'bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 border-teal-700/50'
            : isSuperAdmin
            ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border-purple-700/50'
            : isFacilityStaff
            ? 'bg-gradient-to-r from-amber-950 via-stone-900 to-slate-900 border-amber-700/50'
            : 'bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-emerald-700/50'
        }`}
      >
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Initials */}
            <div className="relative">
              <div
                className={`flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl text-white font-extrabold text-2xl sm:text-3xl shadow-xl ring-4 ring-white/20 ${
                  isDistrictAdmin
                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600'
                    : isDoctor
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-600'
                    : isSuperAdmin
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    : isFacilityStaff
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HC'}
              </div>
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 ring-2 ring-slate-950 flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            {/* Profile Identity & Official Badges */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {user?.name || (isDistrictAdmin ? 'Chief District Health Officer' : 'Public Health User')}
                </h1>

                {/* Primary Cadre Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 uppercase tracking-wide">
                  <Shield className="h-3 w-3 text-indigo-300" />
                  {isDistrictAdmin
                    ? 'Chief District Health Officer (CDHO)'
                    : isFacilityStaff && staffSubType
                    ? staffSubType.replace('_', ' ')
                    : role?.replace('_', ' ')}
                </span>

                {/* District Badge */}
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  <MapPin className="h-3 w-3 text-indigo-300" />
                  {userDistrict} District
                </span>

                {isDoctor && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      dutyStatus === 'ON_LEAVE'
                        ? 'bg-rose-500/30 text-rose-200 border-rose-400/40'
                        : dutyStatus === 'IN_OPD'
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400/40'
                        : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {dutyStatus.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Sub-details line */}
              <p className="text-xs text-slate-200/90 font-medium flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                {isDistrictAdmin ? (
                  <>
                    <span className="flex items-center gap-1">
                      <Landmark className="h-3.5 w-3.5 text-indigo-300" />
                      Department of Health & Family Welfare, Govt. of Gujarat
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-amber-300" />
                      Cadre ID: {employeeId || districtMeta.cadreCode}
                    </span>
                  </>
                ) : user?.facilityName ? (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-teal-300" />
                    {user.facilityName}
                  </span>
                ) : null}

                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-300" />
                    +91 {user.phone}
                  </span>
                )}
              </p>

              {user?.abhaId && (
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold bg-white/10 px-2.5 py-1 rounded-lg text-teal-100 border border-white/10">
                    <QrCode className="h-3 w-3 text-teal-300" />
                    ABHA ID: {user.abhaId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* District Admin Quick Stat Overview in Hero */}
          {isDistrictAdmin && (
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-indigo-700/60 backdrop-blur-md self-stretch sm:self-auto min-w-[260px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1.5 flex items-center justify-between">
                <span>{userDistrict} Health Command Scope</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-lg font-black text-white">{districtMeta.facilitiesCount}</span>
                  <span className="text-[10px] font-medium text-indigo-200 block">Hospitals & CHCs</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-lg font-black text-white">{districtMeta.doctorsCount}</span>
                  <span className="text-[10px] font-medium text-indigo-200 block">Active Clinicians</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Doctor Duty Status Toggle */}
          {isDoctor && (
            <div className="bg-teal-950/70 p-3.5 rounded-2xl border border-teal-700/60 backdrop-blur-md self-stretch sm:self-auto min-w-[240px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block mb-2">
                Live Doctor Duty Status
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDutyToggle('ON_DUTY')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dutyStatus === 'ON_DUTY'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white/10 text-teal-100 hover:bg-white/20'
                  }`}
                >
                  On Duty
                </button>
                <button
                  type="button"
                  onClick={() => handleDutyToggle('IN_OPD')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dutyStatus === 'IN_OPD'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white/10 text-teal-100 hover:bg-white/20'
                  }`}
                >
                  In OPD
                </button>
                <button
                  type="button"
                  onClick={() => handleDutyToggle('IN_SURGERY')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dutyStatus === 'IN_SURGERY'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/10 text-teal-100 hover:bg-white/20'
                  }`}
                >
                  In Surgery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDutyToggle('ON_LEAVE');
                    setActiveTab('roster');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dutyStatus === 'ON_LEAVE'
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                      : 'bg-white/10 text-teal-100 hover:bg-white/20'
                  }`}
                >
                  On Leave
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* DISTRICT TELEMETRY METRIC STRIP (For District Admin)        */}
      {/* ----------------------------------------------------------- */}
      {isDistrictAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{districtMeta.facilitiesCount}</p>
              <p className="text-[11px] font-semibold text-slate-500">Public Hospitals</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{districtMeta.doctorsCount}</p>
              <p className="text-[11px] font-semibold text-slate-500">Doctors on Duty</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{districtMeta.janAushadhiCount}</p>
              <p className="text-[11px] font-semibold text-slate-500">Jan Aushadhi Depots</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{districtMeta.population}</p>
              <p className="text-[11px] font-semibold text-slate-500">Citizens Served</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{districtMeta.talukas.length} Talukas</p>
              <p className="text-[11px] font-semibold text-slate-500">Blocks in {userDistrict}</p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* NAVIGATION TABS                                              */}
      {/* ----------------------------------------------------------- */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'personal'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>{isDistrictAdmin ? 'Official Identity & Contact' : 'Personal & Contact Info'}</span>
        </button>

        {isDistrictAdmin && (
          <button
            onClick={() => setActiveTab('jurisdiction')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'jurisdiction'
                ? 'border-indigo-700 text-indigo-900 bg-indigo-50/60 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="h-4 w-4 text-indigo-600" />
            <span>{userDistrict} Jurisdiction & Health Network</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'credentials'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Credentials & Governance</span>
        </button>

        {isDoctor && (
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'border-teal-700 text-teal-900 bg-teal-50/60 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4 text-emerald-600" />
            <span className="flex items-center gap-1.5">
              Month Planner & Leaves
              {dutyStatus === 'ON_LEAVE' && (
                <span className="h-2 w-2 rounded-full bg-rose-500" />
              )}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Security & Language</span>
        </button>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* TAB 1: PERSONAL & CONTACT INFORMATION                       */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'personal' && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>
                {isDistrictAdmin
                  ? `Chief District Health Officer — ${userDistrict} District Administrative Profile`
                  : 'Personal Details & Official Information'}
              </span>
              <span className="text-xs font-normal text-slate-500">
                Updates sync live with HealthConnect and state directory records.
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSavePersonal} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Official Full Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    className="h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Official Cadre / Designation</label>
                  <Input
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    required
                    placeholder="e.g. Chief District Health Officer"
                    className="h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Official Mobile Phone (+91)</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="10 digit mobile number"
                    className="h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Official Government Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="cdho.rajkot@gujarat.gov.in"
                    className="h-10 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Age</label>
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Years"
                      className="h-10 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'Other')}
                      className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 shadow-2xs cursor-pointer"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 shadow-2xs cursor-pointer"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Assigned District Health Headquarters</label>
                  <Input
                    disabled
                    value={`${userDistrict} District Health Society (${districtMeta.headquarters})`}
                    className="h-10 text-xs font-bold bg-slate-50 text-indigo-900"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">
                    {isDistrictAdmin ? 'Official CDHO Headquarters / Office Postal Address' : 'Residential / Postal Address'}
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter complete postal address"
                    className="h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Emergency / Deputy Contact Person</label>
                  <Input
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="e.g. Additional District Health Officer / Next of Kin"
                    className="h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Emergency Contact Number</label>
                  <Input
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 Phone number"
                    className="h-10 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Executive Public Health Leadership Summary</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description of administrative leadership, clinical experience, or public health responsibilities"
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs gap-2 px-6 h-10 shadow-sm cursor-pointer"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile Details
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB: DISTRICT JURISDICTION & HEALTH NETWORK (District Admin) */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'jurisdiction' && isDistrictAdmin && (
        <div className="space-y-6">
          {/* Mandate & Jurisdiction Card */}
          <Card className="border-indigo-200 shadow-sm bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40">
            <CardHeader className="border-b border-indigo-100 pb-4">
              <CardTitle className="text-base font-bold text-indigo-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-indigo-700" />
                  <span>{userDistrict} District Health Society Jurisdiction Scope</span>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-600 text-white shadow-xs">
                  Gazetted Class-I Mandate
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Governing State Body</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">Health & Family Welfare Dept, Gujarat</p>
                  <p className="text-xs text-slate-500 mt-0.5">Commissioner of Health, Sachivalaya, Gandhinagar</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">District Headquarters</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{districtMeta.headquarters}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{districtMeta.officeAddress}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Officer Cadre Reference</p>
                  <p className="text-sm font-bold font-mono text-indigo-950 mt-1">{districtMeta.cadreCode}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Appointed Public Health Nodal Officer</p>
                </div>
              </div>

              {/* Statutory Health Portfolios */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-700" />
                  <span>Statutory Health Portfolios & Executive Delegations</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      NHM District Mission Director
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Autonomous budget allocation for CHCs, maternal care, and sub-centers in {userDistrict}.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Epidemic Diseases Controller
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Statutory power under Epidemic Diseases Act 1897 & IDSP outbreak rapid-response containment.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      PM-JAY & ABHA Nodal Authority
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Ayushman Bharat digital hospital empanelment, claim approvals, and citizen health ID linkage.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Clinical Establishments Registrar
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Inspection and licensing of private clinics, pathology labs, and nursing homes in {userDistrict}.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Jan Aushadhi & Drug Supply
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Supervision of {districtMeta.janAushadhiCount} Jan Aushadhi generic dispensaries and buffer reserves.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      108 Emergency Grid Zonal Lead
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Coordination with Gujarat EMRI 108 ambulance fleet and trauma center bed availability.
                    </p>
                  </div>
                </div>
              </div>

              {/* Administrative Talukas / Blocks */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-700" />
                  <span>Administrative Talukas / Blocks under {userDistrict} Health Society</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {districtMeta.talukas.map((taluka, idx) => (
                    <span
                      key={taluka}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-950 flex items-center gap-1.5"
                    >
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      {taluka}
                      <span className="text-[10px] font-normal text-indigo-600 ml-1">Block #{idx + 1}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* District Health Facilities Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-700" />
                  <span>Active Public Healthcare Facilities in {userDistrict}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {districtFacilities.map((fac) => (
                    <div
                      key={fac.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{fac.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{fac.address}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            {fac.typeBadge}
                          </span>
                          {fac.availableBeds !== undefined && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {fac.availableBeds} Active Beds
                            </span>
                          )}
                          {fac.emergency24x7 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                              24x7 Trauma
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 2: CREDENTIALS & GOVERNANCE                             */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'credentials' && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Professional Credentials & Deployment Governance</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                Active Role: {role}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveCredentials} className="space-y-6">
              {/* District Admin Credentials */}
              {isDistrictAdmin && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
                    <Shield className="h-5 w-5 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-indigo-950">
                        Chief District Health Officer (CDHO) Gazetted Cadre Credentials
                      </p>
                      <p className="text-indigo-800 mt-1">
                        Empowered under the Government of Gujarat Health & Family Welfare Department notification to administer all secondary hospitals, CHCs, primary health centres, drug stores, and clinical registries throughout {userDistrict} District.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Gazetted Officer Cadre ID</label>
                      <Input
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="h-10 text-xs font-semibold font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">District Health Jurisdiction</label>
                      <Input
                        disabled
                        value={`${userDistrict} District Health Authority`}
                        className="h-10 text-xs font-bold bg-slate-50 text-indigo-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Medical Council Registration / Officer License</label>
                      <Input
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="h-10 text-xs font-semibold font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Highest Qualifications & Public Health Fellowships</label>
                      <Input
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="e.g. MBBS, MD (Community Medicine), PGDHM"
                        className="h-10 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Specialization & Health Focus</label>
                      <Input
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="e.g. Public Health Administration, Epidemiology & Maternal Healthcare"
                        className="h-10 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor-Specific Credentials */}
              {isDoctor && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3">
                    <Stethoscope className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-teal-900">
                      <p className="font-bold">Gujarat Medical Council (GMC) & National Medical Commission (NMC)</p>
                      <p className="text-teal-700 mt-0.5">
                        These credentials verify your authority to issue electronic prescriptions, certify clinical referrals, and supervise public OPD services.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">State Medical Council Registration No.</label>
                      <Input
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. GMC-MED-2018-88421"
                        className="h-10 text-xs font-semibold font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Clinical Specialty / Department</label>
                      <Input
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="e.g. Cardiology & Internal Medicine"
                        className="h-10 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Highest Qualifications & Fellowships</label>
                      <Input
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="e.g. MBBS, MD (Medicine), DM (Cardiology)"
                        className="h-10 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Assigned OPD Consultation Room</label>
                      <Input
                        value={opdRoom}
                        onChange={(e) => setOpdRoom(e.target.value)}
                        placeholder="e.g. Room 104 (Ground Floor OPD)"
                        className="h-10 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Department / Employee Code</label>
                      <Input
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. GJ-HFW-8491"
                        className="h-10 text-xs font-semibold font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Teleconsultation Availability</p>
                        <p className="text-[11px] text-slate-500">Enable remote citizen video consultations</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={teleconsultEnabled}
                        onChange={(e) => setTeleconsultEnabled(e.target.checked)}
                        className="h-5 w-5 rounded-md accent-teal-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Facility Staff Credentials */}
              {isFacilityStaff && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-amber-700 shrink-0" />
                    <div>
                      <p className="font-bold">Hospital Facility Operational Station</p>
                      <p className="text-amber-700 mt-0.5">
                        Designated role: {staffSubType ? staffSubType.replace('_', ' ') : 'Hospital Staff'} at {user?.facilityName || 'Civil Hospital'} ({userDistrict} District).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Staff Badge ID</label>
                      <Input
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="h-10 text-xs font-semibold font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Assigned Desk / Operational Counter</label>
                      <Input
                        value="Counter #02 (Ambulatory OPD Registration & ABHA)"
                        className="h-10 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Super Admin Credentials */}
              {isSuperAdmin && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-3">
                    <Shield className="h-5 w-5 text-purple-700 shrink-0" />
                    <div>
                      <p className="font-bold">HealthConnect Apex State Super Administrator</p>
                      <p className="text-purple-700 mt-0.5">
                        Root privileges across all 33 Gujarat districts, doctor registries, database audit trails, and high-availability health grids.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Credentials */}
              {isPatient && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-teal-700 shrink-0" />
                    <div>
                      <p className="font-bold">Ayushman Bharat Digital Health Account (ABHA)</p>
                      <p className="text-teal-700 mt-0.5">
                        Linked to your 14-digit national health identity: {user?.abhaId || '14-8921-3409-7721'}. Health records are encrypted and patient-consented.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ASHA Credentials */}
              {isAsha && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center gap-3">
                    <Heart className="h-5 w-5 text-teal-700 shrink-0" />
                    <div>
                      <p className="font-bold">National Health Mission (NHM) Accredited Social Health Activist</p>
                      <p className="text-teal-700 mt-0.5">
                        Authorized frontline health worker conducting door-to-door screenings, maternal checkups, and referral linkage in {userDistrict}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs gap-2 px-6 h-10 shadow-sm cursor-pointer"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Credentials
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 3: DOCTOR MONTH PLANNER & LEAVE SCHEDULE                */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'roster' && isDoctor && (
        <div className="space-y-6">
          {dutyStatus === 'ON_LEAVE' && (
            <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                      Doctor Currently On Leave
                    </span>
                    <span className="text-xs text-rose-100">Patient OPD booking is paused</span>
                  </div>
                  <p className="text-sm font-bold mt-1">
                    {leaves.find((l) => l.status === 'APPROVED' && todayStr >= l.startDate && todayStr <= l.endDate)?.reason ||
                      'Scheduled leave period active.'}
                  </p>
                  <p className="text-xs text-rose-100 mt-0.5">
                    District Health Directory and OPD counters show status as <span className="font-bold underline">"ON LEAVE"</span>.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => handleDutyToggle('ON_DUTY')}
                size="sm"
                className="bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs shrink-0 cursor-pointer shadow"
              >
                End Leave Early & Resume OPD
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-teal-700" />
                <span>Monthly Clinical Roster & Availability Planner</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Plan leave days or summits so patients and {userDistrict} administrators know your schedule.
              </p>
            </div>

            <Button
              onClick={() => setShowLeaveModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 h-10 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Plan / Declare Leave
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMonth(-1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-bold text-slate-900 min-w-[140px] text-center">
                    {monthNames[month]} {year}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMonth(1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-semibold flex-wrap">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    <Plus className="h-3 w-3" /> Click any date after today to apply leave
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    OPD Active
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    On Leave
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-20 rounded-xl bg-slate-50/50 border border-transparent" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNumber = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;
                    const isFuture = dateStr > todayStr;
                    const dayLeave = getDayLeaveInfo(dayNumber);
                    const isSunday = (firstDayIndex + i) % 7 === 0;

                    return (
                      <div
                        key={dayNumber}
                        onClick={() => {
                          if (isFuture) {
                            handleCalendarDateClick(dateStr);
                          }
                        }}
                        className={`h-20 p-1.5 rounded-xl border transition-all flex flex-col justify-between text-left select-none ${
                          dayLeave
                            ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-200 cursor-pointer hover:border-rose-400'
                            : isToday
                            ? 'bg-teal-50/90 border-teal-400 ring-2 ring-teal-200'
                            : isFuture
                            ? 'bg-white border-slate-200 hover:border-teal-500 hover:ring-2 hover:ring-teal-200 hover:bg-teal-50/50 cursor-pointer group'
                            : isSunday
                            ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                            : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-extrabold ${
                              isToday
                                ? 'h-5 w-5 rounded-full bg-teal-800 text-white flex items-center justify-center'
                                : dayLeave
                                ? 'text-rose-900'
                                : isFuture
                                ? 'text-slate-800 group-hover:text-teal-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {dayNumber}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-bold text-teal-800 uppercase">
                              Today
                            </span>
                          )}
                          {isFuture && !dayLeave && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-extrabold text-teal-700 bg-teal-100 px-1 py-0.5 rounded">
                              + Leave
                            </span>
                          )}
                        </div>

                        {dayLeave ? (
                          <div
                            className="bg-rose-200/80 text-rose-950 p-1 rounded-md text-[9px] font-bold truncate leading-tight border border-rose-300/80"
                            title={`${dayLeave.category}: ${dayLeave.reason}`}
                          >
                            🏖️ {dayLeave.category}
                          </div>
                        ) : isSunday ? (
                          <span className="text-[9px] font-medium text-slate-400">Weekly Off</span>
                        ) : (
                          <div
                            className={`p-0.5 rounded text-[9px] font-semibold truncate border ${
                              isFuture
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60 group-hover:border-teal-300 group-hover:bg-white'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            🩺 OPD 9-1
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="border-slate-200 shadow-sm bg-white p-5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-700" />
                  <span>Standard OPD Shift Timings</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {Object.entries(weeklySchedule).map(([day, slot]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="capitalize font-bold text-slate-700">{day}</span>
                      <span className="font-semibold text-teal-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {slot}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 mt-3 italic">
                  * Shifts coordinate with token dispatch and patient arrival in {userDistrict}.
                </p>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-teal-50 to-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                    {leaves.filter((l) => l.status === 'APPROVED').length}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Approved Leaves</p>
                    <p className="text-[11px] text-teal-800">
                      Synchronized across {userDistrict} Health Network
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Leaves List */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-700" />
                  <span>Scheduled Leaves & Out-of-Office Records</span>
                </div>
                <span className="text-xs text-slate-500 font-normal">
                  {leaves.length} Total Records
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {leaves.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No scheduled leaves found. Click <strong>"Plan / Declare Leave"</strong> above to plan upcoming time off.
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.map((leave) => {
                    const isActiveNow =
                      leave.status === 'APPROVED' &&
                      todayStr >= leave.startDate &&
                      todayStr <= leave.endDate;

                    return (
                      <div
                        key={leave.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isActiveNow
                            ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                            : leave.status === 'CANCELLED'
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-800 text-white">
                              {leave.category}
                            </span>
                            {isActiveNow && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                                CURRENTLY ON LEAVE
                              </span>
                            )}
                            {leave.status === 'PENDING' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                PENDING OPERATIONS REVIEW
                              </span>
                            )}
                            {leave.status === 'APPROVED' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                APPROVED & ACTIVE
                              </span>
                            )}
                            {leave.status === 'CANCELLED' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                                <CalendarX className="w-3 h-3" />
                                CANCELLED / WITHDRAWN
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-600">
                              📅 {leave.startDate} to {leave.endDate}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-900 mt-1">
                            {leave.reason}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            {leave.handoverDoctorName && (
                              <span>
                                🤝 Handover Covering OPD: <strong className="text-slate-700">{leave.handoverDoctorName}</strong>
                              </span>
                            )}
                            {leave.emergencyContact && (
                              <span>
                                📞 Emergency Contact: <strong className="text-slate-700">{leave.emergencyContact}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {leave.status !== 'CANCELLED' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelLeave(leave.id)}
                              className="text-xs text-rose-700 hover:bg-rose-50 hover:border-rose-300 border-slate-200 gap-1.5 cursor-pointer font-semibold"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Cancel Leave</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 4: SECURITY & APPLICATION PREFERENCES                   */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-700" />
                <span>Application Language Preference</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {supportedLanguages.map((lang) => {
                  const isSelected = (i18n.language || 'en') === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        changeAppLanguage(lang.code);
                        showToast(`Language updated to: ${lang.nativeName} (${lang.name})`);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-200'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{lang.nativeName}</p>
                        <p className="text-[11px] text-slate-500">{lang.name}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-indigo-700" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-700" />
                <span>Security & Consent Architecture</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">ABDM Milestones M1, M2 & M3 Compliance</p>
                  <p className="text-[11px] text-slate-500">
                    Consent Manager, Health Information Provider (HIP), and Health Information User (HIU) enabled.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ACTIVE
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Role-Based Session Tokens & Cryptographic Signatures</p>
                  <p className="text-[11px] text-slate-500">
                    All audit trails, OPD token creations, and referral orders are tamper-proof logged for {userDistrict}.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  ENFORCED
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* DECLARE LEAVE MODAL DIALOG                                  */}
      {/* ----------------------------------------------------------- */}
      <Dialog
        open={showLeaveModal}
        onOpenChange={setShowLeaveModal}
        maxWidth="2xl"
        className="p-0"
        hideCloseButton={true}
      >
        <div className="bg-slate-900 p-5 sm:p-6 text-white rounded-t-3xl flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white tracking-tight">
                Apply for Leave
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 mt-0.5">
                Schedule time off and assign a colleague to cover your duties.
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLeaveModal(false)}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleApplyLeave} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-white">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Your status will show as <strong>On Leave</strong> during this period, and patient visits will be directed to your covering colleague.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Start Date *</label>
                <Input
                  type="date"
                  required
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="h-9 text-xs font-medium bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">End Date *</label>
                <Input
                  type="date"
                  required
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="h-9 text-xs font-medium bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Leave Type *</label>
                <select
                  value={leaveCategory}
                  onChange={(e) => setLeaveCategory(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Medical / Sick Leave (ML)</option>
                  <option value="CONFERENCE">Conference / CME</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="EARNED">Earned / Privilege Leave</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Covering Doctor *</label>
                <Input
                  value={handoverDoctor}
                  onChange={(e) => setHandoverDoctor(e.target.value)}
                  placeholder="e.g. Dr. Meena Parmar"
                  required
                  className="h-9 text-xs font-medium bg-white"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Reason for Leave *</label>
                <textarea
                  rows={2}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Annual leave / Attending medical conference"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Emergency Phone</label>
                <Input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="h-9 text-xs font-medium bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Handover Instructions (Optional)</label>
                <Input
                  value={leaveNotes}
                  onChange={(e) => setLeaveNotes(e.target.value)}
                  placeholder="e.g. Inpatient ICU rounds assigned to Dr. Meena"
                  className="h-9 text-xs font-medium bg-white"
                />
              </div>
            </div>

            {(leaveStartDate && leaveEndDate) && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>
                    Dept Coverage: <strong className={leaveImpactPreview.doctorsRemaining === 0 ? 'text-rose-600' : 'text-slate-800'}>
                      {leaveImpactPreview.doctorsRemaining} on duty
                    </strong>
                    {leaveImpactPreview.affectedAppointmentsCount > 0 && (
                      <span className="ml-2 text-amber-700 font-medium">
                        • {leaveImpactPreview.affectedAppointmentsCount} appts to reschedule
                      </span>
                    )}
                  </span>
                </div>
                {leaveImpactPreview.loading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 shrink-0" />
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLeaveModal(false)}
              className="text-xs font-semibold h-9 px-4 cursor-pointer text-slate-700 hover:bg-slate-100"
              disabled={applyingLeave}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={applyingLeave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 h-9 shadow-xs cursor-pointer gap-1.5 flex items-center"
            >
              {applyingLeave ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
