import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UserModel, IUser, UserRole, StaffSubType } from '../models/User';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. No bearer token provided.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. Check for development / quick-switch role mock tokens
  if (token.startsWith('mock_jwt_') || token.startsWith('mock_refresh_')) {
    const roleKey = token.replace('mock_jwt_', '').replace('mock_refresh_', '').toUpperCase();
    let query: any = {};
    if (roleKey.includes('PATIENT')) query = { role: 'PATIENT' };
    else if (roleKey.includes('ASHA')) query = { role: 'ASHA' };
    else if (roleKey.includes('DOCTOR')) query = { role: 'DOCTOR' };
    else if (roleKey.includes('PHARMACIST')) query = { role: 'FACILITY_STAFF', staffSubType: 'PHARMACIST' };
    else if (roleKey.includes('LAB')) query = { role: 'FACILITY_STAFF', staffSubType: 'LAB_TECHNICIAN' };
    else if (roleKey.includes('OPS') || roleKey.includes('OPERATIONS')) query = { role: 'FACILITY_STAFF', staffSubType: 'FACILITY_OPERATIONS' };
    else if (roleKey.includes('REG') || roleKey.includes('CLERK')) query = { role: 'FACILITY_STAFF', staffSubType: 'REGISTRATION_CLERK' };
    else if (roleKey.includes('DISTRICT')) query = { role: 'DISTRICT_ADMIN' };
    else if (roleKey.includes('SUPER')) query = { role: 'SUPER_ADMIN' };
    else query = { role: 'PATIENT' };

    const devUser = await UserModel.findOne(query);
    if (devUser) {
      req.user = devUser;
      return next();
    }
  }

  // 2. Standard JWT verification
  try {
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as { id: string; role: UserRole };
    const user = await UserModel.findOne({ id: decoded.id });
    if (!user) {
      sendError(res, 'User session not found or invalidated.', 401);
      return;
    }
    req.user = user;
    next();
  } catch (err: any) {
    sendError(res, 'Invalid or expired authentication token.', 401);
    return;
  }
}

export async function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  // 1. Check for development / quick-switch role mock tokens
  if (token.startsWith('mock_jwt_') || token.startsWith('mock_refresh_')) {
    const roleKey = token.replace('mock_jwt_', '').replace('mock_refresh_', '').toUpperCase();
    let query: any = {};
    if (roleKey.includes('PATIENT')) query = { role: 'PATIENT' };
    else if (roleKey.includes('ASHA')) query = { role: 'ASHA' };
    else if (roleKey.includes('DOCTOR')) query = { role: 'DOCTOR' };
    else if (roleKey.includes('PHARMACIST')) query = { role: 'FACILITY_STAFF', staffSubType: 'PHARMACIST' };
    else if (roleKey.includes('LAB')) query = { role: 'FACILITY_STAFF', staffSubType: 'LAB_TECHNICIAN' };
    else if (roleKey.includes('OPS') || roleKey.includes('OPERATIONS')) query = { role: 'FACILITY_STAFF', staffSubType: 'FACILITY_OPERATIONS' };
    else if (roleKey.includes('REG') || roleKey.includes('CLERK')) query = { role: 'FACILITY_STAFF', staffSubType: 'REGISTRATION_CLERK' };
    else if (roleKey.includes('DISTRICT')) query = { role: 'DISTRICT_ADMIN' };
    else if (roleKey.includes('SUPER')) query = { role: 'SUPER_ADMIN' };
    else query = { role: 'PATIENT' };

    const devUser = await UserModel.findOne(query);
    if (devUser) {
      req.user = devUser;
    }
    return next();
  }

  // 2. Standard JWT verification
  try {
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as { id: string; role: UserRole };
    const user = await UserModel.findOne({ id: decoded.id });
    if (user) {
      req.user = user;
    }
  } catch {}

  next();
}

export function authorize(roles: UserRole[] = [], staffSubTypes: StaffSubType[] = []) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Super Admin has universal access
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Role check
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      sendError(res, `Forbidden: Role ${req.user.role} does not have access to this resource.`, 403);
      return;
    }

    // Staff sub-type check if applicable
    if (
      req.user.role === 'FACILITY_STAFF' &&
      staffSubTypes.length > 0 &&
      req.user.staffSubType &&
      !staffSubTypes.includes(req.user.staffSubType)
    ) {
      sendError(res, `Forbidden: Staff subtype ${req.user.staffSubType} cannot perform this action.`, 403);
      return;
    }

    next();
  };
}
