import { Router } from 'express';
import {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  getNearbyFacilities,
  searchFacilities,
  matchFacilities,
} from '../controllers/facilityController';
import { getBedSummary, updateBedStatus } from '../controllers/resourceController';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorStatus,
  getBloodCentres,
  createBloodCentre,
  getDistrictAdmins,
  createDistrictAdmin,
  updateDistrictAdminStatus,
} from '../controllers/directoryController';

import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Facilities CRUD & Matching
router.get('/facilities/nearby', getNearbyFacilities);
router.get('/facilities/search', searchFacilities);
router.post('/facilities/match', matchFacilities);
router.get('/facilities/:facilityId/bed-summary', getBedSummary);
router.patch('/facilities/:facilityId/bed-summary', updateBedStatus);
router.get('/facilities/:id', getFacilityById);
router.put('/facilities/:id', optionalAuthenticate, updateFacility);
router.patch('/facilities/:id', optionalAuthenticate, updateFacility);
router.delete('/facilities/:id', optionalAuthenticate, deleteFacility);
router.get('/facilities', getAllFacilities);
router.post('/facilities', optionalAuthenticate, createFacility);

// Bed summary direct path support
router.get('/bed-summary', getBedSummary);
router.patch('/bed-summary', updateBedStatus);

// Directory: Doctors, Blood Centres, District Admins
router.get('/doctors', getDoctors);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.patch('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.patch('/doctors/:id/status', updateDoctorStatus);

router.get('/blood-centres', getBloodCentres);
router.post('/blood-centres', createBloodCentre);

router.get('/district-admins', getDistrictAdmins);
router.post('/district-admins', createDistrictAdmin);
router.patch('/district-admins/:id/status', updateDistrictAdminStatus);

export default router;
