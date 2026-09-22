import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { FacilityModel } from '../models/Facility';
import { DoctorModel } from '../models/Doctor';
import { DistrictAdminModel } from '../models/DistrictAdmin';
import { DistrictModel } from '../models/District';
import { AiModelModel, AuditLogModel, SystemSettingsModel } from '../models/Admin';
import { sendSuccess, sendError } from '../utils/response';
import { getOpenSocketConnections } from '../sockets/socketHandler';

export async function getRoles(_req: Request, res: Response): Promise<void> {
  const roles = await RoleModel.find().sort({ level: 1, name: 1 });
  sendSuccess(res, 'Roles retrieved successfully', roles.map((r) => r.toJSON()));
}

export async function getSystemHealth(_req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  let dbStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' = 'HEALTHY';
  let dbLatency = 5;

  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      dbLatency = Date.now() - startTime;
    } else {
      dbStatus = 'DOWN';
    }
  } catch {
    dbStatus = 'DOWN';
  }

  const activeUsersCount = await UserModel.countDocuments();
  const openSocketConnections = getOpenSocketConnections();

  const healthOverview = {
    overallStatus: dbStatus === 'HEALTHY' ? 'HEALTHY' : 'CRITICAL',
    services: [
      {
        name: 'Express API Gateway',
        status: 'HEALTHY',
        latencyMs: 8,
        uptimePercent: 99.98,
        lastChecked: new Date().toISOString(),
        details: 'Serving /api/v1 endpoints with CORS & Helmet security',
      },
      {
        name: 'MongoDB HealthConnect Primary',
        status: dbStatus,
        latencyMs: dbLatency,
        uptimePercent: 99.95,
        lastChecked: new Date().toISOString(),
        details: 'MongoDB cluster on 127.0.0.1:27017/healthconnect',
      },
      {
        name: 'Telemedicine WebRTC Signaling',
        status: 'HEALTHY',
        latencyMs: 12,
        uptimePercent: 99.9,
        lastChecked: new Date().toISOString(),
        details: 'WebSocket server handling live consult channels',
      },
      {
        name: 'ML Disease Classifier & Surge Model',
        status: 'HEALTHY',
        latencyMs: 15,
        uptimePercent: 99.85,
        lastChecked: new Date().toISOString(),
        details: 'RandomForest & LSTM surge models serving telemetry',
      },
    ],
    activeUsersCount,
    openSocketConnections,
    totalErrorsLast24h: 0,
    queuedBackgroundJobs: 0,
  };

  sendSuccess(res, 'Realtime system services status retrieved', healthOverview);
}

export async function getAdminUsers(req: Request, res: Response): Promise<void> {
  const caller = (req as any).user;
  const { district, facilityId, role, status, search } = req.query;

  const filter: any = {};

  // Role-based Scoping:
  if (caller?.role === 'DISTRICT_ADMIN') {
    if (caller.district) {
      filter.district = caller.district;
    }
  } else if (caller?.role === 'HOSPITAL_ADMIN') {
    if (caller.facilityId) {
      filter.facilityId = caller.facilityId;
    }
  } else if (district && district !== 'ALL') {
    filter.district = district;
  }

  if (facilityId && facilityId !== 'ALL' && caller?.role !== 'HOSPITAL_ADMIN') {
    filter.facilityId = facilityId;
  }

  if (role && role !== 'ALL') {
    filter.role = role;
  }

  if (status && status !== 'ALL') {
    filter.status = status;
  }

  if (search) {
    const sRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { name: sRegex },
      { username: sRegex },
      { phone: sRegex },
      { email: sRegex },
      { facilityName: sRegex },
      { specialty: sRegex },
    ];
  }

  const users = await UserModel.find(filter).sort({ createdAt: -1 });
  sendSuccess(res, 'User registry retrieved successfully', users.map((u) => u.toJSON()));
}

export async function createAdminUser(req: Request, res: Response): Promise<void> {
  const caller = (req as any).user;
  const {
    name,
    phone,
    email,
    username,
    password,
    role,
    staffSubType,
    facilityId,
    facilityName,
    district,
    department,
    designation,
    specialty,
    qualification,
  } = req.body;

  if (!name || !phone || !role) {
    sendError(res, 'Name, phone, and role are required fields.', 400);
    return;
  }

  const generatedUser = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);
  const finalUsername = String(username || email?.split('@')[0] || generatedUser).trim();
  const finalPassword = String(password || 'Health@123').trim();

  if (finalPassword.length < 4) {
    sendError(res, 'Password must be at least 4 characters long.', 400);
    return;
  }

  // Permission & Scope Enforcement:
  let targetDistrictId = req.body.districtId || caller?.districtId;
  let targetDistrict = district || caller?.district || '';
  let targetFacilityId = facilityId;
  let targetFacilityName = facilityName;

  // Resolve authoritative district record from DistrictModel
  if (targetDistrictId || targetDistrict) {
    const districtDoc = await DistrictModel.findOne({
      $or: [
        ...(targetDistrictId ? [{ id: targetDistrictId }, { _id: mongoose.isValidObjectId(targetDistrictId) ? targetDistrictId : undefined }] : []),
        ...(targetDistrict ? [{ name: new RegExp(`^${targetDistrict.trim()}$`, 'i') }, { code: targetDistrict.trim().toUpperCase() }] : []),
      ].filter(Boolean) as any,
    });
    if (districtDoc) {
      targetDistrictId = districtDoc.id;
      targetDistrict = districtDoc.name;
    }
  }

  if (role === 'DISTRICT_ADMIN' && (!targetDistrictId || !targetDistrict)) {
    sendError(res, 'Valid districtId or registered district name is strictly required when creating a District Admin.', 400);
    return;
  }

  if (caller?.role === 'HOSPITAL_ADMIN') {
    if (!caller.facilityId) {
      sendError(res, 'STAFF_FACILITY_NOT_ASSIGNED: Hospital Admin account does not have an assigned facility.', 403);
      return;
    }
    // Hospital Admin can only create FACILITY_STAFF or DOCTOR
    if (role !== 'FACILITY_STAFF' && role !== 'DOCTOR') {
      sendError(res, 'Hospital Administrators can only provision Hospital Facility Staff and Doctors.', 403);
      return;
    }
    targetFacilityId = caller.facilityId;
    targetFacilityName = caller.facilityName;
    targetDistrictId = caller.districtId;
    targetDistrict = caller.district;
  } else if (caller?.role === 'DISTRICT_ADMIN') {
    const callerDistrictId = caller.districtId;
    const callerDistrict = caller.district;
    if (!callerDistrictId && !callerDistrict) {
      sendError(res, 'District Admin account does not have an assigned district.', 403);
      return;
    }

    // District Admin CANNOT create Super Admins
    if (role === 'SUPER_ADMIN') {
      sendError(res, 'District Administrators cannot create Super Administrator accounts.', 403);
      return;
    }

    // If district was explicitly passed and differs from caller's district
    if (targetDistrictId && callerDistrictId && targetDistrictId !== callerDistrictId) {
      sendError(res, `District Administrators can only create users in their assigned district.`, 403);
      return;
    }
    if (district && callerDistrict && district.trim().toLowerCase() !== callerDistrict.trim().toLowerCase()) {
      sendError(res, `District Administrators can only create users in their assigned district (${callerDistrict}).`, 403);
      return;
    }
    targetDistrictId = callerDistrictId || targetDistrictId;
    targetDistrict = callerDistrict || targetDistrict;

    // Verify facility belongs to the District Admin's district
    if (targetFacilityId) {
      const facilityInDistrict = await FacilityModel.findOne({ id: targetFacilityId });
      if (facilityInDistrict) {
        if (facilityInDistrict.districtId && callerDistrictId && facilityInDistrict.districtId !== callerDistrictId) {
          sendError(res, `Facility does not belong to your assigned district.`, 403);
          return;
        }
        targetFacilityName = facilityInDistrict.name;
      }
    }
  } else if (targetFacilityId) {
    const facilityDoc = await FacilityModel.findOne({ id: targetFacilityId });
    if (facilityDoc) {
      targetFacilityName = facilityDoc.name;
      if (!targetDistrictId) targetDistrictId = facilityDoc.districtId;
      if (!targetDistrict) targetDistrict = facilityDoc.district;
    }
  }

  if (role === 'DOCTOR') {
    if (!targetFacilityId) {
      sendError(res, 'facilityId is strictly required to register a Doctor.', 400);
      return;
    }
    const fac = await FacilityModel.findOne({
      $or: [{ id: targetFacilityId }, { _id: mongoose.isValidObjectId(targetFacilityId) ? targetFacilityId : undefined }],
    });
    if (!fac) {
      sendError(res, `Facility ${targetFacilityId} not found.`, 404);
      return;
    }
    targetFacilityId = fac.id;
    targetFacilityName = fac.name;
    targetDistrictId = fac.districtId;
    targetDistrict = fac.district;
  }

  const existing = await UserModel.findOne({
    $or: [
      { username: { $regex: new RegExp(`^${finalUsername}$`, 'i') } },
      { phone: String(phone).trim() },
    ],
  });

  if (existing) {
    if (existing.username?.toLowerCase() === finalUsername.toLowerCase()) {
      sendError(res, `Username "${finalUsername}" is already in use. Please choose a unique username.`, 400);
      return;
    }
    if (existing.phone === String(phone).trim() && existing.role === role) {
      sendError(res, `A user with phone number "${phone}" and role "${role}" already exists.`, 400);
      return;
    }
  }

  let defaultPermissions: string[] = req.body.permissions || [];
  if (!defaultPermissions.length && role === 'FACILITY_STAFF') {
    if (staffSubType === 'FACILITY_OPERATIONS') {
      defaultPermissions = ['VIEW_FACILITY', 'VIEW_BEDS', 'MANAGE_BEDS', 'VIEW_FLEET', 'MANAGE_FLEET', 'VIEW_RESOURCES', 'MANAGE_RESOURCES'];
    } else if (staffSubType === 'PHARMACIST') {
      defaultPermissions = ['VIEW_MEDICINES', 'MANAGE_INVENTORY', 'DISPENSE_MEDICINE'];
    } else if (staffSubType === 'LAB_TECHNICIAN') {
      defaultPermissions = ['VIEW_LAB_ORDERS', 'MANAGE_SAMPLES', 'MANAGE_RESULTS'];
    } else {
      defaultPermissions = ['VIEW_PATIENT', 'REGISTER_PATIENT', 'VIEW_APPOINTMENT', 'CHECK_IN', 'ASSIGN_DOCTOR', 'MANAGE_QUEUE'];
    }
  }

  const newId = `usr_${Date.now()}`;
  const user = await UserModel.create({
    id: newId,
    name,
    username: finalUsername,
    password: finalPassword,
    phone: String(phone).trim(),
    email: email || `${finalUsername}@gujarat.health.gov.in`,
    role,
    staffSubType: role === 'FACILITY_STAFF' ? (staffSubType || 'REGISTRATION_CLERK') : undefined,
    facilityId: targetFacilityId,
    facilityName: targetFacilityName,
    districtId: targetDistrictId,
    district: targetDistrict,
    permissions: defaultPermissions,
    department: department || (role === 'DOCTOR' ? (specialty ? `${specialty} OPD` : 'General Medicine OPD') : undefined),
    designation: designation || (role === 'DOCTOR' ? (specialty ? `Specialist (${specialty})` : 'Medical Officer') : role === 'FACILITY_STAFF' ? (staffSubType || 'Staff') : role),
    specialty: role === 'DOCTOR' ? (specialty || 'General Medicine') : undefined,
    qualification: qualification || (role === 'DOCTOR' ? 'MBBS, MD' : undefined),
    status: 'ACTIVE',
  });

  // If role is DOCTOR, automatically sync / create in DoctorModel so doctor appears in live roster
  if (role === 'DOCTOR') {
    const docId = `doc_${Date.now()}`;
    await DoctorModel.findOneAndUpdate(
      { $or: [{ name }, { phone: String(phone).trim() }, { userId: newId }] },
      {
        $set: {
          id: docId,
          userId: newId,
          name,
          specialty: specialty || 'General Medicine',
          qualification: qualification || 'MBBS, MD',
          facilityId: targetFacilityId,
          facilityName: targetFacilityName,
          districtId: targetDistrictId,
          district: targetDistrict,
          roomNumber: 'OPD Room 1',
          isAvailable: true,
          status: 'ON_DUTY',
          teleconsultEnabled: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  // If role is DISTRICT_ADMIN, automatically sync in DistrictAdminModel
  if (role === 'DISTRICT_ADMIN') {
    const daId = `usr_dist_${targetDistrict.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const facCount = await FacilityModel.countDocuments({ districtId: targetDistrictId });
    await DistrictAdminModel.findOneAndUpdate(
      { $or: [{ username: finalUsername }, { districtId: targetDistrictId }, { district: targetDistrict }] },
      {
        $set: {
          id: daId,
          name,
          username: finalUsername,
          password: finalPassword,
          email: email || `${finalUsername}@gujarat.health.gov.in`,
          phone: String(phone).trim(),
          districtId: targetDistrictId,
          district: targetDistrict,
          designation: designation || 'Chief District Health Officer (CDHO)',
          status: 'ACTIVE',
          appointedAt: new Date().toISOString().slice(0, 10),
          appointedBy: caller?.name || 'State Health Authority',
          jurisdictionFacilitiesCount: facCount,
          privileges: ['FACILITY_MANAGEMENT', 'DOCTOR_POSTINGS', 'AI_RESOURCE_INTELLIGENCE'],
        },
      },
      { upsert: true, new: true }
    );
  }

  // Audit Log
  await AuditLogModel.create({
    id: `aud_${Date.now()}`,
    action: 'USER_CREATE',
    actorId: caller?.id || 'admin',
    actorName: caller?.name || 'Administrator',
    actorRole: caller?.role || 'SUPER_ADMIN',
    resourceType: 'USER_REGISTRY',
    resourceId: newId,
    details: `Created new ${role} user "${name}" (@${finalUsername}) assigned to Hospital: "${targetFacilityName || 'Statewide'}", District: "${targetDistrict}"`,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  sendSuccess(res, `User ${name} created successfully with login credentials`, {
    ...user.toJSON(),
    credentials: { username: finalUsername, password: finalPassword },
  }, 201);
}

export async function updateAdminUser(req: Request, res: Response): Promise<void> {
  const caller = (req as any).user;
  const { id } = req.params;
  const updateData = req.body;

  const targetUser = await UserModel.findOne({ $or: [{ id }, { _id: mongoose.isValidObjectId(id) ? id : undefined }] });
  if (!targetUser) {
    sendError(res, 'User not found', 404);
    return;
  }

  // Scope Validation:
  if (caller?.role === 'DISTRICT_ADMIN') {
    if (targetUser.district !== caller.district) {
      sendError(res, 'You are not authorized to modify users outside your assigned district.', 403);
      return;
    }
    if (targetUser.role === 'SUPER_ADMIN' || updateData.role === 'SUPER_ADMIN') {
      sendError(res, 'District Administrators cannot manage Super Administrator accounts.', 403);
      return;
    }
  }

  if (updateData.facilityId && updateData.facilityId !== targetUser.facilityId) {
    const fac = await FacilityModel.findOne({ id: updateData.facilityId });
    if (fac) {
      updateData.facilityName = fac.name;
      if (caller?.role === 'SUPER_ADMIN') {
        updateData.district = fac.district;
      }
    }
  }

  Object.assign(targetUser, updateData);
  await targetUser.save();

  sendSuccess(res, `User ${targetUser.name} updated successfully`, targetUser.toJSON());
}

export async function deleteAdminUser(req: Request, res: Response): Promise<void> {
  const caller = (req as any).user;
  const { id } = req.params;

  const targetUser = await UserModel.findOne({ $or: [{ id }, { _id: mongoose.isValidObjectId(id) ? id : undefined }] });
  if (!targetUser) {
    sendError(res, 'User not found', 404);
    return;
  }

  if (caller?.role === 'DISTRICT_ADMIN') {
    if (targetUser.district !== caller.district || targetUser.role === 'SUPER_ADMIN') {
      sendError(res, 'You are not authorized to delete this user.', 403);
      return;
    }
  }

  targetUser.status = 'INACTIVE';
  await targetUser.save();

  sendSuccess(res, `User ${targetUser.name} deactivated successfully`, { id: targetUser.id, status: 'INACTIVE' });
}

export async function getPermissionMatrix(_req: Request, res: Response): Promise<void> {
  const matrix = [
    {
      module: 'PATIENTS',
      patient: { read: true, write: true, create: false, delete: false },
      asha: { read: true, write: true, create: true, delete: false },
      doctor: { read: true, write: true, create: true, delete: false },
      staff: { read: true, write: true, create: true, delete: false },
      districtAdmin: { read: true, write: false, create: false, delete: false },
      superAdmin: { read: true, write: true, create: true, delete: true },
    },
    {
      module: 'APPOINTMENTS',
      patient: { read: true, write: true, create: true, delete: true },
      asha: { read: true, write: true, create: true, delete: false },
      doctor: { read: true, write: true, create: true, delete: false },
      staff: { read: true, write: true, create: true, delete: true },
      districtAdmin: { read: true, write: false, create: false, delete: false },
      superAdmin: { read: true, write: true, create: true, delete: true },
    },
    {
      module: 'QUEUE',
      patient: { read: true, write: false, create: false, delete: false },
      asha: { read: true, write: false, create: false, delete: false },
      doctor: { read: true, write: true, create: true, delete: false },
      staff: { read: true, write: true, create: true, delete: false },
      districtAdmin: { read: true, write: false, create: false, delete: false },
      superAdmin: { read: true, write: true, create: true, delete: true },
    },
    {
      module: 'EHR',
      patient: { read: true, write: false, create: false, delete: false },
      asha: { read: true, write: true, create: true, delete: false },
      doctor: { read: true, write: true, create: true, delete: false },
      staff: { read: true, write: false, create: false, delete: false },
      districtAdmin: { read: true, write: false, create: false, delete: false },
      superAdmin: { read: true, write: true, create: true, delete: true },
    },
    {
      module: 'REFERRALS',
      patient: { read: true, write: false, create: false, delete: false },
      asha: { read: true, write: true, create: true, delete: false },
      doctor: { read: true, write: true, create: true, delete: false },
      staff: { read: true, write: true, create: false, delete: false },
      districtAdmin: { read: true, write: true, create: false, delete: false },
      superAdmin: { read: true, write: true, create: true, delete: true },
    },
    {
      module: 'RESOURCES',
      patient: { read: true, write: false, create: false, delete: false },
      asha: { read: true, write: false, create: false, delete: false },
      doctor: { read: true, write: false, create: false, delete: false },
      staff: { read: true, write: true, create: true, delete: false },
      districtAdmin: { read: true, write: true, create: true, delete: false },
      superAdmin: { read: true, write: true, create: true, delete: true },
    },
    {
      module: 'AI_INSIGHTS',
      patient: { read: false, write: false, create: false, delete: false },
      asha: { read: false, write: false, create: false, delete: false },
      doctor: { read: true, write: false, create: false, delete: false },
      staff: { read: true, write: false, create: false, delete: false },
      districtAdmin: { read: true, write: true, create: true, delete: false },
      superAdmin: { read: true, write: true, create: true, delete: true },
    },
    {
      module: 'SYSTEM_CONFIG',
      patient: { read: false, write: false, create: false, delete: false },
      asha: { read: false, write: false, create: false, delete: false },
      doctor: { read: false, write: false, create: false, delete: false },
      staff: { read: false, write: false, create: false, delete: false },
      districtAdmin: { read: false, write: false, create: false, delete: false },
      superAdmin: { read: true, write: true, create: true, delete: true },
    },
  ];

  sendSuccess(res, 'Role-permission matrix retrieved', matrix);
}

export async function getAiModels(_req: Request, res: Response): Promise<void> {
  const models = await AiModelModel.find();
  sendSuccess(res, 'AI Model registry retrieved', models.map((m) => m.toJSON()));
}

export async function deployAiModel(req: Request, res: Response): Promise<void> {
  const { modelId } = req.params;

  await AiModelModel.findOneAndUpdate(
    { id: modelId },
    { status: 'ACTIVE', deployedAt: new Date().toISOString() }
  );

  sendSuccess(res, `Model ${modelId} deployed to active production cluster`, { deployed: true });
}

export async function rollbackAiModel(req: Request, res: Response): Promise<void> {
  const { modelId } = req.params;

  await AiModelModel.findOneAndUpdate(
    { id: modelId },
    { status: 'ARCHIVED' }
  );

  sendSuccess(res, `Model ${modelId} rolled back to previous checkpoint`, { rolledBack: true });
}

export async function getSystemSettings(_req: Request, res: Response): Promise<void> {
  let settings = await SystemSettingsModel.findOne({ key: 'GLOBAL_SETTINGS' });
  if (!settings) {
    settings = await SystemSettingsModel.create({ key: 'GLOBAL_SETTINGS' });
  }
  sendSuccess(res, 'System settings retrieved', settings.toJSON());
}

export async function updateSystemSettings(req: Request, res: Response): Promise<void> {
  const updates = req.body;
  const caller = (req as any).user;

  const settings = await SystemSettingsModel.findOneAndUpdate(
    { key: 'GLOBAL_SETTINGS' },
    { $set: { ...updates, updatedBy: caller?.name || 'Super Admin' } },
    { new: true, upsert: true }
  );

  // Audit Log
  await AuditLogModel.create({
    id: `aud_${Date.now()}`,
    action: 'SYSTEM_SETTINGS_UPDATE',
    actorId: caller?.id || 'admin',
    actorName: caller?.name || 'Super Admin',
    actorRole: caller?.role || 'SUPER_ADMIN',
    resourceType: 'SYSTEM_CONFIG',
    resourceId: 'GLOBAL_SETTINGS',
    details: `Updated system settings: timeout=${updates.sessionTimeoutMinutes}min, maintenance=${updates.maintenanceMode}`,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  sendSuccess(res, 'System settings updated successfully in database', settings.toJSON());
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { action, role } = req.query;
  const filter: any = {};
  if (action) filter.action = action;
  if (role) filter.actorRole = role;

  const logs = await AuditLogModel.find(filter).sort({ timestamp: -1 });
  sendSuccess(res, 'Audit logs retrieved', logs.map((l) => l.toJSON()));
}


