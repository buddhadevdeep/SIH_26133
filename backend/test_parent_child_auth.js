const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('TESTING FULL PARENT-CHILD CREDENTIALS & LOGIN HIERARCHY');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Create a Hospital with explicit Username & Password (District -> Hospital)
  console.log('--- 1. Testing District -> Hospital Creation with Credentials ---');
  const uniqueId = Date.now();
  const hospitalData = {
    name: `Apex Community Hospital ${uniqueId}`,
    type: 'CHC',
    district: 'Gandhinagar',
    address: 'Sector 28, Gandhinagar',
    contactNumber: '9876500111',
    username: `clerk_apex_${uniqueId}`,
    password: 'ApexClerk@123',
    lat: 23.2300,
    lng: 72.6400,
    totalBeds: 50,
    availableBeds: 35
  };

  const facRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/facilities',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, hospitalData);

  assert(facRes.status === 201, `Create Facility returned 201 (got ${facRes.status})`);
  const createdFacility = facRes.body?.data;
  assert(createdFacility?.id, `Created Facility has ID: ${createdFacility?.id}`);
  assert(createdFacility?.credentials?.username === hospitalData.username, 'Returned credentials match provided username');

  // 2. Login as the newly created Hospital Clerk
  console.log('\n--- 2. Testing Login for Hospital Registration Clerk with Created Credentials ---');
  const clerkLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: hospitalData.username,
    password: hospitalData.password
  });

  assert(clerkLoginRes.status === 200, `Clerk login returned 200 (got ${clerkLoginRes.status})`);
  const clerkUser = clerkLoginRes.body?.data?.user;
  assert(clerkUser?.role === 'FACILITY_STAFF', `Clerk user has role FACILITY_STAFF (got ${clerkUser?.role})`);
  assert(clerkUser?.staffSubType === 'REGISTRATION_CLERK', `Clerk staffSubType is REGISTRATION_CLERK (got ${clerkUser?.staffSubType})`);
  assert(clerkUser?.facilityId === createdFacility?.id, `Clerk is correctly linked to parent facilityId: ${clerkUser?.facilityId}`);

  // 3. Create a Doctor linked to this Hospital (Hospital -> Doctor)
  console.log('\n--- 3. Testing Hospital -> Doctor Creation with Credentials ---');
  const doctorData = {
    name: `Dr. Rameshwar Varma ${uniqueId}`,
    specialty: 'Cardiology',
    qualification: 'MBBS, MD Cardiology',
    facilityId: createdFacility?.id,
    facilityName: createdFacility?.name,
    district: 'Gandhinagar',
    username: `doc_rameshwar_${uniqueId}`,
    password: 'DoctorPass@123',
    phone: '9876500222',
    email: `dr.rameshwar.${uniqueId}@gujarat.health.gov.in`
  };

  const docRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/doctors',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, doctorData);

  assert(docRes.status === 201, `Create Doctor returned 201 (got ${docRes.status})`);
  const createdDoctor = docRes.body?.data;
  assert(createdDoctor?.credentials?.username === doctorData.username, 'Returned credentials match doctor username');

  // 4. Login as the newly created Doctor
  console.log('\n--- 4. Testing Login for Doctor with Created Credentials ---');
  const docLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: doctorData.username,
    password: doctorData.password
  });

  assert(docLoginRes.status === 200, `Doctor login returned 200 (got ${docLoginRes.status})`);
  const docUser = docLoginRes.body?.data?.user;
  assert(docUser?.role === 'DOCTOR', `Doctor user has role DOCTOR (got ${docUser?.role})`);
  assert(docUser?.facilityId === createdFacility?.id, `Doctor is correctly linked to parent facilityId: ${docUser?.facilityId}`);
  assert(docUser?.district === 'Gandhinagar', `Doctor is linked to parent district: ${docUser?.district}`);

  // 5. Create a Medical Store with Pharmacist Credentials (District -> Medical Store)
  console.log('\n--- 5. Testing District -> Medical Store Creation with Pharmacist Credentials ---');
  const storeData = {
    name: `Jan Aushadhi Kendra Sector 28 ${uniqueId}`,
    isJanAushadhi: true,
    type: 'JAN_AUSHADHI',
    district: 'Gandhinagar',
    area: 'Sector 28',
    fullAddress: 'Shop 4, GIDC Shopping Complex, Sector 28, Gandhinagar',
    phone: '9876500333',
    username: `pharm_ja_${uniqueId}`,
    password: 'JanAushadhi@123',
    managerName: `Suresh Patel ${uniqueId}`,
    lat: 23.2310,
    lng: 72.6410
  };

  const storeRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/medical-stores',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, storeData);

  assert(storeRes.status === 201, `Create Medical Store returned 201 (got ${storeRes.status})`);
  const createdStore = storeRes.body?.data;
  assert(createdStore?.credentials?.username === storeData.username, 'Returned credentials match pharmacist username');

  // 6. Login as the newly created Pharmacist
  console.log('\n--- 6. Testing Login for Pharmacist with Created Credentials ---');
  const pharmLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: storeData.username,
    password: storeData.password
  });

  assert(pharmLoginRes.status === 200, `Pharmacist login returned 200 (got ${pharmLoginRes.status})`);
  const pharmUser = pharmLoginRes.body?.data?.user;
  assert(pharmUser?.role === 'FACILITY_STAFF', `Pharmacist user has role FACILITY_STAFF (got ${pharmUser?.role})`);
  assert(pharmUser?.staffSubType === 'PHARMACIST', `Pharmacist staffSubType is PHARMACIST (got ${pharmUser?.staffSubType})`);
  assert(pharmUser?.district === 'Gandhinagar', `Pharmacist is linked to district: ${pharmUser?.district}`);

  // 7. Verify invalid credentials fail
  console.log('\n--- 7. Testing Invalid Password Rejection ---');
  const badLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: doctorData.username,
    password: 'WrongPassword@999'
  });

  assert(badLoginRes.status === 401, `Invalid password correctly rejected with 401 (got ${badLoginRes.status})`);

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================');
}

runTests().catch(console.error);
