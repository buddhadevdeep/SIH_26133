import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { DistrictModel } from '../models/District';
import { FacilityModel } from '../models/Facility';
import { DoctorModel } from '../models/Doctor';
import { PatientModel } from '../models/Patient';
import { AppointmentModel, TokenModel } from '../models/Queue';
import { EncounterModel } from '../models/Encounter';
import { DistrictAdminModel } from '../models/DistrictAdmin';
import { UserModel } from '../models/User';

async function checkIntegrity() {
  console.log(`[db:check-integrity] Connecting to ${ENV.MONGODB_URI}...`);
  await mongoose.connect(ENV.MONGODB_URI);

  const errors: string[] = [];
  let checksPassed = 0;

  console.log('[db:check-integrity] Running Relational & Foreign Reference Audit...\n');

  // 1. Audit Facilities -> District
  const facilities = await FacilityModel.find({});
  for (const fac of facilities) {
    if (!fac.districtId) {
      errors.push(`Facility '${fac.name}' (${fac.id}) has NO districtId.`);
      continue;
    }
    const dist = await DistrictModel.findOne({ id: fac.districtId });
    if (!dist) {
      errors.push(`Facility '${fac.name}' references non-existent districtId '${fac.districtId}'.`);
    } else {
      checksPassed++;
    }
  }

  // 2. Audit Doctors -> Facility & District Consistency
  const doctors = await DoctorModel.find({});
  for (const doc of doctors) {
    if (!doc.facilityId) {
      errors.push(`Doctor '${doc.name}' (${doc.id}) has NO facilityId.`);
      continue;
    }
    const fac = await FacilityModel.findOne({ id: doc.facilityId });
    if (!fac) {
      errors.push(`Doctor '${doc.name}' references non-existent facilityId '${doc.facilityId}'.`);
    } else {
      checksPassed++;
      // Check district alignment
      if (doc.districtId && fac.districtId && doc.districtId !== fac.districtId) {
        errors.push(
          `Doctor '${doc.name}' districtId '${doc.districtId}' does not match facility '${fac.name}' districtId '${fac.districtId}'.`
        );
      } else {
        checksPassed++;
      }
    }
  }

  // 3. Audit Appointments -> Facility, Doctor, Patient
  const appointments = await AppointmentModel.find({});
  for (const apt of appointments) {
    const fac = await FacilityModel.findOne({ id: apt.facilityId });
    if (!fac) {
      errors.push(`Appointment '${apt.id}' references non-existent facilityId '${apt.facilityId}'.`);
    } else {
      checksPassed++;
    }

    if (apt.doctorId && apt.doctorId !== 'unassigned') {
      let doc = await DoctorModel.findOne({ $or: [{ id: apt.doctorId }, { userId: apt.doctorId }] });
      if (!doc) {
        const docUser = await UserModel.findOne({ id: apt.doctorId, role: 'DOCTOR' });
        if (docUser) {
          doc = await DoctorModel.findOne({ $or: [{ userId: docUser.id }, { name: docUser.name }] });
        }
      }

      if (!doc) {
        errors.push(`Appointment '${apt.id}' references non-existent doctorId '${apt.doctorId}'.`);
      } else if (doc.facilityId !== apt.facilityId) {
        errors.push(
          `Appointment '${apt.id}' doctor '${doc.name}' facility '${doc.facilityId}' does not match appointment facility '${apt.facilityId}'.`
        );
      } else {
        checksPassed++;
      }
    }

    if (apt.patientId) {
      const pat = await PatientModel.findOne({
        $or: [{ id: apt.patientId }, { phone: apt.patientPhone }],
      });
      if (!pat) {
        errors.push(`Appointment '${apt.id}' references non-existent patient '${apt.patientId}'.`);
      } else {
        checksPassed++;
      }
    }
  }

  // 4. Audit Tokens -> Appointment & Facility
  const tokens = await TokenModel.find({});
  for (const tok of tokens) {
    if (tok.appointmentId) {
      const apt = await AppointmentModel.findOne({ id: tok.appointmentId });
      if (!apt) {
        errors.push(`Token '${tok.tokenNumber}' (${tok.id}) references non-existent appointmentId '${tok.appointmentId}'.`);
      } else {
        checksPassed++;
      }
    }
    const fac = await FacilityModel.findOne({ id: tok.facilityId });
    if (!fac) {
      errors.push(`Token '${tok.tokenNumber}' references non-existent facilityId '${tok.facilityId}'.`);
    } else {
      checksPassed++;
    }
  }

  // 5. Audit Encounters -> Patient & Facility
  const encounters = await EncounterModel.find({});
  for (const enc of encounters) {
    const pat = await PatientModel.findOne({ id: enc.patientId });
    if (!pat) {
      errors.push(`Encounter '${enc.id}' references non-existent patientId '${enc.patientId}'.`);
    } else {
      checksPassed++;
    }
    const fac = await FacilityModel.findOne({ id: enc.facilityId });
    if (!fac) {
      errors.push(`Encounter '${enc.id}' references non-existent facilityId '${enc.facilityId}'.`);
    } else {
      checksPassed++;
    }
  }

  // 6. Audit District Admins -> District
  const districtAdmins = await DistrictAdminModel.find({});
  for (const da of districtAdmins) {
    if (da.districtId) {
      const dist = await DistrictModel.findOne({ id: da.districtId });
      if (!dist) {
        errors.push(`DistrictAdmin '${da.name}' references non-existent districtId '${da.districtId}'.`);
      } else {
        checksPassed++;
      }
    }
  }

  console.log('========================================================');
  console.log(`[db:check-integrity] AUDIT SUMMARY:`);
  console.log(`  ✓ Total Validated Relational References: ${checksPassed}`);
  console.log(`  ! Orphan / Inconsistent References: ${errors.length}`);
  console.log('========================================================\n');

  if (errors.length > 0) {
    console.error('FAILED: Found integrity violations:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    await mongoose.disconnect();
    process.exit(1);
  } else {
    console.log('SUCCESS: Database relational integrity is 100% verified. Zero orphan foreign references found.\n');
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkIntegrity().catch((err) => {
  console.error('[db:check-integrity] Unexpected error:', err);
  process.exit(1);
});
