import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MedicineModel } from '../models/Medicine';
import { MedicalStoreModel } from '../models/MedicalStore';
import { DispensingRecordModel } from '../models/DispensingRecord';
import { PrescriptionModel } from '../models/Prescription';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export async function getMedicines(req: Request, res: Response): Promise<void> {
  const facilityId = req.query.facilityId || req.body.facilityId;
  const filter: any = {};
  if (facilityId) filter.facilityId = facilityId;

  const medicines = await MedicineModel.find(filter);
  sendSuccess(res, 'Medicine inventory retrieved', medicines.map((m) => m.toJSON()));
}

export async function getMedicineById(req: Request, res: Response): Promise<void> {
  const { medicineId } = req.params;
  const medicine = await MedicineModel.findOne({ id: medicineId });

  if (!medicine) {
    sendError(res, `Medicine with ID ${medicineId} not found`, 404);
    return;
  }

  sendSuccess(res, 'Medicine details retrieved', medicine.toJSON());
}

export async function quarantineBatch(req: Request, res: Response): Promise<void> {
  const { medicineId } = req.params;
  const { reason } = req.body;

  const medicine = await MedicineModel.findOneAndUpdate(
    { id: medicineId },
    {
      status: 'QUARANTINED',
      quarantineReason: reason || 'Quarantined by Pharmacist for quality inspection',
      lastUpdated: new Date().toISOString(),
    },
    { new: true }
  );

  if (!medicine) {
    sendError(res, `Medicine with ID ${medicineId} not found`, 404);
    return;
  }

  sendSuccess(res, 'Medicine batch quarantined successfully', medicine.toJSON());
}

export async function adjustMedicineStock(req: Request, res: Response): Promise<void> {
  const { medicineId } = req.params;
  const { delta = 0 } = req.body;

  const medicine = await MedicineModel.findOne({ id: medicineId });
  if (!medicine) {
    sendError(res, `Medicine with ID ${medicineId} not found`, 404);
    return;
  }

  const newQty = Math.max(0, medicine.availableQuantity + Number(delta));
  medicine.availableQuantity = newQty;
  medicine.status =
    newQty === 0 ? 'OUT_OF_STOCK' : newQty <= medicine.minimumStockThreshold ? 'LOW_STOCK' : 'IN_STOCK';
  medicine.lastUpdated = new Date().toISOString();
  await medicine.save();

  sendSuccess(res, 'Medicine stock level adjusted successfully', medicine.toJSON());
}

export async function getDispensingHistory(_req: Request, res: Response): Promise<void> {
  const records = await DispensingRecordModel.find().sort({ createdAt: -1 });
  sendSuccess(res, 'Chronological dispensing history records retrieved', records.map((r) => r.toJSON()));
}

export async function getPrescriptions(req: Request, res: Response): Promise<void> {
  const patientId = req.query.patientId || req.body.patientId;
  const filter: any = {};
  if (patientId) {
    filter.$or = [
      { patientId },
      { patientPhone: patientId },
    ];
  }

  const prescriptions = await PrescriptionModel.find(filter).sort({ issuedAt: -1 });
  sendSuccess(res, 'Prescriptions retrieved', prescriptions.map((p) => p.toJSON()));
}

export async function getPrescriptionById(req: Request, res: Response): Promise<void> {
  const { prescriptionId } = req.params;
  const rx = await PrescriptionModel.findOne({ id: prescriptionId });

  if (!rx) {
    sendError(res, `Prescription with ID ${prescriptionId} not found`, 404);
    return;
  }

  sendSuccess(res, 'Prescription details retrieved', rx.toJSON());
}

export async function dispensePrescription(req: AuthRequest, res: Response): Promise<void> {
  const { prescriptionId } = req.params;
  const { pharmacistName, notes } = req.body;

  const rx = await PrescriptionModel.findOne({ id: prescriptionId });
  if (!rx) {
    sendError(res, `Prescription ${prescriptionId} not found`, 404);
    return;
  }

  // Deduct inventory for each prescribed medicine
  const dispensedItems: any[] = [];
  for (const item of rx.items) {
    item.dispensedStatus = 'DISPENSED';
    item.dispensedQuantity = item.totalQuantity;

    // Find and deduct from medicine inventory if present
    const med = await MedicineModel.findOne({
      facilityId: rx.facilityId,
      medicineName: { $regex: item.medicineName.split(' ')[0], $options: 'i' },
    });

    if (med) {
      med.availableQuantity = Math.max(0, med.availableQuantity - item.totalQuantity);
      if (med.availableQuantity === 0) med.status = 'OUT_OF_STOCK';
      else if (med.availableQuantity <= med.minimumStockThreshold) med.status = 'LOW_STOCK';
      med.lastUpdated = new Date().toISOString();
      await med.save();

      dispensedItems.push({
        medicineName: item.medicineName,
        genericName: item.genericName || med.genericName,
        batchNumber: med.batchNumber,
        quantity: item.totalQuantity,
        unit: 'Tablets',
        dosageInstructions: `${item.dosage} - ${item.frequency}`,
      });
    } else {
      dispensedItems.push({
        medicineName: item.medicineName,
        genericName: item.genericName,
        batchNumber: 'GEN-2026-01',
        quantity: item.totalQuantity,
        unit: 'Tablets',
        dosageInstructions: `${item.dosage} - ${item.frequency}`,
      });
    }
  }

  rx.status = 'DISPENSED';
  if (notes) rx.pharmacyNotes = notes;
  await rx.save();

  // Create dispensing record
  const record = new DispensingRecordModel({
    id: `disp_${Date.now()}`,
    prescriptionId: rx.id,
    patientId: rx.patientId,
    patientName: rx.patientName,
    patientAge: 45,
    patientGender: 'M',
    doctorId: rx.doctorId,
    doctorName: rx.doctorName,
    facilityId: rx.facilityId,
    facilityName: rx.facilityName,
    dispensedBy: pharmacistName || req.user?.name || 'Priya Nair (Pharmacist)',
    dispensedAt: new Date().toISOString(),
    items: dispensedItems,
    pharmacyNotes: notes || 'Dispensed complete medication course.',
  });
  await record.save();

  sendSuccess(res, `Prescription ${rx.id} dispensed successfully`, rx.toJSON());
}

export async function createMedicine(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    const id = data.id || `med_${Date.now()}`;
    const facilityId = data.facilityId || (req as any).user?.facilityId;
    if (!facilityId) {
      sendError(res, 'facilityId is required to register medicine in inventory.', 400);
      return;
    }
    const medicineName = data.medicineName || data.name;
    if (!medicineName) {
      sendError(res, 'medicineName is required.', 400);
      return;
    }
    const genericName = data.genericName || medicineName;
    const category = data.category || 'General';
    const batchNumber = data.batchNumber || `BT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const availableQuantity = Number(data.availableQuantity !== undefined ? data.availableQuantity : 100);
    const minimumStockThreshold = Number(data.minimumStockThreshold || 20);
    const unit = data.unit || 'Tablets';
    const expiryDate = data.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const status =
      availableQuantity === 0
        ? 'OUT_OF_STOCK'
        : availableQuantity <= minimumStockThreshold
        ? 'LOW_STOCK'
        : 'IN_STOCK';

    const newMed = new MedicineModel({
      id,
      facilityId,
      medicineName,
      genericName,
      category,
      batchNumber,
      availableQuantity,
      minimumStockThreshold,
      unit,
      expiryDate,
      status,
      lastUpdated: new Date().toISOString(),
    });

    await newMed.save();

    // Also sync to MedicalStoreModel stock catalog so patient side can instantly find it!
    const storeItem = {
      id: newMed.id,
      name: newMed.medicineName,
      genericName: newMed.genericName,
      category: newMed.category,
      dosage: data.dosage || '500mg',
      status: (availableQuantity === 0 ? 'OUT_OF_STOCK' : availableQuantity <= minimumStockThreshold ? 'LOW_STOCK' : 'IN_STOCK') as any,
      quantityAvailable: availableQuantity,
      genericPrice: Number(data.genericPrice || 12),
      brandPrice: Number(data.brandPrice || 45),
      unit: newMed.unit,
    };

    // Update all medical stores in this district/facility
    await MedicalStoreModel.updateMany(
      {},
      {
        $push: {
          stockCatalog: storeItem,
        },
      }
    );

    sendSuccess(res, 'Medicine created successfully and synchronized with pharmacy stock and medical stores', newMed.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create medicine', 500);
  }
}

export async function updateMedicine(req: Request, res: Response): Promise<void> {
  try {
    const medicineId = String(req.params.medicineId);
    const updateData = { ...req.body, lastUpdated: new Date().toISOString() };

    if (updateData.availableQuantity !== undefined) {
      const qty = Number(updateData.availableQuantity);
      const threshold = Number(updateData.minimumStockThreshold || 20);
      updateData.status = qty === 0 ? 'OUT_OF_STOCK' : qty <= threshold ? 'LOW_STOCK' : 'IN_STOCK';
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(medicineId);
    const query = isObjectId ? { $or: [{ id: medicineId }, { _id: medicineId }] } : { id: medicineId };

    const med = await MedicineModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    if (!med) {
      sendError(res, `Medicine ${medicineId} not found`, 404);
      return;
    }

    sendSuccess(res, 'Medicine updated successfully', med.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update medicine', 500);
  }
}

export async function deleteMedicine(req: Request, res: Response): Promise<void> {
  try {
    const medicineId = String(req.params.medicineId);
    const isObjectId = mongoose.Types.ObjectId.isValid(medicineId);
    const query = isObjectId ? { $or: [{ id: medicineId }, { _id: medicineId }] } : { id: medicineId };
    const result = await MedicineModel.findOneAndDelete(query);

    if (!result) {
      sendError(res, `Medicine ${medicineId} not found`, 404);
      return;
    }

    // Also remove from MedicalStoreModel catalogs
    await MedicalStoreModel.updateMany(
      {},
      {
        $pull: {
          stockCatalog: { id: medicineId },
        },
      }
    );

    sendSuccess(res, 'Medicine deleted successfully', { id: medicineId });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete medicine', 500);
  }
}
