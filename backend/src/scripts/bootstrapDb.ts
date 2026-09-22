import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { seedInitialDatabase } from '../config/seedData';

async function bootstrapDb() {
  console.log(`[db:bootstrap] Connecting to ${ENV.MONGODB_URI}...`);
  await mongoose.connect(ENV.MONGODB_URI);
  await seedInitialDatabase();
  console.log('[db:bootstrap] Complete! System roles and bootstrap Super Admin configured.');
  await mongoose.disconnect();
}

bootstrapDb().catch((err) => {
  console.error('[db:bootstrap] Failed:', err);
  process.exit(1);
});
