import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import facilityRoutes from './routes/facilityRoutes';
import clinicalRoutes from './routes/clinicalRoutes';
import labRoutes from './routes/labRoutes';
import pharmacyRoutes from './routes/pharmacyRoutes';
import referralRoutes from './routes/referralRoutes';
import ashaRoutes from './routes/ashaRoutes';
import queueRoutes from './routes/queueRoutes';
import operationsRoutes from './routes/operationsRoutes';
import intelligenceRoutes from './routes/intelligenceRoutes';
import adminRoutes from './routes/adminRoutes';
import assistantRoutes from './routes/assistantRoutes';
import medicalStoreRoutes from './routes/medicalStoreRoutes';
import districtRoutes from './routes/districtRoutes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Security and Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-refresh-token', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Authorization', 'Content-Range', 'X-Total-Count'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// API v1 Router
const apiV1 = express.Router();

apiV1.use('/auth', authRoutes);
apiV1.use('/', facilityRoutes);
apiV1.use('/directory', facilityRoutes);
apiV1.use('/', clinicalRoutes);
apiV1.use('/clinical', clinicalRoutes);
apiV1.use('/patients', clinicalRoutes);
apiV1.use('/diagnostics', labRoutes);
apiV1.use('/', pharmacyRoutes);
apiV1.use('/pharmacy', pharmacyRoutes);
apiV1.use('/', referralRoutes);
apiV1.use('/', ashaRoutes);
apiV1.use('/', queueRoutes);
apiV1.use('/queues', queueRoutes);
apiV1.use('/', operationsRoutes);
apiV1.use('/operations', operationsRoutes);
apiV1.use('/', intelligenceRoutes);
apiV1.use('/intelligence', intelligenceRoutes);
apiV1.use('/', adminRoutes);
apiV1.use('/admin', adminRoutes);
apiV1.use('/', assistantRoutes);
apiV1.use('/assistant', assistantRoutes);
apiV1.use('/medical-stores', medicalStoreRoutes);
apiV1.use('/districts', districtRoutes);
apiV1.use('/district', districtRoutes);

// Mount /api/v1
app.use('/api/v1', apiV1);

// Central Error Handler
app.use(errorHandler);

export default app;
