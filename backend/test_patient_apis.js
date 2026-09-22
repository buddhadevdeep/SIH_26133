const http = require('http');

const BASE_URL = 'http://localhost:5001/api/v1';

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

async function runPatientTestSuite() {
  console.log('====================================================');
  console.log('STARTING PATIENT USER FULLSTACK DB & API TEST SUITE');
  console.log('====================================================\n');

  // 1. PATIENT AUTHENTICATION & SESSION
  console.log('--- 1. Testing Patient Authentication & Profile ---');
  const sendOtpRes = await request('POST', '/auth/patient/send-otp', { phone: '9876543210' });
  assert(sendOtpRes.status === 200 && sendOtpRes.data.success, 'POST /auth/patient/send-otp (Send OTP to mobile)');

  const verifyOtpRes = await request('POST', '/auth/patient/verify-otp', { phone: '9876543210', otp: '123456' });
  assert(
    verifyOtpRes.status === 200 && verifyOtpRes.data.data?.token && verifyOtpRes.data.data?.user?.role === 'PATIENT',
    'POST /auth/patient/verify-otp (Verify OTP & receive JWT token and patient profile)',
    JSON.stringify(verifyOtpRes.data)
  );

  const patientToken = verifyOtpRes.data.data?.token;
  const patientId = verifyOtpRes.data.data?.user?.id || 'usr_pat_01';

  // Test GET /auth/me for authenticated Patient
  const meRes = await request('GET', '/auth/me', null, patientToken);
  assert(
    meRes.status === 200 && meRes.data.data?.role === 'PATIENT' && meRes.data.data?.phone === '9876543210',
    'GET /auth/me (Get authenticated patient user profile)'
  );

  // Test PUT /auth/profile (Update patient details)
  const updateProfileRes = await request(
    'PUT',
    '/auth/profile',
    {
      address: 'Sector 14, Gandhinagar, Gujarat 382016',
      bloodGroup: 'O+',
      emergencyContactName: 'Savitri Sharma',
      emergencyContactPhone: '9876543210',
    },
    patientToken
  );
  assert(
    updateProfileRes.status === 200 && updateProfileRes.data.data?.bloodGroup === 'O+',
    'PUT /auth/profile (Update patient emergency contact & address in DB)'
  );

  // 2. PATIENT HEALTH RECORD & EHR TIMELINE
  console.log('\n--- 2. Testing Patient Health Record & Clinical Timeline ---');
  const healthRecordRes = await request('GET', `/patients/${patientId}/health-record`);
  assert(
    healthRecordRes.status === 200 &&
      healthRecordRes.data.data?.name &&
      Array.isArray(healthRecordRes.data.data?.timeline),
    `GET /patients/${patientId}/health-record (Retrieve EHR with clinical timeline)`
  );

  const timelineRes = await request('GET', `/patients/${patientId}/timeline`);
  assert(
    timelineRes.status === 200 && Array.isArray(timelineRes.data.data) && timelineRes.data.data.length > 0,
    `GET /patients/${patientId}/timeline (Retrieve chronological clinical timeline events)`
  );

  // 3. PATIENT APPOINTMENTS & BOOKING WITH FOREIGN REFERENCES
  console.log('\n--- 3. Testing Patient Appointments & Booking with Foreign References ---');
  const aptListRes = await request('GET', `/appointments?patientId=${patientId}`);
  assert(
    aptListRes.status === 200 && Array.isArray(aptListRes.data.data),
    `GET /appointments?patientId=${patientId} (Fetch existing appointments for patient)`
  );

  // Book a new appointment for patient
  const newAptId = `apt_pat_${Date.now()}`;
  const bookAptRes = await request('POST', '/appointments', {
    id: newAptId,
    patientId: patientId,
    patientName: 'Rameshwar Sharma',
    patientPhone: '9876543210',
    facilityId: 'fac_civil_01',
    facilityName: 'Gandhinagar Civil Hospital & Medical College',
    doctorId: 'doc_patel_01',
    doctorName: 'Dr. Arvind Patel',
    specialty: 'General Medicine',
    roomNumber: 'Room 4 (1st Floor)',
    date: '2026-09-18',
    timeSlot: '10:30 AM',
    reasonForVisit: 'Hypertension Follow-up Consultation',
    createToken: true,
  });
  assert(
    bookAptRes.status === 201 &&
      bookAptRes.data.data?.id === newAptId &&
      (bookAptRes.data.data?.doctorId === 'doc_patel_01' || bookAptRes.data.data?.doctorId === 'doc_01') &&
      bookAptRes.data.data?.facilityId === 'fac_civil_01' &&
      bookAptRes.data.data?.tokenNumber,
    'POST /appointments (Book appointment with doctor, facility, and live queue token foreign references)',
    JSON.stringify(bookAptRes)
  );

  // Fetch appointment by ID
  const getAptRes = await request('GET', `/appointments/${newAptId}`);
  assert(
    getAptRes.status === 200 && getAptRes.data.data?.id === newAptId,
    `GET /appointments/${newAptId} (Fetch appointment details)`
  );

  // Cancel appointment test
  const cancelAptRes = await request('PATCH', `/appointments/${newAptId}/cancel`);
  assert(
    cancelAptRes.status === 200 && cancelAptRes.data.data?.status === 'CANCELLED',
    `PATCH /appointments/${newAptId}/cancel (Cancel appointment and sync token status)`
  );

  // 4. PATIENT QUEUE TOKENS & LIVE QUEUE
  console.log('\n--- 4. Testing Queue Tokens & Live Tracking ---');
  const liveQueueRes = await request('GET', '/queues/fac_civil_01/live');
  assert(
    liveQueueRes.status === 200 && liveQueueRes.data.data?.facilityId === 'fac_civil_01',
    'GET /queues/fac_civil_01/live (Live OPD department queue status)'
  );

  const genTokenRes = await request('POST', '/tokens', {
    patientId: patientId,
    patientName: 'Rameshwar Sharma',
    patientPhone: '9876543210',
    facilityId: 'fac_civil_01',
    departmentId: 'dep_med',
    priority: 'ROUTINE',
  });
  assert(
    genTokenRes.status === 201 && genTokenRes.data.data?.tokenNumber,
    'POST /tokens (Generate OPD Queue Token for patient)'
  );

  if (genTokenRes.data.data?.id) {
    const tokenId = genTokenRes.data.data.id;
    const getTokenRes = await request('GET', `/tokens/${tokenId}`);
    assert(
      getTokenRes.status === 200 && getTokenRes.data.data?.id === tokenId,
      `GET /tokens/${tokenId} (Retrieve token by ID)`
    );
  }

  // 5. PATIENT PRESCRIPTIONS & MEDICATIONS
  console.log('\n--- 5. Testing Patient Prescriptions & Medications ---');
  const rxListRes = await request('GET', `/prescriptions?patientId=${patientId}`);
  assert(
    rxListRes.status === 200 && Array.isArray(rxListRes.data.data) && rxListRes.data.data.length > 0,
    `GET /prescriptions?patientId=${patientId} (Retrieve patient active & past prescriptions)`
  );

  if (rxListRes.data.data.length > 0) {
    const rxId = rxListRes.data.data[0].id;
    const rxDetailRes = await request('GET', `/prescriptions/${rxId}`);
    assert(
      rxDetailRes.status === 200 && rxDetailRes.data.data?.id === rxId && rxDetailRes.data.data?.items?.length > 0,
      `GET /prescriptions/${rxId} (Retrieve prescription detail with dosage and frequency)`
    );
  }

  // 6. PATIENT DIAGNOSTIC ORDERS & LAB REPORTS
  console.log('\n--- 6. Testing Patient Diagnostic Orders & Lab Reports ---');
  const labOrdersRes = await request('GET', `/diagnostics/orders?patientId=${patientId}`);
  assert(
    labOrdersRes.status === 200 && Array.isArray(labOrdersRes.data.data) && labOrdersRes.data.data.length > 0,
    `GET /diagnostics/orders?patientId=${patientId} (Retrieve patient diagnostic test orders)`
  );

  if (labOrdersRes.data.data.length > 0) {
    const orderId = labOrdersRes.data.data[0].id;
    const orderDetailRes = await request('GET', `/diagnostics/orders/${orderId}`);
    assert(
      orderDetailRes.status === 200 &&
        orderDetailRes.data.data?.id === orderId &&
        Array.isArray(orderDetailRes.data.data?.resultParameters),
      `GET /diagnostics/orders/${orderId} (Retrieve diagnostic report with result parameters and status)`
    );
  }

  // 7. PATIENT CLINICAL REFERRALS
  console.log('\n--- 7. Testing Patient Clinical Referrals ---');
  const referralsRes = await request('GET', `/referrals?patientId=${patientId}`);
  assert(
    referralsRes.status === 200 && Array.isArray(referralsRes.data.data) && referralsRes.data.data.length > 0,
    `GET /referrals?patientId=${patientId} (Track patient inter-facility referrals)`
  );

  if (referralsRes.data.data.length > 0) {
    const refCode = referralsRes.data.data[0].referralCode || referralsRes.data.data[0].id;
    const refDetailRes = await request('GET', `/referrals/${refCode}`);
    assert(
      refDetailRes.status === 200 &&
        (refDetailRes.data.data?.referralCode === refCode || refDetailRes.data.data?.id === refCode),
      `GET /referrals/${refCode} (Retrieve detailed referral timeline and facility routing)`
    );
  }

  // 8. FACILITIES & DOCTORS DISCOVERY FOR PATIENT
  console.log('\n--- 8. Testing Facilities & Doctors Directory for Patient ---');
  const facilitiesRes = await request('GET', '/facilities');
  assert(
    facilitiesRes.status === 200 && Array.isArray(facilitiesRes.data.data) && facilitiesRes.data.data.length > 0,
    'GET /facilities (List all healthcare facilities with bed and OPD status)'
  );

  const facDetailRes = await request('GET', '/facilities/fac_civil_01');
  assert(
    facDetailRes.status === 200 && facDetailRes.data.data?.id === 'fac_civil_01',
    'GET /facilities/fac_civil_01 (Retrieve facility detail, departments, and live wait times)'
  );

  const doctorsRes = await request('GET', '/doctors');
  assert(
    doctorsRes.status === 200 && Array.isArray(doctorsRes.data.data) && doctorsRes.data.data.length > 0,
    'GET /doctors (List all hospital doctors for appointment selection)'
  );

  // 9. AI CHATBOT SYMPTOM TRIAGE & ASSISTANT
  console.log('\n--- 9. Testing AI Symptom Triage & Assistant ---');
  const chatRes = await request('POST', '/chat', {
    message: 'I have fever, headache, and severe cold since 2 days. Which doctor should I consult?',
    userRole: 'PATIENT',
    patientId: patientId,
  });
  assert(
    chatRes.status === 200 && chatRes.data.data?.reply,
    'POST /chat (AI Symptom Triage with medicine and department recommendation)'
  );

  const assistantQueryRes = await request('POST', '/assistant/query', {
    query: 'Show me available doctors at Civil hospital',
    patientId: patientId,
  });
  assert(
    assistantQueryRes.status === 200 && assistantQueryRes.data.data?.reply,
    'POST /assistant/query (Smart Hospital Assistant Query)'
  );

  console.log('\n====================================================');
  console.log(`TOTAL PATIENT TESTS RUN: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPatientTestSuite().catch((err) => {
  console.error('Patient test suite failed unexpectedly:', err);
  process.exit(1);
});
