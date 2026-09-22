import mongoose from 'mongoose';
import { ENV } from './src/config/env';
import app from './src/app';
import http from 'http';

interface TestResponse {
  status: number;
  body: any;
}

let server: http.Server;
let baseUrl: string;

async function request(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
  token?: string
): Promise<TestResponse> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let responseBody: any = null;
  const text = await res.text();
  try {
    responseBody = JSON.parse(text);
  } catch {
    responseBody = text;
  }

  return {
    status: res.status,
    body: responseBody,
  };
}

function assert(condition: boolean, message: string, context?: any) {
  if (!condition) {
    console.error(`\n❌ ASSERTION FAILED: ${message}`);
    if (context) console.error('Context:', JSON.stringify(context, null, 2));
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runMultiDistrictTests() {
  console.log('======================================================================');
  console.log('SIH 26047 — MULTI-DISTRICT ARCHITECTURE & CROSS-DISTRICT ISOLATION TEST');
  console.log('======================================================================\n');

  // Connect to DB and spin up server on dynamic test port
  await mongoose.connect(ENV.MONGODB_URI);
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(5099, () => {
      baseUrl = 'http://localhost:5099';
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: Super Admin Login
    // -------------------------------------------------------------
    console.log('[Step 1] Super Admin Login...');
    const saLogin = await request('POST', '/api/v1/auth/login', {
      identifier: 'superadmin',
      password: 'Admin@12345',
    });
    assert(saLogin.status === 200, 'Super Admin logged in successfully', saLogin);
    const superAdminToken = saLogin.body.data.tokens.accessToken;

    // -------------------------------------------------------------
    // STEP 2: Super Admin Creates District A ("Ahmedabad", "AMD")
    // -------------------------------------------------------------
    console.log('\n[Step 2] Super Admin creates District A ("Ahmedabad", "AMD")...');
    const distARes = await request('POST', '/api/v1/districts', {
      name: 'Ahmedabad',
      code: 'AMD',
      state: 'Gujarat',
      headquarters: 'Ahmedabad City',
      population: 8500000,
    }, superAdminToken);
    assert(distARes.status === 201, 'District Ahmedabad created', distARes);
    const districtA = distARes.body.data;
    assert(districtA.id === 'dist_amd', 'District A ID is dist_amd');

    // -------------------------------------------------------------
    // STEP 3: Super Admin Creates District B ("Rajkot", "RJK")
    // -------------------------------------------------------------
    console.log('\n[Step 3] Super Admin creates District B ("Rajkot", "RJK")...');
    const distBRes = await request('POST', '/api/v1/districts', {
      name: 'Rajkot',
      code: 'RJK',
      state: 'Gujarat',
      headquarters: 'Rajkot City',
      population: 3800000,
    }, superAdminToken);
    assert(distBRes.status === 201, 'District Rajkot created', distBRes);
    const districtB = distBRes.body.data;
    assert(districtB.id === 'dist_rjk', 'District B ID is dist_rjk');

    // -------------------------------------------------------------
    // STEP 4: Verify Both Districts Available via Public GET /districts
    // -------------------------------------------------------------
    console.log('\n[Step 4] Query all active districts for UI dropdowns...');
    const listDistRes = await request('GET', '/api/v1/districts');
    assert(listDistRes.status === 200, 'Districts list returned 200');
    assert(listDistRes.body.data.length >= 2, 'At least 2 districts listed in database');
    const names = listDistRes.body.data.map((d: any) => d.name);
    assert(names.includes('Ahmedabad') && names.includes('Rajkot'), 'Both Ahmedabad and Rajkot present in list');

    // -------------------------------------------------------------
    // STEP 5: Create District Admin A (Ahmedabad) & District Admin B (Rajkot)
    // -------------------------------------------------------------
    console.log('\n[Step 5] Super Admin creates District Admin for Ahmedabad...');
    const daARes = await request('POST', '/api/v1/admin/users', {
      name: 'Dr. Jayesh Trivedi',
      username: 'cdho_ahmedabad',
      password: 'AmdAdmin@123',
      phone: '9825100012',
      email: 'cdho.ahmedabad@gujarat.health.gov.in',
      role: 'DISTRICT_ADMIN',
      districtId: districtA.id,
      district: 'Ahmedabad',
    }, superAdminToken);
    assert(daARes.status === 201, 'Ahmedabad District Admin created', daARes);
    assert(daARes.body.data.districtId === districtA.id, 'User saved with districtId dist_amd');

    console.log('\n[Step 6] Super Admin creates District Admin for Rajkot...');
    const daBRes = await request('POST', '/api/v1/admin/users', {
      name: 'Dr. Nitin Vora',
      username: 'cdho_rajkot',
      password: 'RajkotAdmin@123',
      phone: '9825400045',
      email: 'cdho.rajkot@gujarat.health.gov.in',
      role: 'DISTRICT_ADMIN',
      districtId: districtB.id,
      district: 'Rajkot',
    }, superAdminToken);
    assert(daBRes.status === 201, 'Rajkot District Admin created', daBRes);
    assert(daBRes.body.data.districtId === districtB.id, 'User saved with districtId dist_rjk');

    // -------------------------------------------------------------
    // STEP 7: Ahmedabad District Admin Login & Context Resolution
    // -------------------------------------------------------------
    console.log('\n[Step 7] Ahmedabad District Admin logs in...');
    const amdLoginRes = await request('POST', '/api/v1/auth/login', {
      identifier: 'cdho_ahmedabad',
      password: 'AmdAdmin@123',
    });
    assert(amdLoginRes.status === 200, 'Ahmedabad District Admin logged in');
    const amdToken = amdLoginRes.body.data.tokens.accessToken;
    assert(amdLoginRes.body.data.user.districtId === districtA.id, 'Login payload contains districtId dist_amd');
    assert(amdLoginRes.body.data.user.district === 'Ahmedabad', 'Login payload contains district Ahmedabad');

    // Test GET /district/me
    console.log('\n[Step 8] Ahmedabad District Admin resolves /district/me...');
    const amdMeRes = await request('GET', '/api/v1/district/me', undefined, amdToken);
    assert(amdMeRes.status === 200, 'GET /district/me succeeded', amdMeRes);
    assert(amdMeRes.body.data.name === 'Ahmedabad', 'Authenticated district is Ahmedabad');
    assert(amdMeRes.body.data.code === 'AMD', 'Authenticated district code is AMD');

    // Initial empty state check
    const amdEmptyFacRes = await request('GET', '/api/v1/district/me/facilities', undefined, amdToken);
    assert(amdEmptyFacRes.status === 200, 'GET /district/me/facilities succeeded');
    assert(amdEmptyFacRes.body.data.length === 0, 'Clean DB shows 0 facilities for Ahmedabad (no fake fallback)');

    // -------------------------------------------------------------
    // STEP 9: Ahmedabad Admin Registers Hospital A
    // -------------------------------------------------------------
    console.log('\n[Step 9] Ahmedabad District Admin creates Hospital A ("Ahmedabad Civil Hospital")...');
    const createAmdFacRes = await request('POST', '/api/v1/facilities', {
      id: 'fac_ahd_civil',
      name: 'Ahmedabad Civil Hospital & BJ Medical College',
      type: 'DISTRICT_HOSPITAL',
      address: 'Asarwa, Ahmedabad - 380016',
      pincode: '380016',
      contactNumber: '07922680074',
      emergencyNumber: '108',
      totalBeds: 250,
      availableBeds: 65,
      icuBedsTotal: 30,
      icuBedsAvailable: 8,
      username: 'clerk_ahd_civil',
      password: 'ClerkPassword@123',
      coordinates: { lat: 23.0525, lng: 72.595 },
    }, amdToken);
    assert(createAmdFacRes.status === 201, 'Hospital A created', createAmdFacRes);
    const hospitalA = createAmdFacRes.body.data;
    assert(hospitalA.districtId === districtA.id, 'Hospital A assigned districtId dist_amd');
    assert(hospitalA.district === 'Ahmedabad', 'Hospital A assigned district Ahmedabad');

    // -------------------------------------------------------------
    // STEP 10: Cross-District Security Attack 1
    // (Ahmedabad Admin attempts to create facility with districtId = Rajkot)
    // -------------------------------------------------------------
    console.log('\n[Step 10] Testing Cross-District Attack 1: Ahmedabad Admin attempts to create Rajkot facility...');
    const crossDistrictAttack1 = await request('POST', '/api/v1/facilities', {
      id: 'fac_rogue_rajkot',
      name: 'Rogue Rajkot Clinic',
      type: 'PHC',
      districtId: districtB.id, // Rajkot
      district: 'Rajkot',
      address: 'Rajkot Highway',
      pincode: '360001',
      contactNumber: '9825000000',
      username: 'rogue_clerk',
      password: 'Password@123',
    }, amdToken);
    assert(
      crossDistrictAttack1.status === 403,
      `Cross-district creation strictly rejected with 403 (Status: ${crossDistrictAttack1.status})`
    );

    // -------------------------------------------------------------
    // STEP 11: Rajkot District Admin Login & Hospital B Creation
    // -------------------------------------------------------------
    console.log('\n[Step 11] Rajkot District Admin logs in and resolves /district/me...');
    const rjkLoginRes = await request('POST', '/api/v1/auth/login', {
      identifier: 'cdho_rajkot',
      password: 'RajkotAdmin@123',
    });
    assert(rjkLoginRes.status === 200, 'Rajkot District Admin logged in');
    const rjkToken = rjkLoginRes.body.data.tokens.accessToken;

    const rjkMeRes = await request('GET', '/api/v1/district/me', undefined, rjkToken);
    assert(rjkMeRes.body.data.name === 'Rajkot', 'Authenticated district is Rajkot');
    assert(rjkMeRes.body.data.code === 'RJK', 'Authenticated district code is RJK');

    console.log('\n[Step 12] Rajkot District Admin creates Hospital B ("PDU Civil Hospital Rajkot")...');
    const createRjkFacRes = await request('POST', '/api/v1/facilities', {
      id: 'fac_raj_civil',
      name: 'PDU Government Medical College & Civil Hospital',
      type: 'DISTRICT_HOSPITAL',
      address: 'Hospital Chowk, Rajkot - 360001',
      pincode: '360001',
      contactNumber: '02812450000',
      emergencyNumber: '108',
      totalBeds: 180,
      availableBeds: 40,
      icuBedsTotal: 20,
      icuBedsAvailable: 5,
      username: 'clerk_raj_civil',
      password: 'ClerkPassword@123',
      coordinates: { lat: 22.3039, lng: 70.8022 },
    }, rjkToken);
    assert(createRjkFacRes.status === 201, 'Hospital B created', createRjkFacRes);
    const hospitalB = createRjkFacRes.body.data;
    assert(hospitalB.districtId === districtB.id, 'Hospital B assigned districtId dist_rjk');

    // -------------------------------------------------------------
    // STEP 13: Strict District Isolation Verification
    // -------------------------------------------------------------
    console.log('\n[Step 13] Verifying strict district data isolation...');
    const amdFacList = await request('GET', '/api/v1/district/me/facilities', undefined, amdToken);
    assert(amdFacList.body.data.length === 1, 'Ahmedabad Admin sees exactly 1 facility');
    assert(amdFacList.body.data[0].id === hospitalA.id, 'Ahmedabad Admin sees Hospital A only');

    const rjkFacList = await request('GET', '/api/v1/district/me/facilities', undefined, rjkToken);
    assert(rjkFacList.body.data.length === 1, 'Rajkot Admin sees exactly 1 facility');
    assert(rjkFacList.body.data[0].id === hospitalB.id, 'Rajkot Admin sees Hospital B only');

    // Cross-District Attack 2: Ahmedabad Admin tries to delete Rajkot hospital
    console.log('\n[Step 14] Testing Cross-District Attack 2: Ahmedabad Admin attempts to delete Rajkot hospital...');
    const attackDelete = await request('DELETE', `/api/v1/facilities/${hospitalB.id}`, undefined, amdToken);
    assert(attackDelete.status === 403, `Cross-district deletion rejected with 403 (Status: ${attackDelete.status})`);

    // -------------------------------------------------------------
    // STEP 15: Register Doctors in Respective Hospitals
    // -------------------------------------------------------------
    console.log('\n[Step 15] Registering Doctor A at Hospital A (Ahmedabad)...');
    const docARes = await request('POST', '/api/v1/admin/users', {
      name: 'Dr. Aarav Mehta',
      username: 'dr_aarav_mehta',
      password: 'DoctorPassword@123',
      phone: '9825111222',
      email: 'dr.aarav@ahdcivil.gov.in',
      role: 'DOCTOR',
      facilityId: hospitalA.id,
      specialty: 'Cardiology',
      qualification: 'MBBS, MD (Cardiology)',
    }, amdToken);
    assert(docARes.status === 201, 'Doctor A created');
    const doctorA = docARes.body.data;
    assert(doctorA.facilityId === hospitalA.id, 'Doctor A assigned to Hospital A');
    assert(doctorA.districtId === districtA.id, 'Doctor A inherits Ahmedabad districtId');

    console.log('\n[Step 16] Registering Doctor B at Hospital B (Rajkot)...');
    const docBRes = await request('POST', '/api/v1/admin/users', {
      name: 'Dr. Sneha Patel',
      username: 'dr_sneha_patel',
      password: 'DoctorPassword@123',
      phone: '9825333444',
      email: 'dr.sneha@rajcivil.gov.in',
      role: 'DOCTOR',
      facilityId: hospitalB.id,
      specialty: 'Endocrinology',
      qualification: 'MBBS, MD (General Medicine)',
    }, rjkToken);
    assert(docBRes.status === 201, 'Doctor B created');
    const doctorB = docBRes.body.data;
    assert(doctorB.facilityId === hospitalB.id, 'Doctor B assigned to Hospital B');
    assert(doctorB.districtId === districtB.id, 'Doctor B inherits Rajkot districtId');

    // -------------------------------------------------------------
    // STEP 17: Patient P Registers & Visits Hospital A (Ahmedabad)
    // -------------------------------------------------------------
    console.log('\n[Step 17] Patient P registers in platform...');
    const patRegRes = await request('POST', '/api/v1/auth/register', {
      name: 'Rameshchandra Joshi',
      phone: '9876543210',
      password: 'PatientPassword@123',
      age: 52,
      gender: 'M',
      bloodGroup: 'O+',
    });
    assert(patRegRes.status === 201, 'Patient P registered', patRegRes);
    const patientP = patRegRes.body.data.user;
    const patToken = patRegRes.body.data.token;

    console.log('\n[Step 18] Patient P books appointment at Hospital A (Ahmedabad)...');
    const apt1Res = await request('POST', '/api/v1/queues/appointments/book', {
      facilityId: hospitalA.id,
      doctorId: doctorA.id,
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '09:30 AM',
      reasonForVisit: 'Chest pain and elevated blood pressure',
      patientId: patientP.id,
      patientName: patientP.name,
      patientPhone: patientP.phone,
    }, patToken);
    assert(apt1Res.status === 201, 'Appointment 1 booked', apt1Res);
    const apt1 = apt1Res.body.data;
    assert(apt1.districtId === districtA.id, 'Appointment 1 assigned Ahmedabad districtId');

    // Check-in at Hospital A Counter
    console.log('\n[Step 19] Counter checks in Patient P at Hospital A...');
    const checkin1Res = await request('POST', `/api/v1/queues/checkin/${apt1.id}`, {
      roomNumber: 'OPD Room 4',
      doctorId: doctorA.id,
    });
    assert(checkin1Res.status === 200, 'Patient P checked in at Hospital A');
    const token1 = checkin1Res.body.data.token;
    assert(token1.districtId === districtA.id, 'Token 1 assigned Ahmedabad districtId');

    // Doctor A consultation
    console.log('\n[Step 20] Doctor A consults Patient P at Hospital A...');
    const enc1Res = await request('POST', '/api/v1/clinical/encounters', {
      patientId: patientP.id,
      patientName: patientP.name,
      doctorId: doctorA.id,
      doctorName: doctorA.name,
      facilityId: hospitalA.id,
      facilityName: hospitalA.name,
      appointmentId: apt1.id,
      tokenId: token1.id,
      chiefComplaint: 'Chest tightness, elevated BP',
      diagnoses: [{
        id: `diag_${Date.now()}`,
        conditionName: 'Hypertension Stage 2',
        type: 'CONFIRMED',
        diagnosedBy: doctorA.name,
      }],
      prescriptions: [{
        medicineName: 'Amlodipine 5mg',
        dosage: '1 tablet once daily',
        durationDays: 30,
      }],
      vitals: {
        systolicBp: 150,
        diastolicBp: 95,
        pulseRate: 82,
        riskLevel: 'NEEDS_ATTENTION',
      },
    }, patToken);
    assert(enc1Res.status === 201, 'Encounter 1 completed', enc1Res);
    const enc1 = enc1Res.body.data;
    assert(enc1.districtId === districtA.id, 'Encounter 1 contains Ahmedabad districtId');

    // Complete consultation cascade
    await request('POST', `/api/v1/clinical/encounters/${enc1.id}/complete`, {
      appointmentId: apt1.id,
      tokenId: token1.id,
    });

    // -------------------------------------------------------------
    // STEP 21: Patient P Visits Hospital B (Rajkot) Next Month
    // -------------------------------------------------------------
    console.log('\n[Step 21] Patient P visits Hospital B (Rajkot) with Doctor B...');
    const apt2Res = await request('POST', '/api/v1/queues/appointments/book', {
      facilityId: hospitalB.id,
      doctorId: doctorB.id,
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '11:00 AM',
      reasonForVisit: 'Routine diabetic follow-up while traveling in Rajkot',
      patientId: patientP.id,
      patientName: patientP.name,
      patientPhone: patientP.phone,
    }, patToken);
    assert(apt2Res.status === 201, 'Appointment 2 booked in Rajkot');
    const apt2 = apt2Res.body.data;
    assert(apt2.districtId === districtB.id, 'Appointment 2 assigned Rajkot districtId');

    const checkin2Res = await request('POST', `/api/v1/queues/checkin/${apt2.id}`, {
      roomNumber: 'OPD Room 2',
      doctorId: doctorB.id,
    });
    assert(checkin2Res.status === 200, 'Patient P checked in at Hospital B');
    const token2 = checkin2Res.body.data.token;
    assert(token2.districtId === districtB.id, 'Token 2 assigned Rajkot districtId');

    const enc2Res = await request('POST', '/api/v1/clinical/encounters', {
      patientId: patientP.id,
      patientName: patientP.name,
      doctorId: doctorB.id,
      doctorName: doctorB.name,
      facilityId: hospitalB.id,
      facilityName: hospitalB.name,
      appointmentId: apt2.id,
      tokenId: token2.id,
      chiefComplaint: 'Fasting blood sugar monitoring',
      diagnoses: [{
        id: `diag_${Date.now() + 1}`,
        conditionName: 'Type 2 Diabetes Mellitus',
        type: 'CONFIRMED',
        diagnosedBy: doctorB.name,
      }],
      prescriptions: [{
        medicineName: 'Metformin 500mg',
        dosage: '1 tablet twice daily after meals',
        durationDays: 30,
      }],
      vitals: {
        systolicBp: 128,
        diastolicBp: 80,
        bloodSugarMgDl: 135,
        sugarType: 'FASTING',
        riskLevel: 'NORMAL',
      },
    }, patToken);
    assert(enc2Res.status === 201, 'Encounter 2 completed in Rajkot');
    const enc2 = enc2Res.body.data;
    assert(enc2.districtId === districtB.id, 'Encounter 2 contains Rajkot districtId');

    await request('POST', `/api/v1/clinical/encounters/${enc2.id}/complete`, {
      appointmentId: apt2.id,
      tokenId: token2.id,
    });

    // -------------------------------------------------------------
    // STEP 22: Patient Clinical History Spans Across Districts
    // -------------------------------------------------------------
    console.log('\n[Step 22] Verifying Patient P health history includes visits across BOTH districts...');
    const phrRes = await request('GET', `/api/v1/clinical/patients/${patientP.id}/health-record`, undefined, patToken);
    assert(phrRes.status === 200, 'Health record retrieved successfully');
    const timeline = phrRes.body.data.timeline || [];
    assert(timeline.length >= 2, `Patient history contains at least 2 events across districts (count: ${timeline.length})`);

    const facNamesInHistory = timeline.map((e: any) => e.facilityName);
    assert(
      facNamesInHistory.includes(hospitalA.name) && facNamesInHistory.includes(hospitalB.name),
      'Patient health history contains BOTH Ahmedabad Civil Hospital AND Rajkot Civil Hospital!'
    );

    // -------------------------------------------------------------
    // STEP 23: Relational Integrity Audit
    // -------------------------------------------------------------
    console.log('\n[Step 23] Performing Foreign Key & Relational Integrity Audit...');
    const db = mongoose.connection.db!;
    const orphanFacilities = await db.collection('facilities').countDocuments({ districtId: { $exists: false } });
    assert(orphanFacilities === 0, 'Zero facilities missing districtId');

    const orphanDoctors = await db.collection('doctors').countDocuments({
      $or: [{ facilityId: { $exists: false } }, { districtId: { $exists: false } }],
    });
    assert(orphanDoctors === 0, 'Zero doctors missing facilityId or districtId');

    const orphanTokens = await db.collection('tokens').countDocuments({
      $or: [{ appointmentId: { $exists: false } }, { facilityId: { $exists: false } }],
    });
    assert(orphanTokens === 0, 'Zero tokens missing appointmentId or facilityId');

    console.log('\n======================================================================');
    console.log('🎉 ALL 23 MULTI-DISTRICT ISOLATION & WORKFLOW TESTS PASSED 100%!');
    console.log('======================================================================\n');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await mongoose.disconnect();
  }
}

runMultiDistrictTests().catch((err) => {
  console.error('\n❌ MULTI-DISTRICT TEST SUITE FAILED:', err);
  process.exit(1);
});
