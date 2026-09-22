import { Router } from 'express';
import {
  getDiagnosticOrders,
  getDiagnosticOrderById,
  collectSample,
  receiveSample,
  rejectSample,
  startProcessing,
  submitResult,
} from '../controllers/labController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/orders', getDiagnosticOrders);
router.get('/orders/:orderId', getDiagnosticOrderById);
router.patch('/orders/:orderId/collect', authenticate, collectSample);
router.post('/orders/:orderId/collect', authenticate, collectSample);
router.patch('/orders/:orderId/receive', authenticate, receiveSample);
router.post('/orders/:orderId/receive', authenticate, receiveSample);
router.patch('/orders/:orderId/reject', authenticate, rejectSample);
router.post('/orders/:orderId/reject', authenticate, rejectSample);
router.patch('/orders/:orderId/process', authenticate, startProcessing);
router.post('/orders/:orderId/process', authenticate, startProcessing);
router.patch('/orders/:orderId/result', authenticate, submitResult);
router.post('/orders/:orderId/result', authenticate, submitResult);

export default router;
