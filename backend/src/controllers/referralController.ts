import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReferralModel, IReferral } from '../models/Referral';
import { NotificationModel } from '../models/Admin';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export async function getReferrals(req: Request, res: Response): Promise<void> {
  const params = { ...req.query, ...req.body };
  const {
    facilityId,
    toFacilityId,
    fromFacilityId,
    fromDoctorId,
    patientId,
    status,
    priority,
    page = 1,
    limit = 50,
  } = params;

  const andConditions: any[] = [];

  if (facilityId) {
    andConditions.push({ $or: [{ toFacilityId: facilityId }, { fromFacilityId: facilityId }] });
  }
  if (toFacilityId) andConditions.push({ toFacilityId });
  if (fromFacilityId) andConditions.push({ fromFacilityId });
  if (fromDoctorId) andConditions.push({ fromDoctorId });
  if (patientId) {
    andConditions.push({
      $or: [
        { patientId },
        { patientPhone: patientId },
      ],
    });
  }
  if (status) andConditions.push({ status });
  if (priority) andConditions.push({ priority });

  const filter = andConditions.length > 0 ? { $and: andConditions } : {};

  const referrals = await ReferralModel.find(filter).sort({ createdAt: -1 });

  sendSuccess(res, 'Referrals retrieved', referrals.map((r) => r.toJSON()), 200, {
    page: Number(page),
    limit: Number(limit),
    total: referrals.length,
  });
}

export async function getReferralById(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const isMongoId = mongoose.Types.ObjectId.isValid(id);
  const ref = await ReferralModel.findOne(
    isMongoId ? { $or: [{ id }, { referralCode: id }, { _id: id }] } : { $or: [{ id }, { referralCode: id }] }
  );

  if (!ref) {
    sendError(res, `Referral with ID ${id} not found`, 404);
    return;
  }

  sendSuccess(res, 'Referral details retrieved', ref.toJSON());
}

export async function createReferral(req: AuthRequest, res: Response): Promise<void> {
  try {
    const reqData = req.body;
    const id = reqData.id || `ref_${Date.now()}`;
    const referralCode =
      reqData.referralCode || `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const toSpecialty = reqData.toSpecialty || reqData.specialty || 'General Medicine';
    const reasonForReferral = reqData.reasonForReferral || reqData.reason || 'Specialist Consultation';
    const clinicalSummary = reqData.clinicalSummary || reqData.summary || 'Referred for specialist evaluation';

    const created = new ReferralModel({
      ...reqData,
      id,
      referralCode,
      toSpecialty,
      reasonForReferral,
      clinicalSummary,
      fromDoctorId: reqData.fromDoctorId || req.user?.id || 'doc_01',
      fromDoctorName: reqData.fromDoctorName || req.user?.name || 'Dr. Arvind Patel',
      fromFacilityId: reqData.fromFacilityId || req.user?.facilityId || 'fac_pet_04',
      fromFacilityName: reqData.fromFacilityName || req.user?.facilityName || 'Pethapur Primary Health Centre',
      status: 'CREATED',
      slaDeadline: reqData.slaDeadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      slaBreached: false,
      events: [
        {
          id: `ev_${Date.now()}`,
          status: 'CREATED',
          timestamp: new Date().toISOString(),
          actorName: req.user?.name || 'Referring Medical Officer',
          actorRole: req.user?.role || 'DOCTOR',
          facilityName: reqData.fromFacilityName || 'Pethapur PHC',
          notes: reasonForReferral || 'Initial electronic referral created',
        },
      ],
    });

    await created.save();

    // Create notification for receiving facility
    const notif = new NotificationModel({
      id: `notif_${Date.now()}`,
      title: `New Referral: ${referralCode}`,
      message: `Patient ${created.patientName} referred for ${created.toSpecialty} (${created.priority})`,
      type: created.priority === 'EMERGENCY' ? 'CRITICAL' : 'INFO',
      link: `/doctor/referrals`,
    });
    await notif.save();

    sendSuccess(res, `Referral ${created.referralCode} dispatched successfully`, created.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create referral', 400);
  }
}

export async function markUnderReview(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const ref = await ReferralModel.findOne({ id });

  if (!ref) {
    sendError(res, 'Referral not found', 404);
    return;
  }

  ref.status = 'UNDER_REVIEW';
  ref.events.push({
    id: `ev_${Date.now()}`,
    status: 'UNDER_REVIEW',
    timestamp: new Date().toISOString(),
    actorName: req.user?.name || 'Vikram Joshi (Operations Lead)',
    actorRole: 'Facility Operations Lead',
    facilityName: ref.toFacilityName,
    notes: 'Referral package opened and clinical triage initiated.',
  });
  await ref.save();

  sendSuccess(res, `Referral ${ref.referralCode} is now under review`, ref.toJSON());
}

export async function acceptReferral(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { appointmentSlot, appointmentId } = req.body;

  const ref = await ReferralModel.findOne({ id });
  if (!ref) {
    sendError(res, 'Referral not found', 404);
    return;
  }

  ref.status = 'ACCEPTED';
  if (appointmentSlot) ref.appointmentSlot = appointmentSlot;
  if (appointmentId) ref.appointmentId = appointmentId;

  ref.events.push({
    id: `ev_${Date.now()}`,
    status: 'ACCEPTED',
    timestamp: new Date().toISOString(),
    actorName: req.user?.name || 'Vikram Joshi (Operations Lead)',
    actorRole: 'Facility Operations Lead',
    facilityName: ref.toFacilityName,
    notes: `Referral accepted. Slot booked: ${appointmentSlot || 'Next available OPD slot'}.`,
  });
  await ref.save();

  sendSuccess(res, `Referral ${ref.referralCode} accepted and scheduled`, ref.toJSON());
}

export async function rejectReferral(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { reason } = req.body;

  const ref = await ReferralModel.findOne({ id });
  if (!ref) {
    sendError(res, 'Referral not found', 404);
    return;
  }

  ref.status = 'REJECTED';
  ref.rejectionReason = reason || 'Specialist / Bed Capacity Unavailable';
  ref.events.push({
    id: `ev_${Date.now()}`,
    status: 'REJECTED',
    timestamp: new Date().toISOString(),
    actorName: req.user?.name || 'Vikram Joshi (Operations Lead)',
    actorRole: 'Facility Operations Lead',
    facilityName: ref.toFacilityName,
    notes: `Referral rejected/diverted: ${ref.rejectionReason}`,
  });
  await ref.save();

  sendSuccess(res, `Referral ${ref.referralCode} diverted with recorded reason`, ref.toJSON());
}

export async function requestClarification(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { message } = req.body;

  const ref = await ReferralModel.findOne({ id });
  if (!ref) {
    sendError(res, 'Referral not found', 404);
    return;
  }

  ref.status = 'CLARIFICATION_REQUIRED';
  ref.clarificationRequest = {
    requestedBy: req.user?.name || 'Operations Lead',
    role: 'Facility Operations',
    facilityName: ref.toFacilityName,
    requestedAt: new Date().toISOString(),
    message: message || 'Please attach latest ECG and CBC report.',
  };
  ref.events.push({
    id: `ev_${Date.now()}`,
    status: 'CLARIFICATION_REQUIRED',
    timestamp: new Date().toISOString(),
    actorName: req.user?.name || 'Operations Lead',
    actorRole: 'Facility Operations',
    facilityName: ref.toFacilityName,
    notes: message,
  });
  await ref.save();

  sendSuccess(res, 'Clarification query dispatched to referring doctor', ref.toJSON());
}

export async function respondClarification(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { message } = req.body;

  const ref = await ReferralModel.findOne({ id });
  if (!ref) {
    sendError(res, 'Referral not found', 404);
    return;
  }

  ref.status = 'CLARIFICATION_RECEIVED';
  ref.clarificationResponse = {
    respondedBy: req.user?.name || 'Referring Doctor',
    role: 'Referring Doctor',
    respondedAt: new Date().toISOString(),
    message: message || 'ECG uploaded. Vitals stable.',
  };
  ref.events.push({
    id: `ev_${Date.now()}`,
    status: 'CLARIFICATION_RECEIVED',
    timestamp: new Date().toISOString(),
    actorName: req.user?.name || 'Referring Doctor',
    actorRole: 'Doctor',
    facilityName: ref.fromFacilityName,
    notes: message,
  });
  await ref.save();

  sendSuccess(res, 'Clarification response submitted to receiving facility', ref.toJSON());
}

export async function confirmArrival(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const ref = await ReferralModel.findOne({ id });
  if (!ref) {
    sendError(res, 'Referral not found', 404);
    return;
  }

  ref.status = 'PATIENT_ARRIVED';
  ref.events.push({
    id: `ev_${Date.now()}`,
    status: 'PATIENT_ARRIVED',
    timestamp: new Date().toISOString(),
    actorName: req.user?.name || 'Casualty Desk',
    actorRole: 'Registration Clerk',
    facilityName: ref.toFacilityName,
    notes: 'Patient arrived and confirmed at facility gate.',
  });
  await ref.save();

  sendSuccess(res, `Arrival confirmed for referral ${ref.referralCode}`, ref.toJSON());
}

export async function recordOutcome(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { outcomeNotes, consultedDoctorName, consultedDoctorSpecialty } = req.body;

  const ref = await ReferralModel.findOne({ id });
  if (!ref) {
    sendError(res, 'Referral not found', 404);
    return;
  }

  ref.status = 'OUTCOME_RECORDED';
  ref.clinicalOutcomeNotes = outcomeNotes || 'Specialist consultation concluded successfully.';
  if (consultedDoctorName) ref.consultedDoctorName = consultedDoctorName;
  if (consultedDoctorSpecialty) ref.consultedDoctorSpecialty = consultedDoctorSpecialty;

  ref.events.push({
    id: `ev_${Date.now()}`,
    status: 'OUTCOME_RECORDED',
    timestamp: new Date().toISOString(),
    actorName: consultedDoctorName || req.user?.name || 'Attending Specialist',
    actorRole: 'Attending Specialist',
    facilityName: ref.toFacilityName,
    notes: ref.clinicalOutcomeNotes,
  });
  await ref.save();

  sendSuccess(res, `Consultation outcome recorded for referral ${ref.referralCode}`, ref.toJSON());
}

export async function closeReferral(_req: AuthRequest, res: Response): Promise<void> {
  const { id } = _req.params;

  const ref = await ReferralModel.findOne({ id });
  if (!ref) {
    sendError(res, 'Referral not found', 404);
    return;
  }

  ref.status = 'CLOSED';
  ref.events.push({
    id: `ev_${Date.now()}`,
    status: 'CLOSED',
    timestamp: new Date().toISOString(),
    actorName: 'System Coordinator',
    actorRole: 'System',
    facilityName: ref.toFacilityName,
    notes: 'Closed loop referral cycle marked complete.',
  });
  await ref.save();

  sendSuccess(res, `Referral ${ref.referralCode} closed`, ref.toJSON());
}

export async function getNotifications(_req: Request, res: Response): Promise<void> {
  const notifications = await NotificationModel.find().sort({ createdAt: -1 });
  sendSuccess(res, 'Notifications retrieved', notifications.map((n) => n.toJSON()));
}
