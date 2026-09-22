import { apiRequest } from './client';
import {
  FacilityOperationsSummary,
  FacilityOperationalStatus,
  OperationalService,
  OperationalAnnouncement,
  OperationalIssue,
  StaffDutyItem,
  StaffLeaveOperationalImpact,
} from '@/types/operations';
import { DoctorLeave } from '@/types/admin';

export const operationsApi = {
  // 1. Get facility operational summary and telemetry
  getSummary: (facilityId: string = 'fac_civil_01') =>
    apiRequest<FacilityOperationsSummary>('/operations', 'GET', { facilityId }),

  // 2. Update facility global operational status
  updateStatus: (
    status: FacilityOperationalStatus,
    reason?: string,
    updatedBy: string = 'Operations Coordinator'
  ) =>
    apiRequest<{
      status: FacilityOperationalStatus;
      reason?: string;
      updatedAt: string;
      updatedBy: string;
    }>('/operations/status', 'PATCH', { status, reason, updatedBy }),

  // 3. Operational Services
  getServices: () =>
    apiRequest<OperationalService[]>('/operations/services', 'GET'),

  updateServiceStatus: (
    serviceId: string,
    status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE',
    reason?: string,
    notes?: string
  ) =>
    apiRequest<OperationalService>(`/operations/services/${serviceId}`, 'PATCH', {
      status,
      reason,
      notes,
    }),

  // 4. Announcements & Bulletins
  getAnnouncements: () =>
    apiRequest<OperationalAnnouncement[]>('/operations/announcements', 'GET'),

  createAnnouncement: (
    title: string,
    message: string,
    severity: 'INFO' | 'WARNING' | 'URGENT' = 'INFO',
    author: string = 'Operations Coordinator'
  ) =>
    apiRequest<OperationalAnnouncement>('/operations/announcements', 'POST', {
      title,
      message,
      severity,
      author,
    }),

  // 5. Operational Issues & Triage
  getIssues: () =>
    apiRequest<OperationalIssue[]>('/operations/issues', 'GET'),

  resolveIssue: (issueId: string, resolvedBy: string = 'Operations Coordinator') =>
    apiRequest<OperationalIssue>(`/operations/issues/${issueId}/resolve`, 'PATCH', {
      resolvedBy,
    }),

  // 6. Staff Duty
  getStaffDuty: () =>
    apiRequest<StaffDutyItem[]>('/operations/staff-duty', 'GET'),

  // 7. Queue Delay Broadcast
  broadcastQueueDelay: (departmentId: string, delayMinutes: number) =>
    apiRequest<any>('/operations/queues/delay', 'POST', {
      departmentId,
      delayMinutes,
    }),

  // 8. Staff Leave, Availability & Service Coverage
  getLeaves: (facilityId: string = 'fac_civil_01', status?: string) => {
    const query = status ? `?facilityId=${encodeURIComponent(facilityId)}&status=${encodeURIComponent(status)}` : `?facilityId=${encodeURIComponent(facilityId)}`;
    return apiRequest<DoctorLeave[]>(`/operations/leaves${query}`, 'GET');
  },

  getDoctorLeaves: (doctorId: string) =>
    apiRequest<DoctorLeave[]>(`/operations/leaves?doctorId=${encodeURIComponent(doctorId)}`, 'GET'),

  getLeaveById: (leaveId: string) =>
    apiRequest<DoctorLeave>(`/operations/leaves/${leaveId}`, 'GET'),

  getLeaveImpact: (
    doctorId: string,
    startDate: string,
    endDate: string,
    facilityId: string = 'fac_civil_01'
  ) =>
    apiRequest<StaffLeaveOperationalImpact>(
      `/operations/leaves/impact?doctorId=${encodeURIComponent(doctorId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&facilityId=${encodeURIComponent(facilityId)}`,
      'GET'
    ),

  applyLeave: (leaveData: Omit<DoctorLeave, 'id' | 'createdAt'>) =>
    apiRequest<DoctorLeave>('/operations/leaves', 'POST', leaveData),

  approveLeave: (leaveId: string, reviewerName: string = 'Facility Operations Coordinator') =>
    apiRequest<DoctorLeave>(`/operations/leaves/${leaveId}/approve`, 'POST', { reviewerName }),

  rejectLeave: (leaveId: string, reason: string, reviewerName: string = 'Facility Operations Coordinator') =>
    apiRequest<DoctorLeave>(`/operations/leaves/${leaveId}/reject`, 'POST', { reason, reviewerName }),

  requestChanges: (leaveId: string, note: string, reviewerName: string = 'Facility Operations Coordinator') =>
    apiRequest<DoctorLeave>(`/operations/leaves/${leaveId}/request-changes`, 'POST', { note, reviewerName }),

  cancelLeave: (leaveId: string, actor: string = 'Doctor') =>
    apiRequest<{ cancelled: boolean }>(`/operations/leaves/${leaveId}/cancel`, 'POST', { actor }),
};