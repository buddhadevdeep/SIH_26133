import { Router } from 'express';
import {
  getPatientHealthRecord,
  getTimeline,
  getEncounters,
  getEncounterById,
  createEncounter,
  completeEncounter,
  saveVitals,
  createPrescription,
} from '../controllers/clinicalController';
import {
  getPrescriptions,
  getPrescriptionById,
  dispensePrescription,
} from '../controllers/pharmacyController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// EHR & Encounters
router.get('/patients/:patientId/health-record', optionalAuthenticate, getPatientHealthRecord);
router.get('/patients/:patientId/timeline', optionalAuthenticate, getTimeline);
router.get('/encounters', getEncounters);
router.get('/encounters/:encounterId', getEncounterById);
router.post('/encounters', optionalAuthenticate, createEncounter);
router.post('/encounters/:encounterId/complete', optionalAuthenticate, completeEncounter);
router.patch('/encounters/:encounterId/complete', optionalAuthenticate, completeEncounter);
router.post('/encounters/:encounterId/vitals', optionalAuthenticate, saveVitals);

// Prescriptions
router.get('/prescriptions', getPrescriptions);
router.get('/prescriptions/:prescriptionId', getPrescriptionById);
router.post('/prescriptions', optionalAuthenticate, createPrescription);
router.post('/encounters/:encounterId/prescriptions', optionalAuthenticate, createPrescription);
router.patch('/prescriptions/:prescriptionId/dispense', optionalAuthenticate, dispensePrescription);

export default router;
