import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import planRoutes from './routes/planRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import commissionRoutes from './routes/commissionRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { getClientPaymentStatus } from './controllers/paymentController.js';
import { protect, authorize } from './middlewares/authMiddleware.js';
import logger from './utils/logger.js';
import path from 'path';

dotenv.config();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/upload', uploadRoutes);

// Basic Home Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to PlanoSaude API' });
});

app.get('/api', (req, res) => {
  res.json({ status: 'API is running', version: '1.2.0' });
});

app.get('/api/health-check', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), version: '1.1.0' });
});

console.log('--- ROTAS REGISTADAS ---');
console.log('/api/auth');
console.log('/api/clients');
console.log('/api/sales');
console.log('/api/dashboard');
console.log('/api/users');
console.log('/api/institutions');
console.log('/api/documents');
console.log('/api/payments');
console.log('/api/notifications');


// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;
