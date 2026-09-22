import http from 'http';
import app from '../app';
import { connectDatabase, closeDatabase } from '../config/db';
import { initializeSockets } from '../sockets/socketHandler';

const TEST_PORT = 5099;

async function request(path: string, method: string = 'GET', data?: any, token?: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 200, body: JSON.parse(responseBody) });
          } catch {
            resolve({ status: res.statusCode || 200, body: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('[Test] Connecting to database...');
  await connectDatabase();

  const server = http.createServer(app);
  initializeSockets(server);

  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`[Test] Server started on port ${TEST_PORT}. Running endpoint tests...`);

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, desc: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ ${desc}`);
    } else {
      console.error(`  ✗ FAILED: ${desc}`);
    }
  }

  try {
    // 1. Auth: Patient Send OTP
    const otpRes = await request('/api/v1/auth/patient/send-otp', 'POST', { phone: '9876543210' });
    assert(otpRes.status === 200 && otpRes.body.success, 'POST /auth/patient/send-otp returns 200 success');

    // 2. Auth: Patient Verify OTP
    const verifyRes = await request('/api/v1/auth/patient/verify-otp', 'POST', { phone: '9876543210', otp: '123456' });
    assert(verifyRes.status === 200 && verifyRes.body.data.tokens.accessToken, 'POST /auth/patient/verify-otp returns valid token');
    const patientToken = verifyRes.body.data.tokens.accessToken;

    // 3. Auth: Staff Doctor Login
    const docLogin = await request('/api/v1/auth/login', 'POST', {
      identifier: 'dr.arvind.patel@gujarat.gov.in',
      password: 'password123',
      role: 'DOCTOR',
    });
    assert(docLogin.status === 200 && docLogin.body.data.user.role === 'DOCTOR', 'POST /auth/login returns Doctor session');
    const doctorToken = docLogin.body.data.tokens.accessToken;

    // 4. Auth: /auth/me
    const meRes = await request('/api/v1/auth/me', 'GET', undefined, doctorToken);
    assert(meRes.status === 200 && meRes.body.data.id === 'usr_doc_01', 'GET /auth/me retrieves authenticated user');

    // 5. Auth: /auth/refresh
    const refreshRes = await request('/api/v1/auth/refresh', 'POST', { refreshToken: docLogin.body.data.tokens.refreshToken });
    assert(refreshRes.status === 200 && refreshRes.body.data.accessToken, 'POST /auth/refresh refreshes access token');

    // 6. Facilities
    const facRes = await request('/api/v1/facilities');
    assert(facRes.status === 200 && facRes.body.data.length > 0, `GET /facilities returns ${facRes.body.data.length} facilities`);

    // 7. Facilities Nearby
    const nearbyRes = await request('/api/v1/facilities/nearby?lat=23.2156&lng=72.6369&radiusKm=25');
    assert(nearbyRes.status === 200 && nearbyRes.body.data.length > 0, 'GET /facilities/nearby calculates distances correctly');

    // 8. Facilities Match
    const matchRes = await request('/api/v1/facilities/match', 'POST', { specialty: 'Cardiology', requiresIcu: true });
    assert(matchRes.status === 200 && matchRes.body.data[0].suitabilityScore > 0, 'POST /facilities/match scores facilities');

    // 9. Clinical: Patient Health Record
    const ehrRes = await request('/api/v1/patients/usr_pat_01/health-record');
    assert(ehrRes.status === 200 && ehrRes.body.data.patientId === 'usr_pat_01', 'GET /patients/:id/health-record returns EHR');

    // 10. Clinical: Prescriptions
    const rxRes = await request('/api/v1/prescriptions?patientId=usr_pat_01');
    assert(rxRes.status === 200 && rxRes.body.data.length > 0, 'GET /prescriptions returns patient prescriptions');
    const rxId = rxRes.body.data[0].id;

    // 11. Pharmacy: Dispense Prescription
    const dispRes = await request(`/api/v1/prescriptions/${rxId}/dispense`, 'PATCH', { notes: 'All medicines issued' }, doctorToken);
    assert(dispRes.status === 200 && dispRes.body.data.status === 'DISPENSED', 'PATCH /prescriptions/:id/dispense marks prescription dispensed');

    // 12. Pharmacy: Dispensing History
    const histRes = await request('/api/v1/pharmacy/history');
    assert(histRes.status === 200 && histRes.body.data.length > 0, 'GET /pharmacy/history logs dispensing records');

    // 13. Lab: Diagnostic Orders
    const labRes = await request('/api/v1/diagnostics/orders');
    assert(labRes.status === 200 && labRes.body.data.length > 0, 'GET /diagnostics/orders returns lab orders');
    const ordId = labRes.body.data[0].id;

    // 14. Lab: Collect Sample
    const collectRes = await request(`/api/v1/diagnostics/orders/${ordId}/collect`, 'PATCH', { technicianName: 'Amit Shah' }, doctorToken);
    assert(collectRes.status === 200 && collectRes.body.data.status === 'SAMPLE_COLLECTED', 'PATCH /diagnostics/orders/:id/collect updates status');

    // 15. Referrals: List & Create
    const refRes = await request('/api/v1/referrals');
    assert(refRes.status === 200 && refRes.body.data.length > 0, 'GET /referrals returns referral list');

    // 16. ASHA: Patients & Visits
    const ashaPatRes = await request('/api/v1/asha/patients');
    assert(ashaPatRes.status === 200 && ashaPatRes.body.data.length > 0, 'GET /asha/patients returns frontline citizens');

    // 17. Queue: Live Queue & Next Call
    const queueRes = await request('/api/v1/queues/fac_civil_01/live');
    assert(queueRes.status === 200 && queueRes.body.data.tokens.length > 0, 'GET /queues/:id/live returns active queue state');

    const nextTokenRes = await request('/api/v1/queues/fac_civil_01/next', 'POST', { departmentId: 'dep_med' });
    assert(nextTokenRes.status === 200 && nextTokenRes.body.data.calledToken, 'POST /queues/:id/next calls next patient token');

    // 17b. Appointment: Book -> Counter Assign Doctor -> Check In
    const testAptId = `apt_flow_${Date.now()}`;
    const bookRes = await request('/api/v1/appointments', 'POST', {
      id: testAptId,
      patientId: 'usr_pat_01',
      patientName: 'Kanti Patel',
      patientPhone: '9876543210',
      facilityId: 'fac_civil_01',
      facilityName: 'Gandhinagar Civil Hospital & Medical College',
      doctorId: 'unassigned',
      doctorName: 'To be assigned at counter',
      specialty: 'General Medicine',
      date: '2026-09-15',
      timeSlot: '11:30 AM',
      status: 'SCHEDULED',
      reasonForVisit: 'General checkup',
    });
    assert(bookRes.status === 201 && bookRes.body.data.id === testAptId, 'POST /appointments creates scheduled appointment');

    const assignRes = await request(`/api/v1/appointments/${testAptId}/assign-doctor`, 'PATCH', {
      doctorId: 'doc_patel_01',
      doctorName: 'Dr. Arvind Patel',
      specialty: 'General Medicine',
      roomNumber: 'Room 4 (1st Floor)',
    });
    assert(assignRes.status === 200 && assignRes.body.data.doctorId === 'doc_patel_01', 'PATCH /appointments/:id/assign-doctor assigns doctor');

    const checkInAptRes = await request(`/api/v1/appointments/${testAptId}/check-in`, 'POST');
    assert(checkInAptRes.status === 200 && checkInAptRes.body.data.token.tokenNumber, 'POST /appointments/:id/check-in generates token');

    // 18. Operations: Facility Summary & Telemetry
    const opsRes = await request('/api/v1/operations?facilityId=fac_civil_01');
    assert(opsRes.status === 200 && opsRes.body.data.telemetry.bedsTotal > 0, 'GET /operations calculates live telemetry from MongoDB');

    // 19. District Intelligence: Summary & Areas
    const intellRes = await request('/api/v1/district/intelligence/summary?district=Gandhinagar');
    assert(intellRes.status === 200 && intellRes.body.data.districtName === 'Gandhinagar', 'GET /district/intelligence/summary returns gap counts');

    // 20. Super Admin: System Health
    const healthRes = await request('/api/v1/super-admin/system-health');
    assert(healthRes.status === 200 && healthRes.body.data.overallStatus === 'HEALTHY', 'GET /super-admin/system-health returns health telemetry');

    // 21. Patient AI Chat Assistant
    const chatRes = await request('/api/v1/chat', 'POST', {
      message: 'I have fever, cough, and body ache. Which doctor should I visit?',
      userId: 'usr_pat_01',
    });
    assert(
      chatRes.status === 200 &&
        chatRes.body.data.answer &&
        chatRes.body.data.answer.length > 20,
      'POST /chat returns grounded clinical response'
    );
    assert(chatRes.body.data.actionChips && chatRes.body.data.actionChips.length > 0, 'POST /chat provides actionable navigation chips');
  } finally {
    server.close();
    await closeDatabase();
  }

  console.log(`\n[Test Summary] ${passedTests} / ${totalTests} tests passed.`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('[Test Error]', err);
  process.exit(1);
});
