import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { DistrictModel } from '../models/District';
import { FacilityModel } from '../models/Facility';

export async function requireDistrictScope(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = (req as any).user;
  if (!user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  // Super Admin can access any district or bypass
  if (user.role === 'SUPER_ADMIN') {
    return next();
  }

  const districtId = user.districtId;
  if (!districtId) {
    sendError(res, 'DISTRICT_CONTEXT_MISSING: Authenticated user is not associated with any district', 403);
    return;
  }

  try {
    const district = await DistrictModel.findOne({ id: districtId });
    if (!district || district.status !== 'ACTIVE') {
      sendError(res, `District with ID '${districtId}' not found or is inactive`, 403);
      return;
    }

    (req as any).district = district;
    next();
  } catch (err: any) {
    sendError(res, `Failed to verify district scope: ${err.message}`, 500);
  }
}

export async function requireFacilityScope(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = (req as any).user;
  if (!user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (user.role === 'SUPER_ADMIN') {
    return next();
  }

  const facilityId = user.facilityId;
  if (!facilityId) {
    sendError(res, 'FACILITY_CONTEXT_MISSING: User is not assigned to a healthcare facility', 403);
    return;
  }

  try {
    const facility = await FacilityModel.findOne({ id: facilityId });
    if (!facility) {
      sendError(res, `Facility with ID '${facilityId}' not found`, 404);
      return;
    }

    // If caller is also district scoped, verify facility belongs to user's district
    if (user.districtId && facility.districtId && facility.districtId !== user.districtId) {
      sendError(res, 'DISTRICT_SCOPE_VIOLATION: Facility does not belong to user district', 403);
      return;
    }

    (req as any).facility = facility;
    next();
  } catch (err: any) {
    sendError(res, `Failed to verify facility scope: ${err.message}`, 500);
  }
}
