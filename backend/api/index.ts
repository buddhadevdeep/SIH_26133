import app from '../src/app';
import { connectDatabase } from '../src/config/db';

let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
    } catch (error) {
      console.error('[Vercel Serverless] MongoDB connection failed:', error);
    }
  }
  return app(req, res);
}
