import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token!, (process.env.JWT_SECRET as string) || 'supersecretplanosaude2024');

      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        req.tenantId = req.user.tenant?.toString();
        logger.info(`Auth: ${req.user.role} | Tenant: ${req.tenantId} | Path: ${req.path}`);
      }
      next();
    } catch (error) {
      logger.error('Auth token validation failed');
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user?.role} is not authorized to access this route`
      });
    }
    next();
  };
};

export const requireActiveStatus = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Always allow Admins and SuperAdmins to bypass status checks
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superAdmin' || req.user.role === 'broker')) {
    return next();
  }

  if (!req.user || req.user.status !== 'active') {
    return res.status(403).json({
      message: 'Conta não autorizada. Por favor, aguarde validação ou contacte o suporte.',
      status: req.user?.status || 'pending'
    });
  }
  next();
};
