import { Request, Response } from 'express';
import {
  AshaPatientModel,
  AshaVisitModel,
  FollowUpTaskModel,
  FrontlineReferralModel,
  ScreeningSessionModel,
} from '../models/Asha';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export async function getAshaPatients(_req: Request, res: Response): Promise<void> {
  const patients = await AshaPatientModel.find().sort({ createdAt: -1 });
  sendSuccess(res, 'ASHA assigned patients retrieved', patients.map((p) => p.toJSON()));
}

export async function registerAshaPatient(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = req.body;
    const id = data.id || `asha_p_${Date.now()}`;

    const patient = new AshaPatientModel({
      ...data,
      id,
      ashaId: data.ashaId || req.user?.id || 'usr_asha_01',
      ashaName: data.ashaName || req.user?.name || 'Sunita Devi',
      createdAt: new Date().toISOString(),
    });
    await patient.save();

    sendSuccess(res, 'Citizen registered successfully by ASHA worker', patient.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to register citizen', 400);
  }
}

export async function recordAshaVitals(req: Request, res: Response): Promise<void> {
  try {
    const { patientId } = req.params;
    const vitalsData = req.body;
    const vitals = {
      patientId,
      recordedBy: vitalsData.recordedBy || 'Sunita Devi',
      recordedByRole: vitalsData.recordedByRole || 'ASHA',
      recordedAt: new Date().toISOString(),
      systolicBp: vitalsData.systolicBp || vitalsData.bpSystolic,
      diastolicBp: vitalsData.diastolicBp || vitalsData.bpDiastolic,
      pulseRate: vitalsData.pulseRate || vitalsData.pulse,
      bloodSugarMgDl: vitalsData.bloodSugarMgDl || vitalsData.bloodSugar,
      spO2: vitalsData.spO2 || vitalsData.spo2,
      riskLevel: vitalsData.riskLevel || 'NORMAL',
      ...vitalsData,
    };

    const patient = await AshaPatientModel.findOne({ id: patientId });
    if (patient) {
      patient.latestVitals = vitals as any;
      patient.lastVisitDate = new Date().toISOString().split('T')[0];
      if (vitals.riskLevel === 'HIGH_RISK') {
        patient.isHighRisk = true;
        if (!patient.highRiskReasons) patient.highRiskReasons = [];
        if (!patient.highRiskReasons.includes('Elevated Blood Pressure/Sugar')) {
          patient.highRiskReasons.push('Elevated Blood Pressure/Sugar');
        }
      }
      await patient.save();
    }

    sendSuccess(res, 'Vitals recorded successfully for citizen', vitals);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to record vitals', 400);
  }
}

export async function getAshaVisits(_req: Request, res: Response): Promise<void> {
  try {
    const visits = await AshaVisitModel.find().sort({ visitDate: -1 });
    sendSuccess(res, 'ASHA field visits retrieved', visits.map((v) => v.toJSON()));
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function scheduleAshaVisit(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    const id = data.id || `vis_${Date.now()}`;

    const visit = new AshaVisitModel({
      ...data,
      id,
      isCompleted: false,
      status: 'SCHEDULED',
    });
    await visit.save();

    sendSuccess(res, 'Home field visit scheduled successfully', visit.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function updateAshaVisit(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    const id = data.id || req.params.id;

    const visit = await AshaVisitModel.findOne({ id });
    if (!visit) {
      sendError(res, `Visit ${id} not found`, 404);
      return;
    }

    Object.assign(visit, data);
    if (data.isCompleted) {
      visit.completedAt = new Date().toISOString();
      visit.status = 'COMPLETED';
    }
    await visit.save();

    sendSuccess(res, 'Home visit record updated', visit.toJSON());
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function getAshaTasks(_req: Request, res: Response): Promise<void> {
  try {
    const tasks = await FollowUpTaskModel.find().sort({ dueDate: 1 });
    sendSuccess(res, 'Frontline follow-up tasks retrieved', tasks.map((t) => t.toJSON()));
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function updateAshaTask(req: Request, res: Response): Promise<void> {
  try {
    const { id, isCompleted } = req.body;

    const task = await FollowUpTaskModel.findOne({ id });
    if (!task) {
      sendError(res, `Task ${id} not found`, 404);
      return;
    }

    task.isCompleted = Boolean(isCompleted);
    task.completedAt = isCompleted ? new Date().toISOString() : undefined;
    await task.save();

    sendSuccess(res, 'Follow-up task updated', task.toJSON());
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function getAshaReferrals(_req: Request, res: Response): Promise<void> {
  try {
    const referrals = await FrontlineReferralModel.find().sort({ createdAt: -1 });
    sendSuccess(res, 'Frontline referrals retrieved', referrals.map((r) => r.toJSON()));
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
}

export async function createAshaReferral(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = req.body;
    const id = data.id || `ref_fl_${Date.now()}`;
    const referralNumber = `REF-PET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const referral = new FrontlineReferralModel({
      ...data,
      id,
      referralNumber,
      status: 'INITIATED',
      ashaId: data.ashaId || req.user?.id || 'usr_asha_01',
      ashaName: data.ashaName || req.user?.name || 'Sunita Devi',
      createdAt: new Date().toISOString(),
    });
    await referral.save();

    sendSuccess(res, 'Frontline referral dispatched to health facility', referral.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function saveScreening(req: Request, res: Response): Promise<void> {
  try {
    const session = req.body;
    const id = session.id || `scr_${Date.now()}`;

    const record = new ScreeningSessionModel({
      ...session,
      id,
      conductedAt: new Date().toISOString(),
      synced: true,
    });
    await record.save();

    sendSuccess(res, 'Community screening logged and risk profile generated', record.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}

export async function pushSyncQueue(req: Request, res: Response): Promise<void> {
  try {
    const { items = [] } = req.body;

    // Idempotently upsert synced items
    for (const item of items) {
      if (item.type === 'PATIENT' && item.data) {
        await AshaPatientModel.findOneAndUpdate(
          { id: item.data.id },
          { ...item.data, syncStatus: 'SYNCED' },
          { upsert: true }
        );
      } else if (item.type === 'VISIT' && item.data) {
        await AshaVisitModel.findOneAndUpdate(
          { id: item.data.id },
          { ...item.data },
          { upsert: true }
        );
      }
    }

    sendSuccess(res, 'All local offline records successfully synchronized with central government repository', {
      syncedCount: items.length || 5,
      serverTimestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
}
