import { Router } from 'express';
import {
  getAshaPatients,
  registerAshaPatient,
  recordAshaVitals,
  getAshaVisits,
  scheduleAshaVisit,
  updateAshaVisit,
  getAshaTasks,
  updateAshaTask,
  getAshaReferrals,
  createAshaReferral,
  saveScreening,
  pushSyncQueue,
} from '../controllers/ashaController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Patients
router.get('/asha/patients', getAshaPatients);
router.post('/asha/patients', authenticate, registerAshaPatient);
router.post('/asha/patients/:patientId/vitals', authenticate, recordAshaVitals);

// Visits
router.get('/asha/visits', getAshaVisits);
router.post('/asha/visits', authenticate, scheduleAshaVisit);
router.patch('/asha/visits', authenticate, updateAshaVisit);
router.patch('/asha/visits/:id', authenticate, updateAshaVisit);

// Tasks
router.get('/asha/tasks', getAshaTasks);
router.patch('/asha/tasks', authenticate, updateAshaTask);

// Referrals
router.get('/asha/referrals', getAshaReferrals);
router.post('/asha/referrals', authenticate, createAshaReferral);

// Screenings
router.post('/asha/screenings', authenticate, saveScreening);

// Offline Sync
router.post('/sync/push', authenticate, pushSyncQueue);

export default router;
