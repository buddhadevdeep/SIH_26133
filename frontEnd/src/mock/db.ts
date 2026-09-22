import {
  DEMO_USERS,
  INITIAL_FACILITIES,
  INITIAL_LIVE_QUEUE,
  INITIAL_HEALTH_RECORD,
  INITIAL_PRESCRIPTIONS,
  INITIAL_DIAGNOSTIC_ORDERS,
  INITIAL_REFERRALS,
  INITIAL_BED_SUMMARY,
  INITIAL_BLOOD_INVENTORY,
  INITIAL_AMBULANCES,
  INITIAL_MEDICINES,
  INITIAL_DISPENSING_HISTORY,
  INITIAL_EQUIPMENT,
  INITIAL_ASHA_PATIENTS,
  INITIAL_ASHA_VISITS,
  INITIAL_ASHA_TASKS,
  INITIAL_FRONTLINE_REFERRALS,
  INITIAL_AI_SUMMARY,
  INITIAL_SYSTEM_HEALTH,
  INITIAL_PERMISSION_MATRIX,
  INITIAL_AI_MODELS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_OPERATIONAL_SERVICES,
  INITIAL_OPERATIONAL_ANNOUNCEMENTS,
  INITIAL_STAFF_DUTY,
  INITIAL_OPERATIONAL_ISSUES,
  INITIAL_DISTRICT_ADMINS,
  INITIAL_DISTRICT_DOCTORS,
  INITIAL_BLOOD_CENTRES,
} from './mockData';
import { INITIAL_MEDICAL_STORES } from './medicalStoresData';
import { Facility, FacilityMatchRequest, FacilityMatchResult } from '@/types/facility';
import { MedicalStore } from '@/types/medicalStore';
import { Token, LiveQueueState, Appointment, RegisteredPatient } from '@/types/queue';
import { Referral, CreateReferralRequest } from '@/types/referral';
import { HealthNotification } from '@/types/notification';
import { Vitals, Diagnosis, Prescription, DiagnosticOrder, PatientHealthRecord, LabResultParameter } from '@/types/clinical';
import { BedSummary, BloodInventory, Ambulance, MedicineInventoryItem, EquipmentItem, DispensingRecord } from '@/types/resources';
import { AshaPatient, AshaVisit, ScreeningSession, FollowUpTask, FrontlineReferral } from '@/types/asha';
import { AiDemandIntelligenceSummary } from '@/types/ai';
import { SystemHealthOverview, PermissionMatrixItem, AiModelRegistryItem, AuditLog, DistrictAdminProfile, DistrictDoctor, BloodCenter, DoctorLeave } from '@/types/admin';
import { User } from '@/types/auth';
import {
  OperationalService,
  OperationalAnnouncement,
  StaffDutyItem,
  OperationalIssue,
  FacilityOperationalStatus,
  FacilityOperationsSummary,
  ServiceOperationalStatus,
  StaffLeaveOperationalImpact,
} from '@/types/operations';

const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_DOCTOR_LEAVES: DoctorLeave[] = [
  {
    id: 'leave_seed_01',
    doctorId: 'doc_02',
    doctorName: 'Dr. Neha Vaghela',
    facilityId: 'fac_pet_04',
    facilityName: 'Pethapur Primary Health Centre',
    department: 'Obstetrics & Gynecology',
    startDate: getRelativeDateStr(-1),
    endDate: getRelativeDateStr(3),
    category: 'CONFERENCE',
    reason: 'Attending National Obstetrics & Gynecology Federation Summit at AIIMS Delhi',
    status: 'APPROVED',
    handoverDoctorName: 'Dr. Arvind Patel',
    emergencyContact: '+91 98765 12345',
    notes: 'Emergency C-sections and high-risk ANC to be redirected to Civil Hospital Gandhinagar.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Dr. Vikram Joshi (PHC In-charge)',
    reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    serviceCoverageImpact: 'ADEQUATE',
    affectedAppointmentsCount: 0,
  },
  {
    id: 'leave_seed_02',
    doctorId: 'doc_01',
    doctorName: 'Dr. Arvind Patel',
    facilityId: 'fac_civil_01',
    facilityName: 'Gandhinagar Civil Hospital',
    department: 'Cardiology',
    startDate: getRelativeDateStr(1),
    endDate: getRelativeDateStr(4),
    category: 'CONFERENCE',
    reason: 'Attending National Cardiology Summit & Clinical Masterclass at AIIMS New Delhi',
    status: 'PENDING',
    handoverDoctorName: 'Dr. Rajesh Solanki',
    emergencyContact: '+91 98765 05678',
    notes: 'Inpatient cardiac telemetry and post-op CCU coverage handed over to Dr. Rajesh Solanki.',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    serviceCoverageImpact: 'CRITICAL_GAP',
    affectedAppointmentsCount: 3,
  },
  {
    id: 'leave_seed_03',
    doctorId: 'doc_06',
    doctorName: 'Dr. Suresh Joshi',
    facilityId: 'fac_civil_01',
    facilityName: 'Gandhinagar Civil Hospital',
    department: 'Orthopedics',
    startDate: getRelativeDateStr(5),
    endDate: getRelativeDateStr(7),
    category: 'CASUAL',
    reason: 'Family personal religious commitment',
    status: 'CHANGES_REQUIRED',
    handoverDoctorName: 'Dr. Rajesh Solanki',
    emergencyContact: '+91 98765 56789',
    notes: 'Requested casual leave during festival week.',
    changesRequestedNote: 'Please coordinate with Dr. Solanki as 2 knee replacement surgeries are scheduled on that Monday.',
    reviewedBy: 'Vikram Joshi (Operations Lead)',
    reviewedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    serviceCoverageImpact: 'LIMITED',
    affectedAppointmentsCount: 1,
  },
  {
    id: 'leave_seed_04',
    doctorId: 'doc_04',
    doctorName: 'Dr. Rajesh Solanki',
    facilityId: 'fac_civil_01',
    facilityName: 'Gandhinagar Civil Hospital',
    department: 'General Surgery',
    startDate: getRelativeDateStr(-3),
    endDate: getRelativeDateStr(-1),
    category: 'CASUAL',
    reason: 'Personal weekend travel',
    status: 'REJECTED',
    rejectionReason: 'Critical surgical emergency roster coverage required this weekend. Insufficient emergency standby surgeons.',
    reviewedBy: 'Vikram Joshi (Operations Lead)',
    reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    serviceCoverageImpact: 'CRITICAL_GAP',
    affectedAppointmentsCount: 4,
  },
];

class MockHealthcareState {
  users: Record<string, User> = { ...DEMO_USERS };
  facilities: Facility[] = [...INITIAL_FACILITIES];
  liveQueue: LiveQueueState = JSON.parse(JSON.stringify(INITIAL_LIVE_QUEUE));
  healthRecords: Record<string, PatientHealthRecord> = {
    usr_pat_01: JSON.parse(JSON.stringify(INITIAL_HEALTH_RECORD)),
  };
  prescriptions: Prescription[] = JSON.parse(JSON.stringify(INITIAL_PRESCRIPTIONS));
  diagnosticOrders: DiagnosticOrder[] = JSON.parse(JSON.stringify(INITIAL_DIAGNOSTIC_ORDERS));
  referrals: Referral[] = JSON.parse(JSON.stringify(INITIAL_REFERRALS));
  bedSummary: BedSummary = JSON.parse(JSON.stringify(INITIAL_BED_SUMMARY));
  bloodInventory: BloodInventory = JSON.parse(JSON.stringify(INITIAL_BLOOD_INVENTORY));
  ambulances: Ambulance[] = JSON.parse(JSON.stringify(INITIAL_AMBULANCES));
  medicines: MedicineInventoryItem[] = JSON.parse(JSON.stringify(INITIAL_MEDICINES));
  medicalStores: MedicalStore[] = JSON.parse(JSON.stringify(INITIAL_MEDICAL_STORES));
  dispensingHistory: DispensingRecord[] = JSON.parse(JSON.stringify(INITIAL_DISPENSING_HISTORY));
  equipment: EquipmentItem[] = JSON.parse(JSON.stringify(INITIAL_EQUIPMENT));
  ashaPatients: AshaPatient[] = JSON.parse(JSON.stringify(INITIAL_ASHA_PATIENTS));
  ashaVisits: AshaVisit[] = JSON.parse(JSON.stringify(INITIAL_ASHA_VISITS));
  ashaTasks: FollowUpTask[] = JSON.parse(JSON.stringify(INITIAL_ASHA_TASKS));
  frontlineReferrals: FrontlineReferral[] = JSON.parse(JSON.stringify(INITIAL_FRONTLINE_REFERRALS));
  screenings: ScreeningSession[] = [];
  aiSummary: AiDemandIntelligenceSummary = JSON.parse(JSON.stringify(INITIAL_AI_SUMMARY));
  systemHealth: SystemHealthOverview = JSON.parse(JSON.stringify(INITIAL_SYSTEM_HEALTH));
  permissions: PermissionMatrixItem[] = JSON.parse(JSON.stringify(INITIAL_PERMISSION_MATRIX));
  aiModels: AiModelRegistryItem[] = JSON.parse(JSON.stringify(INITIAL_AI_MODELS));
  auditLogs: AuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  patients: RegisteredPatient[] = JSON.parse(JSON.stringify(INITIAL_PATIENTS));
  appointments: Appointment[] = JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS));
  notifications: HealthNotification[] = [];

  constructor() {
    this.loadReferrals();
    this.loadAppointments();
    this.loadNotifications();
    this.loadLeaves();
  }

  saveReferrals() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('healthconnect_referrals', JSON.stringify(this.referrals));
      }
    } catch (e) {
      console.warn('Failed to save referrals to localStorage', e);
    }
  }

  loadReferrals() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('healthconnect_referrals');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const savedIds = new Set(parsed.map((r: Referral) => r.id));
            const missing = INITIAL_REFERRALS.filter((r) => !savedIds.has(r.id));
            this.referrals = [...parsed, ...missing];
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to rehydrate referrals', e);
    }
    this.referrals = JSON.parse(JSON.stringify(INITIAL_REFERRALS));
  }

  saveAppointments() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('healthconnect_appointments', JSON.stringify(this.appointments));
      }
    } catch (e) {
      console.warn('Failed to save appointments', e);
    }
  }

  loadAppointments() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('healthconnect_appointments');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.appointments = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to rehydrate appointments', e);
    }
    this.appointments = JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS));
    // Ensure upcoming cardiology appointments exist for Dr. Arvind Patel
    const hasUpcomingPatel = this.appointments.some(
      (a) => (a.doctorId === 'doc_01' || a.doctorId === 'usr_doc_01' || (a.doctorName || '').includes('Arvind Patel')) &&
             a.date >= getRelativeDateStr(0)
    );
    if (!hasUpcomingPatel) {
      this.appointments.unshift(
        {
          id: 'apt_seed_cardio_01',
          patientId: 'usr_pat_01',
          patientName: 'Rameshwar Sharma',
          patientPhone: '9876543210',
          patientAge: 48,
          patientGender: 'M',
          facilityId: 'fac_civil_01',
          facilityName: 'Gandhinagar Civil Hospital',
          doctorId: 'doc_01',
          doctorName: 'Dr. Arvind Patel',
          specialty: 'Cardiology',
          date: getRelativeDateStr(1),
          timeSlot: '10:00 AM',
          status: 'CONFIRMED',
          type: 'IN_PERSON',
          reasonForVisit: 'Hypertension & Post-Angioplasty Follow-up',
          createdAt: new Date(Date.now() - 36000000).toISOString(),
        },
        {
          id: 'apt_seed_cardio_02',
          patientId: 'usr_pat_02',
          patientName: 'Pooja Ben Patel',
          patientPhone: '9825123456',
          patientAge: 29,
          patientGender: 'F',
          facilityId: 'fac_civil_01',
          facilityName: 'Gandhinagar Civil Hospital',
          doctorId: 'doc_01',
          doctorName: 'Dr. Arvind Patel',
          specialty: 'Cardiology',
          date: getRelativeDateStr(1),
          timeSlot: '11:30 AM',
          status: 'CONFIRMED',
          type: 'IN_PERSON',
          reasonForVisit: 'Persistent arrhythmia and 2D Echo review',
          createdAt: new Date(Date.now() - 24000000).toISOString(),
        },
        {
          id: 'apt_seed_cardio_03',
          patientId: 'usr_pat_06',
          patientName: 'Dilipbhai Thakor',
          patientPhone: '9825167890',
          patientAge: 51,
          patientGender: 'M',
          facilityId: 'fac_civil_01',
          facilityName: 'Gandhinagar Civil Hospital',
          doctorId: 'doc_01',
          doctorName: 'Dr. Arvind Patel',
          specialty: 'Cardiology',
          date: getRelativeDateStr(2),
          timeSlot: '02:00 PM',
          status: 'CONFIRMED',
          type: 'IN_PERSON',
          reasonForVisit: 'Chronic chest heaviness evaluation and lipid profile consult',
          createdAt: new Date(Date.now() - 12000000).toISOString(),
        }
      );
      this.saveAppointments();
    }
  }

  saveNotifications() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('healthconnect_notifications', JSON.stringify(this.notifications));
      }
    } catch (e) {
      console.warn('Failed to save notifications', e);
    }
  }

  loadNotifications() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('healthconnect_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.notifications = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to rehydrate notifications', e);
    }
    this.notifications = [
      {
        id: 'notif_seed_01',
        recipientFacilityId: 'fac_civil_01',
        title: 'Inbound Emergency Referral Dispatched',
        message: 'REF-2026-0904 for Kailashben Rathod arriving from Mansa CHC. ICU hold requested.',
        type: 'REFERRAL',
        referralId: 'ref_2026_0904',
        referralCode: 'REF-2026-0904',
        read: false,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }

  saveLeaves() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('healthconnect_doctor_leaves', JSON.stringify(this.doctorLeaves));
      }
    } catch (e) {
      console.warn('Failed to save doctor leaves to localStorage', e);
    }
  }

  loadLeaves() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('healthconnect_doctor_leaves');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.doctorLeaves = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to rehydrate doctor leaves', e);
    }
    this.doctorLeaves = JSON.parse(JSON.stringify(INITIAL_DOCTOR_LEAVES));
  }

  addNotification(notif: Omit<HealthNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotif: HealthNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      timestamp: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    this.saveNotifications();
    return newNotif;
  }
  facilityStatus: Record<string, { status: FacilityOperationalStatus; reason?: string; lastUpdated: string; updatedBy: string }> = {
    fac_civil_01: {
      status: 'OPEN',
      reason: 'Full acute, emergency, and ambulatory care operating normally',
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Vikram Joshi (Operations Lead)',
    },
  };
  operationalServices: OperationalService[] = JSON.parse(JSON.stringify(INITIAL_OPERATIONAL_SERVICES));
  operationalAnnouncements: OperationalAnnouncement[] = JSON.parse(JSON.stringify(INITIAL_OPERATIONAL_ANNOUNCEMENTS));
  staffDuty: StaffDutyItem[] = JSON.parse(JSON.stringify(INITIAL_STAFF_DUTY));
  operationalIssues: OperationalIssue[] = JSON.parse(JSON.stringify(INITIAL_OPERATIONAL_ISSUES));
  doctors: DistrictDoctor[] = JSON.parse(JSON.stringify(INITIAL_DISTRICT_DOCTORS)).map((d: DistrictDoctor) => {
    if (d.id === 'doc_02' || d.name.includes('Neha Vaghela')) {
      return {
        ...d,
        status: 'ON_LEAVE',
        currentLeave: INITIAL_DOCTOR_LEAVES[0],
      };
    }
    return d;
  });
  doctorLeaves: DoctorLeave[] = JSON.parse(JSON.stringify(INITIAL_DOCTOR_LEAVES));
  bloodCenters: BloodCenter[] = JSON.parse(JSON.stringify(INITIAL_BLOOD_CENTRES));
  districtAdmins: DistrictAdminProfile[] = JSON.parse(JSON.stringify(INITIAL_DISTRICT_ADMINS));

  // Patient Registration & Duplicate Detection
  searchPatients(query: string): RegisteredPatient[] {
    const q = (query || '').trim().toLowerCase();
    if (!q) return this.patients;
    const cleanDigits = q.replace(/\D/g, '');
    return this.patients.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const abhaMatch = p.abhaId?.toLowerCase().includes(q) || (p.abhaId && p.abhaId.replace(/\D/g, '').includes(cleanDigits) && cleanDigits.length >= 4);
      const phoneMatch = p.phone.includes(cleanDigits) && cleanDigits.length >= 4;
      const idMatch = p.id.toLowerCase().includes(q);
      return nameMatch || abhaMatch || phoneMatch || idMatch;
    });
  }

  getPatientById(id: string): RegisteredPatient | null {
    return this.patients.find((p) => p.id === id) || null;
  }

  checkDuplicatePatient(phone: string, abhaId?: string, name?: string): RegisteredPatient | null {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const cleanAbha = (abhaId || '').replace(/\D/g, '');
    const cleanName = (name || '').trim().toLowerCase();

    for (const p of this.patients) {
      // 1. Exact phone match (10 digits)
      if (cleanPhone.length >= 10 && p.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10))) {
        return p;
      }
      // 2. Exact ABHA match (14 digits)
      if (cleanAbha.length >= 12 && p.abhaId && p.abhaId.replace(/\D/g, '') === cleanAbha) {
        return p;
      }
      // 3. Exact name and partial phone match
      if (cleanName && p.name.toLowerCase() === cleanName && cleanPhone && p.phone.includes(cleanPhone.slice(-5))) {
        return p;
      }
    }
    return null;
  }

  registerPatient(patientData: Omit<RegisteredPatient, 'id' | 'registeredAt'> & { id?: string }): RegisteredPatient {
    const newId = patientData.id || `usr_pat_${Date.now()}`;
    const newPatient: RegisteredPatient = {
      ...patientData,
      id: newId,
      registeredAt: new Date().toISOString(),
      lastVisitAt: new Date().toISOString(),
    };
    this.patients.unshift(newPatient);

    // Also register in users if not present
    if (!this.users[newId]) {
      this.users[newId] = {
        id: newId,
        name: newPatient.name,
        phone: newPatient.phone,
        role: 'PATIENT',
        age: newPatient.age,
        gender: newPatient.gender,
        abhaId: newPatient.abhaId,
        district: newPatient.district || 'Gandhinagar',
      };
    }

    return newPatient;
  }

  // Appointment Desk & Fast Check-In
  checkInAppointment(appointmentId: string): { appointment: Appointment; token: Token } {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    // Determine department
    const facility = this.facilities.find((f) => f.id === apt.facilityId) || this.facilities[0];
    const dept = facility.departments[0] || { id: 'dep_med', name: 'General Medicine OPD' };

    // Generate token
    const token = this.generateToken(
      apt.patientName,
      apt.patientPhone,
      apt.facilityId,
      dept.id,
      'ROUTINE',
      apt.patientAge,
      apt.patientGender,
      apt.patientId,
      apt.referralId,
      apt.referralCode
    );
    token.doctorId = apt.doctorId;
    token.doctorName = apt.doctorName;

    // Update appointment
    apt.status = 'CHECKED_IN';
    apt.tokenNumber = token.tokenNumber;
    apt.checkedInAt = new Date().toISOString();
    this.saveAppointments();

    // If linked to referral, transition referral to PATIENT_ARRIVED / CHECKED_IN
    if (apt.referralId) {
      const ref = this.getReferralById(apt.referralId);
      if (ref) {
        ref.status = 'PATIENT_ARRIVED';
        ref.tokenId = token.id;
        ref.tokenNumber = token.tokenNumber;
        ref.updatedAt = new Date().toISOString();
        ref.events.push({
          id: `ev_${Date.now()}`,
          status: 'PATIENT_ARRIVED',
          timestamp: new Date().toISOString(),
          actorName: 'OPD Reception',
          actorRole: 'Registration Desk',
          facilityName: apt.facilityName,
          notes: `Patient arrived & checked in. Token ${token.tokenNumber} issued for ${apt.specialty}.`,
        });
        this.saveReferrals();

        // Notify receiving doctor
        this.addNotification({
          recipientUserId: apt.doctorId,
          recipientFacilityId: apt.facilityId,
          recipientRole: 'DOCTOR',
          title: `Referral Patient Arrived: ${ref.referralCode}`,
          message: `${ref.patientName} checked in. Token ${token.tokenNumber} queued for ${apt.specialty}.`,
          type: 'QUEUE',
          referralId: ref.id,
          referralCode: ref.referralCode,
        });
      }
    }

    return { appointment: apt, token };
  }

  bookAppointment(data: Partial<Appointment>): Appointment {
    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      patientId: data.patientId || 'usr_pat_01',
      patientName: data.patientName || 'Patient',
      patientPhone: data.patientPhone || '9876543210',
      patientAge: data.patientAge || 35,
      patientGender: data.patientGender || 'M',
      facilityId: data.facilityId || 'fac_civil_01',
      facilityName: data.facilityName || 'Gandhinagar Civil Hospital',
      doctorId: data.doctorId || 'usr_doc_01',
      doctorName: data.doctorName || 'Dr. Arvind Patel',
      specialty: data.specialty || 'General Medicine',
      date: data.date || new Date().toISOString().split('T')[0],
      timeSlot: data.timeSlot || '11:00 AM',
      status: 'CONFIRMED',
      type: data.type || 'IN_PERSON',
      reasonForVisit: data.reasonForVisit || 'General Consultation',
      referralId: data.referralId,
      referralCode: data.referralCode,
      createdAt: new Date().toISOString(),
    };
    this.appointments.unshift(newApt);
    this.saveAppointments();
    return newApt;
  }

  assignDoctorToAppointment(
    appointmentId: string,
    doctorData: {
      doctorId: string;
      doctorName: string;
      specialty?: string;
      roomNumber?: string;
      departmentId?: string;
      departmentName?: string;
    }
  ): Appointment {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    apt.doctorId = doctorData.doctorId;
    apt.doctorName = doctorData.doctorName;
    if (doctorData.specialty) apt.specialty = doctorData.specialty;
    if (doctorData.roomNumber) apt.roomNumber = doctorData.roomNumber;
    if (doctorData.departmentId) apt.departmentId = doctorData.departmentId;
    if (doctorData.departmentName) apt.departmentName = doctorData.departmentName;

    if (apt.status === 'SCHEDULED') {
      apt.status = 'CONFIRMED';
    }

    // Sync token if already issued
    if (apt.tokenNumber && this.liveQueue.tokens) {
      const tok = this.liveQueue.tokens.find((t: Token) => t.tokenNumber === apt.tokenNumber);
      if (tok) {
        tok.doctorId = doctorData.doctorId;
        tok.doctorName = doctorData.doctorName;
        if (doctorData.roomNumber) tok.roomNumber = doctorData.roomNumber;
      }
    }

    this.saveAppointments();
    return apt;
  }

  // Token & Queue operations
  generateToken(
    patientName: string,
    patientPhone: string,
    facilityId: string,
    departmentId: string,
    priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY' = 'ROUTINE',
    patientAge: number = 45,
    patientGender: 'M' | 'F' | 'Other' = 'M',
    patientId: string = 'usr_pat_01',
    referralId?: string,
    referralCode?: string,
    doctorId?: string,
    doctorName?: string,
    roomNumber?: string
  ): Token {
    const facility = this.facilities.find((f) => f.id === facilityId) || this.facilities[0];
    const dept = facility.departments.find((d) => d.id === departmentId) || facility.departments[0];
    const num = Math.floor(Math.random() * 50) + 40;
    const tokenNumber = `${dept.code || 'A'}-0${num}`;

    const newToken: Token = {
      id: `tok_${Date.now()}`,
      tokenNumber,
      patientId,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      facilityId: facility.id,
      facilityName: facility.name,
      departmentId: dept.id,
      departmentName: dept.name,
      doctorId: doctorId || 'doc_01',
      doctorName: doctorName || 'Dr. Arvind Patel',
      roomNumber: roomNumber || 'Room 4',
      status: 'WAITING',
      priority,
      positionInQueue: this.liveQueue.tokens.filter((t) => t.status === 'WAITING').length + 1,
      estimatedWaitMinutes: (this.liveQueue.tokens.filter((t) => t.status === 'WAITING').length + 1) * 6,
      referralId,
      referralCode,
      createdAt: new Date().toISOString(),
    };

    this.liveQueue.tokens.push(newToken);
    this.liveQueue.totalWaiting += 1;
    return newToken;
  }

  callNextToken(): Token | null {
    const nextWaiting = this.liveQueue.tokens.find((t) => t.status === 'WAITING');
    if (!nextWaiting) return null;

    // Mark previous calling tokens as in consultation or completed
    this.liveQueue.tokens.forEach((t) => {
      if (t.status === 'CALLED') t.status = 'IN_CONSULTATION';
    });

    nextWaiting.status = 'CALLED';
    nextWaiting.calledAt = new Date().toISOString();
    this.liveQueue.currentTokenNumber = nextWaiting.tokenNumber;
    this.liveQueue.totalWaiting = Math.max(0, this.liveQueue.totalWaiting - 1);
    this.liveQueue.updatedAt = new Date().toISOString();

    // Recalculate remaining positions
    let pos = 1;
    this.liveQueue.tokens.forEach((t) => {
      if (t.status === 'WAITING') {
        t.positionInQueue = pos;
        t.estimatedWaitMinutes = pos * 6;
        pos++;
      }
    });

    return nextWaiting;
  }

  skipToken(tokenId: string): Token | null {
    const token = this.liveQueue.tokens.find((t) => t.id === tokenId);
    if (token) {
      token.status = 'SKIPPED';
      this.liveQueue.updatedAt = new Date().toISOString();
    }
    return token || null;
  }

  markTokenNoShow(tokenId: string): Token | null {
    const token = this.liveQueue.tokens.find((t) => t.id === tokenId);
    if (token) {
      token.status = 'NO_SHOW';
      this.liveQueue.updatedAt = new Date().toISOString();
    }
    return token || null;
  }

  // Referral operations with multi-criteria matching
  matchFacilities(request: FacilityMatchRequest): FacilityMatchResult[] {
    return this.facilities.map((fac) => {
      const hasSpecialty = fac.specialties.includes(request.specialty);
      const specialistAvail: 'AVAILABLE_NOW' | 'UNAVAILABLE' = hasSpecialty ? 'AVAILABLE_NOW' : 'UNAVAILABLE';
      const hasIcu = request.requiresIcu ? fac.icuBedsAvailable > 0 : true;
      const bedStatus: 'PLENTY' | 'LIMITED' | 'CRITICAL' = fac.availableBeds > 30 ? 'PLENTY' : fac.availableBeds > 5 ? 'LIMITED' : 'CRITICAL';
      const distance = fac.distanceKm || 5;

      let score = 50;
      const reasons: string[] = [];

      if (hasSpecialty) {
        score += 30;
        reasons.push(`Specialty department active (${request.specialty})`);
      }
      if (hasIcu) {
        score += 10;
        reasons.push(`${fac.icuBedsAvailable} ICU beds currently vacant`);
      }
      if (fac.emergencyAvailable) {
        score += 5;
        reasons.push('24/7 Emergency & Trauma Unit operational');
      }
      if (distance < 10) {
        score += 5;
        reasons.push(`Nearby facility (${distance} km distance)`);
      }

      return {
        facility: fac,
        suitabilityScore: Math.min(score, 98),
        clinicalMatchPercent: hasSpecialty ? 95 : 40,
        specialistAvailability: specialistAvail,
        equipmentSuitability: true,
        bedAvailabilityStatus: bedStatus,
        distanceKm: distance,
        estimatedTransitTimeMins: Math.round(distance * 2.2),
        matchReasons: reasons,
      };
    }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  getReferrals(filters?: {
    facilityId?: string;
    toFacilityId?: string;
    fromFacilityId?: string;
    fromDoctorId?: string;
    patientId?: string;
    status?: string;
    priority?: string;
  }): Referral[] {
    let list = [...this.referrals];

    if (filters?.toFacilityId) {
      list = list.filter(
        (r) =>
          r.toFacilityId === filters.toFacilityId ||
          (filters.toFacilityId === 'fac_civil_01' && r.toFacilityName.toLowerCase().includes('civil'))
      );
    } else if (filters?.facilityId) {
      list = list.filter((r) => r.toFacilityId === filters.facilityId || r.fromFacilityId === filters.facilityId);
    }

    if (filters?.fromFacilityId) {
      list = list.filter((r) => r.fromFacilityId === filters.fromFacilityId);
    }

    if (filters?.fromDoctorId) {
      list = list.filter((r) => r.fromDoctorId === filters.fromDoctorId);
    }

    if (filters?.patientId) {
      list = list.filter(
        (r) => r.patientId === filters.patientId || (filters.patientId === 'usr_pat_01' && r.patientName.includes('Rameshwar'))
      );
    }

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((r) => r.status === filters.status);
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      list = list.filter((r) => r.priority === filters.priority);
    }

    return list;
  }

  getReferralById(id: string): Referral | null {
    return this.referrals.find((r) => r.id === id || r.referralCode === id) || null;
  }

  createReferral(
    req: CreateReferralRequest,
    actor?: { name?: string; role?: string; facilityId?: string; facilityName?: string; doctorId?: string }
  ): Referral {
    const destFacility = this.facilities.find((f) => f.id === req.toFacilityId) || this.facilities[0];
    const fromFacId = req.fromFacilityId || actor?.facilityId || 'fac_pet_04';
    const fromFac = this.facilities.find((f) => f.id === fromFacId);
    const fromFacName = req.fromFacilityName || fromFac?.name || actor?.facilityName || 'Pethapur Primary Health Centre';
    const fromDocName = req.fromDoctorName || actor?.name || 'Dr. Neha Vaghela';
    const fromDocId = req.fromDoctorId || actor?.doctorId || 'usr_doc_pet';

    const refCode = `REF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRef: Referral = {
      id: `ref_${Date.now()}`,
      referralCode: refCode,
      patientId: req.patientId || 'usr_pat_01',
      patientName: req.patientName || 'Rameshwar Sharma',
      patientAge: req.patientAge || 48,
      patientGender: req.patientGender || 'Male',
      patientPhone: req.patientPhone || '9876543210',
      abhaId: req.abhaId || '14-8921-3409-7721',
      fromFacilityId: fromFacId,
      fromFacilityName: fromFacName,
      fromDoctorId: fromDocId,
      fromDoctorName: fromDocName,
      toFacilityId: destFacility.id,
      toFacilityName: destFacility.name,
      toSpecialty: req.toSpecialty,
      reasonForReferral: req.reasonForReferral,
      clinicalSummary: req.clinicalSummary,
      priority: req.priority,
      requiredEquipment: req.requiredEquipment,
      requiredIcu: req.requiredIcu,
      status: 'CREATED',
      slaDeadline: new Date(Date.now() + (req.priority === 'EMERGENCY' ? 4 : 48) * 3600000).toISOString(),
      slaBreached: false,
      events: [
        {
          id: `ev_${Date.now()}`,
          status: 'CREATED',
          timestamp: new Date().toISOString(),
          actorName: fromDocName,
          actorRole: actor?.role || 'Senior Medical Officer',
          facilityName: fromFacName,
          notes: `Referral created & dispatched to ${destFacility.name} for ${req.toSpecialty}.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.referrals.unshift(newRef);
    this.saveReferrals();

    // Broadcast real notification to receiving facility operations
    this.addNotification({
      recipientFacilityId: destFacility.id,
      recipientRole: 'FACILITY_STAFF',
      title: `New Inbound ${newRef.priority} Referral: ${refCode}`,
      message: `Patient ${newRef.patientName} referred from ${fromFacName} for ${newRef.toSpecialty}. Needs operational intake review.`,
      type: 'REFERRAL',
      referralId: newRef.id,
      referralCode: newRef.referralCode,
    });

    return newRef;
  }

  reviewReferral(
    id: string,
    actor?: { name?: string; role?: string; facilityName?: string }
  ): Referral | null {
    const ref = this.getReferralById(id);
    if (!ref) return null;

    if (ref.status === 'CREATED' || ref.status === 'SENT' || ref.status === 'CLARIFICATION_RECEIVED') {
      ref.status = 'UNDER_REVIEW';
      ref.updatedAt = new Date().toISOString();
      ref.events.push({
        id: `ev_${Date.now()}`,
        status: 'UNDER_REVIEW',
        timestamp: new Date().toISOString(),
        actorName: actor?.name || 'Vikram Joshi (Operations Lead)',
        actorRole: actor?.role || 'Facility Operations',
        facilityName: actor?.facilityName || ref.toFacilityName,
        notes: 'Operational triage initiated. Validating specialty bed capacity and clinician duty schedule.',
      });
      this.saveReferrals();
    }
    return ref;
  }

  acceptReferral(
    id: string,
    appointmentSlot?: string,
    appointmentId?: string,
    actor?: { name?: string; role?: string; facilityName?: string }
  ): Referral | null {
    const ref = this.getReferralById(id);
    if (!ref) return null;

    ref.status = appointmentId ? 'APPOINTMENT_CONFIRMED' : 'ACCEPTED';
    ref.updatedAt = new Date().toISOString();
    if (appointmentSlot) ref.appointmentSlot = appointmentSlot;
    if (appointmentId) ref.appointmentId = appointmentId;

    ref.events.push({
      id: `ev_${Date.now()}`,
      status: ref.status,
      timestamp: new Date().toISOString(),
      actorName: actor?.name || 'Vikram Joshi (Operations Lead)',
      actorRole: actor?.role || 'Facility Operations',
      facilityName: actor?.facilityName || ref.toFacilityName,
      notes: appointmentSlot
        ? `Referral accepted & appointment confirmed: ${appointmentSlot}. Slot reserved in receiving hospital.`
        : 'Referral operationally accepted. Care coordination in progress.',
    });
    this.saveReferrals();

    // Notify referring doctor and patient
    this.addNotification({
      recipientUserId: ref.fromDoctorId,
      recipientFacilityId: ref.fromFacilityId,
      recipientRole: 'DOCTOR',
      title: `Referral Accepted: ${ref.referralCode}`,
      message: `${ref.toFacilityName} accepted referral for ${ref.patientName}. Scheduled: ${appointmentSlot || 'Consultation Queue'}.`,
      type: 'REFERRAL',
      referralId: ref.id,
      referralCode: ref.referralCode,
    });

    this.addNotification({
      recipientUserId: ref.patientId,
      recipientRole: 'PATIENT',
      title: `Referral Accepted: ${ref.referralCode}`,
      message: `Your referral to ${ref.toFacilityName} is confirmed! Scheduled slot: ${appointmentSlot || 'Standard Queue'}.`,
      type: 'REFERRAL',
      referralId: ref.id,
      referralCode: ref.referralCode,
    });

    return ref;
  }

  rejectReferral(
    id: string,
    reason: string,
    actor?: { name?: string; role?: string; facilityName?: string }
  ): Referral | null {
    const ref = this.getReferralById(id);
    if (!ref) return null;

    ref.status = 'REJECTED';
    ref.rejectionReason = reason;
    ref.updatedAt = new Date().toISOString();

    ref.events.push({
      id: `ev_${Date.now()}`,
      status: 'REJECTED',
      timestamp: new Date().toISOString(),
      actorName: actor?.name || 'Vikram Joshi (Operations Lead)',
      actorRole: actor?.role || 'Facility Operations',
      facilityName: actor?.facilityName || ref.toFacilityName,
      notes: `Referral diverted: ${reason}`,
    });
    this.saveReferrals();

    // Notify referring doctor
    this.addNotification({
      recipientUserId: ref.fromDoctorId,
      recipientFacilityId: ref.fromFacilityId,
      recipientRole: 'DOCTOR',
      title: `Referral Diverted: ${ref.referralCode}`,
      message: `${ref.toFacilityName} diverted transfer for ${ref.patientName}. Reason: ${reason}`,
      type: 'REFERRAL',
      referralId: ref.id,
      referralCode: ref.referralCode,
    });

    return ref;
  }

  requestClarification(
    id: string,
    message: string,
    actor?: { name?: string; role?: string; facilityName?: string }
  ): Referral | null {
    const ref = this.getReferralById(id);
    if (!ref) return null;

    ref.status = 'CLARIFICATION_REQUIRED';
    ref.clarificationRequest = {
      requestedBy: actor?.name || 'Vikram Joshi (Operations Lead)',
      role: actor?.role || 'Facility Operations',
      facilityName: actor?.facilityName || ref.toFacilityName,
      requestedAt: new Date().toISOString(),
      message,
    };
    ref.updatedAt = new Date().toISOString();

    ref.events.push({
      id: `ev_${Date.now()}`,
      status: 'CLARIFICATION_REQUIRED',
      timestamp: new Date().toISOString(),
      actorName: actor?.name || 'Vikram Joshi (Operations Lead)',
      actorRole: actor?.role || 'Facility Operations',
      facilityName: actor?.facilityName || ref.toFacilityName,
      notes: `Clarification requested: ${message}`,
    });
    this.saveReferrals();

    // Notify referring doctor
    this.addNotification({
      recipientUserId: ref.fromDoctorId,
      recipientFacilityId: ref.fromFacilityId,
      recipientRole: 'DOCTOR',
      title: `Clarification Requested: ${ref.referralCode}`,
      message: `${ref.toFacilityName} requires additional clinical info for ${ref.patientName}: "${message}"`,
      type: 'REFERRAL',
      referralId: ref.id,
      referralCode: ref.referralCode,
    });

    return ref;
  }

  provideClarification(
    id: string,
    message: string,
    actor?: { name?: string; role?: string }
  ): Referral | null {
    const ref = this.getReferralById(id);
    if (!ref) return null;

    ref.status = 'CLARIFICATION_RECEIVED';
    ref.clarificationResponse = {
      respondedBy: actor?.name || 'Dr. Neha Vaghela',
      role: actor?.role || 'Referring Doctor',
      respondedAt: new Date().toISOString(),
      message,
    };
    ref.updatedAt = new Date().toISOString();

    ref.events.push({
      id: `ev_${Date.now()}`,
      status: 'CLARIFICATION_RECEIVED',
      timestamp: new Date().toISOString(),
      actorName: actor?.name || 'Dr. Neha Vaghela',
      actorRole: actor?.role || 'Referring Doctor',
      facilityName: ref.fromFacilityName,
      notes: `Clarification supplied: ${message}`,
    });
    this.saveReferrals();

    // Notify receiving facility operations
    this.addNotification({
      recipientFacilityId: ref.toFacilityId,
      recipientRole: 'FACILITY_STAFF',
      title: `Clarification Provided: ${ref.referralCode}`,
      message: `Doctor responded for ${ref.patientName}: "${message}". Ready for intake review.`,
      type: 'REFERRAL',
      referralId: ref.id,
      referralCode: ref.referralCode,
    });

    return ref;
  }

  confirmArrival(
    id: string,
    actor?: { name?: string; role?: string; facilityName?: string }
  ): Referral | null {
    const ref = this.getReferralById(id);
    if (!ref) return null;

    ref.status = 'PATIENT_ARRIVED';
    ref.updatedAt = new Date().toISOString();

    ref.events.push({
      id: `ev_${Date.now()}`,
      status: 'PATIENT_ARRIVED',
      timestamp: new Date().toISOString(),
      actorName: actor?.name || 'Casualty Desk',
      actorRole: actor?.role || 'Registration Staff',
      facilityName: actor?.facilityName || ref.toFacilityName,
      notes: 'Patient physically arrived at receiving facility. Triage intake completed.',
    });
    this.saveReferrals();
    return ref;
  }

  recordReferralOutcome(
    id: string,
    outcomeNotes: string,
    actor?: { name?: string; role?: string; facilityName?: string }
  ): Referral | null {
    const ref = this.getReferralById(id);
    if (!ref) return null;

    ref.status = 'COMPLETED';
    ref.clinicalOutcomeNotes = outcomeNotes;
    ref.consultedDoctorName = actor?.name || 'Dr. Arvind Patel';
    ref.consultedAt = new Date().toISOString();
    ref.updatedAt = new Date().toISOString();

    ref.events.push({
      id: `ev_${Date.now()}`,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      actorName: actor?.name || 'Dr. Arvind Patel',
      actorRole: actor?.role || 'Attending Specialist',
      facilityName: actor?.facilityName || ref.toFacilityName,
      notes: `Specialist consultation concluded. Clinical outcome notes: "${outcomeNotes}". Closed-loop feedback transmitted to ${ref.fromFacilityName}.`,
    });
    this.saveReferrals();

    // Notify referring doctor and patient
    this.addNotification({
      recipientUserId: ref.fromDoctorId,
      recipientFacilityId: ref.fromFacilityId,
      recipientRole: 'DOCTOR',
      title: `Closed-Loop Referral Completed: ${ref.referralCode}`,
      message: `${ref.consultedDoctorName} at ${ref.toFacilityName} completed consultation for ${ref.patientName}. Care outcome notes are now available.`,
      type: 'REFERRAL',
      referralId: ref.id,
      referralCode: ref.referralCode,
    });

    this.addNotification({
      recipientUserId: ref.patientId,
      recipientRole: 'PATIENT',
      title: `Referral Completed: ${ref.referralCode}`,
      message: `Your specialist consultation at ${ref.toFacilityName} is complete. You can view your care plan and prescription.`,
      type: 'REFERRAL',
      referralId: ref.id,
      referralCode: ref.referralCode,
    });

    return ref;
  }

  closeReferral(
    id: string,
    actor?: { name?: string; role?: string; facilityName?: string }
  ): Referral | null {
    const ref = this.getReferralById(id);
    if (!ref) return null;

    ref.status = 'CLOSED';
    ref.updatedAt = new Date().toISOString();
    ref.events.push({
      id: `ev_${Date.now()}`,
      status: 'CLOSED',
      timestamp: new Date().toISOString(),
      actorName: actor?.name || 'Care Continuity Coordinator',
      actorRole: actor?.role || 'Operations Coordinator',
      facilityName: actor?.facilityName || ref.toFacilityName,
      notes: 'Referral case formally closed in district health record.',
    });
    this.saveReferrals();
    return ref;
  }

  // Pharmacy & Resource mutations
  dispensePrescription(prescriptionId: string, pharmacistName?: string, notes?: string): Prescription | null {
    const rx = this.prescriptions.find((p) => p.id === prescriptionId);
    if (!rx) return null;

    // Double-dispense protection
    if (rx.status === 'DISPENSED') {
      return rx;
    }

    const dispensedItemsSummary: Array<{
      medicineName: string;
      genericName?: string;
      batchNumber: string;
      quantity: number;
      unit: string;
      dosageInstructions: string;
    }> = [];

    // Deduct stock for each prescribed item
    rx.items.forEach((item) => {
      item.dispensedStatus = 'DISPENSED';
      item.dispensedQuantity = item.totalQuantity;

      // Find best-matching medicine in inventory
      const genNorm = (item.genericName || '').toLowerCase().trim();
      const nameNorm = item.medicineName.toLowerCase().trim();

      const matchedMed = this.medicines.find((m) => {
        const mGen = m.genericName.toLowerCase().trim();
        const mName = m.medicineName.toLowerCase().trim();
        if (genNorm && (mGen.includes(genNorm) || genNorm.includes(mGen))) return true;
        if (mName.includes(nameNorm) || nameNorm.includes(mName)) return true;
        return false;
      });

      if (matchedMed) {
        // Safe authoritative stock deduction
        matchedMed.availableQuantity = Math.max(0, matchedMed.availableQuantity - item.totalQuantity);
        if (matchedMed.availableQuantity === 0) {
          matchedMed.status = 'OUT_OF_STOCK';
        } else if (matchedMed.availableQuantity <= matchedMed.minimumStockThreshold) {
          matchedMed.status = 'LOW_STOCK';
        }
        matchedMed.lastUpdated = new Date().toISOString();

        dispensedItemsSummary.push({
          medicineName: matchedMed.medicineName,
          genericName: matchedMed.genericName,
          batchNumber: matchedMed.batchNumber,
          quantity: item.totalQuantity,
          unit: matchedMed.unit,
          dosageInstructions: `${item.frequency} • ${item.instructions || ''}`.trim(),
        });
      } else {
        dispensedItemsSummary.push({
          medicineName: item.medicineName,
          genericName: item.genericName,
          batchNumber: 'GEN-2026-DISP',
          quantity: item.totalQuantity,
          unit: 'Units',
          dosageInstructions: `${item.frequency} • ${item.instructions || ''}`.trim(),
        });
      }
    });

    rx.status = 'DISPENSED';
    rx.pharmacyNotes = notes;

    // Record authoritative audit trail
    const auditRecord: DispensingRecord = {
      id: `disp_${Date.now()}`,
      prescriptionId: rx.id,
      patientId: rx.patientId,
      patientName: rx.patientName,
      patientAge: 48,
      patientGender: 'M',
      doctorId: rx.doctorId,
      doctorName: rx.doctorName,
      facilityId: rx.facilityId,
      facilityName: rx.facilityName,
      dispensedBy: pharmacistName || 'Priya Nair (Pharmacist)',
      dispensedAt: new Date().toISOString(),
      items: dispensedItemsSummary,
      notes: notes || 'Verified with patient identity. Full course dispensed.',
    };

    this.dispensingHistory.unshift(auditRecord);
    return rx;
  }

  quarantineBatch(medicineId: string, reason: string): MedicineInventoryItem | null {
    const med = this.medicines.find((m) => m.id === medicineId);
    if (med) {
      med.status = 'QUARANTINED';
      med.quarantineReason = reason;
      med.lastUpdated = new Date().toISOString();
    }
    return med || null;
  }

  adjustMedicineStock(medicineId: string, delta: number, reason: string): MedicineInventoryItem | null {
    const med = this.medicines.find((m) => m.id === medicineId);
    if (med) {
      med.availableQuantity = Math.max(0, med.availableQuantity + delta);
      if (med.status !== 'QUARANTINED') {
        if (med.availableQuantity === 0) {
          med.status = 'OUT_OF_STOCK';
        } else if (med.availableQuantity <= med.minimumStockThreshold) {
          med.status = 'LOW_STOCK';
        } else {
          med.status = 'IN_STOCK';
        }
      }
      med.lastUpdated = new Date().toISOString();
    }
    return med || null;
  }

  addMedicine(item: Partial<MedicineInventoryItem>): MedicineInventoryItem {
    const qty = Number(item.availableQuantity) || 0;
    const threshold = Number(item.minimumStockThreshold) || 50;
    let initialStatus: MedicineInventoryItem['status'] = 'IN_STOCK';
    if (qty === 0) {
      initialStatus = 'OUT_OF_STOCK';
    } else if (qty <= threshold) {
      initialStatus = 'LOW_STOCK';
    }

    const newMed: MedicineInventoryItem = {
      id: item.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      facilityId: item.facilityId || 'hosp_gandhinagar_civil',
      medicineName: item.medicineName || 'Unnamed Medicine',
      genericName: item.genericName || 'Generic Salt',
      category: item.category || 'Tablet',
      batchNumber: item.batchNumber || `BT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      availableQuantity: qty,
      minimumStockThreshold: threshold,
      unit: item.unit || 'Tablets',
      expiryDate: item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: item.status || initialStatus,
      lastUpdated: new Date().toISOString(),
    };

    this.medicines.unshift(newMed);
    return newMed;
  }

  deleteMedicine(medicineId: string): boolean {
    const initialLen = this.medicines.length;
    this.medicines = this.medicines.filter((m) => m.id !== medicineId);
    return this.medicines.length < initialLen;
  }

  updateBedStatus(facilityId: string, category: string, available: number): BedSummary {
    const targetCat = this.bedSummary.categories.find((c) => c.type === category);
    if (targetCat) {
      targetCat.available = available;
      targetCat.occupied = targetCat.total - available;
      targetCat.lastUpdated = new Date().toISOString();
    }
    this.bedSummary.totalAvailable = this.bedSummary.categories.reduce((acc, c) => acc + c.available, 0);
    this.bedSummary.totalOccupied = this.bedSummary.totalBeds - this.bedSummary.totalAvailable;
    this.bedSummary.lastUpdated = new Date().toISOString();
    return this.bedSummary;
  }

  // --- LABORATORY / DIAGNOSTICS METHODS ---
  getDiagnosticOrders(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }): DiagnosticOrder[] {
    let list = [...this.diagnosticOrders];

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((ord) => ord.status === filters.status);
    }
    if (filters?.category && filters.category !== 'ALL') {
      list = list.filter((ord) => ord.testCategory === filters.category);
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      list = list.filter((ord) => ord.priority === filters.priority);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (ord) =>
          ord.id.toLowerCase().includes(q) ||
          ord.testName.toLowerCase().includes(q) ||
          ord.patientName.toLowerCase().includes(q) ||
          (ord.patientPhone && ord.patientPhone.includes(q)) ||
          (ord.patientAbha && ord.patientAbha.toLowerCase().includes(q)) ||
          (ord.sampleId && ord.sampleId.toLowerCase().includes(q)) ||
          (ord.barcodeNumber && ord.barcodeNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }

  getDiagnosticOrderById(orderId: string): DiagnosticOrder | null {
    const ord = this.diagnosticOrders.find((o) => o.id === orderId);
    return ord || null;
  }

  collectSample(orderId: string, technicianName?: string, notes?: string): DiagnosticOrder | null {
    const ord = this.diagnosticOrders.find((o) => o.id === orderId);
    if (!ord) return null;

    ord.status = 'SAMPLE_COLLECTED';
    ord.sampleCollectedAt = new Date().toISOString();
    ord.technicianName = technicianName || 'Ramesh Patel, MLT';
    if (!ord.sampleId) {
      ord.sampleId = `SMP-${Date.now().toString().slice(-6)}`;
    }
    if (!ord.barcodeNumber) {
      ord.barcodeNumber = `BC-${Date.now().toString().slice(-8)}`;
    }
    if (notes) {
      ord.notes = ord.notes ? `${ord.notes} | ${notes}` : notes;
    }

    this.syncOrderWithHealthRecord(ord);
    return ord;
  }

  receiveSample(orderId: string, technicianName?: string): DiagnosticOrder | null {
    const ord = this.diagnosticOrders.find((o) => o.id === orderId);
    if (!ord) return null;

    ord.status = 'SAMPLE_RECEIVED';
    ord.sampleReceivedAt = new Date().toISOString();
    ord.technicianName = technicianName || 'Ramesh Patel, MLT';

    this.syncOrderWithHealthRecord(ord);
    return ord;
  }

  rejectSample(orderId: string, reason: string, notes?: string, technicianName?: string): DiagnosticOrder | null {
    const ord = this.diagnosticOrders.find((o) => o.id === orderId);
    if (!ord) return null;

    ord.status = 'REJECTED';
    ord.rejectionReason = reason;
    ord.rejectionNotes = notes;
    ord.completedAt = new Date().toISOString();
    ord.technicianName = technicianName || 'Ramesh Patel, MLT';

    this.syncOrderWithHealthRecord(ord);
    return ord;
  }

  startProcessing(orderId: string, technicianName?: string): DiagnosticOrder | null {
    const ord = this.diagnosticOrders.find((o) => o.id === orderId);
    if (!ord) return null;

    ord.status = 'PROCESSING';
    ord.processedAt = new Date().toISOString();
    ord.technicianName = technicianName || 'Ramesh Patel, MLT';

    this.syncOrderWithHealthRecord(ord);
    return ord;
  }

  submitResult(
    orderId: string,
    parameters: LabResultParameter[],
    resultSummary?: string,
    technicianName?: string
  ): DiagnosticOrder | null {
    const ord = this.diagnosticOrders.find((o) => o.id === orderId);
    if (!ord) return null;

    ord.resultParameters = parameters;
    const hasAbnormal = parameters.some((p) => p.status === 'ABNORMAL' || p.status === 'CRITICAL');
    ord.isAbnormal = hasAbnormal;
    ord.resultSummary =
      resultSummary ||
      (hasAbnormal
        ? 'One or more parameters flagged outside biological reference range.'
        : 'All parameter values within expected biological reference range.');
    ord.status = 'REPORT_READY';
    ord.completedAt = new Date().toISOString();
    ord.technicianName = technicianName || 'Ramesh Patel, MLT';
    ord.reportFileUrl = `/reports/${ord.id}.pdf`;

    this.syncOrderWithHealthRecord(ord);
    return ord;
  }

  private syncOrderWithHealthRecord(updatedOrder: DiagnosticOrder): void {
    const patientRecord = this.healthRecords[updatedOrder.patientId];
    if (patientRecord && patientRecord.timeline) {
      const existingIdx = patientRecord.timeline.findIndex(
        (ev) => ev.details && (ev.details as any).orderId === updatedOrder.id
      );
      if (existingIdx !== -1) {
        patientRecord.timeline[existingIdx].summary = `${updatedOrder.testName}: ${updatedOrder.resultSummary || updatedOrder.status}`;
        patientRecord.timeline[existingIdx].details = { orderId: updatedOrder.id, ...updatedOrder } as Record<string, unknown>;
      } else if (updatedOrder.status === 'REPORT_READY' || updatedOrder.status === 'COMPLETED') {
        patientRecord.timeline.unshift({
          id: `tl_lab_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          eventType: 'LAB_REPORT',
          title: `Diagnostic Report: ${updatedOrder.testName}`,
          facilityName: updatedOrder.facilityName,
          doctorName: updatedOrder.orderedBy,
          summary: updatedOrder.resultSummary || 'Investigation completed and verified by laboratory.',
          details: { orderId: updatedOrder.id, ...updatedOrder } as Record<string, unknown>,
        });
      }
    }
  }

  // --- FACILITY OPERATIONS METHODS ---
  getFacilityOperationsSummary(facilityId: string = 'fac_civil_01'): FacilityOperationsSummary {
    const statusEntry = this.facilityStatus[facilityId] || {
      status: 'OPEN',
      reason: 'Normal acute and emergency healthcare operations active',
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Vikram Joshi (Operations Lead)',
    };

    const activeIssues = this.operationalIssues.filter((i) => !i.resolved);
    const criticalCount = activeIssues.filter((i) => i.severity === 'CRITICAL').length;
    const activeTokens = this.liveQueue.tokens.filter(
      (t) => t.status === 'WAITING' || t.status === 'CALLED'
    );
    const ambulancesReady = this.ambulances.filter((a) => a.status === 'AVAILABLE').length;
    const pendingIncoming = this.referrals.filter(
      (r) => r.toFacilityId === facilityId && (r.status === 'CREATED' || r.status === 'ACCEPTED')
    ).length;
    const staffOnDuty = this.staffDuty.filter((s) => s.status === 'ON_DUTY').length;

    return {
      facilityId,
      facilityName: 'Gandhinagar Civil Hospital & Medical College',
      operationalStatus: statusEntry.status,
      statusReason: statusEntry.reason,
      lastStatusUpdate: statusEntry.lastUpdated,
      updatedBy: statusEntry.updatedBy,
      totalActiveIssues: activeIssues.length,
      criticalIssuesCount: criticalCount,
      services: this.operationalServices,
      announcements: this.operationalAnnouncements.filter((a) => a.active),
      telemetry: {
        totalWaitingQueue: activeTokens.length,
        avgQueueWaitMinutes: this.liveQueue.averageConsultTimeMinutes || 20,
        bedsOccupied: this.bedSummary.totalOccupied,
        bedsTotal: this.bedSummary.totalBeds,
        bedsAvailable: this.bedSummary.totalAvailable,
        icuAvailable: this.bedSummary.icuAvailable,
        ambulancesReady,
        ambulancesTotal: this.ambulances.length,
        pendingIncomingReferrals: pendingIncoming,
        staffOnDutyCount: staffOnDuty,
        pendingStaffLeavesCount: this.doctorLeaves.filter(
          (l) => (l.facilityId === facilityId || !l.facilityId || facilityId === 'fac_civil_01') && l.status === 'PENDING'
        ).length,
      },
    };
  }

  updateFacilityStatus(
    facilityId: string = 'fac_civil_01',
    status: FacilityOperationalStatus,
    reason?: string,
    updatedBy?: string
  ): FacilityOperationsSummary {
    const actor = updatedBy || 'Vikram Joshi (Operations Lead)';
    this.facilityStatus[facilityId] = {
      status,
      reason: reason || (status === 'OPEN' ? 'Full healthcare services operating normally' : 'Operational status updated'),
      lastUpdated: new Date().toISOString(),
      updatedBy: actor,
    };

    const targetFac = this.facilities.find((f) => f.id === facilityId);
    if (targetFac) {
      targetFac.isOpen = status !== 'CLOSED';
      targetFac.emergencyAvailable = status !== 'CLOSED';
      targetFac.lastUpdated = new Date().toISOString();
    }

    // Register a priority announcement
    this.broadcastAnnouncement(
      `Hospital Operational Status Changed to ${status.replace(/_/g, ' ')}`,
      reason || `Operational status transition authorized by ${actor}.`,
      status === 'EMERGENCY_ONLY' || status === 'CLOSED' ? 'URGENT' : 'WARNING',
      actor
    );

    return this.getFacilityOperationsSummary(facilityId);
  }

  toggleServiceStatus(
    serviceId: string,
    status: ServiceOperationalStatus,
    reason?: string,
    notes?: string
  ): OperationalService | null {
    const serv = this.operationalServices.find((s) => s.id === serviceId);
    if (!serv) return null;

    serv.status = status;
    serv.statusReason = reason;
    if (notes) serv.notes = notes;
    serv.lastUpdated = new Date().toISOString();

    if (status === 'OFFLINE') {
      serv.currentWaitMinutes = 0;
    } else if (status === 'DEGRADED') {
      serv.currentWaitMinutes = Math.max(serv.currentWaitMinutes, 30);
    }

    return serv;
  }

  broadcastAnnouncement(
    title: string,
    message: string,
    severity: 'INFO' | 'WARNING' | 'URGENT' = 'INFO',
    author: string = 'Vikram Joshi (Operations Lead)'
  ): OperationalAnnouncement {
    const newAnnouncement: OperationalAnnouncement = {
      id: `ann_ops_${Date.now()}`,
      title,
      message,
      severity,
      createdAt: new Date().toISOString(),
      author,
      active: true,
    };
    this.operationalAnnouncements.unshift(newAnnouncement);
    return newAnnouncement;
  }

  resolveOperationalIssue(issueId: string, resolvedBy?: string): OperationalIssue | null {
    const issue = this.operationalIssues.find((i) => i.id === issueId);
    if (!issue) return null;

    issue.resolved = true;
    issue.resolvedAt = new Date().toISOString();
    issue.resolvedBy = resolvedBy || 'Vikram Joshi (Operations Lead)';
    return issue;
  }

  updateDepartmentQueueWait(departmentId: string, delayDeltaMinutes: number): void {
    const serv = this.operationalServices.find((s) => s.code.toLowerCase().includes(departmentId.toLowerCase()));
    if (serv) {
      serv.currentWaitMinutes = Math.max(0, serv.currentWaitMinutes + delayDeltaMinutes);
      serv.lastUpdated = new Date().toISOString();
    }
    if (this.liveQueue.averageConsultTimeMinutes) {
      this.liveQueue.averageConsultTimeMinutes = Math.max(
        5,
        this.liveQueue.averageConsultTimeMinutes + Math.round(delayDeltaMinutes / 2)
      );
    }
  }

  getStaffDuty(facilityId?: string): StaffDutyItem[] {
    return this.staffDuty;
  }

  // --- DISTRICT & STATE HEALTH INSTITUTION MANAGEMENT METHODS ---
  addFacility(data: Partial<Facility>, actor: string = 'District Health Admin'): Facility {
    const newFacility: Facility = {
      id: `fac_${Date.now()}`,
      name: data.name || 'Community Health Clinic',
      type: data.type || 'CHC',
      district: data.district || 'Gandhinagar',
      state: data.state || 'Gujarat',
      address: data.address || 'Civil Hospital Road',
      pincode: data.pincode || '382024',
      contactNumber: data.contactNumber || '+91 79 2322 0000',
      emergencyNumber: data.emergencyNumber || '108',
      totalBeds: data.totalBeds ?? 30,
      availableBeds: data.availableBeds ?? 20,
      icuBedsTotal: data.icuBedsTotal ?? 4,
      icuBedsAvailable: data.icuBedsAvailable ?? 2,
      oxygenAvailable: data.oxygenAvailable ?? true,
      bloodBankAvailable: data.bloodBankAvailable ?? false,
      ambulanceAvailable: data.ambulanceAvailable ?? true,
      emergencyAvailable: data.emergencyAvailable ?? true,
      isOpen: data.isOpen ?? true,
      isVerified: data.isVerified ?? true,
      currentWaitTimeMinutes: data.currentWaitTimeMinutes ?? 15,
      departments: data.departments || [
        { id: `dep_gm_${Date.now()}`, name: 'General Medicine', code: 'GEN', activeDoctors: 2, currentWaitMinutes: 15, opdOpen: true },
        { id: `dep_ped_${Date.now()}`, name: 'Pediatrics', code: 'PED', activeDoctors: 1, currentWaitMinutes: 20, opdOpen: true },
      ],
      specialties: data.specialties && data.specialties.length > 0 ? data.specialties : ['General Medicine', 'Pediatrics'],
      equipment: data.equipment || [],
      coordinates: data.coordinates || { lat: 23.2156 + (Math.random() - 0.5) * 0.05, lng: 72.6369 + (Math.random() - 0.5) * 0.05 },
      distanceKm: data.distanceKm || Math.round((Math.random() * 8 + 2) * 10) / 10,
      lastUpdated: new Date().toISOString(),
    };

    this.facilities.unshift(newFacility);

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr_dist_admin',
      actorName: actor,
      actorRole: 'DISTRICT_ADMIN',
      action: 'ADD_HEALTHCARE_FACILITY',
      resourceType: 'FACILITY',
      resourceId: newFacility.id,
      ipAddress: '10.14.0.1',
      userAgent: 'HealthConnect District Portal',
      status: 'SUCCESS',
      details: `Added new government facility: ${newFacility.name} (${newFacility.type}) in ${newFacility.district}`,
    });

    return newFacility;
  }

  addDoctor(data: Partial<DistrictDoctor>, actor: string = 'District Health Admin'): DistrictDoctor {
    const newDoc: DistrictDoctor = {
      id: `doc_${Date.now()}`,
      name: data.name || 'Dr. Medical Officer',
      qualification: data.qualification || 'MBBS',
      specialty: data.specialty || 'General Medicine',
      facilityId: data.facilityId || (this.facilities[0] ? this.facilities[0].id : 'fac_civil_01'),
      facilityName: data.facilityName || (this.facilities[0] ? this.facilities[0].name : 'Gandhinagar Civil Hospital'),
      status: data.status || 'ON_DUTY',
      phone: data.phone || '9876500000',
      email: data.email || 'doctor@gujarat.health.gov.in',
      opdSchedule: data.opdSchedule || '09:00 AM – 01:00 PM (Mon-Sat)',
      patientsToday: 0,
      teleconsultEnabled: data.teleconsultEnabled ?? true,
      district: data.district || 'Gandhinagar',
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: data.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    };

    this.doctors.unshift(newDoc);

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr_dist_admin',
      actorName: actor,
      actorRole: 'DISTRICT_ADMIN',
      action: 'REGISTER_DISTRICT_DOCTOR',
      resourceType: 'DOCTOR',
      resourceId: newDoc.id,
      ipAddress: '10.14.0.1',
      userAgent: 'HealthConnect District Portal',
      status: 'SUCCESS',
      details: `Registered ${newDoc.name} (${newDoc.specialty}) at ${newDoc.facilityName}`,
    });

    return newDoc;
  }

  updateDoctorStatus(doctorId: string, status: DistrictDoctor['status']): DistrictDoctor | null {
    const doc = this.doctors.find((d) => d.id === doctorId);
    if (doc) {
      doc.status = status;
    }
    return doc || null;
  }

  updateDoctor(doctorId: string, updates: Partial<DistrictDoctor>): DistrictDoctor | null {
    const doc = this.doctors.find((d) => d.id === doctorId || d.name.toLowerCase() === doctorId.toLowerCase());
    if (doc) {
      Object.assign(doc, updates);
      // Also sync user record in this.users if matching
      const userEntry = Object.values(this.users).find((u) => u.name === doc.name || u.phone === doc.phone);
      if (userEntry) {
        if (updates.name) userEntry.name = updates.name;
        if (updates.phone) userEntry.phone = updates.phone;
        if (updates.email) userEntry.email = updates.email;
        if (updates.qualification) userEntry.qualification = updates.qualification;
        if (updates.specialty) userEntry.specialty = updates.specialty;
        if (updates.avatar) userEntry.avatar = updates.avatar;
      }
    }
    return doc || null;
  }

  isDoctorMatch(docId: string, docName: string, targetId?: string, targetName?: string): boolean {
    if (!targetId && !targetName) return false;
    const dId = (docId || '').toLowerCase();
    const tId = (targetId || '').toLowerCase();
    if (dId && tId) {
      if (dId === tId) return true;
      if ((dId === 'doc_01' || dId === 'usr_doc_01') && (tId === 'doc_01' || tId === 'usr_doc_01')) return true;
      if ((dId === 'doc_02' || dId === 'usr_doc_02') && (tId === 'doc_02' || tId === 'usr_doc_02')) return true;
      if ((dId === 'doc_03' || dId === 'usr_doc_03') && (tId === 'doc_03' || tId === 'usr_doc_03')) return true;
      if ((dId === 'doc_04' || dId === 'usr_doc_04') && (tId === 'doc_04' || tId === 'usr_doc_04')) return true;
      if ((dId === 'doc_06' || dId === 'usr_doc_06') && (tId === 'doc_06' || tId === 'usr_doc_06')) return true;
    }
    const dName = (docName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
    const tName = (targetName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
    if (dName && tName && (dName.includes(tName) || tName.includes(dName))) {
      return true;
    }
    return false;
  }

  getDoctorLeaves(doctorIdOrName: string): DoctorLeave[] {
    const term = (doctorIdOrName || '').trim().toLowerCase();
    return this.doctorLeaves.filter(
      (l) => l.doctorId.toLowerCase() === term ||
             l.doctorName.toLowerCase().includes(term) ||
             term.includes(l.doctorName.toLowerCase()) ||
             (term === 'usr_doc_01' && (l.doctorId === 'doc_01' || l.doctorName.includes('Arvind Patel')))
    );
  }

  getFacilityLeaves(facilityId: string = 'fac_civil_01', status?: string): DoctorLeave[] {
    return this.doctorLeaves.filter((l) => {
      const matchesFac = !l.facilityId || l.facilityId === facilityId || facilityId === 'ALL';
      if (!matchesFac) return false;
      if (status && status !== 'ALL') {
        return l.status === status;
      }
      return true;
    });
  }

  getLeaveById(id: string): DoctorLeave | undefined {
    return this.doctorLeaves.find((l) => l.id === id);
  }

  isDoctorOnLeave(doctorIdOrName: string, dateStr?: string): { onLeave: boolean; leave?: DoctorLeave } {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const leaves = this.getDoctorLeaves(doctorIdOrName);
    const activeLeave = leaves.find((l) => {
      if (l.status !== 'APPROVED') return false;
      return targetDate >= l.startDate && targetDate <= l.endDate;
    });

    if (activeLeave) {
      return { onLeave: true, leave: activeLeave };
    }

    // Also verify if the doctor's status is directly ON_LEAVE
    const term = (doctorIdOrName || '').trim().toLowerCase();
    const doc = this.doctors.find(
      (d) => d.id.toLowerCase() === term ||
             d.name.toLowerCase().includes(term) ||
             term.includes(d.name.toLowerCase()) ||
             (term === 'usr_doc_01' && d.id === 'doc_01')
    );

    if (doc && doc.status === 'ON_LEAVE') {
      return { onLeave: true, leave: doc.currentLeave };
    }

    return { onLeave: false };
  }

  evaluateLeaveImpact(
    doctorId: string,
    startDate: string,
    endDate: string,
    facilityId?: string
  ): StaffLeaveOperationalImpact {
    const term = (doctorId || '').toLowerCase();
    const doc = this.doctors.find(
      (d) => d.id.toLowerCase() === term ||
             d.name.toLowerCase().includes(term) ||
             term.includes(d.name.toLowerCase()) ||
             (term === 'usr_doc_01' && d.id === 'doc_01') ||
             (term === 'doc_01' && d.id === 'doc_01')
    );
    const docName = doc ? doc.name : doctorId;
    const docSpecialty = doc ? doc.specialty : 'General Medicine';
    const targetFacilityId = facilityId || (doc ? doc.facilityId : 'fac_civil_01');
    const fac = this.facilities.find((f) => f.id === targetFacilityId);
    const facilityName = fac ? fac.name : (doc ? doc.facilityName : 'Gandhinagar Civil Hospital');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    // Specialty coverage
    const deptDoctors = this.doctors.filter(
      (d) => d.facilityId === targetFacilityId &&
             d.specialty.toLowerCase() === docSpecialty.toLowerCase()
    );
    const totalDeptDoctors = Math.max(deptDoctors.length, 1);

    // Remaining available doctors in dept during requested period
    const availableDuringPeriod = deptDoctors.filter((d) => {
      if (doc && d.id === doc.id) return false;
      const hasOverlap = this.doctorLeaves.some((l) => {
        if (l.status !== 'APPROVED') return false;
        if (l.doctorId !== d.id && !l.doctorName.includes(d.name)) return false;
        return startDate <= l.endDate && endDate >= l.startDate;
      });
      return !hasOverlap;
    });

    const availableCount = availableDuringPeriod.length;
    let coverageStatus: 'ADEQUATE' | 'LIMITED' | 'CRITICAL_GAP' = 'ADEQUATE';
    if (availableCount === 0) {
      coverageStatus = 'CRITICAL_GAP';
    } else if (availableCount === 1 && totalDeptDoctors > 1) {
      coverageStatus = 'LIMITED';
    } else if (availableCount < totalDeptDoctors / 2) {
      coverageStatus = 'LIMITED';
    }

    // Alternate doctors
    const alternateDoctors = this.doctors
      .filter((d) => (doc ? d.id !== doc.id : true) && (
        d.specialty.toLowerCase() === docSpecialty.toLowerCase() ||
        (d.facilityId === targetFacilityId && d.specialty.includes('Medicine'))
      ))
      .map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        status: d.status,
        facilityName: d.facilityName,
        opdSchedule: d.opdSchedule,
      }))
      .slice(0, 3);

    // Affected appointments
    const affectedAppointments = this.appointments.filter((a) => {
      if (a.status === 'CANCELLED') return false;
      if (a.date < startDate || a.date > endDate) return false;
      return this.isDoctorMatch(doc ? doc.id : doctorId, docName, a.doctorId, a.doctorName);
    });

    // Active queues
    const affectedQueuesCount = (this.liveQueue.tokens || []).filter((t: Token) => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      if (doc && (t.doctorId === doc.id || t.doctorName?.includes(doc.name))) return true;
      return t.facilityId === targetFacilityId && t.departmentName.toLowerCase().includes(docSpecialty.toLowerCase());
    }).length;

    let recommendedAction = 'Standard operational approval feasible. Minimum clinical coverage maintained.';
    if (coverageStatus === 'CRITICAL_GAP') {
      recommendedAction = `Severe coverage gap: 0 specialists remaining in ${docSpecialty}. Arrange clinical coverage handover or cross-facility specialist roster before approving. ${affectedAppointments.length} appointments require front-desk rescheduling.`;
    } else if (coverageStatus === 'LIMITED') {
      recommendedAction = `Limited coverage: 1 specialist remaining in ${docSpecialty}. Monitor OPD queue velocity closely. ${affectedAppointments.length} appointments require rescheduling.`;
    } else if (affectedAppointments.length > 0) {
      recommendedAction = `Adequate staff coverage available. Front desk must notify and reschedule ${affectedAppointments.length} affected appointments.`;
    }

    return {
      doctorId: doc ? doc.id : doctorId,
      doctorName: docName,
      specialty: docSpecialty,
      facilityId: targetFacilityId,
      facilityName,
      startDate,
      endDate,
      totalDays,
      totalDoctorsInDepartment: totalDeptDoctors,
      availableDoctorsDuringPeriod: availableCount,
      coverageStatus,
      alternateDoctors,
      affectedAppointments,
      affectedQueuesCount,
      recommendedAction,
    };
  }

  addDoctorLeave(leaveData: Omit<DoctorLeave, 'id' | 'createdAt'>, actor: string = 'Doctor'): DoctorLeave {
    // 1. Validation
    if (!leaveData.startDate || !leaveData.endDate) {
      throw new Error('Start date and end date are required for leave.');
    }
    if (leaveData.startDate > leaveData.endDate) {
      throw new Error('Leave start date cannot be after end date.');
    }

    const term = (leaveData.doctorId || '').toLowerCase();
    const doc = this.doctors.find(
      (d) => d.id.toLowerCase() === term ||
             d.name.toLowerCase().includes(term) ||
             term.includes(d.name.toLowerCase()) ||
             (term === 'usr_doc_01' && d.id === 'doc_01')
    );

    // Check for overlapping active leaves for the same doctor
    const overlapping = this.doctorLeaves.find((l) => {
      if (l.status === 'CANCELLED' || l.status === 'REJECTED') return false;
      const isSameDoc = this.isDoctorMatch(leaveData.doctorId, leaveData.doctorName, l.doctorId, l.doctorName);
      if (!isSameDoc) return false;
      return leaveData.startDate <= l.endDate && leaveData.endDate >= l.startDate;
    });

    if (overlapping) {
      throw new Error(
        `An overlapping leave request (${overlapping.startDate} to ${overlapping.endDate} [${overlapping.status}]) is already on record.`
      );
    }

    // Evaluate impact
    const facilityId = leaveData.facilityId || (doc ? doc.facilityId : 'fac_civil_01');
    const facilityName = leaveData.facilityName || (doc ? doc.facilityName : 'Gandhinagar Civil Hospital');
    const department = leaveData.department || (doc ? doc.specialty : 'Clinical OPD');

    const impact = this.evaluateLeaveImpact(leaveData.doctorId, leaveData.startDate, leaveData.endDate, facilityId);

    const newLeave: DoctorLeave = {
      ...leaveData,
      id: `leave_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: leaveData.status || 'PENDING',
      facilityId,
      facilityName,
      department,
      affectedAppointmentsCount: impact.affectedAppointments.length,
      serviceCoverageImpact: impact.coverageStatus,
      createdAt: new Date().toISOString(),
    };

    this.doctorLeaves.unshift(newLeave);

    // If submitted directly as APPROVED and effective today
    const today = new Date().toISOString().split('T')[0];
    const isEffectiveNow = today >= newLeave.startDate && today <= newLeave.endDate;

    if (doc && newLeave.status === 'APPROVED' && isEffectiveNow) {
      doc.status = 'ON_LEAVE';
      doc.currentLeave = newLeave;
    }

    // Notifications
    this.addNotification({
      recipientRole: 'FACILITY_STAFF',
      recipientFacilityId: facilityId,
      title: 'New Staff Leave Request Filed',
      message: `${newLeave.doctorName} (${department}) requested leave from ${newLeave.startDate} to ${newLeave.endDate}. Potential impact: ${newLeave.affectedAppointmentsCount || 0} appointments.`,
      type: 'LEAVE',
      leaveId: newLeave.id,
    });

    this.addNotification({
      recipientRole: 'DOCTOR',
      recipientUserId: newLeave.doctorId,
      title: 'Leave Application Submitted',
      message: `Your leave request for ${newLeave.startDate} to ${newLeave.endDate} has been submitted to Facility Operations for operational review.`,
      type: 'LEAVE',
      leaveId: newLeave.id,
    });

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: doc ? doc.id : 'usr_doctor',
      actorName: actor || newLeave.doctorName,
      actorRole: 'DOCTOR',
      action: 'DOCTOR_LEAVE_FILED',
      resourceType: 'DOCTOR_ROSTER',
      resourceId: newLeave.id,
      ipAddress: '10.14.0.1',
      userAgent: 'HealthConnect Medical Officer Roster Portal',
      status: 'SUCCESS',
      details: `${newLeave.doctorName} filed leave from ${newLeave.startDate} to ${newLeave.endDate} [Reason: ${newLeave.reason}] (Status: ${newLeave.status})`,
    });

    this.saveLeaves();
    return newLeave;
  }

  approveDoctorLeave(
    leaveId: string,
    reviewedBy: string = 'Vikram Joshi (Operations Lead)',
    options?: { resolutionNotes?: string; alternateDoctorId?: string; notifyPatients?: boolean }
  ): DoctorLeave {
    const leave = this.doctorLeaves.find((l) => l.id === leaveId);
    if (!leave) throw new Error('Leave request record not found.');

    if (leave.status !== 'PENDING' && leave.status !== 'CHANGES_REQUIRED') {
      throw new Error(`Leave request has already been ${leave.status.toLowerCase()}.`);
    }

    leave.status = 'APPROVED';
    leave.reviewedBy = reviewedBy;
    leave.reviewedAt = new Date().toISOString();
    if (options?.resolutionNotes) {
      leave.notes = leave.notes ? `${leave.notes} • ${options.resolutionNotes}` : options.resolutionNotes;
    }

    // Find doctor
    const term = leave.doctorId.toLowerCase();
    const doc = this.doctors.find(
      (d) => d.id.toLowerCase() === term ||
             d.name.toLowerCase().includes(term) ||
             term.includes(d.name.toLowerCase()) ||
             (term === 'usr_doc_01' && d.id === 'doc_01')
    );

    const today = new Date().toISOString().split('T')[0];
    const isEffectiveNow = today >= leave.startDate && today <= leave.endDate;

    if (doc) {
      if (isEffectiveNow) {
        doc.status = 'ON_LEAVE';
        doc.currentLeave = leave;

        // Update staff duty
        const dutyItem = this.staffDuty.find((s) => s.id === doc.id || s.name.includes(doc.name));
        if (dutyItem) {
          dutyItem.status = 'OFF_DUTY';
        }

        // If department coverage is depleted, update operational services
        const remainingInDept = this.doctors.filter(
          (d) => d.facilityId === doc.facilityId &&
                 d.specialty.toLowerCase() === doc.specialty.toLowerCase() &&
                 d.status !== 'ON_LEAVE'
        ).length;

        if (remainingInDept === 0) {
          const serv = this.operationalServices.find(
            (s) => s.name.toLowerCase().includes(doc.specialty.toLowerCase()) ||
                   doc.specialty.toLowerCase().includes(s.name.toLowerCase())
          );
          if (serv && serv.status === 'OPERATIONAL') {
            serv.status = 'DEGRADED';
            serv.statusReason = `Specialist on approved clinical leave until ${leave.endDate}. Inpatient/emergency handover active.`;
            serv.lastUpdated = new Date().toISOString();
          }
        }
      }
    }

    // Process affected appointments & notify patients
    const affectedAppointments = this.appointments.filter((a) => {
      if (a.status === 'CANCELLED') return false;
      if (a.date < leave.startDate || a.date > leave.endDate) return false;
      return this.isDoctorMatch(leave.doctorId, leave.doctorName, a.doctorId, a.doctorName);
    });

    if (options?.notifyPatients !== false) {
      for (const apt of affectedAppointments) {
        if (!apt.reasonForVisit.includes('[Provider On Approved Leave')) {
          apt.reasonForVisit = `${apt.reasonForVisit} [Provider On Approved Leave - Reschedule Required]`;
        }
        this.addNotification({
          recipientRole: 'PATIENT',
          recipientUserId: apt.patientId,
          recipientFacilityId: leave.facilityId,
          title: 'Appointment Notice: Doctor On Approved Leave',
          message: `Dear ${apt.patientName}, your appointment with ${leave.doctorName} on ${apt.date} at ${apt.timeSlot} is affected by approved medical leave. Please visit OPD Front Desk or rebook via portal.`,
          type: 'APPOINTMENT',
        });
      }
    }

    // Notify doctor
    this.addNotification({
      recipientRole: 'DOCTOR',
      recipientUserId: leave.doctorId,
      title: 'Leave Request Approved',
      message: `Your leave request from ${leave.startDate} to ${leave.endDate} has been approved by ${reviewedBy}.`,
      type: 'LEAVE',
      leaveId: leave.id,
    });

    // Notify District Admin if critical gap
    if (leave.serviceCoverageImpact === 'CRITICAL_GAP') {
      this.addNotification({
        recipientRole: 'DISTRICT_ADMIN',
        recipientFacilityId: leave.facilityId,
        title: `Specialist Coverage Gap: ${leave.facilityName || 'Facility'}`,
        message: `${leave.facilityName || 'Hospital'} has 0 active specialists in ${leave.department || 'Department'} during ${leave.startDate} to ${leave.endDate} following approved leave for ${leave.doctorName}.`,
        type: 'STAFF',
        leaveId: leave.id,
      });
    }

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr_ops_lead',
      actorName: reviewedBy,
      actorRole: 'FACILITY_STAFF',
      action: 'DOCTOR_LEAVE_APPROVED',
      resourceType: 'DOCTOR_ROSTER',
      resourceId: leave.id,
      ipAddress: '10.14.0.1',
      userAgent: 'HealthConnect Facility Operations Portal',
      status: 'SUCCESS',
      details: `Approved leave for ${leave.doctorName} (${leave.startDate} to ${leave.endDate}). Affected appointments: ${affectedAppointments.length}`,
    });

    this.saveLeaves();
    this.saveAppointments();
    return leave;
  }

  rejectDoctorLeave(
    leaveId: string,
    reason: string,
    reviewedBy: string = 'Vikram Joshi (Operations Lead)'
  ): DoctorLeave {
    const leave = this.doctorLeaves.find((l) => l.id === leaveId);
    if (!leave) throw new Error('Leave request record not found.');

    if (leave.status !== 'PENDING' && leave.status !== 'CHANGES_REQUIRED') {
      throw new Error(`Leave request has already been ${leave.status.toLowerCase()}.`);
    }

    if (!reason || !reason.trim()) {
      throw new Error('A formal reason is required to reject a leave request.');
    }

    leave.status = 'REJECTED';
    leave.rejectionReason = reason.trim();
    leave.reviewedBy = reviewedBy;
    leave.reviewedAt = new Date().toISOString();

    // Notify doctor
    this.addNotification({
      recipientRole: 'DOCTOR',
      recipientUserId: leave.doctorId,
      title: 'Leave Request Declined',
      message: `Your leave request for ${leave.startDate} to ${leave.endDate} was declined by ${reviewedBy}. Reason: ${reason.trim()}`,
      type: 'LEAVE',
      leaveId: leave.id,
    });

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr_ops_lead',
      actorName: reviewedBy,
      actorRole: 'FACILITY_STAFF',
      action: 'DOCTOR_LEAVE_REJECTED',
      resourceType: 'DOCTOR_ROSTER',
      resourceId: leave.id,
      ipAddress: '10.14.0.1',
      userAgent: 'HealthConnect Facility Operations Portal',
      status: 'SUCCESS',
      details: `Rejected leave for ${leave.doctorName} (${leave.startDate} to ${leave.endDate}). Rationale: ${reason.trim()}`,
    });

    this.saveLeaves();
    return leave;
  }

  requestChangesDoctorLeave(
    leaveId: string,
    note: string,
    reviewedBy: string = 'Vikram Joshi (Operations Lead)'
  ): DoctorLeave {
    const leave = this.doctorLeaves.find((l) => l.id === leaveId);
    if (!leave) throw new Error('Leave request record not found.');

    if (leave.status !== 'PENDING') {
      throw new Error(`Leave request is not in a pending reviewable state.`);
    }

    if (!note || !note.trim()) {
      throw new Error('Specific change or clarification instructions are required.');
    }

    leave.status = 'CHANGES_REQUIRED';
    leave.changesRequestedNote = note.trim();
    leave.reviewedBy = reviewedBy;
    leave.reviewedAt = new Date().toISOString();

    // Notify doctor
    this.addNotification({
      recipientRole: 'DOCTOR',
      recipientUserId: leave.doctorId,
      title: 'Leave Clarification / Adjustment Requested',
      message: `Facility Operations requested changes on your leave for ${leave.startDate} to ${leave.endDate}: "${note.trim()}". Please review and update.`,
      type: 'LEAVE',
      leaveId: leave.id,
    });

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr_ops_lead',
      actorName: reviewedBy,
      actorRole: 'FACILITY_STAFF',
      action: 'DOCTOR_LEAVE_CHANGES_REQUESTED',
      resourceType: 'DOCTOR_ROSTER',
      resourceId: leave.id,
      ipAddress: '10.14.0.1',
      userAgent: 'HealthConnect Facility Operations Portal',
      status: 'SUCCESS',
      details: `Requested changes for ${leave.doctorName} leave (${leave.startDate} to ${leave.endDate}). Note: ${note.trim()}`,
    });

    this.saveLeaves();
    return leave;
  }

  cancelDoctorLeave(leaveId: string, actor: string = 'Doctor'): boolean {
    const leave = this.doctorLeaves.find((l) => l.id === leaveId);
    if (!leave) return false;

    const previousStatus = leave.status;
    leave.status = 'CANCELLED';

    // Find doctor and restore status if leave was approved & active today
    const term = leave.doctorId.toLowerCase();
    const doc = this.doctors.find(
      (d) => d.id.toLowerCase() === term ||
             d.name.toLowerCase().includes(leave.doctorName.toLowerCase()) ||
             leave.doctorName.toLowerCase().includes(d.name.toLowerCase())
    );

    if (doc && previousStatus === 'APPROVED') {
      const today = new Date().toISOString().split('T')[0];
      const otherActive = this.doctorLeaves.find(
        (l) => l.id !== leaveId &&
               (l.doctorId === doc.id || l.doctorName === doc.name) &&
               l.status === 'APPROVED' &&
               today >= l.startDate && today <= l.endDate
      );

      if (otherActive) {
        doc.status = 'ON_LEAVE';
        doc.currentLeave = otherActive;
      } else {
        doc.status = 'ON_DUTY';
        doc.currentLeave = undefined;
        // Restore staff duty item
        const dutyItem = this.staffDuty.find((s) => s.id === doc.id || s.name.includes(doc.name));
        if (dutyItem) {
          dutyItem.status = 'ON_DUTY';
        }
      }
    }

    // Notify Facility Operations
    this.addNotification({
      recipientRole: 'FACILITY_STAFF',
      recipientFacilityId: leave.facilityId || 'fac_civil_01',
      title: 'Leave Request Withdrawn',
      message: `${leave.doctorName} withdrew/cancelled leave for ${leave.startDate} to ${leave.endDate}.`,
      type: 'LEAVE',
      leaveId: leave.id,
    });

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: doc ? doc.id : 'usr_doctor',
      actorName: actor || leave.doctorName,
      actorRole: 'DOCTOR',
      action: 'DOCTOR_LEAVE_CANCELLED',
      resourceType: 'DOCTOR_ROSTER',
      resourceId: leave.id,
      ipAddress: '10.14.0.1',
      userAgent: 'HealthConnect Medical Officer Roster Portal',
      status: 'SUCCESS',
      details: `Leave cancelled for ${leave.doctorName} (${leave.startDate} to ${leave.endDate})`,
    });

    this.saveLeaves();
    return true;
  }

  addBloodCenter(data: Partial<BloodCenter>, actor: string = 'District Health Admin'): BloodCenter {
    const newCenter: BloodCenter = {
      id: `bc_${Date.now()}`,
      name: data.name || 'District Blood Center',
      licenseNo: data.licenseNo || `GJ-BB-${Math.floor(1000 + Math.random() * 9000)}`,
      type: data.type || 'BLOOD_BANK',
      totalCapacity: data.totalCapacity || 200,
      currentStock: data.currentStock || 45,
      phone: data.phone || '079-2322-0000',
      location: data.location || 'Civil Hospital Complex',
      district: data.district || 'Gandhinagar',
      facilityId: data.facilityId,
      facilityName: data.facilityName,
      componentSeparation: data.componentSeparation ?? false,
      emergencyHotline: data.emergencyHotline || '108',
      lastInspectionDate: new Date().toISOString().split('T')[0],
    };

    this.bloodCenters.unshift(newCenter);

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr_dist_admin',
      actorName: actor,
      actorRole: 'DISTRICT_ADMIN',
      action: 'PROVISION_BLOOD_CENTER',
      resourceType: 'BLOOD_BANK',
      resourceId: newCenter.id,
      ipAddress: '10.14.0.1',
      userAgent: 'HealthConnect District Portal',
      status: 'SUCCESS',
      details: `Provisioned blood institution: ${newCenter.name} (${newCenter.type}) in ${newCenter.district}`,
    });

    return newCenter;
  }

  provisionDistrictAdmin(data: Partial<DistrictAdminProfile>, actor: string = 'Super Admin (State Health Authority)'): DistrictAdminProfile {
    const newAdmin: DistrictAdminProfile = {
      id: `usr_dist_${Date.now()}`,
      name: data.name || 'Dr. Appointed CDHO',
      designation: data.designation || 'Chief District Health Officer (CDHO)',
      district: data.district || 'Gandhinagar',
      state: 'Gujarat',
      email: data.email || `cdho.${(data.district || 'district').toLowerCase()}@gujarat.gov.in`,
      phone: data.phone || '9825000000',
      appointedAt: new Date().toISOString(),
      appointedBy: actor,
      status: data.status || 'ACTIVE',
      jurisdictionFacilitiesCount: this.facilities.filter((f) => f.district.toLowerCase() === (data.district || '').toLowerCase()).length || 4,
      jurisdictionPopulation: data.jurisdictionPopulation || 1500000,
      privileges: data.privileges || ['FACILITY_MANAGEMENT', 'DOCTOR_DEPLOYMENT', 'BLOOD_BANK_GOVERNANCE', 'EMERGENCY_BROADCAST'],
    };

    this.districtAdmins.unshift(newAdmin);

    // Register user account in users dictionary
    this.users[newAdmin.id] = {
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      phone: newAdmin.phone,
      role: 'DISTRICT_ADMIN',
      district: newAdmin.district,
    };

    // Immutable Audit Log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr_super_root',
      actorName: actor,
      actorRole: 'SUPER_ADMIN',
      action: 'APPOINT_DISTRICT_HEALTH_OFFICER',
      resourceType: 'USER_ROLE_ASSIGNMENT',
      resourceId: newAdmin.id,
      ipAddress: '127.0.0.1',
      userAgent: 'HealthConnect State Apex Governance Console',
      status: 'SUCCESS',
      details: `State Health Authority appointed ${newAdmin.name} (${newAdmin.designation}) for ${newAdmin.district} District jurisdiction.`,
    });

    return newAdmin;
  }

  updateDistrictAdminStatus(adminId: string, status: DistrictAdminProfile['status']): DistrictAdminProfile | null {
    const admin = this.districtAdmins.find((a) => a.id === adminId);
    if (admin) {
      admin.status = status;
      this.auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: 'usr_super_root',
        actorName: 'Super Admin (State Health Authority)',
        actorRole: 'SUPER_ADMIN',
        action: 'UPDATE_DISTRICT_ADMIN_STATUS',
        resourceType: 'USER_ROLE_ASSIGNMENT',
        resourceId: admin.id,
        ipAddress: '127.0.0.1',
        userAgent: 'HealthConnect State Apex Governance Console',
        status: 'SUCCESS',
        details: `District administrator ${admin.name} status updated to ${status}.`,
      });
    }
    return admin || null;
  }
}

export const mockState = new MockHealthcareState();
