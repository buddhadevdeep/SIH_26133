import mongoose from 'mongoose';
import app from './src/app';
import http from 'http';
import { ENV } from './src/config/env';

let server: http.Server;
let baseUrl: string;

async function request(path: string, options: any = {}): Promise<{ status: number; ok: boolean; body: any }> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data: any = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body: data };
}

function assert(condition: any, message: string, extra?: any) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`, extra ? JSON.stringify(extra, null, 2) : '');
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTest() {
  console.log('====================================================');
  console.log('🏥 SIH 26047 - END-TO-END HEALTHCARE WORKFLOW TEST');
  console.log('====================================================\n');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(ENV.MONGODB_URI);
  }

  // Start HTTP server on an ephemeral port
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test server running on ${baseUrl}`);
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // STEP 1: Verify Initial Clean State
    // ----------------------------------------------------
    console.log('\n[Step 1] Verifying Clean Initial Database State (Zero Dummy Business Data)...');
    const facRes = await request('/api/v1/facilities');
    assert(facRes.status === 200, 'Facilities endpoint accessible');
    assert(Array.isArray(facRes.body.data) && facRes.body.data.length === 0, 'Zero dummy facilities in database');

    const docRes = await request('/api/v1/directory/doctors');
    assert(docRes.status === 200, 'Doctors endpoint accessible');
    assert(Array.isArray(docRes.body.data) && docRes.body.data.length === 0, 'Zero dummy doctors in database');

    // ----------------------------------------------------
    // STEP 2: Super Admin Login
    // ----------------------------------------------------
    console.log('\n[Step 2] Super Admin Authentication...');
    const adminLoginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        username: process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin',
        password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@12345',
      },
    });
    assert(adminLoginRes.status === 200, 'Super Admin logged in successfully');
    const superAdminToken = adminLoginRes.body.data.token;
    assert(superAdminToken, 'Super Admin JWT token received');

    // ----------------------------------------------------
    // STEP 3: Super Admin Creates District "Rajkot" & District Admin
    // ----------------------------------------------------
    console.log('\n[Step 3] Super Admin creates District "Rajkot" and District Admin...');
    const createDistRes = await request('/api/v1/districts', {
      method: 'POST',
      token: superAdminToken,
      body: {
        name: 'Rajkot',
        code: 'RJK',
        state: 'Gujarat',
      },
    });
    assert(createDistRes.status === 201, 'District Rajkot created in MongoDB');

    const createDaRes = await request('/api/v1/admin/users', {
      method: 'POST',
      token: superAdminToken,
      body: {
        name: 'Dr. Ramesh Trivedi',
        phone: '9825000001',
        email: 'cdho.rajkot@gujarat.health.gov.in',
        username: 'cdho_rajkot',
        password: 'RajkotAdmin@123',
        role: 'DISTRICT_ADMIN',
        district: 'Rajkot',
        designation: 'Chief District Health Officer',
      },
    });
    assert(createDaRes.status === 201, 'District Admin created successfully');
    assert(createDaRes.body.data.district === 'Rajkot', 'District Admin scoped to Rajkot');

    // ----------------------------------------------------
    // STEP 4: District Admin Logs In
    // ----------------------------------------------------
    console.log('\n[Step 4] District Admin logs in...');
    const daLoginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        username: 'cdho_rajkot',
        password: 'RajkotAdmin@123',
      },
    });
    assert(daLoginRes.status === 200, 'District Admin authenticated');
    const daToken = daLoginRes.body.data.token;
    assert(daToken, 'District Admin JWT received');

    // ----------------------------------------------------
    // STEP 5: Scoping & Isolation Enforcement
    // ----------------------------------------------------
    console.log('\n[Step 5] Testing District Isolation (Rajkot Admin cannot create Ahmedabad facility)...');
    const illegalFacRes = await request('/api/v1/facilities', {
      method: 'POST',
      token: daToken,
      body: {
        name: 'Illegal Ahmedabad Hospital',
        district: 'Ahmedabad',
        type: 'DISTRICT_HOSPITAL',
        username: 'clerk_illegal',
        password: 'Password@123',
      },
    });
    assert(illegalFacRes.status === 403, 'Cross-district facility creation correctly rejected with 403 Forbidden');

    // ----------------------------------------------------
    // STEP 6: District Admin Creates "Rajkot Civil Hospital"
    // ----------------------------------------------------
    console.log('\n[Step 6] District Admin creates "Rajkot Civil Hospital"...');
    const createFacRes = await request('/api/v1/facilities', {
      method: 'POST',
      token: daToken,
      body: {
        name: 'Rajkot Civil Hospital',
        district: 'Rajkot',
        type: 'DISTRICT_HOSPITAL',
        address: 'PDU Medical College Campus, Jamnagar Road, Rajkot',
        pincode: '360001',
        contactNumber: '0281-2451234',
        emergencyNumber: '108',
        username: 'clerk_rajkot_civil',
        password: 'ClerkPassword@123',
        emergencyAvailable: true,
        availableBeds: 120,
        totalBeds: 250,
        icuBedsAvailable: 15,
        coordinates: { lat: 22.3039, lng: 70.8022 },
        specialties: ['Cardiology', 'General Medicine', 'Orthopedics'],
      },
    });
    assert(createFacRes.status === 201, 'Rajkot Civil Hospital created', createFacRes);
    const facility = createFacRes.body.data;
    const facilityId = facility.id;
    assert(facilityId, `Facility registered with id: ${facilityId}`);

    // ----------------------------------------------------
    // STEP 7: Register Doctor at Rajkot Civil Hospital
    // ----------------------------------------------------
    console.log('\n[Step 7] Adding Doctor "Dr. Priya Shah" to Rajkot Civil Hospital...');
    const createDocRes = await request('/api/v1/admin/users', {
      method: 'POST',
      token: daToken,
      body: {
        name: 'Dr. Priya Shah',
        phone: '9825000002',
        email: 'dr.priya.shah@rajkotcivil.gov.in',
        username: 'dr_priya_shah',
        password: 'DoctorPassword@123',
        role: 'DOCTOR',
        facilityId: facilityId,
        specialty: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology)',
      },
    });
    assert(createDocRes.status === 201, 'Doctor user registered');

    // Verify DoctorModel sync
    const verifyDocRes = await request(`/api/v1/directory/doctors?facilityId=${facilityId}`);
    assert(verifyDocRes.status === 200 && verifyDocRes.body.data.length === 1, 'Doctor automatically synced into Doctor directory');
    const doctor = verifyDocRes.body.data[0];
    const doctorId = doctor.id;
    assert(doctor.name === 'Dr. Priya Shah', 'Doctor name verified');
    assert(doctor.facilityId === facilityId, 'Doctor assigned to Rajkot Civil Hospital');

    // ----------------------------------------------------
    // STEP 8: Doctor Logs In
    // ----------------------------------------------------
    console.log('\n[Step 8] Doctor logs in to acquire clinical session token...');
    const docLoginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        username: 'dr_priya_shah',
        password: 'DoctorPassword@123',
      },
    });
    assert(docLoginRes.status === 200, 'Doctor logged in');
    const docToken = docLoginRes.body.data.token;

    // ----------------------------------------------------
    // STEP 9: Patient A Registers & Logs In
    // ----------------------------------------------------
    console.log('\n[Step 9] Patient A ("Aarav Mehta") registers and logs in...');
    const patientRegRes = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        name: 'Aarav Mehta',
        phone: '9876543210',
        password: 'PatientPassword@123',
        age: 48,
        gender: 'MALE',
        bloodGroup: 'B+',
        district: 'Rajkot',
      },
    });
    assert(patientRegRes.status === 201, 'Patient A registered successfully');
    const patientA = patientRegRes.body.data.user;
    const patientAToken = patientRegRes.body.data.token;
    const patientAId = patientA.id;
    assert(patientAId, `Patient A ID: ${patientAId}`);

    // Verify Patient initial health record exists but is empty
    const initEhrRes = await request(`/api/v1/patients/${patientAId}/health-record`, {
      token: patientAToken,
    });
    assert(initEhrRes.status === 200, 'Patient health record initialized');
    assert(initEhrRes.body.data.timeline.length === 0, 'Patient timeline starts clean with 0 past consultations');

    // ----------------------------------------------------
    // STEP 10: Patient Books Appointment
    // ----------------------------------------------------
    console.log('\n[Step 10] Patient A books appointment at Rajkot Civil Hospital with Dr. Priya Shah...');
    const today = new Date().toISOString().slice(0, 10);
    const bookRes = await request('/api/v1/queues/appointments', {
      method: 'POST',
      token: patientAToken,
      body: {
        facilityId: facilityId,
        doctorId: doctorId,
        date: today,
        timeSlot: '10:00 AM - 10:30 AM',
        departmentId: 'Cardiology',
        reason: 'Chest tightness and shortness of breath upon exertion',
      },
    });
    assert(bookRes.status === 201, 'Appointment booked successfully', bookRes);
    const appointment = bookRes.body.data;
    const appointmentId = appointment.id;
    assert(appointment.status === 'SCHEDULED', 'Appointment status is SCHEDULED');

    // ----------------------------------------------------
    // STEP 11: Counter Staff / Patient Checks In & Generates Queue Token
    // ----------------------------------------------------
    console.log('\n[Step 11] Patient checks in at OPD Counter -> Queue Token generation...');
    const checkinRes = await request('/api/v1/queues/checkin', {
      method: 'POST',
      token: patientAToken,
      body: {
        appointmentId: appointmentId,
        facilityId: facilityId,
        doctorId: doctorId,
      },
    });
    assert(checkinRes.status === 200 || checkinRes.status === 201, 'Check-in successful and token issued', checkinRes);
    const token = checkinRes.body.data.token;
    const tokenId = token.id;
    assert(token.status === 'WAITING', 'Token status is WAITING');
    assert(token.sequenceNumber === 1, 'Sequence number is 1');
    assert(token.appointmentId === appointmentId, 'Token linked to appointment');

    // Verify appointment status transitioned to CHECKED_IN
    const apptCheckRes = await request(`/api/v1/queues/appointments/${appointmentId}`);
    assert(apptCheckRes.status === 200, 'Appointment retrieved', apptCheckRes);
    assert(apptCheckRes.body.data.status === 'CHECKED_IN', 'Appointment status transitioned to CHECKED_IN');

    // ----------------------------------------------------
    // STEP 12: Doctor Calls Token
    // ----------------------------------------------------
    console.log('\n[Step 12] Doctor calls next patient into OPD room...');
    const callRes = await request(`/api/v1/queues/tokens/${tokenId}/call`, {
      method: 'POST',
      token: docToken,
      body: {
        roomNumber: 'OPD Room 1',
      },
    });
    assert(callRes.status === 200, 'Token called');
    assert(callRes.body.data.status === 'CALLED', 'Token status transitioned to CALLED');

    // ----------------------------------------------------
    // STEP 13: Doctor Starts Consultation (Encounter Created)
    // ----------------------------------------------------
    console.log('\n[Step 13] Doctor starts clinical consultation...');
    const startRes = await request(`/api/v1/queues/tokens/${tokenId}/start-consultation`, {
      method: 'POST',
      token: docToken,
    });
    assert(startRes.status === 200, 'Consultation started');
    assert(startRes.body.data.token.status === 'IN_CONSULTATION', 'Token status is IN_CONSULTATION');
    const encounter = startRes.body.data.encounter;
    const encounterId = encounter.id;
    assert(encounterId, `Encounter created with id: ${encounterId}`);

    // ----------------------------------------------------
    // STEP 14: Doctor Records Clinical Vitals & Prescription
    // ----------------------------------------------------
    console.log('\n[Step 14] Doctor records real vitals, diagnosis, and prescription...');
    // 14a: Vitals
    const vitalsRes = await request(`/api/v1/clinical/encounters/${encounterId}/vitals`, {
      method: 'POST',
      token: docToken,
      body: {
        bloodPressureSys: 136,
        bloodPressureDia: 88,
        pulseRate: 78,
        temperatureF: 98.6,
        oxygenSaturation: 99,
        weightKg: 72,
        notes: 'Mild essential hypertension noted',
      },
    });
    assert(vitalsRes.status === 200, 'Clinical vitals recorded in MongoDB');

    // 14b: Prescription
    const rxRes = await request(`/api/v1/clinical/encounters/${encounterId}/prescriptions`, {
      method: 'POST',
      token: docToken,
      body: {
        diagnosis: 'Stage 1 Essential Hypertension with Dyslipidemia',
        medicines: [
          {
            name: 'Amlodipine 5mg',
            dosage: '5mg',
            frequency: '1-0-0 (Morning)',
            duration: '30 days',
            instructions: 'Take after breakfast',
          },
          {
            name: 'Atorvastatin 10mg',
            dosage: '10mg',
            frequency: '0-0-1 (Night)',
            duration: '30 days',
            instructions: 'Take before bedtime',
          },
        ],
        notes: 'Advised 30 min daily brisk walking and low sodium diet. Follow up in 4 weeks.',
      },
    });
    assert(rxRes.status === 201, 'Prescription recorded in MongoDB');

    // ----------------------------------------------------
    // STEP 15: Doctor Completes Consultation
    // ----------------------------------------------------
    console.log('\n[Step 15] Doctor completes consultation (Atomic status cascade)...');
    const completeRes = await request(`/api/v1/clinical/encounters/${encounterId}/complete`, {
      method: 'POST',
      token: docToken,
      body: {
        summary: 'Patient evaluated for exertion dyspnea. Diagnosed with Stage 1 Hypertension. Started on Amlodipine.',
      },
    });
    assert(completeRes.status === 200, 'Consultation completed');

    // Verify token & appointment are COMPLETED
    const tokenInDb = await request(`/api/v1/queues/appointments/${appointmentId}`);
    assert(tokenInDb.body.data.status === 'COMPLETED', 'Appointment status transitioned to COMPLETED');

    // ----------------------------------------------------
    // STEP 16: Verify Patient Health Record Updated Permanently
    // ----------------------------------------------------
    console.log('\n[Step 16] Verifying Patient Health Record Timeline...');
    const patientEhrRes = await request(`/api/v1/patients/${patientAId}/health-record`, {
      token: patientAToken,
    });
    assert(patientEhrRes.status === 200, 'Patient health record fetched');
    const ehr = patientEhrRes.body.data;
    assert(ehr.timeline.length >= 1, `Timeline has permanent clinical encounter: ${ehr.timeline.length} event(s)`);
    const encounterEvent = ehr.timeline.find((e: any) => e.eventType === 'ENCOUNTER');
    assert(encounterEvent, 'Timeline contains ENCOUNTER event');
    assert(encounterEvent.facilityName === 'Rajkot Civil Hospital', 'Timeline record points to Rajkot Civil Hospital');
    assert(encounterEvent.doctorName === 'Dr. Priya Shah', 'Timeline record points to Dr. Priya Shah');

    const rxEvent = ehr.timeline.find((e: any) => e.eventType === 'PRESCRIPTION');
    assert(rxEvent, 'Timeline contains PRESCRIPTION event');
    assert(rxEvent.summary.includes('Amlodipine') || rxEvent.summary.includes('Atorvastatin') || rxEvent.summary.includes('Hypertension'), 'Prescription event contains real clinical treatment');

    const vitalsEvent = ehr.timeline.find((e: any) => e.eventType === 'VITALS');
    assert(vitalsEvent, 'Timeline contains VITALS event');
    assert(vitalsEvent.summary.includes('136/88') || vitalsEvent.summary.includes('BP:'), 'Vitals event contains real BP values');

    // ----------------------------------------------------
    // STEP 17: Security & Tenant Isolation Checks
    // ----------------------------------------------------
    console.log('\n[Step 17] Verifying Patient-to-Patient Isolation...');
    // Register Patient B
    const patientBReg = await request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        name: 'Sunita Patel',
        phone: '9876543211',
        password: 'PatientBPassword@123',
        age: 35,
        gender: 'FEMALE',
      },
    });
    assert(patientBReg.status === 201, 'Patient B registered');
    const patientBToken = patientBReg.body.data.token;
    const patientBId = patientBReg.body.data.user.id;

    // Patient B attempts to access Patient A's health record -> 403 Forbidden
    const snoopRes = await request(`/api/v1/patients/${patientAId}/health-record`, {
      token: patientBToken,
    });
    assert(snoopRes.status === 403, 'Patient B correctly blocked from viewing Patient A health record (403 Forbidden)');

    // Patient B views own health record -> 0 events
    const patientBOwnEhr = await request(`/api/v1/patients/${patientBId}/health-record`, {
      token: patientBToken,
    });
    assert(patientBOwnEhr.status === 200, 'Patient B can view own health record');
    assert(patientBOwnEhr.body.data.timeline.length === 0, 'Patient B timeline is clean');

    console.log('\n====================================================');
    console.log('🎉 ALL INTEGRATION WORKFLOW TESTS PASSED 100%');
    console.log('====================================================\n');
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  }
}

runTest().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
