import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { DistrictModel } from '../models/District';
import { FacilityModel } from '../models/Facility';
import { DoctorModel } from '../models/Doctor';
import { AppointmentModel, TokenModel } from '../models/Queue';

// List all active districts (open to all authenticated or dropdown callers)
export async function listDistricts(req: Request, res: Response): Promise<void> {
  try {
    const { status, state } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    else filter.status = 'ACTIVE';
    if (state) filter.state = state;

    const districts = await DistrictModel.find(filter).sort({ name: 1 });
    sendSuccess(res, 'Districts retrieved successfully', districts.map((d) => d.toJSON()));
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve districts', 500);
  }
}

// Get single district by id or code
export async function getDistrictById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const strId = String(id || '').trim();
    const district = await DistrictModel.findOne({ $or: [{ id: strId }, { code: strId.toUpperCase() }] });
    if (!district) {
      sendError(res, `District '${strId}' not found`, 404);
      return;
    }
    sendSuccess(res, 'District retrieved successfully', district.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve district', 500);
  }
}

// Create new District (Super Admin)
export async function createDistrict(req: Request, res: Response): Promise<void> {
  try {
    const { name, code, state = 'Gujarat', headquarters, population } = req.body;
    if (!name || !code) {
      sendError(res, 'District name and unique code are strictly required', 400);
      return;
    }

    const cleanName = String(name).trim();
    const cleanCode = String(code).trim().toUpperCase();

    // Check duplicate
    const existing = await DistrictModel.findOne({
      $or: [{ name: cleanName }, { code: cleanCode }],
    });
    if (existing) {
      sendError(res, `District with name '${cleanName}' or code '${cleanCode}' already exists`, 409);
      return;
    }

    const id = `dist_${cleanCode.toLowerCase()}`;
    const district = await DistrictModel.create({
      id,
      name: cleanName,
      code: cleanCode,
      state: String(state).trim(),
      headquarters: headquarters ? String(headquarters).trim() : undefined,
      population: population ? Number(population) : 0,
      status: 'ACTIVE',
    });

    sendSuccess(res, 'District created successfully', district.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create district', 500);
  }
}

// Update District (Super Admin)
export async function updateDistrict(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, headquarters, population, status } = req.body;

    const district = await DistrictModel.findOne({ id });
    if (!district) {
      sendError(res, `District '${id}' not found`, 404);
      return;
    }

    if (name) district.name = String(name).trim();
    if (headquarters !== undefined) district.headquarters = String(headquarters).trim();
    if (population !== undefined) district.population = Number(population);
    if (status) district.status = status;

    await district.save();
    sendSuccess(res, 'District updated successfully', district.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update district', 500);
  }
}

// GET /district/me (Authenticated District Admin gets their district details)
export async function getMyDistrict(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const districtId = user.districtId;
    if (!districtId) {
      sendError(res, 'DISTRICT_CONTEXT_MISSING: User is not linked to any district', 403);
      return;
    }

    const district = await DistrictModel.findOne({ id: districtId });
    if (!district) {
      sendError(res, `District record not found for ID '${districtId}'`, 404);
      return;
    }

    sendSuccess(res, 'Authenticated district retrieved', district.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to load district context', 500);
  }
}

// GET /district/me/facilities (Strictly scoped to user.districtId)
export async function getMyDistrictFacilities(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user || !user.districtId) {
      sendError(res, 'DISTRICT_CONTEXT_MISSING: Authenticated user has no district scope', 403);
      return;
    }

    const facilities = await FacilityModel.find({ districtId: user.districtId });
    sendSuccess(res, 'District facilities retrieved', facilities.map((f) => f.toJSON()));
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve district facilities', 500);
  }
}

// GET /district/me/doctors (Strictly scoped to user.districtId)
export async function getMyDistrictDoctors(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user || !user.districtId) {
      sendError(res, 'DISTRICT_CONTEXT_MISSING: Authenticated user has no district scope', 403);
      return;
    }

    const doctors = await DoctorModel.find({ districtId: user.districtId });
    sendSuccess(res, 'District doctors retrieved', doctors.map((d) => d.toJSON()));
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve district doctors', 500);
  }
}

// GET /district/me/statistics (Real database-driven counts strictly scoped to user.districtId)
export async function getMyDistrictStatistics(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user || !user.districtId) {
      sendError(res, 'DISTRICT_CONTEXT_MISSING: Authenticated user has no district scope', 403);
      return;
    }

    const districtId = user.districtId;
    const district = await DistrictModel.findOne({ id: districtId });

    const [facilities, doctors, appointmentsCount, activeTokensCount] = await Promise.all([
      FacilityModel.find({ districtId }),
      DoctorModel.find({ districtId }),
      AppointmentModel.countDocuments({ districtId }),
      TokenModel.countDocuments({ districtId, status: { $in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] } }),
    ]);

    const totalBeds = facilities.reduce((sum, f) => sum + (f.totalBeds || 0), 0);
    const availableBeds = facilities.reduce((sum, f) => sum + (f.availableBeds || 0), 0);
    const icuBedsTotal = facilities.reduce((sum, f) => sum + (f.icuBedsTotal || 0), 0);
    const icuBedsAvailable = facilities.reduce((sum, f) => sum + (f.icuBedsAvailable || 0), 0);

    const onDutyDoctors = doctors.filter((d) => d.status === 'ON_DUTY' || d.status === 'IN_OPD').length;

    sendSuccess(res, 'District statistics computed', {
      districtId,
      districtName: district ? district.name : user.district || 'Unknown District',
      state: district ? district.state : 'Gujarat',
      facilitiesCount: facilities.length,
      doctorsCount: doctors.length,
      onDutyDoctorsCount: onDutyDoctors,
      totalBeds,
      availableBeds,
      icuBedsTotal,
      icuBedsAvailable,
      appointmentsCount,
      activeTokensCount,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to compute district statistics', 500);
  }
}
