const API_BASE = 'http://localhost:5001/api/v1';

async function testAssistantHospitalAndMedicineKeywords() {
  console.log('=== TEST 1: REGULAR CLINICAL QUESTION (No Hospital / Medicine Keyword) ===');
  const res1 = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'I have mild headache and fatigue for the last 2 days',
      latitude: 23.2156,
      longitude: 72.6369
    })
  }).then(r => r.json());

  console.log('Intent:', res1.data?.intent);
  console.log('Recommended Hospitals count:', res1.data?.recommendedHospitals?.length || 0);
  console.log('Sample Response Answer:\n', res1.data?.answer?.substring(0, 200) + '...\n');
  if ((res1.data?.recommendedHospitals?.length || 0) === 0) {
    console.log('✅ Clean Regular Response provided: No unwanted hospital cards dumped.\n');
  } else {
    console.error('❌ Hospital cards returned for regular question!\n');
  }

  console.log('=== TEST 2: HOSPITAL KEYWORD QUERY (Explicitly asks for Hospital) ===');
  const res2 = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show real nearby specialized hospital for heart and chest pain with available beds',
      latitude: 23.2156,
      longitude: 72.6369
    })
  }).then(r => r.json());

  console.log('Intent:', res2.data?.intent);
  console.log('Recommended Hospitals count:', res2.data?.recommendedHospitals?.length || 0);
  if ((res2.data?.recommendedHospitals?.length || 0) > 0) {
    console.log('✅ Correctly returned Real Nearest Hospital recommendation:');
    res2.data.recommendedHospitals.forEach(h => {
      console.log(` - 🏥 ${h.name} (${h.distanceKm} km) | Dept: ${h.matchedSpecialty} | Dr: ${h.doctorOnDuty?.name} | Beds: ${h.availableBeds}`);
    });
  } else {
    console.error('❌ Expected hospital cards for hospital query!\n');
  }

  console.log('\n=== TEST 3: MEDICINE / PHARMACY KEYWORD QUERY ===');
  const res3 = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What medicine stock is available in pharmacy for cold and fever?',
      latitude: 23.2156,
      longitude: 72.6369
    })
  }).then(r => r.json());

  console.log('Intent:', res3.data?.intent);
  console.log('Recommended Hospitals count:', res3.data?.recommendedHospitals?.length || 0);
  console.log('Sample Response Answer:\n', res3.data?.answer?.substring(0, 220) + '...\n');
  if (res3.data?.answer?.includes('Government Formulary Medicine Stock')) {
    console.log('✅ Correctly returned Medicine Stock and Jan Aushadhi Pharmacy info.\n');
  } else {
    console.error('❌ Expected medicine formulary response!\n');
  }

  console.log('=== TEST 4: GENERAL GREETING ===');
  const res4 = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello, how can you help me today?',
      latitude: 23.2156,
      longitude: 72.6369
    })
  }).then(r => r.json());

  console.log('Intent:', res4.data?.intent);
  console.log('Recommended Hospitals count:', res4.data?.recommendedHospitals?.length || 0);
  console.log('Sample Response Answer:\n', res4.data?.answer?.substring(0, 180) + '...\n');
  if ((res4.data?.recommendedHospitals?.length || 0) === 0) {
    console.log('✅ Clean Greeting Response provided.\n');
  }
}

testAssistantHospitalAndMedicineKeywords();
