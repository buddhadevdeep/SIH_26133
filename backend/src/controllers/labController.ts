import { Request, Response } from 'express';
import { DiagnosticOrderModel } from '../models/DiagnosticOrder';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export async function getDiagnosticOrders(req: Request, res: Response): Promise<void> {
  const params = { ...req.query, ...req.body };
  const { status, category, priority, search, patientId } = params;

  const andConditions: any[] = [];

  if (status && status !== 'ALL') andConditions.push({ status });
  if (category && category !== 'ALL') andConditions.push({ testCategory: category });
  if (priority && priority !== 'ALL') andConditions.push({ priority });
  if (patientId) {
    andConditions.push({
      $or: [
        { patientId },
        { patientPhone: patientId },
      ],
    });
  }

  if (search && typeof search === 'string' && search.trim()) {
    const s = search.trim();
    andConditions.push({
      $or: [
        { testName: { $regex: s, $options: 'i' } },
        { patientName: { $regex: s, $options: 'i' } },
        { barcodeNumber: { $regex: s, $options: 'i' } },
        { sampleId: { $regex: s, $options: 'i' } },
      ],
    });
  }

  const filter = andConditions.length > 0 ? { $and: andConditions } : {};

  const orders = await DiagnosticOrderModel.find(filter).sort({ createdAt: -1 });
  sendSuccess(res, `Found ${orders.length} diagnostic orders`, orders.map((o) => o.toJSON()));
}

export async function getDiagnosticOrderById(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  const order = await DiagnosticOrderModel.findOne({ id: orderId });

  if (!order) {
    sendError(res, `Diagnostic order with ID ${orderId} not found`, 404);
    return;
  }

  sendSuccess(res, 'Diagnostic order retrieved', order.toJSON());
}

export async function collectSample(req: AuthRequest, res: Response): Promise<void> {
  const { orderId } = req.params;
  const { technicianName, notes } = req.body;

  const barcodeNumber = `BAR-${Math.floor(100000 + Math.random() * 900000)}`;
  const sampleId = `SMP-${Math.floor(1000 + Math.random() * 9000)}`;

  const order = await DiagnosticOrderModel.findOneAndUpdate(
    { id: orderId },
    {
      status: 'SAMPLE_COLLECTED',
      sampleId,
      barcodeNumber,
      sampleCollectedAt: new Date().toISOString(),
      technicianName: technicianName || req.user?.name || 'Amit Shah (Lab Technician)',
      notes: notes || 'Specimen collected following standard phlebotomy protocol',
    },
    { new: true }
  );

  if (!order) {
    sendError(res, `Test order ${orderId} not found`, 404);
    return;
  }

  sendSuccess(
    res,
    `Sample collected successfully for ${order.testName}. Barcode: ${order.barcodeNumber}`,
    order.toJSON()
  );
}

export async function receiveSample(req: AuthRequest, res: Response): Promise<void> {
  const { orderId } = req.params;
  const { technicianName } = req.body;

  const order = await DiagnosticOrderModel.findOneAndUpdate(
    { id: orderId },
    {
      status: 'SAMPLE_RECEIVED',
      sampleReceivedAt: new Date().toISOString(),
      technicianName: technicianName || req.user?.name || 'Amit Shah (Lab Technician)',
    },
    { new: true }
  );

  if (!order) {
    sendError(res, `Test order ${orderId} not found`, 404);
    return;
  }

  sendSuccess(
    res,
    `Specimen ${order.sampleId} received and registered at lab desk`,
    order.toJSON()
  );
}

export async function rejectSample(req: AuthRequest, res: Response): Promise<void> {
  const { orderId } = req.params;
  const { reason, notes, technicianName } = req.body;

  const order = await DiagnosticOrderModel.findOneAndUpdate(
    { id: orderId },
    {
      status: 'REJECTED',
      rejectionReason: reason || 'Pre-analytical failure / clotted sample',
      rejectionNotes: notes,
      technicianName: technicianName || req.user?.name || 'Amit Shah (Lab Technician)',
    },
    { new: true }
  );

  if (!order) {
    sendError(res, `Test order ${orderId} not found`, 404);
    return;
  }

  sendSuccess(
    res,
    `Specimen rejected: ${reason}. Re-collection request flagged.`,
    order.toJSON()
  );
}

export async function startProcessing(req: AuthRequest, res: Response): Promise<void> {
  const { orderId } = req.params;
  const { technicianName } = req.body;

  const order = await DiagnosticOrderModel.findOneAndUpdate(
    { id: orderId },
    {
      status: 'PROCESSING',
      processedAt: new Date().toISOString(),
      technicianName: technicianName || req.user?.name || 'Amit Shah (Lab Technician)',
    },
    { new: true }
  );

  if (!order) {
    sendError(res, `Test order ${orderId} not found`, 404);
    return;
  }

  sendSuccess(res, `Specimen loaded on analyzer for ${order.testName}`, order.toJSON());
}

export async function submitResult(req: AuthRequest, res: Response): Promise<void> {
  const { orderId } = req.params;
  const { parameters = [], resultSummary, technicianName } = req.body;

  const isAbnormal = parameters.some((p: any) => p.status === 'ABNORMAL' || p.status === 'CRITICAL');

  const order = await DiagnosticOrderModel.findOneAndUpdate(
    { id: orderId },
    {
      status: 'REPORT_READY',
      completedAt: new Date().toISOString(),
      resultParameters: parameters,
      resultSummary: resultSummary || 'Diagnostic testing verified and finalized.',
      technicianName: technicianName || req.user?.name || 'Amit Shah (Lab Technician)',
      isAbnormal,
    },
    { new: true }
  );

  if (!order) {
    sendError(res, `Test order ${orderId} not found`, 404);
    return;
  }

  sendSuccess(
    res,
    `Test results submitted and verified for ${order.testName}. Diagnostic report generated.`,
    order.toJSON()
  );
}
