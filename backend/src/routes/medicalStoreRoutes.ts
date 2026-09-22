import { Router } from 'express';
import {
  getAllMedicalStores,
  getMedicalStoreById,
  createMedicalStore,
  updateMedicalStore,
  deleteMedicalStore,
} from '../controllers/medicalStoreController';

const router = Router();

router.get('/', getAllMedicalStores);
router.get('/:id', getMedicalStoreById);
router.post('/', createMedicalStore);
router.put('/:id', updateMedicalStore);
router.patch('/:id', updateMedicalStore);
router.delete('/:id', deleteMedicalStore);

export default router;
