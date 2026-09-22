import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TokenModel, AppointmentModel } from '../models/Queue';
import { PatientModel } from '../models/Patient';
import { DoctorModel } from '../models/Doctor';
import { FacilityModel } from '../models/Facility';
import { EncounterModel } from '../models/Encounter';
import { sendSuccess, sendError } from '../utils/response';
import { broadcastTokenCalled, broadcastQueueUpdate } from '../sockets/socketHandler';
import { AuthRequest } from '../middleware/auth';

// Clerk Patient Search
export async function searchClerkPatients(req: Request, res: Response): Promise<void> {
  const params = { ...req.query, ...req.body };
  const search = params.search || '';

  const filter: any = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { abhaId: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const patients = await PatientModel.find(filter).sort({ registeredAt: -1 });
  sendSuccess(res, 'Patients retrieved successfully', patients.map((p) => p.toJSON()));
}

export async function getClerkPatientById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const patient = await PatientModel.findOne({ id });

  if (!patient) {
    sendError(res, `Patient ${id} not found`, 404);
    return;
  }

  sendSuccess(res, 'Patient details retrieved', patient.toJSON());
}

export async function checkDuplicatePatient(req: Request, res: Response): Promise<void> {
  const { phone, abhaId, name } = req.body;

  const filter: any = {};
  if (phone) filter.phone = phone;
  else if (abhaId) filter.abhaId = abhaId;
  else if (name) filter.name = { $regex: `^${name}$`, $options: 'i' };

  const existing = await PatientModel.findOne(filter);
  sendSuccess(res, 'Duplicate check completed', existing ? existing.toJSON() : null);
}

export async function registerPatient(req: Request, res: Response): Promise<void> {
  const data = req.body;
  if (!data.name || !data.phone) {
    sendError(res, 'Patient name and phone number are required', 400);
    return;
  }

  const id = data.id || `usr_pat_${Date.now()}`;

  const patient = new PatientModel({
    ...data,
    id,
    registeredAt: new Date().toISOString(),
  });
  await patient.save();

  sendSuccess(res, 'Patient registered successfully', patient.toJSON(), 201);
}

// Appointments
export async function getAppointments(req: Request, res: Response): Promise<void> {
  const params = { ...req.query, ...req.body };
  const { patientId, doctorId, status, date, facilityId, search } = params;

  const andConditions: any[] = [];

  if (patientId) {
    andConditions.push({
      $or: [{ patientId }, { patientPhone: patientId }],
    });
  }
  if (doctorId) andConditions.push({ doctorId });
  if (facilityId) andConditions.push({ facilityId });
  if (status && status !== 'ALL') andConditions.push({ status });
  if (date) andConditions.push({ date });

  if (search) {
    andConditions.push({
      $or: [
        { patientName: { $regex: search, $options: 'i' } },
        { patientPhone: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { tokenNumber: { $regex: search, $options: 'i' } },
      ],
    });
  }

  const filter = andConditions.length > 0 ? { $and: andConditions } : {};
  const appointments = await AppointmentModel.find(filter).sort({ createdAt: -1, date: 1, timeSlot: 1 });
  sendSuccess(res, 'Appointments retrieved', appointments.map((a) => a.toJSON()));
}

export async function getAppointmentById(req: Request, res: Response): Promise<void> {
  const appointmentId = String(req.params.appointmentId);
  const isMongoId = mongoose.Types.ObjectId.isValid(appointmentId);
  const apt = await AppointmentModel.findOne(
    isMongoId ? { $or: [{ id: appointmentId }, { _id: appointmentId }] } : { id: appointmentId }
  );

  if (!apt) {
    sendError(res, `Appointment ${appointmentId} not found`, 404);
    return;
  }

  sendSuccess(res, 'Appointment retrieved', apt.toJSON());
}

export async function bookAppointment(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;

    // 1. Validate Facility
    if (!data.facilityId) {
      sendError(res, 'facilityId is required to book an appointment', 400);
      return;
    }
    const fac = await FacilityModel.findOne({ id: data.facilityId });
    if (!fac) {
      sendError(res, `Facility ${data.facilityId} not found in database`, 404);
      return;
    }
    const facilityId = fac.id;
    const facilityName = fac.name;

    // 2. Validate Patient
    const caller = (req as any).user;
    const patientQuery = data.patientId || data.patientPhone || caller?.id || caller?.phone;
    if (!patientQuery) {
      sendError(res, 'patientId or patientPhone is required', 400);
      return;
    }
    const pat = await PatientModel.findOne({
      $or: [{ id: patientQuery }, { phone: patientQuery }],
    });
    const patientId = pat ? pat.id : (caller?.id || data.patientId);
    const patientName = pat ? pat.name : (data.patientName || caller?.name);
    const patientPhone = pat ? pat.phone : (data.patientPhone || caller?.phone);

    if (!patientName || !patientPhone) {
      sendError(res, 'Patient name and phone number are required', 400);
      return;
    }

    // 3. Optional Doctor Selection
    let doctorId = data.doctorId || 'unassigned';
    let doctorName = data.doctorName || 'To be assigned at counter';
    let specialty = data.specialty || 'General Medicine';
    let roomNumber = data.roomNumber;

    if (doctorId && doctorId !== 'unassigned') {
      const doc = await DoctorModel.findOne({ id: doctorId });
      if (doc) {
        if (doc.facilityId !== facilityId) {
          sendError(res, `Doctor ${doc.name} does not belong to facility ${facilityName}`, 400);
          return;
        }
        doctorId = doc.id;
        doctorName = doc.name;
        specialty = doc.specialty || specialty;
        roomNumber = doc.opdRoom || roomNumber;
      }
    }

    const id = data.id || `apt_${Date.now()}`;
    const reasonForVisit = data.reasonForVisit || data.reason || 'General Consultation';
    const apt = new AppointmentModel({
      ...data,
      id,
      facilityId,
      facilityName,
      districtId: fac.districtId,
      doctorId,
      doctorName,
      specialty,
      roomNumber,
      patientId,
      patientName,
      patientPhone,
      reasonForVisit,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    });
    await apt.save();

    // Notify counter via Socket
    broadcastQueueUpdate(String(apt.facilityId), {
      event: 'APPOINTMENT_BOOKED',
      appointment: apt.toJSON(),
    });

    sendSuccess(res, 'Appointment booked successfully', apt.toJSON(), 201);
  } catch (err: any) {
    console.error('Error in bookAppointment:', err);
    sendError(res, err.message || 'Failed to book appointment', 500);
  }
}

export async function assignDoctorToAppointment(req: Request, res: Response): Promise<void> {
  const { appointmentId } = req.params;
  const { doctorId, doctorName, specialty, roomNumber, departmentId, departmentName } = req.body;

  if (!doctorId) {
    sendError(res, 'Doctor ID is required for assignment', 400);
    return;
  }

  const apt = await AppointmentModel.findOne({ id: appointmentId });
  if (!apt) {
    sendError(res, `Appointment ${appointmentId} not found`, 404);
    return;
  }

  const doc = await DoctorModel.findOne({ id: doctorId });
  if (!doc) {
    sendError(res, `Doctor ${doctorId} not found in database`, 404);
    return;
  }

  if (doc.facilityId !== apt.facilityId) {
    sendError(res, `Doctor ${doc.name} belongs to facility ${doc.facilityId}, not ${apt.facilityId}`, 400);
    return;
  }

  apt.doctorId = doc.id;
  apt.doctorName = doctorName || doc.name;
  apt.specialty = specialty || doc.specialty;
  apt.roomNumber = roomNumber || doc.opdRoom || apt.roomNumber;
  if (departmentId) apt.departmentId = departmentId;
  if (departmentName) apt.departmentName = departmentName;

  if (apt.status === 'SCHEDULED') {
    apt.status = 'CONFIRMED';
  }
  await apt.save();

  // Sync token if already issued
  if (apt.tokenId) {
    await TokenModel.findOneAndUpdate(
      { id: apt.tokenId },
      {
        doctorId: doc.id,
        doctorName: doc.name,
        roomNumber: apt.roomNumber,
        departmentName: apt.specialty || departmentName,
      }
    );
  }

  // Real-time broadcast
  broadcastQueueUpdate(String(apt.facilityId), {
    event: 'DOCTOR_ASSIGNED',
    appointment: apt.toJSON(),
  });

  sendSuccess(res, `Doctor ${doc.name} successfully assigned to ${apt.patientName}`, apt.toJSON());
}

export async function checkInAppointment(req: Request, res: Response): Promise<void> {
  const appointmentId = req.params.appointmentId || req.body?.appointmentId;
  const { roomNumber, doctorId } = req.body || {};

  if (!appointmentId) {
    sendError(res, 'appointmentId is required for check-in', 400);
    return;
  }

  const apt = await AppointmentModel.findOne({ id: appointmentId });
  if (!apt) {
    sendError(res, `Appointment ${appointmentId} not found`, 404);
    return;
  }

  if (apt.status === 'CHECKED_IN' || apt.status === 'IN_CONSULTATION' || apt.status === 'COMPLETED') {
    sendError(res, `Appointment ${appointmentId} is already ${apt.status}`, 400);
    return;
  }

  // If doctor assigned during check-in, validate
  if (doctorId && doctorId !== 'unassigned') {
    const doc = await DoctorModel.findOne({ id: doctorId });
    if (doc) {
      if (doc.facilityId !== apt.facilityId) {
        sendError(res, `Doctor ${doc.name} belongs to facility ${doc.facilityId}, not ${apt.facilityId}`, 400);
        return;
      }
      apt.doctorId = doc.id;
      apt.doctorName = doc.name;
      apt.specialty = doc.specialty;
      apt.roomNumber = roomNumber || doc.opdRoom || apt.roomNumber;
    }
  }

  // Safe daily sequence numbering per facility and date
  const today = new Date().toISOString().slice(0, 10);
  const dailyCount = await TokenModel.countDocuments({ facilityId: apt.facilityId, date: today });
  const seq = dailyCount + 1;
  const deptPrefix = (apt.departmentId || 'A').toUpperCase().replace('DEP_', '').slice(0, 2) || 'A';
  const tokenNumber = `${deptPrefix}-${String(seq).padStart(3, '0')}`;

  const assignedRoom = roomNumber || apt.roomNumber || 'Room 1';
  const tokenId = `tok_${Date.now()}`;

  const token = new TokenModel({
    id: tokenId,
    tokenNumber,
    sequenceNumber: seq,
    date: today,
    appointmentId: apt.id,
    patientId: apt.patientId,
    patientName: apt.patientName,
    patientAge: apt.patientAge || 40,
    patientGender: apt.patientGender || 'M',
    patientPhone: apt.patientPhone,
    facilityId: apt.facilityId,
    facilityName: apt.facilityName,
    districtId: apt.districtId,
    departmentId: apt.departmentId || 'dep_general',
    departmentName: apt.specialty || 'General OPD',
    doctorId: apt.doctorId !== 'unassigned' ? apt.doctorId : undefined,
    doctorName: apt.doctorId !== 'unassigned' ? apt.doctorName : undefined,
    roomNumber: assignedRoom,
    status: 'WAITING',
    priority: 'ROUTINE',
    positionInQueue: seq,
    estimatedWaitMinutes: seq * 10,
    createdAt: new Date().toISOString(),
  });
  await token.save();

  apt.status = 'CHECKED_IN';
  apt.checkedInAt = new Date().toISOString();
  apt.tokenId = tokenId;
  apt.tokenNumber = tokenNumber;
  apt.roomNumber = assignedRoom;
  await apt.save();

  // Real-time broadcast
  broadcastTokenCalled(token.toJSON());
  broadcastQueueUpdate(String(apt.facilityId), {
    event: 'APPOINTMENT_CHECKED_IN',
    appointment: apt.toJSON(),
    token: token.toJSON(),
  });

  sendSuccess(res, `Patient checked in. Assigned token ${tokenNumber}`, {
    appointment: apt.toJSON(),
    token: token.toJSON(),
  });
}

export async function callToken(req: Request, res: Response): Promise<void> {
  const { tokenId } = req.params;
  const token = await TokenModel.findOne({ id: tokenId });

  if (!token) {
    sendError(res, `Token ${tokenId} not found`, 404);
    return;
  }

  token.status = 'CALLED';
  token.calledAt = new Date().toISOString();
  await token.save();

  if (token.appointmentId) {
    await AppointmentModel.findOneAndUpdate(
      { id: token.appointmentId },
      { status: 'CALLED' }
    );
  }

  broadcastTokenCalled(token.toJSON());
  broadcastQueueUpdate(String(token.facilityId), {
    event: 'TOKEN_CALLED',
    token: token.toJSON(),
  });

  sendSuccess(res, `Token ${token.tokenNumber} called successfully`, token.toJSON());
}

export async function startConsultation(req: AuthRequest, res: Response): Promise<void> {
  const { tokenId } = req.params;
  const token = await TokenModel.findOne({ id: tokenId });

  if (!token) {
    sendError(res, `Token ${tokenId} not found`, 404);
    return;
  }

  token.status = 'IN_CONSULTATION';
  await token.save();

  if (token.appointmentId) {
    await AppointmentModel.findOneAndUpdate(
      { id: token.appointmentId },
      { status: 'IN_CONSULTATION' }
    );
  }

  // Create or find Encounter
  let encounter = await EncounterModel.findOne({ tokenId: token.id });
  if (!encounter) {
    const doctorId = token.doctorId || req.user?.id || 'unassigned';
    const doctorName = token.doctorName || req.user?.name || 'Medical Officer';

    encounter = new EncounterModel({
      id: `enc_${Date.now()}`,
      patientId: token.patientId,
      patientName: token.patientName,
      doctorId,
      doctorName,
      facilityId: token.facilityId,
      facilityName: token.facilityName,
      appointmentId: token.appointmentId,
      tokenId: token.id,
      chiefComplaint: 'Clinical consultation in progress',
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
    });
    await encounter.save();
  }

  broadcastQueueUpdate(String(token.facilityId), {
    event: 'CONSULTATION_STARTED',
    token: token.toJSON(),
    encounter: encounter.toJSON(),
  });

  sendSuccess(res, `Consultation started for token ${token.tokenNumber}`, {
    token: token.toJSON(),
    encounter: encounter.toJSON(),
  });
}

export async function completeConsultation(req: Request, res: Response): Promise<void> {
  const { tokenId } = req.params;
  const token = await TokenModel.findOne({ id: tokenId });

  if (!token) {
    sendError(res, `Token ${tokenId} not found`, 404);
    return;
  }

  token.status = 'COMPLETED';
  token.completedAt = new Date().toISOString();
  await token.save();

  if (token.appointmentId) {
    await AppointmentModel.findOneAndUpdate(
      { id: token.appointmentId },
      { status: 'COMPLETED' }
    );
  }

  await EncounterModel.findOneAndUpdate(
    { tokenId: token.id, status: 'IN_PROGRESS' },
    { status: 'COMPLETED', completedAt: new Date().toISOString() }
  );

  await PatientModel.findOneAndUpdate(
    { id: token.patientId },
    { lastVisitAt: new Date().toISOString() }
  );

  broadcastQueueUpdate(String(token.facilityId), {
    event: 'CONSULTATION_COMPLETED',
    token: token.toJSON(),
  });

  sendSuccess(res, `Consultation completed for token ${token.tokenNumber}`, token.toJSON());
}

export async function skipToken(req: Request, res: Response): Promise<void> {
  const tokenId = req.params.tokenId || req.body.tokenId;
  const token = await TokenModel.findOneAndUpdate(
    { id: tokenId },
    { status: 'SKIPPED' },
    { new: true }
  );

  if (!token) {
    sendError(res, `Token ${tokenId} not found`, 404);
    return;
  }

  sendSuccess(res, `Token ${token.tokenNumber} skipped`, token.toJSON());
}

export async function noShowToken(req: Request, res: Response): Promise<void> {
  const tokenId = req.params.tokenId || req.body.tokenId;
  const token = await TokenModel.findOneAndUpdate(
    { id: tokenId },
    { status: 'NO_SHOW' },
    { new: true }
  );

  if (!token) {
    sendError(res, `Token ${tokenId} not found`, 404);
    return;
  }

  if (token.appointmentId) {
    await AppointmentModel.findOneAndUpdate(
      { id: token.appointmentId },
      { status: 'NO_SHOW' }
    );
  }

  sendSuccess(res, `Token ${token.tokenNumber} marked as no-show`, token.toJSON());
}

export async function cancelToken(req: Request, res: Response): Promise<void> {
  const tokenId = req.params.tokenId || req.body.tokenId;
  const token = await TokenModel.findOneAndUpdate(
    { id: tokenId },
    { status: 'CANCELLED' },
    { new: true }
  );

  if (!token) {
    sendError(res, `Token ${tokenId} not found`, 404);
    return;
  }

  if (token.appointmentId) {
    await AppointmentModel.findOneAndUpdate(
      { id: token.appointmentId },
      { status: 'CANCELLED' }
    );
  }

  sendSuccess(res, 'Token cancelled', token.toJSON());
}

export async function cancelAppointment(req: Request, res: Response): Promise<void> {
  const { appointmentId } = req.params;

  const apt = await AppointmentModel.findOneAndUpdate(
    { id: appointmentId },
    { status: 'CANCELLED' },
    { new: true }
  );

  if (!apt) {
    sendError(res, `Appointment ${appointmentId} not found`, 404);
    return;
  }

  if (apt.tokenId || apt.id) {
    await TokenModel.updateMany(
      { $or: [{ appointmentId: apt.id }, { id: apt.tokenId }] },
      { status: 'CANCELLED' }
    );
  }

  sendSuccess(res, 'Appointment cancelled successfully', apt.toJSON());
}

export async function updateAppointment(req: Request, res: Response): Promise<void> {
  const { appointmentId } = req.params;
  const updates = req.body;

  const apt = await AppointmentModel.findOneAndUpdate(
    { id: appointmentId },
    { ...updates },
    { new: true }
  );

  if (!apt) {
    sendError(res, `Appointment ${appointmentId} not found`, 404);
    return;
  }

  sendSuccess(res, 'Appointment updated successfully', apt.toJSON());
}

export async function getLiveQueue(req: Request, res: Response): Promise<void> {
  const { facilityId } = req.params;
  const { departmentId, doctorId } = { ...req.query, ...req.body } as any;

  const filter: any = { facilityId };
  if (departmentId) filter.departmentId = departmentId;
  if (doctorId) filter.doctorId = doctorId;

  const tokens = await TokenModel.find(filter).sort({ createdAt: 1 });
  const calledToken = tokens.find((t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION');
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING');

  const liveState = {
    facilityId,
    departmentId: departmentId || 'all',
    departmentName: departmentId || 'Department Queue',
    currentTokenNumber: calledToken ? calledToken.tokenNumber : null,
    callingRoom: calledToken?.roomNumber || null,
    totalWaiting: waitingTokens.length,
    averageConsultTimeMinutes: 10,
    tokens: tokens.map((t) => t.toJSON()),
    updatedAt: new Date().toISOString(),
  };

  sendSuccess(res, 'Live queue retrieved', liveState);
}

export async function callNext(req: Request, res: Response): Promise<void> {
  const { facilityId } = req.params;
  const { departmentId, doctorId } = req.body;

  const filter: any = { facilityId, status: 'WAITING' };
  if (departmentId) filter.departmentId = departmentId;
  if (doctorId) filter.doctorId = doctorId;

  // Find next waiting token by priority then creation time
  const nextToken = await TokenModel.findOne(filter).sort({
    priority: -1,
    createdAt: 1,
  });

  if (nextToken) {
    nextToken.status = 'CALLED';
    nextToken.calledAt = new Date().toISOString();
    nextToken.positionInQueue = 0;
    await nextToken.save();

    if (nextToken.appointmentId) {
      await AppointmentModel.findOneAndUpdate(
        { id: nextToken.appointmentId },
        { status: 'CALLED' }
      );
    }

    broadcastTokenCalled(nextToken.toJSON());
  }

  const allTokens = await TokenModel.find({ facilityId }).sort({ createdAt: 1 });
  const waiting = allTokens.filter((t) => t.status === 'WAITING');

  const queueState = {
    facilityId,
    departmentId: departmentId || 'all',
    currentTokenNumber: nextToken ? nextToken.tokenNumber : null,
    callingRoom: nextToken?.roomNumber || null,
    totalWaiting: waiting.length,
    tokens: allTokens.map((t) => t.toJSON()),
    updatedAt: new Date().toISOString(),
  };

  broadcastQueueUpdate(String(facilityId), queueState);

  sendSuccess(res, 'Next token called successfully', {
    calledToken: nextToken ? nextToken.toJSON() : null,
    queue: queueState,
  });
}

export async function generateToken(req: Request, res: Response): Promise<void> {
  const data = req.body;
  if (!data.facilityId) {
    sendError(res, 'facilityId is required to generate a token', 400);
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const count = await TokenModel.countDocuments({ facilityId: data.facilityId, date: today });
  const seq = count + 1;
  const deptPrefix = (data.departmentId || 'A').toUpperCase().replace('DEP_', '').slice(0, 2) || 'A';
  const tokenNumber = `${deptPrefix}-${String(seq).padStart(3, '0')}`;

  const token = new TokenModel({
    id: `tok_${Date.now()}`,
    tokenNumber,
    sequenceNumber: seq,
    date: today,
    patientId: data.patientId || `usr_pat_${Date.now()}`,
    patientName: data.patientName || 'Walk-in Citizen',
    patientAge: data.patientAge || 30,
    patientGender: data.patientGender || 'M',
    patientPhone: data.patientPhone || 'Walk-in',
    facilityId: data.facilityId,
    facilityName: data.facilityName,
    departmentId: data.departmentId || 'dep_general',
    departmentName: data.departmentName || 'General OPD',
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    roomNumber: data.roomNumber || 'Room 1',
    status: 'WAITING',
    priority: data.priority || 'ROUTINE',
    positionInQueue: seq,
    estimatedWaitMinutes: seq * 10,
    createdAt: new Date().toISOString(),
  });
  await token.save();

  sendSuccess(res, `Token ${tokenNumber} generated successfully`, token.toJSON(), 201);
}

export async function getTokenById(req: Request, res: Response): Promise<void> {
  const { tokenId } = req.params;
  const token = await TokenModel.findOne({ id: tokenId });

  if (!token) {
    sendError(res, `Token ${tokenId} not found`, 404);
    return;
  }

  sendSuccess(res, 'Token retrieved', token.toJSON());
}
