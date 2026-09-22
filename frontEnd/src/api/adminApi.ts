import { apiRequest } from './client';
import { SystemHealthOverview, PermissionMatrixItem, AiModelRegistryItem, AuditLog } from '@/types/admin';
import { User } from '@/types/auth';

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string;
  level: 'STATE' | 'DISTRICT' | 'FACILITY' | 'COMMUNITY' | 'CITIZEN';
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
}

export const adminApi = {
  getSystemHealth: () =>
    apiRequest<SystemHealthOverview>('/super-admin/system-health', 'GET'),

  getRoles: () =>
    apiRequest<RoleItem[]>('/roles', 'GET'),

  getUsers: (params?: { district?: string; facilityId?: string; role?: string; status?: string; search?: string }) =>
    apiRequest<User[]>('/users', 'GET', params),

  createUser: (data: Partial<User> & { password?: string }) =>
    apiRequest<User>('/users', 'POST', data),

  updateUser: (id: string, data: Partial<User>) =>
    apiRequest<User>(`/users/${id}`, 'PUT', data),

  deleteUser: (id: string) =>
    apiRequest<{ id: string; status: string }>(`/users/${id}`, 'DELETE'),

  getPermissions: () =>
    apiRequest<PermissionMatrixItem[]>('/super-admin/roles', 'GET'),

  getAiModels: () =>
    apiRequest<AiModelRegistryItem[]>('/super-admin/ai-models', 'GET'),

  deployModel: (modelId: string) =>
    apiRequest<{ deployed: boolean }>(`/super-admin/ai-models/${modelId}/deploy`, 'POST'),

  rollbackModel: (modelId: string) =>
    apiRequest<{ rolledBack: boolean }>(`/super-admin/ai-models/${modelId}/rollback`, 'POST'),

  getAuditLogs: (params?: { action?: string; role?: string }) =>
    apiRequest<AuditLog[]>('/super-admin/audit', 'GET', params),

  getSettings: () =>
    apiRequest<any>('/super-admin/settings', 'GET'),

  updateSettings: (data: any) =>
    apiRequest<any>('/super-admin/settings', 'PUT', data),
};

