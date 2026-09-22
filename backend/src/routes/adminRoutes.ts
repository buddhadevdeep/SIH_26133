import { Router } from 'express';
import {
  getRoles,
  getSystemHealth,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getPermissionMatrix,
  getAiModels,
  deployAiModel,
  rollbackAiModel,
  getAuditLogs,
  getSystemSettings,
  updateSystemSettings,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Roles Directory
router.get('/roles', getRoles);
router.get('/super-admin/roles-list', getRoles);

// System Health (open to health checks)
router.get('/super-admin/system-health', getSystemHealth);
router.get('/health', getSystemHealth);

// System Settings
router.get('/super-admin/settings', getSystemSettings);
router.put('/super-admin/settings', authenticate, authorize(['SUPER_ADMIN']), updateSystemSettings);

// User Management (Super Admin, District Admin & Hospital Admin)
router.get('/users', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN', 'HOSPITAL_ADMIN']), getAdminUsers);
router.post('/users', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN', 'HOSPITAL_ADMIN']), createAdminUser);
router.put('/users/:id', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN', 'HOSPITAL_ADMIN']), updateAdminUser);
router.delete('/users/:id', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN', 'HOSPITAL_ADMIN']), deleteAdminUser);

// Legacy Super Admin user paths for backward compatibility
router.get('/super-admin/users', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN']), getAdminUsers);
router.post('/super-admin/users', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN']), createAdminUser);
router.put('/super-admin/users/:id', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN']), updateAdminUser);
router.delete('/super-admin/users/:id', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN']), deleteAdminUser);

// Roles matrix & AI models
router.get('/super-admin/roles', authenticate, authorize(['SUPER_ADMIN']), getPermissionMatrix);
router.get('/super-admin/ai-models', authenticate, authorize(['SUPER_ADMIN']), getAiModels);
router.post('/super-admin/ai-models/:modelId/deploy', authenticate, authorize(['SUPER_ADMIN']), deployAiModel);
router.post('/super-admin/ai-models/:modelId/rollback', authenticate, authorize(['SUPER_ADMIN']), rollbackAiModel);
router.get('/super-admin/audit', authenticate, authorize(['SUPER_ADMIN', 'DISTRICT_ADMIN']), getAuditLogs);

export default router;

