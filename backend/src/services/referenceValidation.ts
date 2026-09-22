import { DistrictModel, IDistrict } from '../models/District';
import { FacilityModel, IFacility } from '../models/Facility';
import { DoctorModel, IDoctor } from '../models/Doctor';
import { AppointmentModel, IAppointment, TokenModel, IToken } from '../models/Queue';
import { PatientModel, IPatient } from '../models/Patient';

export class ReferenceValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'ReferenceValidationError';
    this.statusCode = statusCode;
  }
}

export async function validateDistrict(districtId: string): Promise<IDistrict> {
  if (!districtId) {
    throw new ReferenceValidationError('districtId is required', 400);
  }
  const district = await DistrictModel.findOne({ id: districtId });
  if (!district) {
    throw new ReferenceValidationError(`District with ID '${districtId}' does not exist`, 404);
  }
  if (district.status !== 'ACTIVE') {
    throw new ReferenceValidationError(`District '${district.name}' is inactive`, 400);
  }
  return district;
}

export async function validateFacility(facilityId: string, expectedDistrictId?: string): Promise<IFacility> {
  if (!facilityId) {
    throw new ReferenceValidationError('facilityId is required', 400);
  }
  const facility = await FacilityModel.findOne({ id: facilityId });
  if (!facility) {
    throw new ReferenceValidationError(`Facility with ID '${facilityId}' does not exist`, 404);
  }
  if (expectedDistrictId && facility.districtId !== expectedDistrictId) {
    throw new ReferenceValidationError(
      `DISTRICT_SCOPE_VIOLATION: Facility '${facility.name}' belongs to district '${facility.districtId}', not '${expectedDistrictId}'`,
      403
    );
  }
  return facility;
}

export async function validateDoctor(doctorId: string, expectedFacilityId?: string): Promise<IDoctor> {
  if (!doctorId) {
    throw new ReferenceValidationError('doctorId is required', 400);
  }
  const doctor = await DoctorModel.findOne({ id: doctorId });
  if (!doctor) {
    throw new ReferenceValidationError(`Doctor with ID '${doctorId}' does not exist`, 404);
  }
  if (expectedFacilityId && doctor.facilityId !== expectedFacilityId) {
    throw new ReferenceValidationError(
      `FACILITY_SCOPE_VIOLATION: Doctor '${doctor.name}' is posted at facility '${doctor.facilityId}', not '${expectedFacilityId}'`,
      403
    );
  }
  return doctor;
}

export async function validatePatient(patientId: string): Promise<IPatient> {
  if (!patientId) {
    throw new ReferenceValidationError('patientId is required', 400);
  }
  const patient = await PatientModel.findOne({ id: patientId });
  if (!patient) {
    throw new ReferenceValidationError(`Patient with ID '${patientId}' does not exist`, 404);
  }
  return patient;
}

export async function validateAppointment(appointmentId: string, expectedFacilityId?: string): Promise<IAppointment> {
  if (!appointmentId) {
    throw new ReferenceValidationError('appointmentId is required', 400);
  }
  const appointment = await AppointmentModel.findOne({ id: appointmentId });
  if (!appointment) {
    throw new ReferenceValidationError(`Appointment with ID '${appointmentId}' does not exist`, 404);
  }
  if (expectedFacilityId && appointment.facilityId !== expectedFacilityId) {
    throw new ReferenceValidationError(
      `FACILITY_SCOPE_VIOLATION: Appointment '${appointmentId}' belongs to facility '${appointment.facilityId}', not '${expectedFacilityId}'`,
      403
    );
  }
  return appointment;
}

export async function validateToken(tokenId: string, expectedDoctorId?: string): Promise<IToken> {
  if (!tokenId) {
    throw new ReferenceValidationError('tokenId is required', 400);
  }
  const token = await TokenModel.findOne({ id: tokenId });
  if (!token) {
    throw new ReferenceValidationError(`Token with ID '${tokenId}' does not exist`, 404);
  }
  if (expectedDoctorId && token.doctorId && token.doctorId !== expectedDoctorId) {
    throw new ReferenceValidationError(
      `DOCTOR_SCOPE_VIOLATION: Token '${tokenId}' is assigned to doctor '${token.doctorId}', not '${expectedDoctorId}'`,
      403
    );
  }
  return token;
}
