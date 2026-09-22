import { Router } from 'express';
import {
  getOperationsSummary,
  updateOperationalStatus,
  getOperationalServices,
  updateServiceStatus,
  getAnnouncements,
  createAnnouncement,
  getIssues,
  resolveIssue,
  getStaffDuty,
  broadcastQueueDelay,
  getLeaves,
  getLeaveById,
  getLeaveImpact,
  applyLeave,
  approveLeave,
  rejectLeave,
  requestChanges,
  cancelLeave,
} from '../controllers/operationsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Summary & Status
router.get('/operations', getOperationsSummary);
router.get('/operations/summary', getOperationsSummary);
router.patch('/operations/status', authenticate, updateOperationalStatus);

// Services
router.get('/operations/services', getOperationalServices);
router.patch('/operations/services/:serviceId', authenticate, updateServiceStatus);

// Announcements
router.get('/operations/announcements', getAnnouncements);
router.post('/operations/announcements', authenticate, createAnnouncement);

// Issues
router.get('/operations/issues', getIssues);
router.patch('/operations/issues/:issueId/resolve', authenticate, resolveIssue);

// Staff Duty
router.get('/operations/staff-duty', getStaffDuty);

// Queue Delay
router.post('/operations/queues/delay', authenticate, broadcastQueueDelay);

// Leaves
router.get('/operations/leaves/impact', getLeaveImpact);
router.get('/operations/leaves/:leaveId', getLeaveById);
router.get('/operations/leaves', getLeaves);
router.post('/operations/leaves', authenticate, applyLeave);
router.post('/operations/leaves/:leaveId/approve', authenticate, approveLeave);
router.post('/operations/leaves/:leaveId/reject', authenticate, rejectLeave);
router.post('/operations/leaves/:leaveId/request-changes', authenticate, requestChanges);
router.post('/operations/leaves/:leaveId/cancel', authenticate, cancelLeave);

export default router;
