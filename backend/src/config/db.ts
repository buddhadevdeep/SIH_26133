import mongoose from 'mongoose';
import { ENV } from './env';
import { seedInitialDatabase } from './seedData';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      dbName: 'healthconnect',
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    
    // Seed initial data if collections are empty
    await seedInitialDatabase();
    
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected to database.');
});

export async function closeDatabase(): Promise<void> {
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed.');
}
