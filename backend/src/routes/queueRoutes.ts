import { Router } from 'express';
import {
  searchClerkPatients,
  getClerkPatientById,
  checkDuplicatePatient,
  registerPatient,
  getAppointments,
  getAppointmentById,
  bookAppointment,
  assignDoctorToAppointment,
  updateAppointment,
  checkInAppointment,
  cancelAppointment,
  getLiveQueue,
  callNext,
  callToken,
  startConsultation,
  completeConsultation,
  skipToken,
  noShowToken,
  generateToken,
  getTokenById,
  cancelToken,
} from '../controllers/queueController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Clerk Patients
router.get('/clerk/patients', searchClerkPatients);
router.post('/clerk/patients/check-duplicate', checkDuplicatePatient);
router.post('/clerk/patients/register', registerPatient);
router.get('/clerk/patients/:id', getClerkPatientById);

// Appointments
router.get('/appointments', getAppointments);
router.post('/appointments', optionalAuthenticate, bookAppointment);
router.post('/appointments/book', optionalAuthenticate, bookAppointment);
router.post('/checkin', checkInAppointment);
router.post('/checkin/:appointmentId', checkInAppointment);
router.post('/queue/check-in', checkInAppointment);
router.post('/queues/checkin', checkInAppointment);
router.post('/queues/checkin/:appointmentId', checkInAppointment);
router.get('/appointments/:appointmentId', getAppointmentById);
router.patch('/appointments/:appointmentId/assign-doctor', assignDoctorToAppointment);
router.patch('/appointments/:appointmentId/check-in', checkInAppointment);
router.post('/appointments/:appointmentId/check-in', checkInAppointment);
router.patch('/appointments/:appointmentId/cancel', cancelAppointment);
router.patch('/appointments/:appointmentId', updateAppointment);

// Live Queues
router.get('/queues/:facilityId/live', getLiveQueue);
router.post('/queues/:facilityId/next', callNext);
router.post('/queues/:queueId/skip', skipToken);
router.post('/queues/:queueId/no-show', noShowToken);

// Tokens & Consultation
router.post('/tokens', generateToken);
router.get('/tokens/:tokenId', getTokenById);
router.post('/tokens/:tokenId/call', callToken);
router.post('/tokens/:tokenId/start-consultation', optionalAuthenticate, startConsultation);
router.post('/tokens/:tokenId/complete', completeConsultation);
router.post('/tokens/:tokenId/skip', skipToken);
router.post('/tokens/:tokenId/no-show', noShowToken);
router.patch('/tokens/:tokenId/cancel', cancelToken);

export default router;
