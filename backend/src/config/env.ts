import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://deepbuddhadev135_db_user:RFUtAgSlhuwoDLRg@rms.beog0b4.mongodb.net/healthconnect?retryWrites=true&w=majority',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'healthconnect_access_secret_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'healthconnect_refresh_secret_2026',
  JWT_ACCESS_EXPIRES_IN: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '3600', 10),
  JWT_REFRESH_EXPIRES_IN: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
