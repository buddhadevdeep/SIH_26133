import { Request, Response } from 'express';
import { DoctorModel } from '../models/Doctor';
import { FacilityModel } from '../models/Facility';
import { DistrictModel } from '../models/District';
import { BloodCenterModel } from '../models/BloodCenter';
import { DistrictAdminModel } from '../models/DistrictAdmin';
import { UserModel } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

// Doctors
export async function getDoctors(req: Request, res: Response): Promise<void> {
  try {
    const { facilityId, specialty, district, departmentId } = req.query as any;
    const filter: any = {};
    if (facilityId) filter.facilityId = facilityId;
    if (specialty) filter.specialty = specialty;
    if (district) filter.district = district;
    if (departmentId) filter.departmentId = departmentId;

    const doctors = await DoctorModel.find(filter);
    sendSuccess(res, 'Doctors retrieved successfully', doctors.map((d) => d.toJSON()));
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve doctors', 500);
  }
}

export async function createDoctor(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    if (!data.name || !data.facilityId) {
      sendError(res, 'Doctor name and facilityId are strictly required.', 400);
      return;
    }

    const facility = await FacilityModel.findOne({ id: data.facilityId });
    if (!facility) {
      sendError(res, `Facility ${data.facilityId} not found in database.`, 404);
      return;
    }

    const district = facility.district;
    const districtId = facility.districtId || data.districtId || '';
    const facilityId = facility.id;
    const facilityName = facility.name;
    const id = data.id || `doc_${Date.now()}`;

    const username = data.username ? String(data.username).trim() : '';
    const password = data.password ? String(data.password).trim() : '';

    if (!username || !password) {
      sendError(
        res,
        'Doctor Login Username / ID and Password credentials are strictly mandatory to register a doctor.',
        400
      );
      return;
    }

    if (password.length < 4) {
      sendError(res, 'Doctor Password must be at least 4 characters long.', 400);
      return;
    }

    // Check if username is already taken
    const existingUser = await UserModel.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      id: { $ne: id },
    });
    if (existingUser) {
      sendError(res, `The Doctor Username "${username}" is already taken. Please choose a unique username / ID.`, 400);
      return;
    }

    const doc = new DoctorModel({
      ...data,
      id,
      district,
      districtId,
      facilityId,
      facilityName,
      status: data.status || 'ON_DUTY',
    });
    await doc.save();

    // Create / Sync UserModel login credentials in MongoDB
    const docPhone = data.phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = data.email || `${username}@gujarat.health.gov.in`;

    let user = await UserModel.findOne({ $or: [{ id }, { username }] });
    if (!user) {
      user = new UserModel({
        id,
        name: data.name,
        username,
        email,
        phone: docPhone,
        password,
        role: 'DOCTOR',
        facilityId,
        facilityName,
        district,
        districtId,
        doctorId: id,
        specialty: data.specialty || 'General Medicine',
        designation: data.designation || 'Medical Officer',
        qualification: data.qualification || 'MBBS, MD',
        licenseNumber: data.registrationNumber || data.licenseNumber,
      });
      await user.save();
    } else {
      user.name = data.name;
      user.username = username;
      user.password = password;
      user.specialty = data.specialty || user.specialty;
      user.facilityId = facilityId;
      user.facilityName = facilityName;
      user.district = district;
      user.districtId = districtId;
      user.doctorId = id;
      await user.save();
    }

    doc.userId = user.id;
    await doc.save();

    sendSuccess(res, 'Doctor registered successfully with login credentials', {
      ...doc.toJSON(),
      credentials: { username, password },
    }, 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create doctor', 400);
  }
}

export async function updateDoctorStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isMongoId ? { $or: [{ id }, { _id: id }] } : { id };

    const doc = await DoctorModel.findOneAndUpdate(filter, { status }, { new: true });
    if (!doc) {
      sendError(res, `Doctor ${id} not found`, 404);
      return;
    }
    sendSuccess(res, `Doctor status updated to ${status}`, doc.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update doctor status', 400);
  }
}

export async function updateDoctor(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const updateData = req.body;

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isMongoId ? { $or: [{ id }, { _id: id }] } : { id };

    const doc = await DoctorModel.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true }
    );

    if (!doc) {
      sendError(res, `Doctor ${id} not found`, 404);
      return;
    }

    sendSuccess(res, `Doctor ${doc.name} profile updated successfully`, doc.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update doctor', 500);
  }
}

export async function deleteDoctor(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isMongoId ? { $or: [{ id }, { _id: id }] } : { id };

    const doc = await DoctorModel.findOneAndDelete(filter);

    if (!doc) {
      sendError(res, `Doctor ${id} not found`, 404);
      return;
    }

    sendSuccess(res, `Doctor ${doc.name} deleted successfully from duty roster`, { id, deleted: true });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete doctor', 500);
  }
}

// Blood Centres
export async function getBloodCentres(req: Request, res: Response): Promise<void> {
  try {
    const { district } = req.query;
    const filter: any = {};
    if (district) filter.district = district;

    const centres = await BloodCenterModel.find(filter);
    sendSuccess(res, 'Blood centres retrieved successfully', centres.map((c) => c.toJSON()));
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve blood centres', 500);
  }
}

export async function createBloodCentre(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    const id = data.id || `bc_${Date.now()}`;
    const district = data.district || 'Gandhinagar';
    const centre = new BloodCenterModel({ ...data, id, district });
    await centre.save();
    sendSuccess(res, 'Blood centre added successfully', centre.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to add blood centre', 400);
  }
}

// District Admins
export async function getDistrictAdmins(req: Request, res: Response): Promise<void> {
  try {
    const { district } = req.query;
    const filter: any = {};
    if (district) filter.district = district;

    const admins = await DistrictAdminModel.find(filter);
    const users = await UserModel.find({ role: 'DISTRICT_ADMIN', ...(district ? { district } : {}) });

    // Map and consolidate by district or username
    const map = new Map<string, any>();
    
    // Add seed / model records
    for (const a of admins) {
      const key = (a.district || a.username || a.id).toLowerCase();
      map.set(key, a.toJSON());
    }

    // Add user records
    for (const u of users) {
      const key = (u.district || u.username || u.id).toLowerCase();
      const existing = map.get(key) || {};
      map.set(key, {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        district: u.district || 'Gandhinagar',
        designation: u.designation || 'Chief District Health Officer (CDHO)',
        status: u.status || 'ACTIVE',
        appointedAt: existing.appointedAt || (u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
        appointedBy: existing.appointedBy || 'State Health Authority',
        jurisdictionFacilitiesCount: existing.jurisdictionFacilitiesCount || 14,
        privileges: existing.privileges || ['FACILITY_MANAGEMENT', 'DOCTOR_POSTINGS', 'AI_RESOURCE_INTELLIGENCE'],
      });
    }

    const consolidated = Array.from(map.values());
    sendSuccess(res, 'District admins retrieved successfully', consolidated);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve district admins', 500);
  }
}

export async function createDistrictAdmin(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    const rawDistrict = String(data.district || data.districtName || '').trim();
    const rawDistrictId = String(data.districtId || '').trim();

    if (!rawDistrict && !rawDistrictId) {
      sendError(res, 'District name or districtId is strictly required to appoint a district admin.', 400);
      return;
    }

    let districtDoc = null;
    if (rawDistrictId) {
      districtDoc = await DistrictModel.findOne({ id: rawDistrictId });
    }
    if (!districtDoc && rawDistrict) {
      districtDoc = await DistrictModel.findOne({
        $or: [
          { name: new RegExp(`^${rawDistrict}$`, 'i') },
          { code: rawDistrict.toUpperCase() },
          { id: rawDistrict },
        ],
      });
    }
    if (!districtDoc && rawDistrict) {
      const code = rawDistrict.substring(0, 3).toUpperCase();
      const distId = `dist_${rawDistrict.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      districtDoc = await DistrictModel.findOneAndUpdate(
        { $or: [{ name: rawDistrict }, { code }] },
        {
          $set: {
            id: distId,
            name: rawDistrict,
            code,
            state: 'Gujarat',
            status: 'ACTIVE',
          },
        },
        { upsert: true, new: true }
      );
    }

    if (!districtDoc) {
      sendError(res, `District "${rawDistrict || rawDistrictId}" not found in database.`, 404);
      return;
    }

    const district = districtDoc.name;
    const districtId = districtDoc.id;
    const username = data.username ? String(data.username).trim() : `cdho_${district.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const password = data.password ? String(data.password).trim() : 'Health@123';
    const id = data.id || `usr_dist_${district.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    if (!username || !password) {
      sendError(
        res,
        'District Admin Login Username / ID and Password credentials are strictly mandatory to appoint a district admin.',
        400
      );
      return;
    }

    if (password.length < 4) {
      sendError(res, 'District Admin Password must be at least 4 characters long.', 400);
      return;
    }

    const adminPhone = data.phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = data.email || `${username}@gujarat.health.gov.in`;

    const admin = await DistrictAdminModel.findOneAndUpdate(
      { $or: [{ id }, { district }, { districtId }, { username }] },
      {
        $set: {
          id,
          name: data.name,
          username,
          password,
          district,
          districtId,
          email,
          phone: adminPhone,
          designation: data.designation || 'Chief District Health Officer (CDHO)',
          status: 'ACTIVE',
          appointedAt: new Date().toISOString().slice(0, 10),
          appointedBy: data.appointedBy || 'State Health Authority',
          jurisdictionFacilitiesCount: parseInt(String(data.jurisdictionFacilitiesCount || '14'), 10),
          privileges: data.privileges || ['FACILITY_MANAGEMENT', 'DOCTOR_POSTINGS', 'AI_RESOURCE_INTELLIGENCE'],
        },
      },
      { upsert: true, new: true }
    );

    // Create / Sync UserModel login credentials in MongoDB
    let user = await UserModel.findOne({ $or: [{ id }, { username }] });
    if (!user) {
      user = new UserModel({
        id,
        name: data.name,
        username,
        email,
        phone: adminPhone,
        password,
        role: 'DISTRICT_ADMIN',
        district,
        districtId,
        designation: data.designation || 'Chief District Health Officer (CDHO)',
        status: 'ACTIVE',
      });
      await user.save();
    } else {
      user.name = data.name;
      user.username = username;
      user.email = email;
      user.phone = adminPhone;
      user.password = password;
      user.role = 'DISTRICT_ADMIN';
      user.district = district;
      user.districtId = districtId;
      user.designation = data.designation || 'Chief District Health Officer (CDHO)';
      user.status = 'ACTIVE';
      await user.save();
    }

    sendSuccess(res, 'District admin registered successfully with login credentials', {
      ...admin.toJSON(),
      credentials: { username, password },
    }, 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create district admin', 400);
  }
}

export async function updateDistrictAdminStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const admin = await DistrictAdminModel.findOneAndUpdate({ id }, { status }, { new: true });
    if (!admin) {
      sendError(res, `District admin ${id} not found`, 404);
      return;
    }
    sendSuccess(res, `District admin status updated to ${status}`, admin.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update district admin status', 400);
  }
}
