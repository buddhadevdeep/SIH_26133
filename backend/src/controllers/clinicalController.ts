import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PatientHealthRecordModel } from '../models/HealthRecord';
import { EncounterModel } from '../models/Encounter';
import { PrescriptionModel } from '../models/Prescription';
import { DiagnosticOrderModel } from '../models/DiagnosticOrder';
import { AppointmentModel, TokenModel } from '../models/Queue';
import { PatientModel } from '../models/Patient';
import { DoctorModel } from '../models/Doctor';
import { FacilityModel } from '../models/Facility';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export async function getPatientHealthRecord(req: Request, res: Response): Promise<void> {
  const caller = (req as any).user;
  const { patientId } = req.params;
  if (!patientId) {
    sendError(res, 'Patient ID is required', 400);
    return;
  }

  // Tenant / Patient-to-Patient Isolation:
  // If caller is authenticated as PATIENT, they may ONLY view their own records!
  if (caller && caller.role === 'PATIENT') {
    const isSelf = caller.id === patientId || caller.phone === patientId;
    if (!isSelf) {
      sendError(res, 'Access denied. Patients may only access their own health records.', 403);
      return;
    }
  }

  // 1. Search existing PatientHealthRecord
  let record = await PatientHealthRecordModel.findOne({
    $or: [
      { patientId },
      { id: patientId },
      { phone: patientId },
      { abhaId: patientId },
    ],
  });

  // 2. If not yet created, check PatientModel or UserModel
  let patientDoc = null;
  if (!record) {
    patientDoc = await PatientModel.findOne({
      $or: [{ id: patientId }, { phone: patientId }, { abhaId: patientId }],
    });

    if (!patientDoc) {
      sendError(res, `Patient health record not found for ID: ${patientId}`, 404);
      return;
    }

    // Initialize an empty record for this real patient
    record = new PatientHealthRecordModel({
      id: `phr_${patientDoc.id}`,
      patientId: patientDoc.id,
      name: patientDoc.name,
      phone: patientDoc.phone,
      age: patientDoc.age,
      gender: patientDoc.gender === 'M' ? 'Male' : patientDoc.gender === 'F' ? 'Female' : 'Other',
      abhaId: patientDoc.abhaId,
      bloodGroup: patientDoc.bloodGroup || 'Not Recorded',
      allergies: [],
      chronicConditions: [],
      timeline: [],
    });
    await record.save();
  }

  const recordObj = record.toJSON();

  // 3. Dynamic sync: Fetch actual prescriptions, encounters, and appointments for this patient
  const targetPatientId = record.patientId;
  const rxList = await PrescriptionModel.find({ patientId: targetPatientId }).sort({ createdAt: -1 });
  const apptList = await AppointmentModel.find({ patientId: targetPatientId }).sort({ createdAt: -1 });
  const diagList = await DiagnosticOrderModel.find({ patientId: targetPatientId }).sort({ createdAt: -1 });
  const encList = await EncounterModel.find({ patientId: targetPatientId }).sort({ startedAt: -1 });

  const timelineItems = [...(recordObj.timeline || [])];

  // Merge real encounters
  encList.forEach((enc) => {
    const encId = enc.id || (enc as any)._id?.toString();
    if (!timelineItems.some((t) => t.id === encId || t.id === `tl_${encId}`)) {
      timelineItems.unshift({
        id: `tl_${encId}`,
        date: (enc.startedAt || new Date().toISOString()).split('T')[0],
        eventType: 'ENCOUNTER',
        title: `Clinical Consultation - ${enc.chiefComplaint}`,
        facilityName: enc.facilityName,
        doctorName: enc.doctorName,
        summary: `Diagnosis: ${(enc.diagnoses || []).map((d) => d.conditionName).join(', ') || 'Under evaluation'}. ${enc.clinicalNotes || ''}`,
      });
    }
  });

  // Merge real prescriptions
  rxList.forEach((rx) => {
    const rxId = rx.id || (rx as any)._id?.toString();
    if (!timelineItems.some((t) => t.id === rxId || t.id === `tl_${rxId}`)) {
      timelineItems.unshift({
        id: `tl_${rxId}`,
        date: (rx.issuedAt || new Date().toISOString()).split('T')[0],
        eventType: 'PRESCRIPTION',
        title: `e-Prescription (${rx.diagnosisSummary || 'Consultation'})`,
        facilityName: rx.facilityName,
        doctorName: rx.doctorName,
        summary: `Diagnosis: ${rx.diagnosisSummary}. Items: ${(rx.items || []).map((i: any) => i.medicineName).join(', ')}`,
      });
    }
  });

  // Merge completed appointments
  apptList
    .filter((a) => a.status === 'COMPLETED')
    .forEach((apt) => {
      const aptId = apt.id || (apt as any)._id?.toString();
      if (!timelineItems.some((t) => t.id === aptId || t.id === `tl_${aptId}`)) {
        timelineItems.unshift({
          id: `tl_${aptId}`,
          date: apt.date || new Date().toISOString().split('T')[0],
          eventType: 'ENCOUNTER',
          title: `Appointment Completed - ${apt.specialty || 'OPD'}`,
          facilityName: apt.facilityName,
          doctorName: apt.doctorName,
          summary: `Reason: ${apt.reasonForVisit}. Status: Completed consultation.`,
        });
      }
    });

  // Merge diagnostic tests
  diagList.forEach((diag) => {
    const diagId = diag.id || (diag as any)._id?.toString();
    if (!timelineItems.some((t) => t.id === diagId || t.id === `tl_${diagId}`)) {
      timelineItems.unshift({
        id: `tl_${diagId}`,
        date: (diag.orderedAt || new Date().toISOString()).split('T')[0],
        eventType: 'LAB_REPORT',
        title: `Diagnostic Investigation: ${diag.testName}`,
        facilityName: diag.facilityName,
        doctorName: diag.orderedBy,
        summary: `Category: ${diag.testCategory}, Priority: ${diag.priority}, Status: ${diag.status}`,
      });
    }
  });

  recordObj.timeline = timelineItems;
  sendSuccess(res, 'Patient health record retrieved', recordObj);
}

export async function getTimeline(req: Request, res: Response): Promise<void> {
  const caller = (req as any).user;
  const { patientId } = req.params;
  if (!patientId) {
    sendError(res, 'Patient ID is required', 400);
    return;
  }

  if (caller && caller.role === 'PATIENT') {
    const isSelf = caller.id === patientId || caller.phone === patientId;
    if (!isSelf) {
      sendError(res, 'Access denied. Patients may only access their own health records.', 403);
      return;
    }
  }

  const record = await PatientHealthRecordModel.findOne({
    $or: [
      { patientId },
      { id: patientId },
      { phone: patientId },
      { abhaId: patientId },
    ],
  });

  if (!record) {
    sendSuccess(res, 'Patient timeline is empty', []);
    return;
  }

  sendSuccess(res, 'Patient timeline retrieved', record.timeline || []);
}

export async function getEncounters(req: Request, res: Response): Promise<void> {
  const { patientId, doctorId, facilityId, type, status } = { ...req.query, ...req.body } as any;
  const filter: any = {};
  if (patientId) filter.patientId = patientId;
  if (doctorId) filter.doctorId = doctorId;
  if (facilityId) filter.facilityId = facilityId;
  if (type) filter.type = type;
  if (status) filter.status = status;

  const encounters = await EncounterModel.find(filter).sort({ startedAt: -1, _id: -1 });
  sendSuccess(res, 'Encounters retrieved successfully', encounters.map((e) => e.toJSON()));
}

export async function getEncounterById(req: Request, res: Response): Promise<void> {
  const encounterId = String(req.params.encounterId);
  const isMongoId = mongoose.Types.ObjectId.isValid(encounterId);
  const encounter = await EncounterModel.findOne(
    isMongoId ? { $or: [{ id: encounterId }, { _id: encounterId }] } : { id: encounterId }
  );

  if (!encounter) {
    sendError(res, `Encounter ${encounterId} not found`, 404);
    return;
  }

  sendSuccess(res, 'Encounter retrieved successfully', encounter.toJSON());
}

export async function createEncounter(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = req.body;
    if (!data.patientId) {
      sendError(res, 'patientId is required to document a clinical encounter', 400);
      return;
    }

    // Resolve patient
    const patient = await PatientModel.findOne({
      $or: [{ id: data.patientId }, { phone: data.patientPhone || data.patientId }],
    });
    const patientId = patient ? patient.id : data.patientId;
    const patientName = patient ? patient.name : data.patientName;

    if (!patientName) {
      sendError(res, 'Patient record not found. Valid registered patient is required.', 404);
      return;
    }

    // Resolve doctor
    const doctorId = data.doctorId || req.user?.id;
    if (!doctorId) {
      sendError(res, 'doctorId is required', 400);
      return;
    }
    const doctor = await DoctorModel.findOne({ $or: [{ id: doctorId }, { userId: doctorId }] });
    const doctorName = doctor ? doctor.name : data.doctorName || req.user?.name;

    // Resolve facility
    const facilityId = data.facilityId || doctor?.facilityId || req.user?.facilityId;
    if (!facilityId) {
      sendError(res, 'facilityId is required', 400);
      return;
    }
    const facility = await FacilityModel.findOne({ id: facilityId });
    const facilityName = facility ? facility.name : data.facilityName || doctor?.facilityName;
    const districtId = facility?.districtId || doctor?.districtId || (req.user as any)?.districtId;

    const id = data.id || `enc_${Date.now()}`;

    const formattedDiagnoses = (data.diagnoses || []).map((d: any, idx: number) => ({
      ...d,
      id: d.id || `diag_${Date.now()}_${idx}`,
      encounterId: id,
      patientId,
      diagnosedBy: d.diagnosedBy || doctorName,
      diagnosedAt: d.diagnosedAt || new Date().toISOString(),
    }));

    const formattedVitals = data.vitals
      ? {
          ...data.vitals,
          patientId,
          encounterId: id,
          recordedBy: data.vitals.recordedBy || doctorName,
          recordedByRole: data.vitals.recordedByRole || 'DOCTOR',
          recordedAt: data.vitals.recordedAt || new Date().toISOString(),
        }
      : undefined;

    const encounter = new EncounterModel({
      ...data,
      id,
      patientId,
      patientName,
      doctorId,
      doctorName,
      facilityId,
      facilityName,
      districtId,
      departmentId: data.departmentId || doctor?.departmentId,
      appointmentId: data.appointmentId,
      tokenId: data.tokenId,
      status: data.status || 'IN_PROGRESS',
      diagnoses: formattedDiagnoses,
      vitals: formattedVitals,
      startedAt: data.startedAt || new Date().toISOString(),
    });
    await encounter.save();

    // If prescriptions included
    if (data.prescriptions && data.prescriptions.length > 0) {
      const formattedRxItems = data.prescriptions.map((p: any, idx: number) => ({
        id: p.id || `rx_item_${Date.now()}_${idx}`,
        medicineName: p.medicineName || p.name || 'Prescribed Medicine',
        genericName: p.genericName || p.generic || '',
        dosage: p.dosage || '1 tab',
        frequency: p.frequency || p.timing || 'Once daily',
        duration: p.duration || (p.durationDays ? `${p.durationDays} days` : '5 days'),
        route: p.route || 'Oral',
        instructions: p.instructions || '',
        dispensedStatus: p.dispensedStatus || 'PENDING',
        dispensedQuantity: p.dispensedQuantity || 0,
        totalQuantity: p.totalQuantity || (p.durationDays ? Number(p.durationDays) : 10),
      }));

      const rx = new PrescriptionModel({
        id: `rx_${Date.now()}`,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        patientName: encounter.patientName,
        doctorId: encounter.doctorId,
        doctorName: encounter.doctorName,
        facilityId: encounter.facilityId,
        facilityName: encounter.facilityName,
        issuedAt: new Date().toISOString(),
        diagnosisSummary: data.chiefComplaint || 'Clinical Consultation',
        items: formattedRxItems,
        status: 'PENDING',
      });
      await rx.save();
    }

    // Update Token & Appointment to IN_CONSULTATION if linked
    if (data.tokenId) {
      await TokenModel.findOneAndUpdate(
        { id: data.tokenId },
        { status: 'IN_CONSULTATION' }
      );
    }
    if (data.appointmentId) {
      await AppointmentModel.findOneAndUpdate(
        { id: data.appointmentId },
        { status: 'IN_CONSULTATION' }
      );
    }

    sendSuccess(res, 'Clinical encounter created successfully', encounter.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create clinical encounter', 500);
  }
}

export async function completeEncounter(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { encounterId } = req.params;
    const { clinicalNotes, diagnoses, vitals, prescriptions, appointmentId, tokenId } = req.body;

    const encounter = await EncounterModel.findOne({ id: encounterId });
    if (!encounter) {
      sendError(res, `Encounter ${encounterId} not found`, 404);
      return;
    }

    encounter.status = 'COMPLETED';
    encounter.completedAt = new Date().toISOString();
    if (clinicalNotes) encounter.clinicalNotes = clinicalNotes;
    if (diagnoses) {
      encounter.diagnoses = diagnoses.map((d: any, idx: number) => ({
        ...d,
        id: d.id || `diag_${encounter.id}_${idx}`,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        diagnosedBy: d.diagnosedBy || encounter.doctorName,
        diagnosedAt: d.diagnosedAt || new Date().toISOString(),
      }));
    }
    if (vitals) {
      encounter.vitals = {
        ...vitals,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        recordedBy: vitals.recordedBy || encounter.doctorName,
        recordedByRole: vitals.recordedByRole || 'DOCTOR',
        recordedAt: vitals.recordedAt || new Date().toISOString(),
      };
    }
    if (prescriptions) encounter.prescriptions = prescriptions;
    await encounter.save();

    // 1. Mark Appointment as COMPLETED
    const targetAptId = appointmentId || encounter.appointmentId;
    if (targetAptId) {
      await AppointmentModel.findOneAndUpdate(
        { id: targetAptId },
        { status: 'COMPLETED' }
      );
    }

    // 2. Mark Token as COMPLETED
    const targetTokenId = tokenId || encounter.tokenId;
    if (targetTokenId) {
      await TokenModel.findOneAndUpdate(
        { id: targetTokenId },
        { status: 'COMPLETED', completedAt: new Date().toISOString() }
      );
    }

    // 3. Update Patient's lastVisitAt
    await PatientModel.findOneAndUpdate(
      { id: encounter.patientId },
      { lastVisitAt: new Date().toISOString() }
    );

    // 4. Update PatientHealthRecord timeline
    let phr = await PatientHealthRecordModel.findOne({ patientId: encounter.patientId });
    if (!phr) {
      phr = new PatientHealthRecordModel({
        id: `phr_${encounter.patientId}`,
        patientId: encounter.patientId,
        name: encounter.patientName,
        bloodGroup: 'Not Recorded',
        allergies: [],
        chronicConditions: [],
        timeline: [],
      });
    }

    const diagnosisSummary = (encounter.diagnoses || []).map((d) => d.conditionName).join(', ') || 'OPD Consultation';
    phr.timeline.unshift({
      id: `tl_${encounter.id}`,
      date: new Date().toISOString().split('T')[0],
      eventType: 'ENCOUNTER',
      title: `Consultation Completed - ${diagnosisSummary}`,
      facilityName: encounter.facilityName,
      doctorName: encounter.doctorName,
      summary: encounter.clinicalNotes || `Encounter concluded by ${encounter.doctorName}. Prescription issued.`,
    });
    await phr.save();

    sendSuccess(res, 'Consultation completed successfully and added to patient health history', encounter.toJSON());
  } catch (err: any) {
    sendError(res, err.message || 'Failed to complete consultation', 500);
  }
}

export async function saveVitals(req: AuthRequest, res: Response): Promise<void> {
  const { encounterId } = req.params;
  const vitalsData = req.body;

  const encounter = await EncounterModel.findOne({ id: encounterId });
  if (encounter) {
    encounter.vitals = {
      ...vitalsData,
      id: `vit_${Date.now()}`,
      recordedBy: req.user?.name || 'Medical Officer',
      recordedByRole: req.user?.role || 'DOCTOR',
      recordedAt: new Date().toISOString(),
    };
    await encounter.save();
  }

  // Update timeline if patient health record exists
  const targetPatientId = encounter?.patientId || vitalsData.patientId;
  if (targetPatientId) {
    const record = await PatientHealthRecordModel.findOne({ patientId: targetPatientId });
    if (record) {
      const summaryParts = [];
      const sys = vitalsData.systolicBp || vitalsData.bloodPressureSys;
      const dia = vitalsData.diastolicBp || vitalsData.bloodPressureDia;
      if (sys && dia) summaryParts.push(`BP: ${sys}/${dia} mmHg`);
      const pulse = vitalsData.pulseRate || vitalsData.heartRate;
      if (pulse) summaryParts.push(`Pulse: ${pulse} bpm`);
      const spo2 = vitalsData.spO2 || vitalsData.oxygenSaturation;
      if (spo2) summaryParts.push(`SpO2: ${spo2}%`);
      if (vitalsData.temperatureF) summaryParts.push(`Temp: ${vitalsData.temperatureF}°F`);

      record.timeline.unshift({
        id: `tl_vit_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        eventType: 'VITALS',
        title: 'Vitals Recorded',
        facilityName: encounter?.facilityName || 'Healthcare Center',
        doctorName: req.user?.name || 'Staff Nurse / MO',
        summary: summaryParts.length > 0 ? summaryParts.join(' | ') : 'Vitals recorded in clinical encounter.',
      });
      await record.save();
    }
  }

  sendSuccess(res, 'Vitals recorded successfully', vitalsData);
}

export async function createPrescription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = req.body;
    const encounterId = req.params.encounterId || data.encounterId;
    let encounter = null;
    if (encounterId) {
      encounter = await EncounterModel.findOne({ id: encounterId });
    }

    const patientId = data.patientId || encounter?.patientId;
    if (!patientId) {
      sendError(res, 'patientId is required to issue a prescription', 400);
      return;
    }

    const patient = await PatientModel.findOne({ id: patientId });
    const patientName = patient ? patient.name : (data.patientName || encounter?.patientName);
    if (!patientName) {
      sendError(res, `Patient ${patientId} not found in database`, 404);
      return;
    }

    const doctorId = data.doctorId || encounter?.doctorId || req.user?.id;
    if (!doctorId) {
      sendError(res, 'doctorId is required', 400);
      return;
    }
    const doctor = await DoctorModel.findOne({ $or: [{ id: doctorId }, { userId: doctorId }] });
    const doctorName = doctor ? doctor.name : (data.doctorName || encounter?.doctorName || req.user?.name);

    const facilityId = data.facilityId || encounter?.facilityId || doctor?.facilityId || req.user?.facilityId;
    if (!facilityId) {
      sendError(res, 'facilityId is required', 400);
      return;
    }
    const facility = await FacilityModel.findOne({ id: facilityId });
    const facilityName = facility ? facility.name : (data.facilityName || encounter?.facilityName || doctor?.facilityName);

    const id = data.id || `rx_${Date.now()}`;

    const rx = new PrescriptionModel({
      ...data,
      id,
      patientId,
      patientName,
      doctorId,
      doctorName,
      facilityId,
      facilityName,
      encounterId,
      issuedAt: data.issuedAt || new Date().toISOString(),
      diagnosisSummary: data.diagnosisSummary || data.diagnosis || 'Clinical Consultation',
      status: data.status || 'PENDING',
    });
    await rx.save();

    if (encounter) {
      if (!encounter.prescriptions) encounter.prescriptions = [];
      encounter.prescriptions.push(rx.toJSON() as any);
      await encounter.save();
    }

    // Add to timeline of patient health record
    let record = await PatientHealthRecordModel.findOne({ patientId });
    if (!record) {
      record = new PatientHealthRecordModel({
        id: `phr_${patientId}`,
        patientId,
        name: patientName,
        bloodGroup: 'Not Recorded',
        allergies: [],
        chronicConditions: [],
        timeline: [],
      });
    }

    record.timeline.unshift({
      id: `tl_${id}`,
      date: new Date().toISOString().split('T')[0],
      eventType: 'PRESCRIPTION',
      title: `e-Prescription Issued (#${id})`,
      facilityName,
      doctorName,
      summary: `Diagnosis: ${rx.diagnosisSummary}. Items: ${(data.items || []).map((i: any) => i.medicineName).join(', ')}`,
    });
    await record.save();

    sendSuccess(res, 'Prescription created successfully in database', rx.toJSON(), 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create prescription', 500);
  }
}
