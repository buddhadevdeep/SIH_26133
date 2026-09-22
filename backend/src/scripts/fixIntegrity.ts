import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { DistrictModel } from '../models/District';
import { FacilityModel } from '../models/Facility';

const GUJARAT_DISTRICTS = [
  { id: 'dist_gandhinagar', name: 'Gandhinagar', code: 'GANDHINAGAR', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Gandhinagar', population: 1391753 },
  { id: 'dist_ahmedabad', name: 'Ahmedabad', code: 'AHMEDABAD', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Ahmedabad', population: 7214225 },
  { id: 'dist_rajkot', name: 'Rajkot', code: 'RAJKOT', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Rajkot', population: 3804558 },
  { id: 'dist_surat', name: 'Surat', code: 'SURAT', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Surat', population: 6081322 },
  { id: 'dist_vadodara', name: 'Vadodara', code: 'VADODARA', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Vadodara', population: 4165626 },
  { id: 'dist_bhavnagar', name: 'Bhavnagar', code: 'BHAVNAGAR', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Bhavnagar', population: 2880365 },
  { id: 'dist_jamnagar', name: 'Jamnagar', code: 'JAMNAGAR', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Jamnagar', population: 2160119 },
  { id: 'dist_junagadh', name: 'Junagadh', code: 'JUNAGADH', state: 'Gujarat', status: 'ACTIVE', headquarters: 'Junagadh', population: 2743082 },
];

async function fixIntegrity() {
  console.log(`[db:fix-integrity] Connecting to ${ENV.MONGODB_URI}...`);
  await mongoose.connect(ENV.MONGODB_URI);

  // 1. Seed all districts
  for (const d of GUJARAT_DISTRICTS) {
    await DistrictModel.findOneAndUpdate(
      { $or: [{ id: d.id }, { name: d.name }] },
      { $set: d },
      { upsert: true, new: true }
    );
  }
  console.log('✓ All Gujarat districts synced.');

  // 2. Map all facilities to districtId
  const facilities = await FacilityModel.find({});
  for (const fac of facilities) {
    let targetDistrictId = fac.districtId;
    if (!targetDistrictId || targetDistrictId === '') {
      const distName = (fac.district || '').toLowerCase().trim();
      if (distName.includes('gandhinagar')) targetDistrictId = 'dist_gandhinagar';
      else if (distName.includes('ahmedabad')) targetDistrictId = 'dist_ahmedabad';
      else if (distName.includes('rajkot')) targetDistrictId = 'dist_rajkot';
      else if (distName.includes('surat')) targetDistrictId = 'dist_surat';
      else if (distName.includes('vadodara')) targetDistrictId = 'dist_vadodara';
      else if (distName.includes('bhavnagar')) targetDistrictId = 'dist_bhavnagar';
      else if (distName.includes('jamnagar')) targetDistrictId = 'dist_jamnagar';
      else targetDistrictId = 'dist_gandhinagar'; // default

      fac.districtId = targetDistrictId;
      await fac.save();
      console.log(`✓ Updated facility '${fac.name}' with districtId: ${targetDistrictId}`);
    }
  }

  await mongoose.disconnect();
  console.log('[db:fix-integrity] Completed successfully!');
}

fixIntegrity().catch((err) => {
  console.error('[db:fix-integrity] Failed:', err);
  process.exit(1);
});
