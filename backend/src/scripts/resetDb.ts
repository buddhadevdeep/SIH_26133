import mongoose from 'mongoose';
import { ENV } from '../config/env';

async function resetDb() {
  console.log(`[db:reset] Connecting to ${ENV.MONGODB_URI}...`);
  await mongoose.connect(ENV.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }

  const collectionsToClear = [
    'facilities',
    'doctors',
    'patients',
    'patienthealthrecords',
    'appointments',
    'tokens',
    'encounters',
    'prescriptions',
    'diagnosticorders',
    'referrals',
    'ashapatients',
    'ashavisits',
    'ambulances',
    'equipment',
    'operationalservices',
    'operationalannouncements',
    'operationalissues',
    'staffdutyitems',
    'doctorleaves',
    'dispensingrecords',
    'auditlogs',
    'districtadmins',
    'districts',
    'medicines',
  ];

  for (const colName of collectionsToClear) {
    try {
      await db.collection(colName).deleteMany({});
      console.log(`  ✓ Cleared ${colName}`);
    } catch (e) {
      // Collection may not exist yet
    }
  }

  // Remove all users so bootstrap cleanly recreates super admin
  try {
    const res = await db.collection('users').deleteMany({});
    console.log(`  ✓ Cleared users (${res.deletedCount} removed)`);
  } catch (e) {}

  console.log('[db:reset] Complete! Operational healthcare collections cleanly cleared.');
  await mongoose.disconnect();
}

resetDb().catch((err) => {
  console.error('[db:reset] Failed:', err);
  process.exit(1);
});
