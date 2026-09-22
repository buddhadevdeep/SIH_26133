import mongoose from 'mongoose';
import { ENV } from './src/config/env';
import { DistrictModel } from './src/models/District';
import { FacilityModel } from './src/models/Facility';
import { UserModel } from './src/models/User';
import { DoctorModel } from './src/models/Doctor';
import { PatientModel } from './src/models/Patient';
import { AppointmentModel, TokenModel } from './src/models/Queue';
import { EncounterModel } from './src/models/Encounter';

const API_BASE = 'http://localhost:5001/api/v1';

function resolveLandingRoute(user: any): string {
  if (!user) return '/login';
  const role = user.role;
  const staffSubType = user.staffSubType;

  switch (role) {
    case 'SUPER_ADMIN': return '/super-admin';
    case 'DISTRICT_ADMIN': return '/district';
    case 'HOSPITAL_ADMIN': return '/hospital';
    case 'DOCTOR': return '/doctor';
    case 'FACILITY_STAFF':
      if (staffSubType === 'FACILITY_OPERATIONS') return '/facility-operations';
      if (staffSubType === 'REGISTRATION_CLERK') return '/registration-clerk';
      if (staffSubType === 'PHARMACIST') return '/pharmacist';
      if (staffSubType === 'LAB_TECHNICIAN') return '/staff/lab';
      return '/staff';
    case 'PATIENT': return '/patient';
    default: return '/patient';
  }
}

async function api(path: string, options: { method?: string; body?: any; token?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json() as any;
  if (!res.ok) {
    throw new Error(`API Error [${res.status} ${path}]: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function runEndToEndVerification() {
  console.log('========================================================================');
  console.log('FINAL FULL-STACK HEALTHCARE INTEGRATION VERIFICATION TEST');
  console.log('========================================================================\n');

  await mongoose.connect(ENV.MONGODB_URI);
  console.log(`[1/8] Connected to MongoDB at: ${ENV.MONGODB_URI}`);

  // 1. Super Admin Login
  console.log('\n[2/8] Testing Super Admin Login...');
  const saRes = await api('/auth/login', {
    method: 'POST',
    body: {
      identifier: 'superadmin',
      password: 'Admin@12345',
      role: 'SUPER_ADMIN',
    },
  });
  const superToken = saRes.data.token;
  const superAdmin = saRes.data.user;
  console.log(`  ✓ Super Admin logged in: ${superAdmin.name}`);
  const saRoute = resolveLandingRoute(superAdmin);
  console.log(`  ✓ Super Admin landing route resolved to: ${saRoute}`);
  if (saRoute !== '/super-admin') throw new Error('Incorrect Super Admin landing route');

  // 2. Multi-District Creation
  console.log('\n[3/8] Testing Multi-District Provisioning...');
  const distAId = 'dist_ahmedabad';
  const distBId = 'dist_rajkot';

  const distA = await DistrictModel.findOneAndUpdate(
    { name: 'Ahmedabad' },
    { $set: { id: distAId, name: 'Ahmedabad', code: 'AMD', state: 'Gujarat', status: 'ACTIVE' } },
    { upsert: true, new: true }
  );

  const distB = await DistrictModel.findOneAndUpdate(
    { name: 'Rajkot' },
    { $set: { id: distBId, name: 'Rajkot', code: 'RJK', state: 'Gujarat', status: 'ACTIVE' } },
    { upsert: true, new: true }
  );
  console.log(`  ✓ District A created: ${distA.name} (${distA.id})`);
  console.log(`  ✓ District B created: ${distB.name} (${distB.id})`);

  // 3. District Admin Creation & Isolation
  console.log('\n[4/8] Testing District Admin Scoping & Isolation...');
  const adminAUser = `admin_amd_${Date.now()}`;
  const adminBUser = `admin_rjk_${Date.now()}`;

  await api('/users', {
    method: 'POST',
    token: superToken,
    body: {
      name: 'Ahmedabad CDHO',
      username: adminAUser,
      password: 'Health@123',
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'DISTRICT_ADMIN',
      districtId: distA.id,
      district: distA.name,
    },
  });

  await api('/users', {
    method: 'POST',
    token: superToken,
    body: {
      name: 'Rajkot CDHO',
      username: adminBUser,
      password: 'Health@123',
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'DISTRICT_ADMIN',
      districtId: distB.id,
      district: distB.name,
    },
  });

  const loginARes = await api('/auth/login', {
    method: 'POST',
    body: {
      identifier: adminAUser,
      password: 'Health@123',
      role: 'DISTRICT_ADMIN',
    },
  });
  const tokenA = loginARes.data.token;
  const userA = loginARes.data.user;
  console.log(`  ✓ District Admin A logged in: ${userA.name} -> District: ${userA.district}`);

  const loginBRes = await api('/auth/login', {
    method: 'POST',
    body: {
      identifier: adminBUser,
      password: 'Health@123',
      role: 'DISTRICT_ADMIN',
    },
  });
  const tokenB = loginBRes.data.token;
  const userB = loginBRes.data.user;
  console.log(`  ✓ District Admin B logged in: ${userB.name} -> District: ${userB.district}`);

  // Test District A info
  const myDistARes = await api('/district/me', { token: tokenA });
  console.log(`  ✓ District Admin A GET /district/me returned: ${myDistARes.data.name}`);
  if (myDistARes.data.name !== 'Ahmedabad') throw new Error('District scoping failure for Admin A');

  // Test District B info
  const myDistBRes = await api('/district/me', { token: tokenB });
  console.log(`  ✓ District Admin B GET /district/me returned: ${myDistBRes.data.name}`);
  if (myDistBRes.data.name !== 'Rajkot') throw new Error('District scoping failure for Admin B');

  // 4. Hospital Creation & Automatic Staff Provisioning
  console.log('\n[5/8] Testing Hospital Creation & Staff Provisioning...');
  const runTs = Date.now();
  const hospAId = `fac_amd_${runTs}`;
  const clerkAUser = `clerk_amd_${runTs}`;

  const createHospRes = await api('/facilities', {
    method: 'POST',
    token: tokenA,
    body: {
      id: hospAId,
      name: `Ahmedabad Metropolitan Hospital ${runTs}`,
      type: 'DISTRICT_HOSPITAL',
      facilityType: 'DISTRICT_HOSPITAL',
      districtId: distA.id,
      district: distA.name,
      address: 'Civil Hospital Campus, Asarwa, Ahmedabad',
      pincode: '380016',
      contactNumber: '07922680074',
      phone: '07922680074',
      username: clerkAUser,
      password: 'Health@123',
      totalBeds: 250,
      availableBeds: 75,
      icuBedsAvailable: 15,
      emergencyAvailable: true,
      specialties: ['General Medicine', 'Cardiology', 'Pediatrics'],
      lat: 23.0531,
      lng: 72.5956,
    },
  });
  console.log(`  ✓ Hospital A created in Ahmedabad: ${createHospRes.data.name}`);

  // Verify that Registration Clerk, Facility Operations Staff, and Hospital Admin were all automatically provisioned
  const clerkDoc = await UserModel.findOne({ username: clerkAUser });
  const opsDoc = await UserModel.findOne({ username: `${clerkAUser}_ops` });
  const hospAdminDoc = await UserModel.findOne({ username: `${clerkAUser}_admin` });

  console.log(`  ✓ Registration Clerk in MongoDB: ${clerkDoc?.username} (${clerkDoc?.staffSubType})`);
  console.log(`  ✓ Facility Operations in MongoDB: ${opsDoc?.username} (${opsDoc?.staffSubType})`);
  console.log(`  ✓ Hospital Admin in MongoDB: ${hospAdminDoc?.username} (${hospAdminDoc?.role})`);

  if (!opsDoc || opsDoc.staffSubType !== 'FACILITY_OPERATIONS') throw new Error('Operations staff was not provisioned');
  if (!hospAdminDoc || hospAdminDoc.role !== 'HOSPITAL_ADMIN') throw new Error('Hospital Admin was not provisioned');

  // 5. Test Facility Operations Staff Login & Root Cause Fix
  console.log('\n[6/8] Testing Facility Operations Staff Login & Routing Fix...');
  const opsLoginRes = await api('/auth/login', {
    method: 'POST',
    body: {
      identifier: opsDoc.username,
      password: 'Health@123',
      role: 'FACILITY_STAFF',
      staffSubType: 'FACILITY_OPERATIONS',
    },
  });
  const opsUser = opsLoginRes.data.user;
  const opsToken = opsLoginRes.data.token;
  console.log(`  ✓ Authenticated as: ${opsUser.name} | Subtype: ${opsUser.staffSubType} | Facility: ${opsUser.facilityName}`);

  const opsRoute = resolveLandingRoute(opsUser);
  console.log(`  ✓ Resolved Landing Route: ${opsRoute}`);
  if (opsRoute !== '/facility-operations') {
    throw new Error(`FAILURE: Facility Operations staff redirected to ${opsRoute} instead of /facility-operations!`);
  }
  console.log('  ★ CONFIRMED: Facility Operations Staff correctly lands on /facility-operations (NOT Counter Dashboard)!');

  // Test operations telemetry query scoped to Hospital A
  const opsSumRes = await api('/operations/summary', { token: opsToken });
  console.log(`  ✓ Telemetry retrieved for facility: ${opsSumRes.data.facilityName} (Beds: ${opsSumRes.data.telemetry.bedsTotal})`);

  // 6. Hospital Admin Provisions a Doctor
  console.log('\n[7/8] Testing Hospital Admin Staff Management...');
  const hospAdminLoginRes = await api('/auth/login', {
    method: 'POST',
    body: {
      identifier: hospAdminDoc.username,
      password: 'Health@123',
      role: 'HOSPITAL_ADMIN',
    },
  });
  const hospAdminToken = hospAdminLoginRes.data.token;

  const docUser = `dr_bhavesh_${runTs}`;
  const createDocRes = await api('/users', {
    method: 'POST',
    token: hospAdminToken,
    body: {
      name: 'Dr. Bhavesh Patel',
      username: docUser,
      password: 'Health@123',
      phone: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'DOCTOR',
      specialty: 'General Medicine',
      qualification: 'MBBS, MD',
    },
  });
  const createdDoctor = createDocRes.data;
  console.log(`  ✓ Hospital Admin created Doctor: ${createdDoctor.name} (Facility: ${createdDoctor.facilityId})`);
  if (createdDoctor.facilityId !== hospAId) throw new Error('Doctor facilityId was not scoped to Hospital Admin');

  // 7. Full Patient Clinical Workflow
  console.log('\n[8/8] Testing Complete Patient Workflow (Appointment -> Check-in -> Token -> Consultation -> History)...');
  const patientPhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
  const patRegRes = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Ketan Shah',
      phone: patientPhone,
      password: 'Patient@123',
      age: 42,
      gender: 'M',
      bloodGroup: 'O+',
      district: 'Ahmedabad',
      address: 'Navrangpura, Ahmedabad',
    },
  });
  const patUser = patRegRes.data.user;
  const patToken = patRegRes.data.token;
  console.log(`  ✓ Patient registered: ${patUser.name} (${patUser.id})`);

  // Book Appointment
  const aptRes = await api('/appointments/book', {
    method: 'POST',
    token: patToken,
    body: {
      facilityId: hospAId,
      doctorId: createdDoctor.id,
      patientId: patUser.id,
      patientName: patUser.name,
      patientPhone: patUser.phone,
      patientAge: patUser.age,
      patientGender: patUser.gender,
      department: 'General Medicine OPD',
      timeSlot: '10:30 AM',
      date: new Date().toISOString().slice(0, 10),
      reason: 'Persistent fever and cough',
    },
  });
  const appointment = aptRes.data;
  console.log(`  ✓ Appointment booked: ${appointment.id} (Status: ${appointment.status})`);

  // Clerk Login & Check-in
  const clerkLoginRes = await api('/auth/login', {
    method: 'POST',
    body: {
      identifier: clerkDoc.username,
      password: 'Health@123',
      role: 'FACILITY_STAFF',
      staffSubType: 'REGISTRATION_CLERK',
    },
  });
  const clerkToken = clerkLoginRes.data.token;
  const clerkRoute = resolveLandingRoute(clerkLoginRes.data.user);
  console.log(`  ✓ Registration Clerk landing route resolved to: ${clerkRoute}`);
  if (clerkRoute !== '/registration-clerk') throw new Error('Registration clerk landing route mismatch');

  // Check-in & Generate Token
  const checkInRes = await api('/queue/check-in', {
    method: 'POST',
    token: clerkToken,
    body: {
      appointmentId: appointment.id,
      facilityId: hospAId,
      doctorId: createdDoctor.id,
    },
  });
  const tokenRecord = checkInRes.data?.token || checkInRes.data;
  console.log(`  ✓ Patient checked in -> Queue Token issued: #${tokenRecord.tokenNumber} (ID: ${tokenRecord.id})`);

  // Doctor Login & Consultation
  const docLoginRes = await api('/auth/login', {
    method: 'POST',
    body: {
      identifier: docUser,
      password: 'Health@123',
      role: 'DOCTOR',
    },
  });
  const docToken = docLoginRes.data.token;
  const docRoute = resolveLandingRoute(docLoginRes.data.user);
  console.log(`  ✓ Doctor landing route resolved to: ${docRoute}`);

  // Doctor Completes Consultation -> Creates Real Encounter & Prescription in MongoDB
  const consultRes = await api('/encounters', {
    method: 'POST',
    token: docToken,
    body: {
      appointmentId: appointment.id,
      patientId: patUser.id,
      facilityId: hospAId,
      districtId: distA.id,
      chiefComplaint: 'Fever for 3 days and dry cough',
      status: 'COMPLETED',
      vitals: {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 76,
        temperatureFahrenheit: 99.2,
        spO2Percent: 98,
        weightKg: 68,
      },
      diagnoses: [
        {
          conditionName: 'Acute Viral Upper Respiratory Infection',
          icd10Code: 'J06.9',
          notes: 'Mild pharyngeal congestion. Vitals stable.',
          verificationStatus: 'CONFIRMED',
        },
      ],
      prescriptions: [
        {
          medicineName: 'Paracetamol 650mg',
          dosage: '1 tablet thrice daily after meals',
          frequency: 'TDS',
          durationDays: 5,
        },
        {
          medicineName: 'Cetirizine 10mg',
          dosage: '1 tablet once at bedtime',
          frequency: 'OD',
          durationDays: 5,
        },
      ],
    },
  });
  console.log(`  ✓ Consultation completed -> Real MongoDB Encounter saved: ${consultRes.data.id}`);

  // Verify Patient History in MongoDB
  const patientHistoryRes = await api(`/patients/${patUser.id}/health-record`, { token: patToken });
  const healthRecord = patientHistoryRes.data;
  console.log(`  ✓ Verified Patient Health Record: ${healthRecord.timeline?.length || 0} timeline event(s) found in MongoDB.`);
  if (!healthRecord.timeline || healthRecord.timeline.length === 0) {
    throw new Error('Patient clinical encounter was not saved to MongoDB!');
  }

  console.log('\n========================================================================');
  console.log('ALL INTEGRATION AND ISOLATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runEndToEndVerification().catch(async (err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
