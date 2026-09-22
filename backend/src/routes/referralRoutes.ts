import { Router } from 'express';
import {
  getReferrals,
  getReferralById,
  createReferral,
  markUnderReview,
  acceptReferral,
  rejectReferral,
  requestClarification,
  respondClarification,
  confirmArrival,
  recordOutcome,
  closeReferral,
  getNotifications,
} from '../controllers/referralController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/notifications', getNotifications);

router.get('/referrals', getReferrals);
router.post('/referrals', authenticate, createReferral);
router.post('/referrals/:id/review', authenticate, markUnderReview);
router.post('/referrals/:id/accept', authenticate, acceptReferral);
router.post('/referrals/:id/reject', authenticate, rejectReferral);
router.post('/referrals/:id/clarification-request', authenticate, requestClarification);
router.post('/referrals/:id/clarification-response', authenticate, respondClarification);
router.post('/referrals/:id/confirm-arrival', authenticate, confirmArrival);
router.post('/referrals/:id/outcome', authenticate, recordOutcome);
router.post('/referrals/:id/close', authenticate, closeReferral);
router.get('/referrals/:id', getReferralById);

export default router;
