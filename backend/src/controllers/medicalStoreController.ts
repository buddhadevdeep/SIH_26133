import { Request, Response } from 'express';
import { MedicalStoreModel, IMedicalStore } from '../models/MedicalStore';
import { UserModel } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

// Haversine distance in kilometers
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export async function getAllMedicalStores(req: Request, res: Response): Promise<void> {
  try {
    const { district, type, isJanAushadhi, openNow, search, lat, lng, radiusKm } = req.query;

    const filter: any = {};

    if (district) {
      filter.district = { $regex: new RegExp(`^${district}$`, 'i') };
    }

    if (type) {
      filter.type = type;
    }

    if (isJanAushadhi !== undefined) {
      filter.isJanAushadhi = String(isJanAushadhi) === 'true';
    }

    if (openNow !== undefined && String(openNow) === 'true') {
      filter.isOpenNow = true;
    }

    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { area: { $regex: q, $options: 'i' } },
        { fullAddress: { $regex: q, $options: 'i' } },
        { 'stockCatalog.name': { $regex: q, $options: 'i' } },
        { 'stockCatalog.genericName': { $regex: q, $options: 'i' } },
      ];
    }

    let stores = await MedicalStoreModel.find(filter);

    let parsedLat: number | undefined;
    let parsedLng: number | undefined;

    if (lat && lng) {
      parsedLat = parseFloat(String(lat));
      parsedLng = parseFloat(String(lng));
    }

    let results = stores.map((s) => {
      const storeObj = (s.toJSON() as unknown) as IMedicalStore & { distanceKm: number };
      if (parsedLat !== undefined && parsedLng !== undefined && storeObj.coordinates?.lat && storeObj.coordinates?.lng) {
        storeObj.distanceKm = calculateHaversineDistanceKm(
          parsedLat,
          parsedLng,
          storeObj.coordinates.lat,
          storeObj.coordinates.lng
        );
      } else if (storeObj.distanceKm === undefined) {
        storeObj.distanceKm = 1.5;
      }
      return storeObj;
    });

    if (radiusKm && parsedLat !== undefined && parsedLng !== undefined) {
      const maxRadius = parseFloat(String(radiusKm));
      results = results.filter((s) => (s.distanceKm || 0) <= maxRadius);
    }

    // Sort: If lat/lng provided, sort by nearest distance first
    if (parsedLat !== undefined && parsedLng !== undefined) {
      results.sort((a, b) => {
        if (a.isJanAushadhi && !b.isJanAushadhi) return -1;
        if (!a.isJanAushadhi && b.isJanAushadhi) return 1;
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      });
    }

    sendSuccess(res, 'Medical stores retrieved successfully', results);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve medical stores', 500);
  }
}

export async function getMedicalStoreById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const store = await MedicalStoreModel.findOne({ id });

    if (!store) {
      sendError(res, `Medical store with ID ${id} not found`, 404);
      return;
    }

    sendSuccess(res, 'Medical store retrieved successfully', store.toJSON());
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve medical store', 500);
  }
}

export async function createMedicalStore(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    const id = data.id || `store_${Date.now()}`;

    const username = data.username ? String(data.username).trim() : '';
    const password = data.password ? String(data.password).trim() : '';

    if (!username || !password) {
      sendError(
        res,
        'Pharmacist Login Username / ID and Password credentials are strictly mandatory to register a medical store.',
        400
      );
      return;
    }

    if (password.length < 4) {
      sendError(res, 'Pharmacist Password must be at least 4 characters long.', 400);
      return;
    }

    const existingUser = await UserModel.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      id: { $ne: `usr_${id}` },
    });
    if (existingUser) {
      sendError(res, `The Pharmacist Username "${username}" is already taken. Please choose a unique username / ID.`, 400);
      return;
    }

    const lat = data.coordinates?.lat ? Number(data.coordinates.lat) : Number(data.lat || 23.2268);
    const lng = data.coordinates?.lng ? Number(data.coordinates.lng) : Number(data.lng || 72.6515);

    const newStore = new MedicalStoreModel({
      ...data,
      id,
      area: data.area || data.district || 'City Center',
      coordinates: { lat, lng },
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      lastSyncTimestamp: new Date().toISOString(),
    });

    await newStore.save();

    // Create / Sync UserModel login credentials in MongoDB for Pharmacist
    const pharmPhone = data.phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = data.email || `${username}@gujarat.health.gov.in`;

    let user = await UserModel.findOne({ $or: [{ id: `usr_${id}` }, { username }] });
    if (!user) {
      user = new UserModel({
        id: `usr_${id}`,
        name: data.managerName || data.name,
        username,
        email,
        phone: pharmPhone,
        password,
        role: 'FACILITY_STAFF',
        staffSubType: 'PHARMACIST',
        facilityId: id,
        facilityName: data.name,
        district: data.district || 'Gandhinagar',
        designation: 'Registered Pharmacist / Store Incharge',
      });
      await user.save();
    } else {
      user.name = data.managerName || data.name;
      user.username = username;
      user.password = password;
      await user.save();
    }

    sendSuccess(res, 'Medical store created successfully with login credentials', {
      ...newStore.toJSON(),
      credentials: { username, password },
    }, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create medical store', 400);
  }
}

export async function updateMedicalStore(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.coordinates?.lat && data.coordinates?.lng) {
      const lat = Number(data.coordinates.lat);
      const lng = Number(data.coordinates.lng);
      data.coordinates = { lat, lng };
      data.location = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    data.lastSyncTimestamp = new Date().toISOString();

    const store = await MedicalStoreModel.findOneAndUpdate({ id }, data, { new: true });

    if (!store) {
      sendError(res, `Medical store with ID ${id} not found`, 404);
      return;
    }

    sendSuccess(res, 'Medical store updated successfully', store.toJSON());
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update medical store', 500);
  }
}

export async function deleteMedicalStore(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await MedicalStoreModel.findOneAndDelete({ id });

    if (!result) {
      sendError(res, `Medical store with ID ${id} not found`, 404);
      return;
    }

    sendSuccess(res, 'Medical store deleted successfully', { id });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete medical store', 500);
  }
}
