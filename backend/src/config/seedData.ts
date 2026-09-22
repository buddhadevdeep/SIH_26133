import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { FacilityModel } from '../models/Facility';
import { DoctorModel } from '../models/Doctor';
import { DistrictModel } from '../models/District';

export const SEED_ROLES = [
  {
    id: 'role_super_admin',
    code: 'SUPER_ADMIN',
    name: 'State Apex Super Administrator',
    description: 'Full state-wide administrative authority across all districts, hospitals, technical AI models, system health, and cross-district user governance.',
    level: 'STATE',
    permissions: [
      'system:manage:all',
      'district:manage:all',
      'facility:manage:all',
      'user:manage:all',
      'role:manage:all',
      'ai_models:deploy',
      'ai_models:rollback',
      'audit:read:all',
      'analytics:read:state',
      'queue:override:state',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    id: 'role_district_admin',
    code: 'DISTRICT_ADMIN',
    name: 'District Chief Medical Administrator (CDHO)',
    description: 'District command authority for facility oversight, hospital staff provisioning, ambulance tracking, epidemic intelligence, and resource allocation within assigned district.',
    level: 'DISTRICT',
    permissions: [
      'district:manage:own',
      'facility:manage:district',
      'user:manage:district',
      'staff:provision:district',
      'referral:coordinate',
      'ambulance:dispatch:district',
      'epidemic:track:district',
      'inventory:reallocate:district',
      'analytics:read:district',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    id: 'role_hospital_admin',
    code: 'HOSPITAL_ADMIN',
    name: 'Hospital Superintendent & Operations Admin',
    description: 'Hospital-level operational control for bed allocation, OPD department configuration, on-duty specialist rostering, and hospital staff management.',
    level: 'FACILITY',
    permissions: [
      'facility:manage:own',
      'opd:configure:facility',
      'doctor:roster:facility',
      'beds:allocate:facility',
      'staff:manage:facility',
      'equipment:track:facility',
      'analytics:read:facility',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    id: 'role_doctor',
    code: 'DOCTOR',
    name: 'Licensed Medical Doctor & Specialist',
    description: 'Clinical consultation, digital prescriptions (Rx), patient medical records review, lab investigations orders, closed-loop cross-facility referrals, and token queue management.',
    level: 'FACILITY',
    permissions: [
      'patient:consult',
      'ehr:read:authorized',
      'ehr:write:consultation',
      'prescription:create',
      'lab:order',
      'referral:create',
      'queue:manage:doctor',
      'telehealth:consult',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    id: 'role_facility_staff',
    code: 'FACILITY_STAFF',
    name: 'Hospital Facility Staff & Operators',
    description: 'Specialized hospital staff operations across registration counter tokens, pharmacy dispensing, laboratory diagnostics, nursing vitals, and bed triage coordination.',
    level: 'FACILITY',
    permissions: [
      'registration:token:create',
      'registration:patient:register',
      'pharmacy:dispense',
      'pharmacy:inventory:read',
      'lab:sample:collect',
      'lab:result:enter',
      'nursing:vitals:record',
      'queue:call:next',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    id: 'role_asha',
    code: 'ASHA',
    name: 'ASHA & Community Health Worker',
    description: 'Grassroots community health surveillance, home health surveys, ANC/immunization tracking, emergency triage, and telehealth facilitation.',
    level: 'COMMUNITY',
    permissions: [
      'community:survey',
      'anc:track',
      'immunization:log',
      'telehealth:request',
      'emergency:flag',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    id: 'role_patient',
    code: 'PATIENT',
    name: 'Citizen & Registered Patient',
    description: 'Public patient portal access for appointment scheduling, live token tracking, AI symptom triage, ABHA health locker, and medicine orders.',
    level: 'CITIZEN',
    permissions: [
      'appointment:book',
      'token:request',
      'ai_chat:use',
      'records:view_own',
      'prescription:download',
    ],
    isSystem: true,
    isActive: true,
  },
];

export async function seedInitialDatabase(): Promise<void> {
  try {
    // 1. Seed Canonical Roles in RoleModel
    for (const r of SEED_ROLES) {
      await RoleModel.findOneAndUpdate(
        { code: r.code },
        { $set: r },
        { upsert: true, new: true }
      );
    }

    // 2. Ensure initial Gujarat Districts exist
    const defaultDistricts = [
      { id: 'dist_gandhinagar', name: 'Gandhinagar', code: 'GANDHINAGAR', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Gandhinagar', population: 1391753 },
      { id: 'dist_ahmedabad', name: 'Ahmedabad', code: 'AHMEDABAD', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Ahmedabad', population: 7214225 },
      { id: 'dist_surat', name: 'Surat', code: 'SURAT', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Surat', population: 6081322 },
    ];

    for (const d of defaultDistricts) {
      await DistrictModel.findOneAndUpdate(
        { $or: [{ id: d.id }, { name: d.name }] },
        { $set: d },
        { upsert: true, new: true }
      );
    }

    // 3. Ensure primary facilities exist
    const defaultFacilities = [
      {
        id: 'fac_civil_01',
        facilityId: 'fac_civil_01',
        name: 'Gandhinagar Civil Hospital & Medical College',
        type: 'DISTRICT_HOSPITAL',
        districtId: 'dist_gandhinagar',
        district: 'Gandhinagar',
        state: 'Gujarat',
        address: 'Sector 12, Near Bus Depot, Gandhinagar - 382012',
        pincode: '382012',
        contactNumber: '079-2322-1916',
        phone: '079-2322-1916',
        emergencyNumber: '108',
        emergencyPhone: '108',
        coordinates: { lat: 23.2156, lng: 72.6369 },
        location: { type: 'Point', coordinates: [72.6369, 23.2156] },
        totalBeds: 650,
        availableBeds: 84,
        icuBeds: 60,
        availableIcuBeds: 12,
        oxygenBeds: 200,
        availableOxygenBeds: 34,
        ventilators: 30,
        availableVentilators: 8,
        activeDoctors: 42,
        onDutyStaff: 85,
        opdQueueLength: 24,
        avgWaitTimeMinutes: 18,
        services: ['EMERGENCY', 'ICU', 'CARDIOLOGY', 'NEUROLOGY', 'ORTHOPEDICS', 'PEDIATRICS', 'GENERAL_MEDICINE', 'SURGERY', 'DIALYSIS', 'BLOOD_BANK', 'RADIOLOGY', 'PATHOLOGY'],
        departments: [
          { name: 'General Medicine', code: 'GEN_MED', activeDoctors: 6, queueCount: 8, avgWaitMinutes: 15 },
          { name: 'Cardiology', code: 'CARDIO', activeDoctors: 3, queueCount: 4, avgWaitMinutes: 25 },
          { name: 'Pediatrics', code: 'PED', activeDoctors: 4, queueCount: 5, avgWaitMinutes: 12 },
          { name: 'Orthopedics', code: 'ORTHO', activeDoctors: 4, queueCount: 7, avgWaitMinutes: 20 },
        ],
        isOpen: true,
        isActive: true,
      },
      {
        id: 'fac_civil_02',
        facilityId: 'fac_civil_02',
        name: 'Ahmedabad Civil Hospital (Asarwa)',
        type: 'APEX_TERTIARY_HOSPITAL',
        districtId: 'dist_ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        address: 'Asarwa, Ahmedabad - 380016',
        pincode: '380016',
        contactNumber: '079-2268-3721',
        phone: '079-2268-3721',
        emergencyNumber: '108',
        emergencyPhone: '108',
        coordinates: { lat: 23.0525, lng: 72.5947 },
        location: { type: 'Point', coordinates: [72.5947, 23.0525] },
        totalBeds: 2800,
        availableBeds: 340,
        icuBeds: 350,
        availableIcuBeds: 45,
        oxygenBeds: 800,
        availableOxygenBeds: 110,
        ventilators: 150,
        availableVentilators: 28,
        activeDoctors: 180,
        onDutyStaff: 450,
        opdQueueLength: 68,
        avgWaitTimeMinutes: 22,
        services: ['EMERGENCY', 'ICU', 'CARDIOLOGY', 'NEUROLOGY', 'ONCOLOGY', 'NEPHROLOGY', 'TRAUMA_CENTER', 'ORGAN_TRANSPLANT', 'PEDIATRICS', 'GENERAL_MEDICINE'],
        departments: [
          { name: 'General Medicine', code: 'GEN_MED', activeDoctors: 18, queueCount: 22, avgWaitMinutes: 20 },
          { name: 'Cardiology', code: 'CARDIO', activeDoctors: 12, queueCount: 15, avgWaitMinutes: 30 },
          { name: 'Trauma & Emergency', code: 'EMERGENCY', activeDoctors: 20, queueCount: 10, avgWaitMinutes: 5 },
        ],
        isOpen: true,
        isActive: true,
      },
    ];

    for (const f of defaultFacilities) {
      await FacilityModel.findOneAndUpdate(
        { $or: [{ id: f.id }, { name: f.name }] },
        { $set: f },
        { upsert: true, new: true }
      );
    }

    const firstFacility = await FacilityModel.findOne({ id: 'fac_civil_01' }) || await FacilityModel.findOne({});

    // 4. Ensure Super Admin exists
    const username = process.env.BOOTSTRAP_ADMIN_USERNAME || 'superadmin';
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@12345';
    let superAdmin = await UserModel.findOne({ role: 'SUPER_ADMIN' });
    if (!superAdmin) {
      await UserModel.create({
        id: 'usr_super_bootstrap',
        name: 'State Super Administrator',
        username,
        email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'superadmin@gujarat.health.gov.in',
        phone: '9999900001',
        password,
        role: 'SUPER_ADMIN',
        district: 'State Apex',
        designation: 'State Principal Health Administrator',
        status: 'ACTIVE',
      });
      console.log(`[Bootstrap] Super Admin created: username=${username}`);
    }

    // 5. Ensure All Canonical Demo Staff and Admin Accounts Exist
    const demoUsers = [
      {
        id: 'usr_district_meet',
        name: 'Dr. Meet Parmar (CDHO)',
        username: 'meet',
        email: 'meet@gujarat.health.gov.in',
        phone: '9876500010',
        password: 'Health@123',
        role: 'DISTRICT_ADMIN',
        districtId: 'dist_gandhinagar',
        district: 'Gandhinagar',
        designation: 'Chief District Health Officer (CDHO)',
        status: 'ACTIVE',
      },
      {
        id: 'usr_admin_hospital',
        name: 'Dr. Ramesh Shah (Medical Superintendent)',
        username: 'hospitaladmin',
        email: 'admin.hospital@gujarat.health.gov.in',
        phone: '9876500004',
        password: 'Health@123',
        role: 'HOSPITAL_ADMIN',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        designation: 'Hospital Superintendent & Facility Director',
        status: 'ACTIVE',
      },
      {
        id: 'usr_doc_arvind',
        name: 'Dr. Arvind Patel',
        username: 'dr.arvind.patel',
        email: 'dr.arvind.patel@gujarat.gov.in',
        phone: '9876500005',
        password: 'Health@123',
        role: 'DOCTOR',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        specialty: 'General Medicine',
        qualification: 'MBBS, MD',
        designation: 'Senior Medical Specialist',
        status: 'ACTIVE',
      },
      {
        id: 'usr_doc_sneha',
        name: 'Dr. Sneha Desai',
        username: 'dr.sneha.desai',
        email: 'dr.sneha.desai@gujarat.gov.in',
        phone: '9876500006',
        password: 'Health@123',
        role: 'DOCTOR',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        specialty: 'Cardiology',
        qualification: 'MBBS, DM Cardiology',
        designation: 'Lead Consultant Cardiologist',
        status: 'ACTIVE',
      },
      {
        id: 'usr_ops_vikram',
        name: 'Vikram Sharma (Facility Operations)',
        username: 'vikram.ops',
        email: 'vikram.ops@civilhospital.in',
        phone: '9876500001',
        password: 'Health@123',
        role: 'FACILITY_STAFF',
        staffSubType: 'FACILITY_OPERATIONS',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        permissions: ['VIEW_FACILITY', 'VIEW_BEDS', 'MANAGE_BEDS', 'VIEW_FLEET', 'MANAGE_FLEET', 'VIEW_RESOURCES', 'MANAGE_RESOURCES'],
        designation: 'Operations Coordinator (Beds & Fleet)',
        status: 'ACTIVE',
      },
      {
        id: 'usr_pharma_priya',
        name: 'Priya Mehta (Pharmacist)',
        username: 'priya.pharma',
        email: 'priya.pharma@civilhospital.in',
        phone: '9876500002',
        password: 'Health@123',
        role: 'FACILITY_STAFF',
        staffSubType: 'PHARMACIST',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        permissions: ['VIEW_MEDICINES', 'MANAGE_INVENTORY', 'DISPENSE_MEDICINE'],
        designation: 'Chief Pharmacist',
        status: 'ACTIVE',
      },
      {
        id: 'usr_reg_rajesh',
        name: 'Rajesh Patel (Registration Counter)',
        username: 'rajesh.reg',
        email: 'rajesh.reg@civilhospital.in',
        phone: '9876500003',
        password: 'Health@123',
        role: 'FACILITY_STAFF',
        staffSubType: 'REGISTRATION_CLERK',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        permissions: ['VIEW_PATIENT', 'REGISTER_PATIENT', 'VIEW_APPOINTMENT', 'CHECK_IN', 'ASSIGN_DOCTOR', 'MANAGE_QUEUE'],
        designation: 'Registration & Token Counter Clerk',
        status: 'ACTIVE',
      },
      {
        id: 'usr_lab_amit',
        name: 'Amit Joshi (Lab Technician)',
        username: 'labtech',
        email: 'lab.tech@civilhospital.in',
        phone: '9876500007',
        password: 'Health@123',
        role: 'FACILITY_STAFF',
        staffSubType: 'LAB_TECHNICIAN',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        permissions: ['VIEW_LAB_ORDERS', 'COLLECT_SAMPLE', 'ENTER_RESULTS', 'VERIFY_REPORT'],
        designation: 'Senior Diagnostics Technician',
        status: 'ACTIVE',
      },
      {
        id: 'usr_asha_sunita',
        name: 'Sunita Ben Patel',
        username: 'asha.sunita',
        email: 'asha.sunita@gujarat.health.gov.in',
        phone: '9876500009',
        password: 'Health@123',
        role: 'ASHA',
        districtId: 'dist_gandhinagar',
        district: 'Gandhinagar',
        designation: 'Accredited Social Health Activist (ASHA)',
        status: 'ACTIVE',
      },
    ];

    for (const du of demoUsers) {
      let existing = await UserModel.findOne({ $or: [{ id: du.id }, { email: du.email }, { username: du.username }] });
      if (!existing) {
        const u = new UserModel(du);
        await u.save();
      } else {
        existing.facilityId = du.facilityId;
        existing.facilityName = du.facilityName;
        existing.districtId = du.districtId;
        existing.district = du.district;
        existing.permissions = du.permissions;
        existing.staffSubType = du.staffSubType as any;
        existing.role = du.role as any;
        if (!existing.password) existing.password = 'Health@123';
        await existing.save();
      }
    }

    // 6. Ensure DoctorModel records are active and on duty
    const doctors = [
      {
        id: 'doc_arvind',
        userId: 'usr_doc_arvind',
        name: 'Dr. Arvind Patel',
        specialty: 'General Medicine',
        qualification: 'MBBS, MD',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        roomNumber: 'OPD Room 101',
        isAvailable: true,
        status: 'ON_DUTY',
        teleconsultEnabled: true,
      },
      {
        id: 'doc_sneha',
        userId: 'usr_doc_sneha',
        name: 'Dr. Sneha Desai',
        specialty: 'Cardiology',
        qualification: 'MBBS, DM Cardiology',
        facilityId: firstFacility?.id || 'fac_civil_01',
        facilityName: firstFacility?.name || 'Gandhinagar Civil Hospital & Medical College',
        districtId: firstFacility?.districtId || 'dist_gandhinagar',
        district: firstFacility?.district || 'Gandhinagar',
        roomNumber: 'Cardiology Clinic 2',
        isAvailable: true,
        status: 'ON_DUTY',
        teleconsultEnabled: true,
      },
    ];

    for (const doc of doctors) {
      await DoctorModel.findOneAndUpdate(
        { $or: [{ id: doc.id }, { name: doc.name }] },
        { $set: doc },
        { upsert: true, new: true }
      );
    }

    console.log('[Bootstrap] Complete! Districts, Facilities, Doctors, and Staff synced to MongoDB Atlas.');
  } catch (err) {
    console.warn('[Bootstrap] Error during database bootstrap:', err);
  }
}
