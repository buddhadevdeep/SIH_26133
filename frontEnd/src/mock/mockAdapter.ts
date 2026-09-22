import { mockState } from './db';
import { ApiResponse } from '@/types/api';
import { User, UserRole, StaffSubType } from '@/types/auth';
import { FacilityMatchRequest } from '@/types/facility';
import { CreateReferralRequest } from '@/types/referral';
import { AshaPatient, AshaVisit, ScreeningSession, FollowUpTask, FrontlineReferral } from '@/types/asha';
import { MedicalStore } from '@/types/medicalStore';
import { IntelligenceService } from '@/services/intelligenceService';

// Intercepts mock requests and returns structured ApiResponse format
export async function handleMockRequest(url: string, method: string = 'GET', data?: unknown): Promise<ApiResponse<unknown> | null> {
  // Artificial slight latency to demonstrate smooth loading skeletons (120ms)
  await new Promise((r) => setTimeout(r, 120));

  const cleanUrl = url.replace(/^[a-z]+:\/\/[^/]+/i, '').split('?')[0];

  // 1. AUTH
  if (cleanUrl.includes('/auth/patient/send-otp') && method === 'POST') {
    return {
      success: true,
      message: 'OTP sent successfully to registered mobile number (Demo OTP: 123456)',
      data: { phone: (data as { phone: string })?.phone || '9876543210' },
    };
  }

  if (cleanUrl.includes('/auth/patient/verify-otp') && method === 'POST') {
    const user = mockState.users.patient;
    return {
      success: true,
      message: 'OTP verified successfully',
      data: {
        user,
        tokens: { accessToken: 'mock_jwt_patient', refreshToken: 'mock_refresh_patient', expiresIn: 3600 },
      },
    };
  }

  if (cleanUrl.includes('/auth/login') && method === 'POST') {
    const creds = (data || {}) as { role?: UserRole; staffSubType?: StaffSubType; identifier?: string };
    let user = mockState.users.patient;

    if (creds.role === 'ASHA') user = mockState.users.asha;
    else if (creds.role === 'DOCTOR') user = mockState.users.doctor;
    else if (creds.role === 'FACILITY_STAFF') {
      if (creds.staffSubType === 'PHARMACIST') user = mockState.users.pharmacist;
      else if (creds.staffSubType === 'LAB_TECHNICIAN') user = mockState.users.labTech;
      else if (creds.staffSubType === 'FACILITY_OPERATIONS') user = mockState.users.operations;
      else user = mockState.users.registrationClerk;
    } else if (creds.role === 'DISTRICT_ADMIN') user = mockState.users.districtAdmin;
    else if (creds.role === 'SUPER_ADMIN') user = mockState.users.superAdmin;

    return {
      success: true,
      message: 'Authentication successful',
      data: {
        user,
        tokens: { accessToken: `mock_jwt_${user.role.toLowerCase()}`, refreshToken: 'mock_refresh_token', expiresIn: 3600 },
      },
    };
  }

  if (cleanUrl.includes('/auth/me')) {
    return {
      success: true,
      message: 'Current authenticated user retrieved',
      data: mockState.users.patient,
    };
  }

  // 2. FACILITIES
  if (cleanUrl === '/facilities' || cleanUrl === '/api/v1/facilities' || cleanUrl.includes('/facilities/nearby') || cleanUrl.includes('/facilities/search')) {
    if (method === 'POST') {
      const createdFac = mockState.addFacility(data as any);
      return {
        success: true,
        message: `Government facility ${createdFac.name} registered successfully in ${createdFac.district}`,
        data: createdFac,
      };
    }
    return {
      success: true,
      message: 'Facilities retrieved',
      data: mockState.facilities,
      meta: { page: 1, limit: 10, total: mockState.facilities.length },
    };
  }

  const facilityIdMatch = cleanUrl.match(/\/facilities\/(fac_[a-z0-9_]+)$/);
  if (facilityIdMatch && method === 'GET') {
    const fac = mockState.facilities.find((f) => f.id === facilityIdMatch[1]) || mockState.facilities[0];
    return {
      success: true,
      message: 'Facility details retrieved',
      data: fac,
    };
  }

  if (cleanUrl.includes('/facilities/match') && method === 'POST') {
    const matchResults = mockState.matchFacilities((data || {}) as FacilityMatchRequest);
    return {
      success: true,
      message: 'Ranked facilities matching clinical criteria retrieved',
      data: matchResults,
    };
  }

  // 2a. DOCTORS & SPECIALISTS MANAGEMENT
  if (cleanUrl === '/doctors' || cleanUrl === '/api/v1/doctors') {
    if (method === 'POST') {
      const newDoc = mockState.addDoctor(data as any);
      return {
        success: true,
        message: `Doctor ${newDoc.name} (${newDoc.specialty}) registered successfully`,
        data: newDoc,
      };
    }
    return {
      success: true,
      message: 'Doctors retrieved',
      data: mockState.doctors,
    };
  }

  const docStatusMatch = cleanUrl.match(/\/doctors\/(doc_[a-z0-9_]+)\/status$/);
  if (docStatusMatch && (method === 'PATCH' || method === 'POST')) {
    const body = (data || {}) as { status: any };
    const updated = mockState.updateDoctorStatus(docStatusMatch[1], body.status);
    return {
      success: true,
      message: 'Doctor duty status updated successfully',
      data: updated,
    };
  }

  // 2b. BLOOD CENTERS & STORAGE UNITS
  if (cleanUrl === '/blood-centres' || cleanUrl === '/api/v1/blood-centres') {
    if (method === 'POST') {
      const newCenter = mockState.addBloodCenter(data as any);
      return {
        success: true,
        message: `Blood institution ${newCenter.name} registered successfully`,
        data: newCenter,
      };
    }
    return {
      success: true,
      message: 'Blood centers retrieved',
      data: mockState.bloodCenters,
    };
  }

  // 2c. DISTRICT HEALTH ADMINISTRATORS (SUPER ADMIN EXCLUSIVE APPOINTMENTS)
  if (cleanUrl === '/district-admins' || cleanUrl === '/api/v1/district-admins') {
    if (method === 'POST') {
      const newAdmin = mockState.provisionDistrictAdmin(data as any);
      return {
        success: true,
        message: `District Administrator ${newAdmin.name} appointed for ${newAdmin.district} District jurisdiction`,
        data: newAdmin,
      };
    }
    return {
      success: true,
      message: 'District administrators retrieved',
      data: mockState.districtAdmins,
    };
  }

  const adminStatusMatch = cleanUrl.match(/\/district-admins\/(usr_dist_[a-z0-9_]+)\/status$/);
  if (adminStatusMatch && (method === 'PATCH' || method === 'POST')) {
    const body = (data || {}) as { status: any };
    const updated = mockState.updateDistrictAdminStatus(adminStatusMatch[1], body.status);
    return {
      success: true,
      message: 'District Administrator status updated',
      data: updated,
    };
  }

  // 2d. FACILITY OPERATIONS (FACILITY_OPERATIONS)
  if (cleanUrl.includes('/operations') || cleanUrl.includes('/facilities/fac_civil_01') || cleanUrl.includes('/facility-operations')) {
    const facId = 'fac_civil_01';

    // Update facility status (Open, Limited, Closed, Emergency-Only)
    if (cleanUrl.includes('/status') && (method === 'PATCH' || method === 'POST')) {
      const body = (data || {}) as { status: any; reason?: string; updatedBy?: string };
      const updated = mockState.updateFacilityStatus(facId, body.status, body.reason, body.updatedBy);
      return {
        success: true,
        message: `Facility operational status updated to ${body.status}`,
        data: updated,
      };
    }

    // Services management
    if (cleanUrl.includes('/services')) {
      if (method === 'PATCH' || method === 'POST') {
        const servMatch = cleanUrl.match(/\/services\/(serv_[a-z0-9_]+)/);
        const servId = servMatch ? servMatch[1] : '';
        const body = (data || {}) as { status: any; reason?: string; notes?: string };
        const updatedServ = mockState.toggleServiceStatus(servId, body.status, body.reason, body.notes);
        return {
          success: true,
          message: `Department service status updated to ${body.status}`,
          data: updatedServ,
        };
      }
      return {
        success: true,
        message: 'Operational services retrieved',
        data: mockState.operationalServices,
      };
    }

    // Announcements & broadcasts
    if (cleanUrl.includes('/announcements')) {
      if (method === 'POST') {
        const body = (data || {}) as { title: string; message: string; severity?: any; author?: string };
        const created = mockState.broadcastAnnouncement(body.title, body.message, body.severity, body.author);
        return {
          success: true,
          message: 'Facility announcement broadcasted successfully',
          data: created,
        };
      }
      return {
        success: true,
        message: 'Active operational announcements retrieved',
        data: mockState.operationalAnnouncements.filter((a) => a.active),
      };
    }

    // Operational Issues & Alerts
    if (cleanUrl.includes('/issues')) {
      if (cleanUrl.includes('/resolve') && (method === 'PATCH' || method === 'POST')) {
        const issMatch = cleanUrl.match(/\/issues\/(iss_[a-z0-9_]+)/);
        const issueId = issMatch ? issMatch[1] : '';
        const body = (data || {}) as { resolvedBy?: string };
        const resolved = mockState.resolveOperationalIssue(issueId, body.resolvedBy);
        return {
          success: true,
          message: 'Operational issue marked resolved',
          data: resolved,
        };
      }
      return {
        success: true,
        message: 'Operational issues retrieved',
        data: mockState.operationalIssues,
      };
    }

    // Staff Duty Roster
    if (cleanUrl.includes('/staff-duty')) {
      return {
        success: true,
        message: 'Operational staff duty roster retrieved',
        data: mockState.staffDuty,
      };
    }

    // Staff Leaves Management
    if (cleanUrl.includes('/leaves')) {
      const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const queryFacilityId = queryParams.get('facilityId') || facId;
      const queryStatus = queryParams.get('status') || undefined;
      const queryDoctorId = queryParams.get('doctorId') || undefined;

      // Evaluate operational impact preview
      if (cleanUrl.includes('/impact')) {
        const docId = queryParams.get('doctorId') || ((data as any)?.doctorId) || 'usr_doc_01';
        const start = queryParams.get('startDate') || ((data as any)?.startDate) || '';
        const end = queryParams.get('endDate') || ((data as any)?.endDate) || '';
        const impact = mockState.evaluateLeaveImpact(docId, start, end, queryFacilityId);
        return {
          success: true,
          message: 'Staff leave operational impact evaluated',
          data: impact,
        };
      }

      // Action: Approve
      const approveMatch = cleanUrl.match(/\/leaves\/(leave_[a-z0-9_]+)\/approve/);
      if (approveMatch && method === 'POST') {
        const body = (data || {}) as { reviewerName?: string };
        try {
          const approved = mockState.approveDoctorLeave(approveMatch[1], body.reviewerName || 'Facility Operations Coordinator');
          return {
            success: true,
            message: `Leave approved for ${approved.doctorName}. Operational availability and service coverage updated.`,
            data: approved,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err.message || 'Failed to approve leave',
            data: null,
          };
        }
      }

      // Action: Reject
      const rejectMatch = cleanUrl.match(/\/leaves\/(leave_[a-z0-9_]+)\/reject/);
      if (rejectMatch && method === 'POST') {
        const body = (data || {}) as { reason: string; reviewerName?: string };
        try {
          const rejected = mockState.rejectDoctorLeave(
            rejectMatch[1],
            body.reason || 'Service coverage constraints',
            body.reviewerName || 'Facility Operations Coordinator'
          );
          return {
            success: true,
            message: `Leave request rejected for ${rejected.doctorName}. Doctor notified.`,
            data: rejected,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err.message || 'Failed to reject leave',
            data: null,
          };
        }
      }

      // Action: Request Changes
      const changesMatch = cleanUrl.match(/\/leaves\/(leave_[a-z0-9_]+)\/request-changes/);
      if (changesMatch && method === 'POST') {
        const body = (data || {}) as { note: string; reviewerName?: string };
        try {
          const updated = mockState.requestChangesDoctorLeave(
            changesMatch[1],
            body.note || 'Please arrange alternate specialist handover',
            body.reviewerName || 'Facility Operations Coordinator'
          );
          return {
            success: true,
            message: `Clarification requested for ${updated.doctorName}. Leave returned with reviewer notes.`,
            data: updated,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err.message || 'Failed to request changes',
            data: null,
          };
        }
      }

      // Action: Cancel / Withdraw
      const cancelMatch = cleanUrl.match(/\/leaves\/(leave_[a-z0-9_]+)\/cancel/);
      if (cancelMatch && method === 'POST') {
        const body = (data || {}) as { actor?: string };
        const cancelled = mockState.cancelDoctorLeave(cancelMatch[1], body.actor || 'Doctor');
        return {
          success: cancelled,
          message: cancelled ? 'Leave schedule withdrawn. Staff duty availability restored.' : 'Leave not found or already cancelled',
          data: { cancelled },
        };
      }

      // Single Leave Details
      const singleMatch = cleanUrl.match(/\/leaves\/(leave_[a-z0-9_]+)$/);
      if (singleMatch && method === 'GET') {
        const leave = mockState.getLeaveById(singleMatch[1]);
        if (!leave) {
          return {
            success: false,
            message: 'Leave record not found',
            data: null,
          };
        }
        return {
          success: true,
          message: 'Leave details retrieved',
          data: leave,
        };
      }

      // Create new leave (Doctor or Staff applying)
      if (method === 'POST') {
        const body = (data || {}) as any;
        try {
          const created = mockState.addDoctorLeave(body, body.actor || 'Doctor');
          return {
            success: true,
            message: `Leave request registered successfully with ID ${created.id} and routed for Facility Operations review`,
            data: created,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err.message || 'Failed to submit leave request',
            data: null,
          };
        }
      }

      // List facility leaves or doctor leaves
      if (queryDoctorId) {
        return {
          success: true,
          message: 'Doctor leaves retrieved',
          data: mockState.getDoctorLeaves(queryDoctorId),
        };
      }

      return {
        success: true,
        message: 'Facility staff leave records retrieved',
        data: mockState.getFacilityLeaves(queryFacilityId, queryStatus),
      };
    }

    // Queue Delay Broadcast
    if (cleanUrl.includes('/queues/delay') && (method === 'PATCH' || method === 'POST')) {
      const body = (data || {}) as { departmentId: string; delayMinutes: number };
      mockState.updateDepartmentQueueWait(body.departmentId, body.delayMinutes);
      return {
        success: true,
        message: `Broadcasted ${body.delayMinutes} min delay for department`,
        data: mockState.liveQueue,
      };
    }

    // Default operations summary
    return {
      success: true,
      message: 'Facility operations summary retrieved',
      data: mockState.getFacilityOperationsSummary(facId),
    };
  }

  // 3. QUEUES & TOKENS
  if (cleanUrl.includes('/queues') && cleanUrl.includes('/live')) {
    return {
      success: true,
      message: 'Live queue state retrieved',
      data: mockState.liveQueue,
    };
  }

  if (cleanUrl.includes('/queues') && cleanUrl.includes('/next') && method === 'POST') {
    const calledToken = mockState.callNextToken();
    return {
      success: true,
      message: calledToken ? `Token ${calledToken.tokenNumber} called to Room 4` : 'No waiting tokens in queue',
      data: { calledToken, queue: mockState.liveQueue },
    };
  }

  if (cleanUrl.includes('/tokens') && method === 'POST') {
    const body = (data || {}) as {
      patientName?: string;
      patientPhone?: string;
      facilityId?: string;
      departmentId?: string;
      priority?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
      doctorId?: string;
      doctorName?: string;
      roomNumber?: string;
    };
    const token = mockState.generateToken(
      body.patientName || 'Rameshwar Sharma',
      body.patientPhone || '9876543210',
      body.facilityId || 'fac_civil_01',
      body.departmentId || 'dep_med',
      body.priority || 'ROUTINE',
      45,
      'M',
      'usr_pat_01',
      undefined,
      undefined,
      body.doctorId,
      body.doctorName,
      body.roomNumber
    );
    return {
      success: true,
      message: `Digital Token ${token.tokenNumber} generated successfully`,
      data: token,
    };
  }

  if (cleanUrl.match(/\/tokens\/[a-z0-9_]+$/) && method === 'GET') {
    const userToken = mockState.liveQueue.tokens.find((t) => t.patientId === 'usr_pat_01') || mockState.liveQueue.tokens[0];
    return {
      success: true,
      message: 'Token status retrieved',
      data: userToken,
    };
  }

  // 3b. REGISTRATION CLERK PATIENTS & APPOINTMENTS
  if (cleanUrl.includes('/clerk/patients/check-duplicate') && method === 'POST') {
    const body = (data || {}) as { phone?: string; abhaId?: string; name?: string };
    const duplicate = mockState.checkDuplicatePatient(body.phone || '', body.abhaId, body.name);
    return {
      success: true,
      message: duplicate ? 'Matching patient record found' : 'No duplicate record found',
      data: duplicate,
    };
  }

  if (cleanUrl.includes('/clerk/patients/register') && method === 'POST') {
    const patientData = (data || {}) as any;
    const newPatient = mockState.registerPatient(patientData);
    return {
      success: true,
      message: `Patient ${newPatient.name} registered successfully with ID ${newPatient.id}`,
      data: newPatient,
    };
  }

  const clerkPatientMatch = cleanUrl.match(/\/clerk\/patients\/(usr_pat_[a-z0-9_]+)$/);
  if (clerkPatientMatch && method === 'GET') {
    const patient = mockState.getPatientById(clerkPatientMatch[1]);
    if (!patient) {
      return {
        success: false,
        message: 'Patient not found',
        data: null,
      };
    }
    return {
      success: true,
      message: 'Patient record retrieved',
      data: patient,
    };
  }

  if (cleanUrl.includes('/clerk/patients') && method === 'GET') {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const searchQuery = queryParams.get('search') || '';
    const results = mockState.searchPatients(searchQuery);
    return {
      success: true,
      message: `Found ${results.length} patient records`,
      data: results,
    };
  }

  if (cleanUrl.includes('/appointments') && cleanUrl.includes('/assign-doctor') && (method === 'PATCH' || method === 'POST')) {
    const parts = cleanUrl.split('/');
    const aptIndex = parts.findIndex((p) => p === 'appointments');
    const aptId = aptIndex !== -1 ? parts[aptIndex + 1] : '';
    try {
      const updatedApt = mockState.assignDoctorToAppointment(aptId, (data || {}) as any);
      return {
        success: true,
        message: `Doctor ${updatedApt.doctorName} assigned to patient ${updatedApt.patientName}`,
        data: updatedApt,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to assign doctor',
        data: null,
      };
    }
  }

  if (cleanUrl.includes('/appointments') && cleanUrl.includes('/check-in') && method === 'POST') {
    const parts = cleanUrl.split('/');
    const aptIndex = parts.findIndex((p) => p === 'appointments');
    const aptId = aptIndex !== -1 ? parts[aptIndex + 1] : '';
    try {
      const result = mockState.checkInAppointment(aptId);
      return {
        success: true,
        message: `Patient ${result.appointment.patientName} checked in. Token ${result.token.tokenNumber} issued.`,
        data: result,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Check-in failed',
        data: null,
      };
    }
  }

  if (cleanUrl.includes('/appointments') && method === 'POST') {
    const aptData = (data || {}) as any;
    const newApt = mockState.bookAppointment(aptData);
    return {
      success: true,
      message: `Appointment booked for ${newApt.patientName} on ${newApt.date} at ${newApt.timeSlot}`,
      data: newApt,
    };
  }

  if (cleanUrl.includes('/appointments') && method === 'GET') {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const patientId = queryParams.get('patientId');
    const status = queryParams.get('status');
    const date = queryParams.get('date');

    let list = mockState.appointments;
    if (patientId) {
      list = list.filter((a) => a.patientId === patientId);
    }
    if (status && status !== 'ALL') {
      list = list.filter((a) => a.status === status);
    }
    if (date) {
      list = list.filter((a) => a.date === date);
    }

    return {
      success: true,
      message: 'Appointments retrieved',
      data: list,
    };
  }

  // 4. EHR & CLINICAL TIMELINE
  if (cleanUrl.includes('/health-record') || cleanUrl.includes('/timeline')) {
    return {
      success: true,
      message: 'Patient health record retrieved',
      data: mockState.healthRecords.usr_pat_01,
    };
  }

  if (cleanUrl.includes('/pharmacy/history')) {
    return {
      success: true,
      message: 'Dispensing history records retrieved',
      data: mockState.dispensingHistory,
    };
  }

  if (cleanUrl.includes('/prescriptions')) {
    if (method === 'PATCH' && cleanUrl.includes('/dispense')) {
      const parts = cleanUrl.split('/');
      const rxIndex = parts.findIndex((p) => p === 'prescriptions');
      const rxId = rxIndex !== -1 ? parts[rxIndex + 1] : parts[4];
      const body = (data || {}) as { pharmacistName?: string; notes?: string };
      const dispensed = mockState.dispensePrescription(rxId, body.pharmacistName, body.notes);
      return {
        success: true,
        message: 'Prescription verified, dispensed and inventory deducted successfully',
        data: dispensed,
      };
    }

    const rxSingleMatch = cleanUrl.match(/\/prescriptions\/([a-zA-Z0-9_-]+)$/);
    if (rxSingleMatch && method === 'GET') {
      const targetRx = mockState.prescriptions.find((p) => p.id === rxSingleMatch[1]);
      if (targetRx) {
        return {
          success: true,
          message: 'Prescription details retrieved',
          data: targetRx,
        };
      }
    }

    return {
      success: true,
      message: 'Prescriptions list retrieved',
      data: mockState.prescriptions,
    };
  }

  // 4b. DIAGNOSTIC ORDERS (LAB TECHNICIAN)
  if (cleanUrl.includes('/diagnostics/orders')) {
    // 1. Collect sample
    if (cleanUrl.includes('/collect') && (method === 'PATCH' || method === 'POST')) {
      const parts = cleanUrl.split('/');
      const ordIndex = parts.findIndex((p) => p === 'orders');
      const orderId = ordIndex !== -1 ? parts[ordIndex + 1] : '';
      const body = (data || {}) as { technicianName?: string; notes?: string };
      const updated = mockState.collectSample(orderId, body.technicianName, body.notes);
      if (!updated) {
        return { success: false, message: 'Test order not found', data: null };
      }
      return {
        success: true,
        message: `Sample collected successfully for ${updated.testName}. Barcode: ${updated.barcodeNumber}`,
        data: updated,
      };
    }

    // 2. Receive sample at desk
    if (cleanUrl.includes('/receive') && (method === 'PATCH' || method === 'POST')) {
      const parts = cleanUrl.split('/');
      const ordIndex = parts.findIndex((p) => p === 'orders');
      const orderId = ordIndex !== -1 ? parts[ordIndex + 1] : '';
      const body = (data || {}) as { technicianName?: string };
      const updated = mockState.receiveSample(orderId, body.technicianName);
      if (!updated) {
        return { success: false, message: 'Test order not found', data: null };
      }
      return {
        success: true,
        message: `Specimen ${updated.sampleId} received and registered at lab desk`,
        data: updated,
      };
    }

    // 3. Reject sample (pre-analytical failure)
    if (cleanUrl.includes('/reject') && (method === 'PATCH' || method === 'POST')) {
      const parts = cleanUrl.split('/');
      const ordIndex = parts.findIndex((p) => p === 'orders');
      const orderId = ordIndex !== -1 ? parts[ordIndex + 1] : '';
      const body = (data || {}) as { reason: string; notes?: string; technicianName?: string };
      const updated = mockState.rejectSample(orderId, body.reason, body.notes, body.technicianName);
      if (!updated) {
        return { success: false, message: 'Test order not found', data: null };
      }
      return {
        success: true,
        message: `Specimen rejected: ${body.reason}. Re-collection request flagged.`,
        data: updated,
      };
    }

    // 4. Start processing / load analyzer
    if (cleanUrl.includes('/process') && (method === 'PATCH' || method === 'POST')) {
      const parts = cleanUrl.split('/');
      const ordIndex = parts.findIndex((p) => p === 'orders');
      const orderId = ordIndex !== -1 ? parts[ordIndex + 1] : '';
      const body = (data || {}) as { technicianName?: string };
      const updated = mockState.startProcessing(orderId, body.technicianName);
      if (!updated) {
        return { success: false, message: 'Test order not found', data: null };
      }
      return {
        success: true,
        message: `Specimen loaded on analyzer for ${updated.testName}`,
        data: updated,
      };
    }

    // 5. Submit result
    if (cleanUrl.includes('/result') && (method === 'PATCH' || method === 'POST')) {
      const parts = cleanUrl.split('/');
      const ordIndex = parts.findIndex((p) => p === 'orders');
      const orderId = ordIndex !== -1 ? parts[ordIndex + 1] : '';
      const body = (data || {}) as {
        parameters: any[];
        resultSummary?: string;
        technicianName?: string;
      };
      const updated = mockState.submitResult(orderId, body.parameters || [], body.resultSummary, body.technicianName);
      if (!updated) {
        return { success: false, message: 'Test order not found', data: null };
      }
      return {
        success: true,
        message: `Test results submitted and verified for ${updated.testName}. Diagnostic report generated.`,
        data: updated,
      };
    }

    // 6. Single order detail
    const singleMatch = cleanUrl.match(/\/diagnostics\/orders\/([a-zA-Z0-9_-]+)$/);
    if (singleMatch && method === 'GET') {
      const orderId = singleMatch[1];
      const ord = mockState.getDiagnosticOrderById(orderId);
      if (!ord) {
        return { success: false, message: 'Diagnostic order not found', data: null };
      }
      return {
        success: true,
        message: 'Diagnostic order retrieved',
        data: ord,
      };
    }

    // 7. Filtered orders list
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const status = queryParams.get('status') || undefined;
    const category = queryParams.get('category') || undefined;
    const priority = queryParams.get('priority') || undefined;
    const search = queryParams.get('search') || undefined;

    const list = mockState.getDiagnosticOrders({ status, category, priority, search });
    return {
      success: true,
      message: `Found ${list.length} diagnostic orders`,
      data: list,
    };
  }

  // 5. REFERRALS & CLOSED-LOOP TRANSFER COORDINATION
  if ((cleanUrl === '/referrals' || cleanUrl === '/api/v1/referrals' || cleanUrl.endsWith('/referrals')) && method === 'GET') {
    const queryString = url.includes('?') ? url.split('?')[1] : '';
    const queryParams = new URLSearchParams(queryString);
    const facilityId = queryParams.get('facilityId') || (data as any)?.facilityId;
    const toFacilityId = queryParams.get('toFacilityId') || (data as any)?.toFacilityId;
    const fromFacilityId = queryParams.get('fromFacilityId') || (data as any)?.fromFacilityId;
    const fromDoctorId = queryParams.get('fromDoctorId') || (data as any)?.fromDoctorId;
    const patientId = queryParams.get('patientId') || (data as any)?.patientId;
    const status = queryParams.get('status') || (data as any)?.status;
    const priority = queryParams.get('priority') || (data as any)?.priority;

    const list = mockState.getReferrals({
      facilityId: facilityId || undefined,
      toFacilityId: toFacilityId || undefined,
      fromFacilityId: fromFacilityId || undefined,
      fromDoctorId: fromDoctorId || undefined,
      patientId: patientId || undefined,
      status: status || undefined,
      priority: priority || undefined,
    });

    return {
      success: true,
      message: 'Referrals retrieved',
      data: list,
      meta: { page: 1, limit: 50, total: list.length },
    };
  }

  if ((cleanUrl === '/referrals' || cleanUrl === '/api/v1/referrals' || cleanUrl.endsWith('/referrals')) && method === 'POST') {
    let currentUser: User | null = null;
    try {
      const savedUser = localStorage.getItem('healthconnect_user') || localStorage.getItem('sanjeevani_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    const reqData = data as CreateReferralRequest;
    const created = mockState.createReferral(reqData, {
      name: reqData.fromDoctorName || currentUser?.name || 'Dr. Neha Vaghela',
      role: currentUser?.designation || 'Medical Officer',
      facilityId: reqData.fromFacilityId || currentUser?.facilityId,
      facilityName: reqData.fromFacilityName || currentUser?.facilityName,
      doctorId: reqData.fromDoctorId || currentUser?.id,
    });

    return {
      success: true,
      message: `Referral ${created.referralCode} dispatched successfully`,
      data: created,
    };
  }

  // Specific Action Routes (Check before generic ID match)
  const reviewMatch = cleanUrl.match(/\/referrals\/([^/]+)\/review$/);
  if (reviewMatch && method === 'POST') {
    const id = reviewMatch[1];
    let currentUser: User | null = null;
    try {
      const savedUser = localStorage.getItem('healthconnect_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    const updated = mockState.reviewReferral(id, {
      name: currentUser?.name || 'Vikram Joshi',
      role: 'Facility Operations Lead',
      facilityName: currentUser?.facilityName || 'Gandhinagar Civil Hospital',
    });
    if (updated) {
      return { success: true, message: `Referral ${updated.referralCode} is now under review`, data: updated };
    }
    return { success: false, message: 'Referral not found', data: null as any };
  }

  const acceptMatch = cleanUrl.match(/\/referrals\/([^/]+)\/accept$/);
  if (acceptMatch && method === 'POST') {
    const id = acceptMatch[1];
    const { appointmentSlot, appointmentId } = (data || {}) as { appointmentSlot?: string; appointmentId?: string };
    let currentUser: User | null = null;
    try {
      const savedUser = localStorage.getItem('healthconnect_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    const updated = mockState.acceptReferral(id, appointmentSlot, appointmentId, {
      name: currentUser?.name || 'Vikram Joshi (Operations Lead)',
      role: 'Facility Operations Lead',
      facilityName: currentUser?.facilityName || 'Gandhinagar Civil Hospital',
    });
    if (updated) {
      return { success: true, message: `Referral ${updated.referralCode} accepted and scheduled`, data: updated };
    }
    return { success: false, message: 'Referral not found', data: null as any };
  }

  const rejectMatch = cleanUrl.match(/\/referrals\/([^/]+)\/reject$/);
  if (rejectMatch && method === 'POST') {
    const id = rejectMatch[1];
    const { reason } = (data || {}) as { reason: string };
    let currentUser: User | null = null;
    try {
      const savedUser = localStorage.getItem('healthconnect_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    const updated = mockState.rejectReferral(id, reason || 'Specialist / Bed Capacity Unavailable', {
      name: currentUser?.name || 'Vikram Joshi (Operations Lead)',
      role: 'Facility Operations',
      facilityName: currentUser?.facilityName || 'Gandhinagar Civil Hospital',
    });
    if (updated) {
      return { success: true, message: `Referral ${updated.referralCode} diverted with recorded reason`, data: updated };
    }
    return { success: false, message: 'Referral not found', data: null as any };
  }

  const clarReqMatch = cleanUrl.match(/\/referrals\/([^/]+)\/clarification-request$/);
  if (clarReqMatch && method === 'POST') {
    const id = clarReqMatch[1];
    const { message } = (data || {}) as { message: string };
    let currentUser: User | null = null;
    try {
      const savedUser = localStorage.getItem('healthconnect_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    const updated = mockState.requestClarification(id, message, {
      name: currentUser?.name || 'Vikram Joshi (Operations Lead)',
      role: 'Facility Operations',
      facilityName: currentUser?.facilityName || 'Gandhinagar Civil Hospital',
    });
    if (updated) {
      return { success: true, message: 'Clarification query dispatched to referring doctor', data: updated };
    }
    return { success: false, message: 'Referral not found', data: null as any };
  }

  const clarResMatch = cleanUrl.match(/\/referrals\/([^/]+)\/clarification-response$/);
  if (clarResMatch && method === 'POST') {
    const id = clarResMatch[1];
    const { message } = (data || {}) as { message: string };
    let currentUser: User | null = null;
    try {
      const savedUser = localStorage.getItem('healthconnect_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    const updated = mockState.provideClarification(id, message, {
      name: currentUser?.name || 'Dr. Neha Vaghela',
      role: 'Referring Doctor',
    });
    if (updated) {
      return { success: true, message: 'Clarification response submitted to receiving facility', data: updated };
    }
    return { success: false, message: 'Referral not found', data: null as any };
  }

  const arrivalMatch = cleanUrl.match(/\/referrals\/([^/]+)\/confirm-arrival$/);
  if (arrivalMatch && method === 'POST') {
    const id = arrivalMatch[1];
    let currentUser: User | null = null;
    try {
      const savedUser = localStorage.getItem('healthconnect_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    const updated = mockState.confirmArrival(id, {
      name: currentUser?.name || 'Casualty Desk',
      role: 'Registration Clerk',
      facilityName: currentUser?.facilityName || 'Gandhinagar Civil Hospital',
    });
    if (updated) {
      return { success: true, message: `Arrival confirmed for referral ${updated.referralCode}`, data: updated };
    }
    return { success: false, message: 'Referral not found', data: null as any };
  }

  const outcomeMatch = cleanUrl.match(/\/referrals\/([^/]+)\/outcome$/);
  if (outcomeMatch && method === 'POST') {
    const id = outcomeMatch[1];
    const { outcomeNotes } = (data || {}) as { outcomeNotes: string };
    let currentUser: User | null = null;
    try {
      const savedUser = localStorage.getItem('healthconnect_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    const updated = mockState.recordReferralOutcome(id, outcomeNotes || 'Consultation concluded.', {
      name: currentUser?.name || 'Dr. Arvind Patel',
      role: 'Attending Specialist',
      facilityName: currentUser?.facilityName || 'Gandhinagar Civil Hospital',
    });
    if (updated) {
      return { success: true, message: `Consultation outcome recorded for referral ${updated.referralCode}`, data: updated };
    }
    return { success: false, message: 'Referral not found', data: null as any };
  }

  const closeMatch = cleanUrl.match(/\/referrals\/([^/]+)\/close$/);
  if (closeMatch && method === 'POST') {
    const id = closeMatch[1];
    const updated = mockState.closeReferral(id);
    if (updated) {
      return { success: true, message: `Referral ${updated.referralCode} closed`, data: updated };
    }
    return { success: false, message: 'Referral not found', data: null as any };
  }

  // Generic single referral match: GET /referrals/:id
  const singleRefMatch = cleanUrl.match(/\/referrals\/([^/]+)$/);
  if (singleRefMatch && method === 'GET') {
    const id = singleRefMatch[1];
    const ref = mockState.getReferralById(id);
    if (ref) {
      return {
        success: true,
        message: 'Referral details retrieved',
        data: ref,
      };
    }
    return {
      success: false,
      message: `Referral with ID ${id} not found`,
      data: null as any,
    };
  }

  // Notifications endpoint
  if ((cleanUrl === '/notifications' || cleanUrl.endsWith('/notifications')) && method === 'GET') {
    return {
      success: true,
      message: 'Notifications retrieved',
      data: mockState.notifications,
    };
  }

  // 6. RESOURCES (Beds, Blood, Ambulances, Medicines, Equipment)
  if (cleanUrl.includes('/bed-summary') || cleanUrl.includes('/beds')) {
    if (method === 'PATCH') {
      const { category, available } = (data || {}) as { category: string; available: number };
      const updated = mockState.updateBedStatus('fac_civil_01', category, available);
      return {
        success: true,
        message: 'Bed status updated successfully',
        data: updated,
      };
    }
    return {
      success: true,
      message: 'Bed summary retrieved',
      data: mockState.bedSummary,
    };
  }

  if (cleanUrl.includes('/blood')) {
    return {
      success: true,
      message: 'Blood inventory retrieved',
      data: mockState.bloodInventory,
    };
  }

  if (cleanUrl.includes('/ambulances')) {
    return {
      success: true,
      message: 'Ambulance fleet status retrieved',
      data: mockState.ambulances,
    };
  }

  if (cleanUrl.includes('/medicines') || cleanUrl.includes('/medicine-inventory')) {
    if (method === 'POST') {
      const newMed = mockState.addMedicine((data || {}) as any);
      return {
        success: true,
        message: 'Medicine added successfully to pharmacy formulary',
        data: newMed,
      };
    }

    if (method === 'DELETE') {
      const parts = cleanUrl.split('/');
      const medIndex = parts.findIndex((p) => p === 'medicines');
      const medId = medIndex !== -1 ? parts[medIndex + 1] : parts[parts.length - 1];
      const deleted = mockState.deleteMedicine(medId);
      return {
        success: deleted,
        message: deleted ? 'Medicine removed from inventory successfully' : 'Medicine not found',
        data: { id: medId },
      };
    }

    if (method === 'PATCH' && cleanUrl.includes('/quarantine')) {
      const parts = cleanUrl.split('/');
      const medIndex = parts.findIndex((p) => p === 'medicines');
      const medId = medIndex !== -1 ? parts[medIndex + 1] : parts[parts.length - 2];
      const body = (data || {}) as { reason?: string };
      const updated = mockState.quarantineBatch(medId, body.reason || 'Batch quarantined by Pharmacist');
      return {
        success: true,
        message: 'Medicine batch quarantined successfully',
        data: updated,
      };
    }

    if (method === 'PATCH' && (cleanUrl.includes('/stock') || cleanUrl.includes('/adjust'))) {
      const parts = cleanUrl.split('/');
      const medIndex = parts.findIndex((p) => p === 'medicines');
      const medId = medIndex !== -1 ? parts[medIndex + 1] : parts[parts.length - 2];
      const body = (data || {}) as { delta?: number; reason?: string };
      const updated = mockState.adjustMedicineStock(medId, body.delta || 0, body.reason || 'Inventory reconciliation');
      return {
        success: true,
        message: 'Medicine stock level adjusted successfully',
        data: updated,
      };
    }

    const medSingleMatch = cleanUrl.match(/\/medicines\/([a-zA-Z0-9_-]+)$/);
    if (medSingleMatch && method === 'GET') {
      const targetMed = mockState.medicines.find((m) => m.id === medSingleMatch[1]);
      if (targetMed) {
        return {
          success: true,
          message: 'Medicine details retrieved',
          data: targetMed,
        };
      }
    }

    return {
      success: true,
      message: 'Medicine inventory retrieved',
      data: mockState.medicines,
    };
  }

  if (cleanUrl.includes('/medical-stores')) {
    if (method === 'POST') {
      const payload = (data || {}) as Partial<MedicalStore>;
      const newStore: MedicalStore = {
        id: payload.id || `store_${Date.now()}`,
        name: payload.name || 'Pradhan Mantri Jan Aushadhi Kendra',
        type: payload.type || 'JAN_AUSHADHI',
        isJanAushadhi: payload.type === 'JAN_AUSHADHI' || !!payload.isJanAushadhi,
        hasLiveApi: true,
        licenseNumber: payload.licenseNumber || 'GJ-GNR-PMBJP-0101',
        fullAddress: payload.fullAddress || 'Sector 21 Market, Gandhinagar',
        area: payload.area || 'Sector 21',
        pincode: payload.pincode || '382021',
        district: payload.district || 'Gandhinagar',
        state: payload.state || 'Gujarat',
        phone: payload.phone || '9825012345',
        whatsappPhone: payload.whatsappPhone,
        timings: payload.timings || '8:00 AM - 10:00 PM (All 7 Days)',
        isOpenNow: true,
        rating: 4.8,
        reviewCount: 45,
        discountPercentage: payload.discountPercentage || 75,
        coordinates: {
          lat: payload.coordinates?.lat || 23.2268,
          lng: payload.coordinates?.lng || 72.6515,
        },
        stockCatalog: payload.stockCatalog || [],
      };
      mockState.medicalStores.unshift(newStore);
      return {
        success: true,
        message: 'Medical store created successfully',
        data: newStore,
      };
    }

    const storeSingleMatch = cleanUrl.match(/\/medical-stores\/([a-zA-Z0-9_-]+)$/);
    if (storeSingleMatch) {
      const storeId = storeSingleMatch[1];
      if (method === 'DELETE') {
        mockState.medicalStores = mockState.medicalStores.filter((s) => s.id !== storeId);
        return {
          success: true,
          message: 'Medical store deleted successfully',
          data: { id: storeId },
        };
      }
      if (method === 'PUT') {
        const storeIdx = mockState.medicalStores.findIndex((s) => s.id === storeId);
        if (storeIdx !== -1) {
          mockState.medicalStores[storeIdx] = { ...mockState.medicalStores[storeIdx], ...(data as Partial<MedicalStore>) };
          return {
            success: true,
            message: 'Medical store updated successfully',
            data: mockState.medicalStores[storeIdx],
          };
        }
      }
      const store = mockState.medicalStores.find((s) => s.id === storeId);
      return {
        success: !!store,
        message: store ? 'Medical store retrieved' : 'Medical store not found',
        data: store || null,
      };
    }

    return {
      success: true,
      message: 'Medical stores retrieved successfully',
      data: mockState.medicalStores,
    };
  }

  if (cleanUrl.includes('/equipment')) {
    return {
      success: true,
      message: 'Medical equipment inventory retrieved',
      data: mockState.equipment,
    };
  }

  // 7. ASHA WORKFLOWS
  if (cleanUrl.includes('/asha/patients')) {
    if (method === 'POST') {
      const newPatient: AshaPatient = {
        ...((data || {}) as AshaPatient),
        id: `asha_p_${Date.now()}`,
        ashaId: 'usr_asha_01',
        ashaName: 'Sunita Devi',
        createdAt: new Date().toISOString(),
      };
      mockState.ashaPatients.unshift(newPatient);
      return {
        success: true,
        message: 'Citizen registered successfully by ASHA worker',
        data: newPatient,
      };
    }
    return {
      success: true,
      message: 'ASHA assigned patients retrieved',
      data: mockState.ashaPatients,
    };
  }

  if (cleanUrl.includes('/asha/visits')) {
    if (method === 'POST') {
      const newVisit: AshaVisit = {
        ...((data || {}) as AshaVisit),
        id: `vis_${Date.now()}`,
        isCompleted: false,
        status: 'SCHEDULED',
      };
      mockState.ashaVisits.unshift(newVisit);
      return {
        success: true,
        message: 'Home field visit scheduled successfully',
        data: newVisit,
      };
    }
    if (method === 'PATCH' || method === 'PUT') {
      const updateData = (data || {}) as Partial<AshaVisit> & { id: string };
      const visitIndex = mockState.ashaVisits.findIndex((v) => v.id === updateData.id);
      if (visitIndex >= 0) {
        mockState.ashaVisits[visitIndex] = {
          ...mockState.ashaVisits[visitIndex],
          ...updateData,
          completedAt: updateData.isCompleted ? new Date().toISOString() : mockState.ashaVisits[visitIndex].completedAt,
        };
        return {
          success: true,
          message: 'Home visit record updated',
          data: mockState.ashaVisits[visitIndex],
        };
      }
    }
    return {
      success: true,
      message: 'ASHA field visits retrieved',
      data: mockState.ashaVisits,
    };
  }

  if (cleanUrl.includes('/asha/tasks') || cleanUrl.includes('/asha/follow-ups')) {
    if (method === 'PATCH' || method === 'PUT') {
      const updateData = (data || {}) as { id: string; isCompleted: boolean };
      const taskIndex = mockState.ashaTasks.findIndex((t) => t.id === updateData.id);
      if (taskIndex >= 0) {
        mockState.ashaTasks[taskIndex].isCompleted = updateData.isCompleted;
        mockState.ashaTasks[taskIndex].completedAt = updateData.isCompleted ? new Date().toISOString() : undefined;
        return {
          success: true,
          message: 'Follow-up task updated',
          data: mockState.ashaTasks[taskIndex],
        };
      }
    }
    return {
      success: true,
      message: 'Frontline follow-up tasks retrieved',
      data: mockState.ashaTasks,
    };
  }

  if (cleanUrl.includes('/asha/referrals')) {
    if (method === 'POST') {
      const newRef: FrontlineReferral = {
        ...((data || {}) as FrontlineReferral),
        id: `ref_fl_${Date.now()}`,
        referralNumber: `REF-PET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        status: 'INITIATED',
        createdAt: new Date().toISOString(),
      };
      mockState.frontlineReferrals.unshift(newRef);
      return {
        success: true,
        message: 'Frontline referral dispatched to health facility',
        data: newRef,
      };
    }
    return {
      success: true,
      message: 'Frontline referrals retrieved',
      data: mockState.frontlineReferrals,
    };
  }

  if (cleanUrl.includes('/asha/screenings') && method === 'POST') {
    const session = data as ScreeningSession;
    mockState.screenings.push(session);
    return {
      success: true,
      message: 'Community screening logged and risk profile generated',
      data: session,
    };
  }

  if (cleanUrl.includes('/sync/push') && method === 'POST') {
    return {
      success: true,
      message: 'All local offline records successfully synchronized with central government repository',
      data: { syncedCount: 5, serverTimestamp: new Date().toISOString() },
    };
  }

  // 8. AI & DISTRICT DEMAND INTELLIGENCE
  if (cleanUrl.includes('/district/intelligence/summary')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    const timeRange = (queryParams.get('timeRange') as any) || 'TODAY';
    return {
      success: true,
      message: 'District health resource intelligence summary retrieved',
      data: IntelligenceService.getDistrictSummary(district, timeRange),
    };
  }

  if (cleanUrl.includes('/district/intelligence/areas')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Area & village healthcare intelligence profiles retrieved',
      data: IntelligenceService.getAreaProfiles(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/facilities')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Facility capacity & service gap profiles retrieved',
      data: IntelligenceService.getFacilityGapProfiles(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/specialist-gaps')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Specialist shortage intelligence retrieved',
      data: IntelligenceService.getSpecialistGaps(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/equipment-gaps')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Equipment gap intelligence retrieved',
      data: IntelligenceService.getEquipmentGaps(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/medicine-shortages')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Medicine shortage intelligence retrieved',
      data: IntelligenceService.getMedicineShortages(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/diagnostic-gaps')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Diagnostic service gap intelligence retrieved',
      data: IntelligenceService.getDiagnosticGaps(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/recommendations')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Evidence-backed capacity planning recommendations retrieved',
      data: IntelligenceService.getRecommendations(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/unused-resources')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Unused & underutilized resources retrieved',
      data: IntelligenceService.getUnusedResources(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/doctor-requirements')) {
    const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const district = queryParams.get('district') || 'Gandhinagar';
    return {
      success: true,
      message: 'Hospital-wise doctor requirements retrieved',
      data: IntelligenceService.getHospitalDoctorRequirements(district),
    };
  }

  if (cleanUrl.includes('/district/intelligence/query') && method === 'POST') {
    const body = (data || {}) as { query?: string; district?: string };
    const answer = IntelligenceService.queryDistrictIntelligence(body.query || '', body.district || 'Gandhinagar');
    return {
      success: true,
      message: 'Grounded intelligence query executed successfully',
      data: answer,
    };
  }

  if (cleanUrl.includes('/ai/dashboard') || cleanUrl.includes('/disease-trends') || cleanUrl.includes('/outbreak-alerts')) {
    return {
      success: true,
      message: 'AI demand intelligence retrieved',
      data: mockState.aiSummary,
    };
  }

  // 9. SUPER ADMIN & SYSTEM
  if (cleanUrl.includes('/super-admin/system-health') || cleanUrl.includes('/health')) {
    return {
      success: true,
      message: 'Realtime system services status retrieved',
      data: mockState.systemHealth,
    };
  }

  if (cleanUrl.includes('/super-admin/users')) {
    return {
      success: true,
      message: 'User registry retrieved',
      data: Object.values(mockState.users),
    };
  }

  if (cleanUrl.includes('/super-admin/roles')) {
    return {
      success: true,
      message: 'Role-permission matrix retrieved',
      data: mockState.permissions,
    };
  }

  if (cleanUrl.includes('/super-admin/ai-models')) {
    return {
      success: true,
      message: 'AI Model registry retrieved',
      data: mockState.aiModels,
    };
  }

  if (cleanUrl.includes('/super-admin/audit')) {
    return {
      success: true,
      message: 'Audit logs retrieved',
      data: mockState.auditLogs,
    };
  }

  // Fallback for unhandled endpoints
  return {
    success: true,
    message: 'Request fulfilled',
    data: {},
  };
}
