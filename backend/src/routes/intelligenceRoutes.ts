import { Router } from 'express';
import {
  getDistrictSummary,
  getDistrictAreas,
  getDistrictFacilities,
  getSpecialistGaps,
  getEquipmentGaps,
  getMedicineShortages,
  getDiagnosticGaps,
  getRecommendations,
  getUnusedResources,
  getDoctorRequirements,
  queryAi,
  getAiDashboard,
  acknowledgeAlert,
} from '../controllers/intelligenceController';

const router = Router();

// District Intelligence
router.get('/district/intelligence/summary', getDistrictSummary);
router.get('/district/intelligence/areas', getDistrictAreas);
router.get('/district/intelligence/facilities', getDistrictFacilities);
router.get('/district/intelligence/specialist-gaps', getSpecialistGaps);
router.get('/district/intelligence/equipment-gaps', getEquipmentGaps);
router.get('/district/intelligence/medicine-shortages', getMedicineShortages);
router.get('/district/intelligence/diagnostic-gaps', getDiagnosticGaps);
router.get('/district/intelligence/recommendations', getRecommendations);
router.get('/district/intelligence/unused-resources', getUnusedResources);
router.get('/district/intelligence/doctor-requirements', getDoctorRequirements);
router.post('/district/intelligence/query', queryAi);

// AI Dashboard & Outbreak Alerts
router.get('/ai/dashboard', getAiDashboard);
router.get('/disease-trends', getAiDashboard);
router.get('/outbreak-alerts', getAiDashboard);
router.patch('/ai/alerts/:alertId/acknowledge', acknowledgeAlert);

export default router;
