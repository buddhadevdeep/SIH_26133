import { Router } from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  quarantineBatch,
  adjustMedicineStock,
  getDispensingHistory,
} from '../controllers/pharmacyController';
import {
  getBloodInventory,
  getAmbulances,
  getEquipment,
} from '../controllers/resourceController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Pharmacy History
router.get('/pharmacy/history', getDispensingHistory);

// Medicines Inventory
router.get('/medicines', getMedicines);
router.post('/medicines', createMedicine);
router.get('/medicines/:medicineId', getMedicineById);
router.put('/medicines/:medicineId', updateMedicine);
router.patch('/medicines/:medicineId', updateMedicine);
router.delete('/medicines/:medicineId', deleteMedicine);
router.patch('/medicines/:medicineId/quarantine', quarantineBatch);
router.patch('/medicines/:medicineId/stock', adjustMedicineStock);

// Resources
router.get('/blood/inventory', getBloodInventory);
router.get('/blood', getBloodInventory);
router.get('/ambulances', getAmbulances);
router.get('/equipment', getEquipment);

export default router;
