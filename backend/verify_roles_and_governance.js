const API_BASE = 'http://localhost:5001/api/v1';

async function testRoleAndUserGovernance() {
  console.log('=== 1. TEST GET ROLES FROM DATABASE ===');
  try {
    const rolesRes = await fetch(`${API_BASE}/admin/roles`).then(r => r.json());
    console.log(`Retrieved ${rolesRes.data.length} roles from RoleModel in MongoDB:`);
    rolesRes.data.forEach(r => console.log(` - [${r.code}] ${r.name} (${r.level}) - ${r.permissions.length} perms`));
  } catch (err) {
    console.error('Error fetching roles:', err.message);
  }

  console.log('\n=== 2. TEST SUPER ADMIN PROVISIONING ACROSS ANY DISTRICT & HOSPITAL ===');
  // Login as Super Admin
  let superAdminToken = '';
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@healthconnect.gujarat.gov.in',
        role: 'SUPER_ADMIN'
      })
    }).then(r => r.json());
    superAdminToken = loginRes.data.token;
    console.log('Super Admin logged in successfully.');
  } catch (err) {
    console.error('Super Admin login failed:', err.message);
  }

  // Super Admin creates a Hospital Admin in Ahmedabad
  try {
    const createRes = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Ahmedabad Civil Super Admin Test',
        email: `hospadmin.ahmedabad.${Date.now()}@civilhospital.org`,
        phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'HOSPITAL_ADMIN',
        district: 'Ahmedabad',
        facilityId: 'FAC-CIVIL-AHM',
        facilityName: 'Civil Hospital Ahmedabad',
        designation: 'Medical Superintendent'
      })
    }).then(r => r.json());
    console.log('✅ Super Admin created user in Ahmedabad successfully:', createRes.data?.name, '| Role:', createRes.data?.role, '| District:', createRes.data?.district);
  } catch (err) {
    console.error('Super admin creation failed:', err.message);
  }

  // Super Admin creates a Doctor in Surat
  try {
    const docRes = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Surat Cardiologist Test',
        email: `cardiologist.surat.${Date.now()}@smimer.org`,
        phone: `98766${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'DOCTOR',
        specialty: 'Cardiology',
        district: 'Surat',
        facilityId: 'FAC-SMIMER-SURAT',
        facilityName: 'SMIMER Hospital Surat',
        qualification: 'MD, DM Cardiology',
        opdRoom: 'OPD Room 304'
      })
    }).then(r => r.json());
    console.log('✅ Super Admin created Doctor in Surat (synced to DoctorModel):', docRes.data?.name, '| Specialty:', docRes.data?.specialty, '| Hospital:', docRes.data?.facilityName);
  } catch (err) {
    console.error('Super admin doctor creation failed:', err.message);
  }

  console.log('\n=== 3. TEST DISTRICT ADMIN SCOPED GOVERNANCE ===');
  // Login as District Admin (Gandhinagar)
  let districtAdminToken = '';
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'district.gandhinagar@healthconnect.gujarat.gov.in',
        role: 'DISTRICT_ADMIN'
      })
    }).then(r => r.json());
    districtAdminToken = loginRes.data.token;
    console.log('Gandhinagar District Admin logged in successfully.');
  } catch (err) {
    console.error('District Admin login failed:', err.message);
  }

  // District Admin creates a Doctor in Gandhinagar Civil Hospital (Allowed)
  try {
    const docRes = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${districtAdminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Gandhinagar Local ENT Specialist',
        email: `ent.gandhinagar.${Date.now()}@gmers.gov.in`,
        phone: `98767${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'DOCTOR',
        specialty: 'ENT',
        district: 'Gandhinagar',
        facilityId: 'FAC-CIVIL-GNR',
        facilityName: 'GMERS Civil Hospital Gandhinagar',
        qualification: 'MS ENT',
        opdRoom: 'Room 12'
      })
    }).then(r => r.json());
    console.log('✅ District Admin successfully added doctor within Gandhinagar:', docRes.data?.name, '| Hospital:', docRes.data?.facilityName);
  } catch (err) {
    console.error('District Admin creation failed:', err.message);
  }

  // District Admin attempts to create a Super Admin (Should be 403 Forbidden)
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${districtAdminToken}`
      },
      body: JSON.stringify({
        name: 'Illegal Super Admin Attempt',
        email: `illegal.superadmin.${Date.now()}@gov.in`,
        phone: `98768${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'SUPER_ADMIN',
        district: 'Gandhinagar'
      })
    });
    const data = await res.json();
    if (res.status === 403) {
      console.log('✅ Correctly blocked District Admin from creating SUPER_ADMIN (403):', data.message);
    } else {
      console.error('❌ SECURITY BREACH: District Admin status:', res.status, data);
    }
  } catch (err) {
    console.log('Error caught:', err.message);
  }

  // District Admin attempts to create a User in Ahmedabad (Should be 403 Forbidden)
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${districtAdminToken}`
      },
      body: JSON.stringify({
        name: 'Cross District Doctor Attempt',
        email: `crossdistrict.${Date.now()}@civilhospital.org`,
        phone: `98769${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'DOCTOR',
        district: 'Ahmedabad',
        facilityId: 'FAC-CIVIL-AHM',
        facilityName: 'Civil Hospital Ahmedabad'
      })
    });
    const data = await res.json();
    if (res.status === 403) {
      console.log('✅ Correctly blocked Gandhinagar District Admin from creating user in Ahmedabad (403):', data.message);
    } else {
      console.error('❌ SECURITY BREACH: District Admin cross-district status:', res.status, data);
    }
  } catch (err) {
    console.log('Error caught:', err.message);
  }

  console.log('\n=== 4. TEST SCOPED USER LISTING ===');
  try {
    const listRes = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${districtAdminToken}` }
    }).then(r => r.json());
    const userList = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.users || []);
    console.log(`District Admin fetched ${userList.length} users.`);
    const nonGandhinagar = userList.filter(u => u.district && u.district !== 'Gandhinagar');
    if (nonGandhinagar.length === 0) {
      console.log('✅ All retrieved users strictly belong to Gandhinagar district (Scoped properly).');
    } else {
      console.warn('❌ Found users outside district:', nonGandhinagar.length);
    }
  } catch (err) {
    console.error('Listing users failed:', err.message);
  }
}

testRoleAndUserGovernance();
