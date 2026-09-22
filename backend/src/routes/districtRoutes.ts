import { Router } from 'express';
import {
  listDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  getMyDistrict,
  getMyDistrictFacilities,
  getMyDistrictDoctors,
  getMyDistrictStatistics,
} from '../controllers/districtController';
import { authenticate, authorize } from '../middleware/auth';
import { requireDistrictScope } from '../middleware/scoping';

const router = Router();

// District Admin Scoped Endpoints
router.get('/me', authenticate, authorize(['DISTRICT_ADMIN', 'SUPER_ADMIN']), requireDistrictScope, getMyDistrict);
router.get(
  '/me/facilities',
  authenticate,
  authorize(['DISTRICT_ADMIN', 'SUPER_ADMIN']),
  requireDistrictScope,
  getMyDistrictFacilities
);
router.get(
  '/me/doctors',
  authenticate,
  authorize(['DISTRICT_ADMIN', 'SUPER_ADMIN']),
  requireDistrictScope,
  getMyDistrictDoctors
);
router.get(
  '/me/statistics',
  authenticate,
  authorize(['DISTRICT_ADMIN', 'SUPER_ADMIN']),
  requireDistrictScope,
  getMyDistrictStatistics
);

// Public / open query for UI dropdowns
router.get('/', listDistricts);
router.get('/list', listDistricts);
router.get('/:id', getDistrictById);

// Super Admin District Management
router.post('/', authenticate, authorize(['SUPER_ADMIN']), createDistrict);
router.put('/:id', authenticate, authorize(['SUPER_ADMIN']), updateDistrict);

export default router;
