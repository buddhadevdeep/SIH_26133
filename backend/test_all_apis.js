const http = require('http');

const BASE_URL = 'http://localhost:5001/api/v1';

// Helper for making HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch (e) {}
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message} -> Details:`, details);
    results.push({ message, details });
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('STARTING HEALTHCONNECT FULL API & USER TEST SUITE');
  console.log('====================================================\n');

  // 1. AUTHENTICATION & ALL USERS TEST
  console.log('--- 1. Testing Auth & All User Roles ---');
  const userRoles = [
    { role: 'PATIENT', username: 'pat_01', phone: '9876543210' },
    { role: 'DOCTOR', username: 'doc_arvind', email: 'arvind.patel@gujarat.health.gov.in' },
    { role: 'ASHA', username: 'asha_geeta', email: 'geeta.parmar@asha.gujarat.gov.in' },
    { role: 'REGISTRATION_CLERK', username: 'clerk_ramesh', email: 'ramesh.clerk@civil.health.gov.in' },
    { role: 'PHARMACIST', username: 'pharm_suresh', email: 'suresh.pharm@civil.health.gov.in' },
    { role: 'LAB_TECHNICIAN', username: 'lab_priya', email: 'priya.lab@civil.health.gov.in' },
    { role: 'FACILITY_OPERATIONS', username: 'ops_vijay', email: 'vijay.ops@civil.health.gov.in' },
    { role: 'DISTRICT_ADMIN', username: 'admin_gandhinagar', email: 'cdho.gandhinagar@gujarat.health.gov.in' },
    { role: 'SUPER_ADMIN', username: 'superadmin', email: 'state.admin@gujarat.health.gov.in' },
  ];

  const tokens = {};

  // Test Patient OTP flow
  const otpRes = await request('POST', '/auth/patient/send-otp', { phone: '9876543210' });
  assert(otpRes.status === 200 && otpRes.data.success, 'Patient OTP send endpoint');

  const verifyRes = await request('POST', '/auth/patient/verify-otp', { phone: '9876543210', otp: '123456' });
  assert(verifyRes.status === 200 && verifyRes.data.data?.token, 'Patient OTP verify login');
  if (verifyRes.data?.data?.token) tokens['PATIENT'] = verifyRes.data.data.token;

  // Test Direct Login for each role
  for (const user of userRoles) {
    const loginRes = await request('POST', '/auth/login', { username: user.username, role: user.role });
    assert(loginRes.status === 200 && loginRes.data.success, `Login as ${user.role} (${user.username})`, JSON.stringify(loginRes.data));
    if (loginRes.data && loginRes.data.data?.token) {
      tokens[user.role] = loginRes.data.data.token;
    }
  }

  // Test /auth/me for Doctor
  const meRes = await request('GET', '/auth/me', null, tokens['DOCTOR']);
  assert(meRes.status === 200 && meRes.data.data?.role === 'DOCTOR', 'GET /auth/me for authenticated Doctor');

  // 2. FACILITIES & DIRECTORY APIS (GET, POST, PATCH)
  console.log('\n--- 2. Testing Facilities & Directory APIs ---');
  const facsRes = await request('GET', '/facilities');
  assert(facsRes.status === 200 && Array.isArray(facsRes.data.data), 'GET /facilities (List all)');

  const facDetailRes = await request('GET', '/facilities/fac_civil_01');
  assert(facDetailRes.status === 200 && facDetailRes.data.data?.id === 'fac_civil_01', 'GET /facilities/:id');

  // Create new test facility
  const newFacId = `fac_test_${Date.now()}`;
  const createFacRes = await request('POST', '/facilities', {
    id: newFacId,
    name: 'Test Community Health Center',
    type: 'CHC',
    district: 'Gandhinagar',
    username: `clerk_${newFacId}`,
    password: 'ClerkPassword@123',
    totalBeds: 40,
    availableBeds: 15,
  });
  assert(createFacRes.status === 201 && createFacRes.data.data?.id === newFacId, 'POST /facilities (Create facility)');

  // Doctors
  const docsRes = await request('GET', '/doctors');
  assert(docsRes.status === 200 && Array.isArray(docsRes.data.data), 'GET /doctors (List all doctors)');

  // Create doctor
  const newDocId = `doc_test_${Date.now()}`;
  const createDocRes = await request('POST', '/doctors', {
    id: newDocId,
    name: 'Dr. Test Patel',
    specialty: 'Cardiology',
    facilityId: 'fac_civil_01',
    facilityName: 'Gandhinagar Civil Hospital',
    username: `doc_${newDocId}`,
    password: 'DoctorPassword@123',
    status: 'ON_DUTY',
  });
  assert(createDocRes.status === 201 && createDocRes.data.data?.id === newDocId, 'POST /doctors (Create doctor)');

  // Update doctor status
  const updateDocRes = await request('PATCH', `/doctors/${newDocId}/status`, { status: 'IN_OPD' });
  assert(updateDocRes.status === 200 && updateDocRes.data.data?.status === 'IN_OPD', 'PATCH /doctors/:id/status (Update status)');

  // Edit doctor details (PUT)
  const editDocRes = await request('PUT', `/doctors/${newDocId}`, {
    name: 'Dr. Test Patel (Edited)',
    qualification: 'MBBS, MD',
    phone: '9876543299',
  });
  assert(editDocRes.status === 200 && editDocRes.data.data?.name === 'Dr. Test Patel (Edited)', 'PUT /doctors/:id (Edit doctor)');

  // Delete doctor (DELETE)
  const deleteDocRes = await request('DELETE', `/doctors/${newDocId}`);
  assert(deleteDocRes.status === 200 && deleteDocRes.data.success, 'DELETE /doctors/:id (Delete doctor)');

  // Blood Centres
  const bloodCentresRes = await request('GET', '/blood-centres');
  assert(bloodCentresRes.status === 200 && Array.isArray(bloodCentresRes.data.data), 'GET /blood-centres');

  // District Admins
  const distAdminsRes = await request('GET', '/district-admins');
  assert(distAdminsRes.status === 200 && Array.isArray(distAdminsRes.data.data), 'GET /district-admins');

  // 3. QUEUE & APPOINTMENTS (GET, POST, PATCH)
  console.log('\n--- 3. Testing Queue & Appointments APIs ---');
  const aptsRes = await request('GET', '/appointments');
  assert(aptsRes.status === 200 && Array.isArray(aptsRes.data.data), 'GET /appointments');

  // Book appointment with counter assignment
  const newAptId = `apt_test_${Date.now()}`;
  const bookAptRes = await request('POST', '/appointments', {
    id: newAptId,
    patientId: 'usr_pat_01',
    patientName: 'Kishorebhai Patel',
    patientPhone: '9876543210',
    facilityId: 'fac_civil_01',
    facilityName: 'Gandhinagar Civil Hospital',
    doctorId: 'unassigned',
    doctorName: 'To be assigned at counter',
    specialty: 'General Medicine',
    date: '2026-09-15',
    timeSlot: '10:00 AM',
    status: 'SCHEDULED',
    reasonForVisit: 'Hypertension checkup',
  });
  assert(bookAptRes.status === 201 && bookAptRes.data.data?.id === newAptId, 'POST /appointments (Book appointment for hospital counter)');

  // Assign Doctor at Hospital Counter
  const assignDocRes = await request('PATCH', `/appointments/${newAptId}/assign-doctor`, {
    doctorId: 'doc_patel_01',
    doctorName: 'Dr. Arvind Patel',
    specialty: 'General Medicine',
    roomNumber: 'Room 4 (1st Floor)',
  });
  assert(
    assignDocRes.status === 200 &&
    assignDocRes.data.data?.doctorId === 'doc_patel_01' &&
    assignDocRes.data.data?.status === 'CONFIRMED',
    'PATCH /appointments/:id/assign-doctor (Hospital Counter assigns doctor)'
  );

  // Check in appointment
  const checkInRes = await request('POST', `/appointments/${newAptId}/check-in`);
  assert(checkInRes.status === 200 && checkInRes.data.data?.token?.tokenNumber && checkInRes.data.data?.token?.doctorId === 'doc_patel_01', 'POST /appointments/:id/check-in (Assign OPD Token with assigned doctor)');

  // Live Queue
  const liveQueueRes = await request('GET', '/queues/fac_civil_01/live');
  assert(liveQueueRes.status === 200 && liveQueueRes.data.data?.facilityId === 'fac_civil_01', 'GET /queues/:facilityId/live');

  // Generate Token
  const genTokRes = await request('POST', '/tokens', {
    patientName: 'Walk-in Patient',
    patientPhone: '9898989898',
    facilityId: 'fac_civil_01',
    departmentId: 'dep_med',
    priority: 'ROUTINE',
  });
  assert((genTokRes.status === 200 || genTokRes.status === 201) && genTokRes.data.data?.tokenNumber, 'POST /tokens (Generate walk-in token)');

  // 4. PHARMACY & MEDICINES (GET, PATCH, DISPENSE)
  console.log('\n--- 4. Testing Pharmacy & Medicine APIs ---');
  const medsRes = await request('GET', '/medicines');
  assert(medsRes.status === 200 && Array.isArray(medsRes.data.data), 'GET /medicines (List inventory)');

  const medDetailRes = await request('GET', '/medicines/med_01');
  assert(medDetailRes.status === 200 && medDetailRes.data.data?.id === 'med_01', 'GET /medicines/:id');

  // Adjust stock
  const adjustStockRes = await request('PATCH', '/medicines/med_01/stock', { delta: 100 }, tokens['PHARMACIST']);
  assert(adjustStockRes.status === 200 && adjustStockRes.data.data?.availableQuantity, 'PATCH /medicines/:id/stock (Adjust stock)');

  // Prescriptions
  const rxRes = await request('GET', '/prescriptions');
  assert(rxRes.status === 200 && Array.isArray(rxRes.data.data), 'GET /prescriptions');

  const rxDetailRes = await request('GET', '/prescriptions/rx_2026_01');
  assert(rxDetailRes.status === 200 && rxDetailRes.data.data?.id === 'rx_2026_01', 'GET /prescriptions/:id');

  // Dispense prescription
  const dispenseRes = await request('PATCH', '/prescriptions/rx_2026_01/dispense', { pharmacistName: 'Suresh Parmar' }, tokens['PHARMACIST']);
  assert(dispenseRes.status === 200 && dispenseRes.data.data?.status === 'DISPENSED', 'PATCH /prescriptions/:id/dispense (Dispense rx)');

  // 5. DIAGNOSTICS & LAB (GET, PATCH)
  console.log('\n--- 5. Testing Diagnostics & Lab APIs ---');
  const labOrdersRes = await request('GET', '/diagnostics/orders');
  assert(labOrdersRes.status === 200 && Array.isArray(labOrdersRes.data.data), 'GET /diagnostics/orders (Lab test orders)');

  const labDetailRes = await request('GET', '/diagnostics/orders/lab_ord_01');
  assert(labDetailRes.status === 200 && labDetailRes.data.data?.id === 'lab_ord_01', 'GET /diagnostics/orders/:id');

  // Collect sample
  const collectRes = await request('PATCH', '/diagnostics/orders/lab_ord_01/collect', { technicianName: 'Priya Shah' }, tokens['LAB_TECHNICIAN']);
  assert(collectRes.status === 200 && collectRes.data.data?.status === 'SAMPLE_COLLECTED', 'PATCH /diagnostics/orders/:id/collect (Sample collection)');

  // Submit result
  const submitResultRes = await request(
    'PATCH',
    '/diagnostics/orders/lab_ord_01/result',
    {
      technicianName: 'Priya Shah',
      parameters: [{ parameter: 'Hemoglobin', value: '14.2', unit: 'g/dL', isNormal: true }],
    },
    tokens['LAB_TECHNICIAN']
  );
  assert(submitResultRes.status === 200 && (submitResultRes.data.data?.status === 'REPORT_READY' || submitResultRes.data.data?.status === 'COMPLETED'), 'PATCH /diagnostics/orders/:id/result (Submit lab results)');

  // 6. REFERRALS (GET, POST, ACCEPT)
  console.log('\n--- 6. Testing Clinical Referrals APIs ---');
  const referralsRes = await request('GET', '/referrals');
  assert(referralsRes.status === 200 && Array.isArray(referralsRes.data.data), 'GET /referrals');

  // Create referral
  const newRefId = `ref_test_${Date.now()}`;
  const createRefRes = await request(
    'POST',
    '/referrals',
    {
      id: newRefId,
      patientId: 'usr_pat_01',
      patientName: 'Kishorebhai Patel',
      fromFacilityId: 'fac_pet_04',
      fromFacilityName: 'Pethapur Primary Health Centre',
      toFacilityId: 'fac_civil_01',
      toFacilityName: 'Gandhinagar Civil Hospital',
      specialty: 'Cardiology',
      priority: 'URGENT',
      reason: 'Chest heaviness workup',
    },
    tokens['DOCTOR']
  );
  assert(createRefRes.status === 201 && createRefRes.data.data?.id === newRefId, 'POST /referrals (Create referral)');

  // Accept referral
  const acceptRefRes = await request('POST', `/referrals/${newRefId}/accept`, { notes: 'Accepted by cardiology OPD' }, tokens['DOCTOR']);
  assert(acceptRefRes.status === 200 && acceptRefRes.data.data?.status === 'ACCEPTED', 'POST /referrals/:id/accept (Accept referral)');

  // 7. ASHA PORTAL (PATIENTS, VISITS, REFERRALS)
  console.log('\n--- 7. Testing ASHA Portal APIs ---');
  const ashaPatientsRes = await request('GET', '/asha/patients');
  assert(ashaPatientsRes.status === 200 && Array.isArray(ashaPatientsRes.data.data), 'GET /asha/patients');

  // Register ASHA Patient
  const newAshaPatId = `asha_p_test_${Date.now()}`;
  const regAshaPatRes = await request(
    'POST',
    '/asha/patients',
    {
      id: newAshaPatId,
      name: 'Radhaben Solanki',
      age: 28,
      gender: 'F',
      phone: '9898112233',
      village: 'Pethapur',
      category: 'MATERNAL',
      riskLevel: 'MODERATE',
    },
    tokens['ASHA']
  );
  assert((regAshaPatRes.status === 201 || regAshaPatRes.status === 200) && regAshaPatRes.data.data?.id === newAshaPatId, 'POST /asha/patients (Register citizen)');

  // Record Vitals
  const vitalsRes = await request(
    'POST',
    `/asha/patients/${newAshaPatId}/vitals`,
    {
      bpSystolic: 120,
      bpDiastolic: 80,
      bloodSugar: 98,
      hemoglobin: 11.8,
      pulse: 74,
      spo2: 99,
    },
    tokens['ASHA']
  );
  assert(vitalsRes.status === 200 && (vitalsRes.data.success || vitalsRes.data.data), 'POST /asha/patients/:id/vitals (Record vitals)');

  // ASHA Visits
  const ashaVisitsRes = await request('GET', '/asha/visits');
  assert(ashaVisitsRes.status === 200 && Array.isArray(ashaVisitsRes.data.data), 'GET /asha/visits');

  // ASHA Referrals
  const ashaRefsRes = await request('GET', '/asha/referrals');
  assert(ashaRefsRes.status === 200 && Array.isArray(ashaRefsRes.data.data), 'GET /asha/referrals');

  // 8. RESOURCES & EQUIPMENT (GET, PATCH)
  console.log('\n--- 8. Testing Resources & Equipment APIs ---');
  const bedSummaryRes = await request('GET', '/facilities/fac_civil_01/bed-summary');
  assert(bedSummaryRes.status === 200 && bedSummaryRes.data.data?.facilityId, 'GET /facilities/:id/bed-summary');

  const updateBedRes = await request('PATCH', '/facilities/fac_civil_01/bed-summary', { category: 'ICU', available: 8 });
  assert(updateBedRes.status === 200 && updateBedRes.data.data?.facilityId, 'PATCH /facilities/:id/bed-summary (Update beds)');

  const ambRes = await request('GET', '/ambulances');
  assert(ambRes.status === 200 && Array.isArray(ambRes.data.data), 'GET /ambulances');

  const eqRes = await request('GET', '/equipment');
  assert(eqRes.status === 200 && Array.isArray(eqRes.data.data), 'GET /equipment');

  // 9. SUPER ADMIN & GOVERNANCE
  console.log('\n--- 9. Testing Super Admin & Governance APIs ---');
  const healthRes = await request('GET', '/super-admin/system-health');
  assert(healthRes.status === 200 && (healthRes.data.data?.status === 'HEALTHY' || healthRes.data.data?.overallStatus === 'HEALTHY'), 'GET /super-admin/system-health');

  const adminUsersRes = await request('GET', '/super-admin/users', null, tokens['SUPER_ADMIN']);
  assert(adminUsersRes.status === 200 && Array.isArray(adminUsersRes.data.data), 'GET /super-admin/users');

  const rolesRes = await request('GET', '/super-admin/roles', null, tokens['SUPER_ADMIN']);
  assert(rolesRes.status === 200 && Array.isArray(rolesRes.data.data), 'GET /super-admin/roles');

  const aiModelsRes = await request('GET', '/super-admin/ai-models', null, tokens['SUPER_ADMIN']);
  assert(aiModelsRes.status === 200 && Array.isArray(aiModelsRes.data.data), 'GET /super-admin/ai-models');

  const auditRes = await request('GET', '/super-admin/audit', null, tokens['SUPER_ADMIN']);
  assert(auditRes.status === 200 && Array.isArray(auditRes.data.data), 'GET /super-admin/audit');

  // 10. OPERATIONS & INTELLIGENCE
  console.log('\n--- 10. Testing Operations & Intelligence APIs ---');
  const opsSummaryRes = await request('GET', '/operations');
  assert(opsSummaryRes.status === 200 && (opsSummaryRes.data.data?.shift || opsSummaryRes.data.data?.operationalStatus || opsSummaryRes.data.data?.facilityId), 'GET /operations');

  const opsServicesRes = await request('GET', '/operations/services');
  assert(opsServicesRes.status === 200 && Array.isArray(opsServicesRes.data.data), 'GET /operations/services');

  const announcementsRes = await request('GET', '/operations/announcements');
  assert(announcementsRes.status === 200 && Array.isArray(announcementsRes.data.data), 'GET /operations/announcements');

  const issuesRes = await request('GET', '/operations/issues');
  assert(issuesRes.status === 200 && Array.isArray(issuesRes.data.data), 'GET /operations/issues');

  const staffDutyRes = await request('GET', '/operations/staff-duty');
  assert(staffDutyRes.status === 200 && Array.isArray(staffDutyRes.data.data), 'GET /operations/staff-duty');

  const distIntelRes = await request('GET', '/district/intelligence/summary');
  assert(distIntelRes.status === 200 && (distIntelRes.data.data?.district || distIntelRes.data.data?.districtName), 'GET /district/intelligence/summary');

  const aiDashRes = await request('GET', '/ai/dashboard');
  assert(aiDashRes.status === 200 && Array.isArray(aiDashRes.data.data?.outbreakAlerts), 'GET /ai/dashboard');

  console.log('\n====================================================');
  console.log(`TOTAL TESTS RUN: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed unexpectedly:', err);
  process.exit(1);
});
