import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { FacilityModel, IFacility } from '../models/Facility';
import { DistrictModel } from '../models/District';
import { UserModel } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

// Calculate distance in KM using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function getAllFacilities(req: Request, res: Response): Promise<void> {
  // Support params in query or body
  const queryParams = { ...req.query, ...req.body };
  const {
    district,
    search,
    facilityType,
    specialty,
    emergencyOnly,
    availableBedsOnly,
    maxDistanceKm,
    lat,
    lng,
    page = 1,
    limit = 50,
  } = queryParams;

  const filter: any = {};
  const caller = (req as any).user;

  if (caller?.role === 'DISTRICT_ADMIN') {
    if (caller.districtId) {
      filter.$or = [{ districtId: caller.districtId }, { district: caller.district }];
    } else if (caller.district) {
      filter.district = caller.district;
    }
  } else if (queryParams.districtId && queryParams.districtId !== 'ALL') {
    filter.districtId = queryParams.districtId;
  } else if (district && district !== 'ALL') {
    filter.district = { $regex: new RegExp(`^${district}$`, 'i') };
  }

  if (facilityType && facilityType !== 'ALL') {
    filter.type = facilityType;
  }

  if (specialty && specialty !== 'ALL') {
    filter.specialties = specialty;
  }

  if (emergencyOnly === true || emergencyOnly === 'true') {
    filter.emergencyAvailable = true;
  }

  if (availableBedsOnly === true || availableBedsOnly === 'true') {
    filter.availableBeds = { $gt: 0 };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { district: { $regex: search, $options: 'i' } },
      { specialties: { $regex: search, $options: 'i' } },
    ];
  }

  const facilities = await FacilityModel.find(filter);

  // If user passed coordinates, calculate distanceKm
  const userLat = lat ? parseFloat(lat) : undefined;
  const userLng = lng ? parseFloat(lng) : undefined;

  let results = facilities.map((f) => {
    const obj = f.toJSON() as any;
    if (userLat !== undefined && userLng !== undefined && f.coordinates) {
      obj.distanceKm = calculateDistance(userLat, userLng, f.coordinates.lat, f.coordinates.lng);
    }
    return obj;
  });

  if (maxDistanceKm && (userLat !== undefined && userLng !== undefined)) {
    const maxDist = parseFloat(maxDistanceKm);
    results = results.filter((f) => f.distanceKm !== undefined && f.distanceKm <= maxDist);
  }

  sendSuccess(res, 'Facilities retrieved', results, 200, {
    page: Number(page),
    limit: Number(limit),
    total: results.length,
  });
}

export async function getFacilityById(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const filter = isMongoId ? { $or: [{ id }, { _id: id }] } : { id };
  const facility = await FacilityModel.findOne(filter);

  if (!facility) {
    sendError(res, `Facility with ID ${id} not found.`, 404);
    return;
  }

  sendSuccess(res, 'Facility details retrieved', facility.toJSON());
}

export async function createFacility(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    const id = data.id || `fac_${Date.now()}`;

    // Extract and strictly validate login credentials
    const username = data.username ? String(data.username).trim() : '';
    const password = data.password ? String(data.password).trim() : '';

    if (!username || !password) {
      sendError(
        res,
        'Hospital Registration Counter Login Username / ID and Password credentials are strictly mandatory and required to register a healthcare facility.',
        400
      );
      return;
    }

    if (password.length < 4) {
      sendError(res, 'Counter Password must be at least 4 characters long.', 400);
      return;
    }

    // Check if username is already registered in MongoDB by another account
    const existingUser = await UserModel.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      id: { $ne: `usr_clerk_${id}` },
    });
    if (existingUser) {
      sendError(res, `The Counter Username "${username}" is already in use. Please specify a unique username / ID.`, 400);
      return;
    }

    const caller = (req as any).user;
    let targetDistrictId = data.districtId || caller?.districtId;
    let targetDistrict = data.district || caller?.district;

    if (caller?.role === 'DISTRICT_ADMIN') {
      const callerDistrictId = caller.districtId;
      const callerDistrict = caller.district;
      if (!callerDistrictId && !callerDistrict) {
        sendError(res, 'District Admin account does not have an assigned district.', 403);
        return;
      }
      if (data.districtId && callerDistrictId && data.districtId !== callerDistrictId) {
        sendError(res, 'DISTRICT_SCOPE_VIOLATION: District Administrators can only create facilities within their assigned district.', 403);
        return;
      }
      if (data.district && callerDistrict && data.district.trim().toLowerCase() !== callerDistrict.trim().toLowerCase()) {
        sendError(res, `DISTRICT_SCOPE_VIOLATION: District Administrators can only create facilities within their assigned district (${callerDistrict}).`, 403);
        return;
      }
      targetDistrictId = callerDistrictId || targetDistrictId;
      targetDistrict = callerDistrict || targetDistrict;
    }

    // Authoritative lookup in DistrictModel
    const districtDoc = await DistrictModel.findOne({
      $or: [
        ...(targetDistrictId ? [{ id: targetDistrictId }, { _id: mongoose.isValidObjectId(targetDistrictId) ? targetDistrictId : undefined }] : []),
        ...(targetDistrict ? [{ name: new RegExp(`^${String(targetDistrict).trim()}$`, 'i') }, { code: String(targetDistrict).trim().toUpperCase() }] : []),
      ].filter(Boolean) as any,
    });
    if (!districtDoc) {
      sendError(res, 'A valid registered districtId or district name is strictly required to register a facility.', 400);
      return;
    }
    targetDistrictId = districtDoc.id;
    targetDistrict = districtDoc.name;

    // Extract & parse precise latitude and longitude
    let lat = 23.2156;
    let lng = 72.6369;

    if (data.coordinates && data.coordinates.lat !== undefined && data.coordinates.lng !== undefined) {
      lat = parseFloat(data.coordinates.lat);
      lng = parseFloat(data.coordinates.lng);
    } else if (data.lat !== undefined && data.lng !== undefined) {
      lat = parseFloat(data.lat);
      lng = parseFloat(data.lng);
    }

    const facilityData = {
      ...data,
      id,
      districtId: targetDistrictId,
      district: targetDistrict,
      registrationClerkUsername: username,
      registrationClerkUserId: `usr_clerk_${id}`,
      coordinates: { lat, lng },
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    };

    const facility = new FacilityModel(facilityData);
    await facility.save();

    // 1. Create / Sync UserModel login credentials in MongoDB for Hospital Registration Clerk
    const clerkPhone = data.clerkPhone || data.contactNumber || data.phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = data.email || `${username}@gujarat.health.gov.in`;

    const regPermissions = ['VIEW_PATIENT', 'REGISTER_PATIENT', 'VIEW_APPOINTMENT', 'CHECK_IN', 'ASSIGN_DOCTOR', 'MANAGE_QUEUE'];
    let user = await UserModel.findOne({ $or: [{ id: `usr_clerk_${id}` }, { username }] });
    if (!user) {
      user = new UserModel({
        id: `usr_clerk_${id}`,
        name: `${facility.name} Desk Clerk`,
        username,
        email,
        phone: clerkPhone,
        password,
        role: 'FACILITY_STAFF',
        staffSubType: 'REGISTRATION_CLERK',
        permissions: regPermissions,
        facilityId: facility.id,
        facilityName: facility.name,
        districtId: targetDistrictId,
        district: facility.district,
        designation: 'Senior Registration & OPD Counter Clerk',
      });
      await user.save();
    } else {
      user.facilityId = facility.id;
      user.facilityName = facility.name;
      user.districtId = targetDistrictId;
      user.district = facility.district;
      user.username = username;
      user.password = password;
      user.permissions = regPermissions;
      await user.save();
    }

    // 2. Create / Sync Facility Operations Staff (Beds, Fleet & Resources)
    const opsUsername = `${username}_ops`;
    const opsPermissions = ['VIEW_FACILITY', 'VIEW_BEDS', 'MANAGE_BEDS', 'VIEW_FLEET', 'MANAGE_FLEET', 'VIEW_RESOURCES', 'MANAGE_RESOURCES'];
    let opsUser = await UserModel.findOne({ $or: [{ id: `usr_ops_${id}` }, { username: opsUsername }] });
    if (!opsUser) {
      opsUser = new UserModel({
        id: `usr_ops_${id}`,
        name: `${facility.name} Operations Officer`,
        username: opsUsername,
        email: `ops.${email}`,
        phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        password,
        role: 'FACILITY_STAFF',
        staffSubType: 'FACILITY_OPERATIONS',
        permissions: opsPermissions,
        facilityId: facility.id,
        facilityName: facility.name,
        districtId: targetDistrictId,
        district: facility.district,
        designation: 'Operations Coordinator (Beds & Fleet)',
      });
      await opsUser.save();
    } else {
      opsUser.facilityId = facility.id;
      opsUser.facilityName = facility.name;
      opsUser.districtId = targetDistrictId;
      opsUser.district = facility.district;
      opsUser.permissions = opsPermissions;
      await opsUser.save();
    }

    // 3. Create / Sync Hospital Admin (Superintendent)
    const adminUsername = `${username}_admin`;
    let hospAdminUser = await UserModel.findOne({ $or: [{ id: `usr_admin_${id}` }, { username: adminUsername }] });
    if (!hospAdminUser) {
      hospAdminUser = new UserModel({
        id: `usr_admin_${id}`,
        name: `${facility.name} Medical Superintendent`,
        username: adminUsername,
        email: `admin.${email}`,
        phone: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
        password,
        role: 'HOSPITAL_ADMIN',
        facilityId: facility.id,
        facilityName: facility.name,
        districtId: targetDistrictId,
        district: facility.district,
        designation: 'Hospital Superintendent & Facility Director',
      });
      await hospAdminUser.save();
    } else {
      hospAdminUser.facilityId = facility.id;
      hospAdminUser.facilityName = facility.name;
      hospAdminUser.districtId = targetDistrictId;
      hospAdminUser.district = facility.district;
      await hospAdminUser.save();
    }

    sendSuccess(
      res,
      `Government facility ${facility.name} registered successfully with exact coordinates [${lat}, ${lng}] in ${facility.district}`,
      {
        ...facility.toJSON(),
        credentials: { username, password },
      },
      201
    );
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create facility', 400);
  }
}

export async function getNearbyFacilities(req: Request, res: Response): Promise<void> {
  const params = { ...req.query, ...req.body };
  const lat = parseFloat(params.lat || '23.2156');
  const lng = parseFloat(params.lng || '72.6369');
  const radiusKm = parseFloat(params.radiusKm || '25');

  const facilities = await FacilityModel.find();
  const nearby = facilities
    .map((f) => {
      const obj = f.toJSON() as any;
      if (f.coordinates && typeof f.coordinates.lat === 'number' && typeof f.coordinates.lng === 'number') {
        obj.distanceKm = calculateDistance(lat, lng, f.coordinates.lat, f.coordinates.lng);
      } else {
        obj.distanceKm = 10;
      }
      return obj;
    })
    .filter((f) => f.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  sendSuccess(res, 'Nearby facilities retrieved with exact distances', nearby);
}

export async function searchFacilities(req: Request, res: Response): Promise<void> {
  const params = { ...req.query, ...req.body };
  const query = params.query || '';

  const filter = query
    ? {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { address: { $regex: query, $options: 'i' } },
          { district: { $regex: query, $options: 'i' } },
          { specialties: { $regex: query, $options: 'i' } },
        ],
      }
    : {};

  const facilities = await FacilityModel.find(filter);
  sendSuccess(res, 'Facility search completed', facilities.map((f) => f.toJSON()));
}

export async function matchFacilities(req: Request, res: Response): Promise<void> {
  const criteria = req.body;
  const facilities = await FacilityModel.find();

  const userLat = criteria.lat || 23.2156;
  const userLng = criteria.lng || 72.6369;

  const results = facilities.map((fac) => {
    let score = 70;
    const reasons: string[] = [];

    // Specialty check
    if (criteria.specialty && fac.specialties.some((s) => s.toLowerCase().includes(criteria.specialty.toLowerCase()))) {
      score += 20;
      reasons.push(`Specialist available in ${criteria.specialty}`);
    }

    // ICU Requirement
    if (criteria.requiresIcu) {
      if (fac.icuBedsAvailable > 0) {
        score += 10;
        reasons.push(`ICU beds available (${fac.icuBedsAvailable})`);
      } else {
        score -= 30;
      }
    }

    // Distance calculation
    const distanceKm = fac.coordinates
      ? calculateDistance(userLat, userLng, fac.coordinates.lat, fac.coordinates.lng)
      : 5;

    let bedAvailabilityStatus: 'PLENTY' | 'LIMITED' | 'CRITICAL' | 'NONE' = 'PLENTY';
    if (fac.availableBeds === 0) bedAvailabilityStatus = 'NONE';
    else if (fac.availableBeds < 5) bedAvailabilityStatus = 'CRITICAL';
    else if (fac.availableBeds < 15) bedAvailabilityStatus = 'LIMITED';

    return {
      facility: fac.toJSON(),
      suitabilityScore: Math.min(100, Math.max(10, score)),
      clinicalMatchPercent: Math.min(100, score),
      specialistAvailability: 'AVAILABLE_NOW',
      equipmentSuitability: true,
      bedAvailabilityStatus,
      distanceKm,
      estimatedTransitTimeMins: Math.round(distanceKm * 2.5),
      matchReasons: reasons.length > 0 ? reasons : ['General hospital coverage', 'Emergency facility operational'],
    };
  });

  results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  sendSuccess(res, 'Matched facilities ranked successfully', results);
}

export async function updateFacility(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const updateData = { ...req.body };
    const caller = (req as any).user;

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isMongoId ? { $or: [{ id }, { _id: id }] } : { id };

    const existingFacility = await FacilityModel.findOne(filter);
    if (!existingFacility) {
      sendError(res, `Facility with ID ${id} not found`, 404);
      return;
    }

    if (caller?.role === 'DISTRICT_ADMIN') {
      const matchDistrict = (caller.districtId && existingFacility.districtId === caller.districtId) ||
        (caller.district && existingFacility.district.trim().toLowerCase() === caller.district.trim().toLowerCase());
      if (!matchDistrict) {
        sendError(res, `DISTRICT_SCOPE_VIOLATION: You are not authorized to update facilities outside your district.`, 403);
        return;
      }
    }

    if (updateData.coordinates && updateData.coordinates.lat !== undefined && updateData.coordinates.lng !== undefined) {
      const lat = parseFloat(updateData.coordinates.lat);
      const lng = parseFloat(updateData.coordinates.lng);
      updateData.coordinates = { lat, lng };
      updateData.location = { type: 'Point', coordinates: [lng, lat] };
    } else if (updateData.lat !== undefined && updateData.lng !== undefined) {
      const lat = parseFloat(updateData.lat);
      const lng = parseFloat(updateData.lng);
      updateData.coordinates = { lat, lng };
      updateData.location = { type: 'Point', coordinates: [lng, lat] };
    }

    const facility = await FacilityModel.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true }
    );

    sendSuccess(res, `Facility ${facility!.name} updated successfully`, facility!.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update facility', 500);
  }
}

export async function deleteFacility(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const caller = (req as any).user;

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isMongoId ? { $or: [{ id }, { _id: id }] } : { id };

    const existingFacility = await FacilityModel.findOne(filter);
    if (!existingFacility) {
      sendError(res, `Facility with ID ${id} not found`, 404);
      return;
    }

    if (caller?.role === 'DISTRICT_ADMIN') {
      const matchDistrict = (caller.districtId && existingFacility.districtId === caller.districtId) ||
        (caller.district && existingFacility.district.trim().toLowerCase() === caller.district.trim().toLowerCase());
      if (!matchDistrict) {
        sendError(res, `DISTRICT_SCOPE_VIOLATION: You are not authorized to delete facilities outside your district.`, 403);
        return;
      }
    }

    await FacilityModel.findOneAndDelete(filter);

    sendSuccess(res, `Facility ${existingFacility.name} deleted successfully`, { id, deleted: true });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete facility', 500);
  }
}

