const API = 'http://localhost:5001/api/v1';

async function postJson(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }
  return json;
}

async function runCredentialsAuthTest() {
  console.log('===========================================================');
  console.log('  TESTING LIVE USERNAME & PASSWORD CREATION & AUTHENTICATION');
  console.log('===========================================================');

  const timestamp = Date.now().toString().slice(-4);

  // 1. Create a Doctor with custom username & password
  console.log('\n--- 1. Testing Doctor Creation with Custom Username & Password ---');
  const docUsername = `doc_sharma_${timestamp}`;
  const docPassword = `DocPass_${timestamp}!`;
  try {
    const docRes = await postJson(`${API}/directory/doctors`, {
      name: `Dr. Ramesh Sharma ${timestamp}`,
      username: docUsername,
      password: docPassword,
      specialty: 'Cardiology',
      qualification: 'MD, DM Cardiology',
      facilityId: 'fac_civil_01',
      facilityName: 'Gandhinagar Civil Hospital',
      phone: `98765${timestamp}`,
      district: 'Gandhinagar'
    });
    console.log('Doctor created successfully:', docRes.message);

    // Test Login as Doctor with Username & Password
    const docLogin = await postJson(`${API}/auth/login`, {
      identifier: docUsername,
      password: docPassword,
      role: 'DOCTOR'
    });
    console.log('✓ Doctor login with username succeeded! User:', docLogin.data.user.name, '| Role:', docLogin.data.user.role);
  } catch (err) {
    console.error('Doctor test error:', err.message);
  }

  // 2. Create a Hospital Facility with Counter Clerk Username & Password
  console.log('\n--- 2. Testing Hospital Facility & Counter Clerk Auto-Creation ---');
  const clerkUsername = `clerk_subhosp_${timestamp}`;
  const clerkPassword = `ClerkPass_${timestamp}!`;
  try {
    const facRes = await postJson(`${API}/facilities`, {
      name: `Sub-District Hospital ${timestamp}`,
      username: clerkUsername,
      password: clerkPassword,
      type: 'SUB_DISTRICT_HOSPITAL',
      district: 'Gandhinagar',
      address: `Sector 28, Gandhinagar`,
      pincode: '382028',
      totalBeds: 60,
      availableBeds: 25,
      icuBedsTotal: 8,
      icuBedsAvailable: 4,
      contactNumber: `9825${timestamp}00`,
      lat: 23.235,
      lng: 72.645
    });
    console.log('Facility created successfully:', facRes.message);

    // Test Login as Counter Clerk with Username & Password
    const clerkLogin = await postJson(`${API}/auth/login`, {
      identifier: clerkUsername,
      password: clerkPassword,
      role: 'FACILITY_STAFF',
      staffSubType: 'REGISTRATION_CLERK'
    });
    console.log('✓ Counter Clerk login with username succeeded! User:', clerkLogin.data.user.name, '| SubType:', clerkLogin.data.user.staffSubType);
  } catch (err) {
    console.error('Facility Clerk test error:', err.message);
  }

  // 3. Create a Medical Store with Pharmacist Username & Password
  console.log('\n--- 3. Testing Medical Store & Pharmacist Creation ---');
  const pharmUsername = `pharm_kendra_${timestamp}`;
  const pharmPassword = `PharmPass_${timestamp}!`;
  try {
    const storeRes = await postJson(`${API}/medical-stores`, {
      name: `Jan Aushadhi Kendra ${timestamp}`,
      username: pharmUsername,
      password: pharmPassword,
      type: 'JAN_AUSHADHI',
      fullAddress: `Shop 12, Sector 16, Gandhinagar`,
      phone: `9898${timestamp}`,
      district: 'Gandhinagar',
      lat: 23.221,
      lng: 72.639
    });
    console.log('Medical store created successfully:', storeRes.message);

    // Test Login as Pharmacist with Username & Password
    const pharmLogin = await postJson(`${API}/auth/login`, {
      identifier: pharmUsername,
      password: pharmPassword,
      role: 'FACILITY_STAFF',
      staffSubType: 'PHARMACIST'
    });
    console.log('✓ Pharmacist login with username succeeded! User:', pharmLogin.data.user.name, '| SubType:', pharmLogin.data.user.staffSubType);
  } catch (err) {
    console.error('Medical Store test error:', err.message);
  }

  // 4. Create a District Admin with Username & Password
  console.log('\n--- 4. Testing District Admin Creation & Auth ---');
  const adminUsername = `admin_morbi_${timestamp}`;
  const adminPassword = `AdminPass_${timestamp}!`;
  try {
    const adminRes = await postJson(`${API}/directory/district-admins`, {
      name: `Dr. Jayesh Mehta ${timestamp}`,
      username: adminUsername,
      password: adminPassword,
      designation: 'Chief District Health Officer (CDHO)',
      district: 'Morbi',
      phone: `9712${timestamp}`,
      email: `${adminUsername}@gujarat.health.gov.in`
    });
    console.log('District Admin appointed successfully:', adminRes.message);

    // Test Login as District Admin with Username & Password
    const adminLogin = await postJson(`${API}/auth/login`, {
      identifier: adminUsername,
      password: adminPassword,
      role: 'DISTRICT_ADMIN'
    });
    console.log('✓ District Admin login with username succeeded! User:', adminLogin.data.user.name, '| District:', adminLogin.data.user.district);
  } catch (err) {
    console.error('District Admin test error:', err.message);
  }

  console.log('\n===========================================================');
  console.log('  ALL USERNAME & PASSWORD AUTHENTICATION TESTS COMPLETED!');
  console.log('===========================================================');
}

runCredentialsAuthTest();
