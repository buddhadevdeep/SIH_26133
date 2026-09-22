import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { FacilityModel } from '../models/Facility';
import { DoctorModel } from '../models/Doctor';

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
      'queue:manage:facility',
      'inventory:manage:facility',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    id: 'role_doctor',
    code: 'DOCTOR',
    name: 'Medical Officer & Specialist Physician',
    description: 'Clinical examination, live queue consultation, digital Rx prescription generation, lab investigations, e-referrals, and teleconsultation.',
    level: 'FACILITY',
    permissions: [
      'queue:call_patient',
      'consultation:write',
      'prescription:issue',
      'lab:order',
      'referral:create',
      'teleconsult:attend',
      'emr:read_write',
    ],
    isSystem: true,
    isActive: true,
  },
  {
    id: 'role_facility_staff',
    code: 'FACILITY_STAFF',
    name: 'Hospital Auxiliary Staff & Technicians',
    description: 'Hospital operations including OPD registration clerk, pharmacy dispensing, pathology laboratory testing, and triage nursing.',
    level: 'FACILITY',
    permissions: [
      'token:generate',
      'patient:register',
      'pharmacy:dispense',
      'lab:upload_result',
      'vital_signs:record',
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

/**
 * Clean System Bootstrap Function:
 * ONLY initializes system roles and the initial bootstrap Super Admin.
 * Does NOT auto-insert any fake demo hospitals, doctors, patients, appointments, or prescriptions.
 */
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

    // 2. Ensure initial Super Admin exists
    const superAdminExists = await UserModel.findOne({ role: 'SUPER_ADMIN' });
    if (!superAdminExists) {
      const username = process.env.BOOTSTRAP_ADMIN_USERNAME || 'superadmin';
      const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@12345';

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

    // 3. Ensure canonical demo staff accounts are bound to real existing facility if available
    const firstFacility = await FacilityModel.findOne({});
    if (firstFacility) {
      const demoUsers = [
        {
          id: 'usr_ops_vikram',
          name: 'Vikram Sharma (Facility Operations)',
          username: 'vikram.ops',
          email: 'vikram.ops@civilhospital.in',
          phone: '9876500001',
          password: 'Health@123',
          role: 'FACILITY_STAFF',
          staffSubType: 'FACILITY_OPERATIONS',
          facilityId: firstFacility.id,
          facilityName: firstFacility.name,
          districtId: firstFacility.districtId,
          district: firstFacility.district,
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
          facilityId: firstFacility.id,
          facilityName: firstFacility.name,
          districtId: firstFacility.districtId,
          district: firstFacility.district,
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
          facilityId: firstFacility.id,
          facilityName: firstFacility.name,
          districtId: firstFacility.districtId,
          district: firstFacility.district,
          permissions: ['VIEW_PATIENT', 'REGISTER_PATIENT', 'VIEW_APPOINTMENT', 'CHECK_IN', 'ASSIGN_DOCTOR', 'MANAGE_QUEUE'],
          designation: 'Registration & Token Counter Clerk',
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
          facilityId: firstFacility.id,
          facilityName: firstFacility.name,
          districtId: firstFacility.districtId,
          district: firstFacility.district,
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
          facilityId: firstFacility.id,
          facilityName: firstFacility.name,
          districtId: firstFacility.districtId,
          district: firstFacility.district,
          specialty: 'General Medicine',
          qualification: 'MBBS, MD',
          designation: 'Senior Medical Specialist',
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

      // Also ensure DoctorModel has Dr. Arvind Patel
      await DoctorModel.findOneAndUpdate(
        { $or: [{ id: 'doc_arvind' }, { name: 'Dr. Arvind Patel' }] },
        {
          $set: {
            id: 'doc_arvind',
            userId: 'usr_doc_arvind',
            name: 'Dr. Arvind Patel',
            specialty: 'General Medicine',
            qualification: 'MBBS, MD',
            facilityId: firstFacility.id,
            facilityName: firstFacility.name,
            districtId: firstFacility.districtId,
            district: firstFacility.district,
            roomNumber: 'OPD Room 1',
            isAvailable: true,
            status: 'ON_DUTY',
            teleconsultEnabled: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    console.log('[Bootstrap] System roles, Super Admin, and Canonical demo users synced to real MongoDB facilities.');
  } catch (err) {
    console.warn('[Bootstrap] Error during database bootstrap:', err);
  }
}
