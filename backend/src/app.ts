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

// Routes (Hybrid: Supports both /api and no-prefix for Nginx flexibility)
const registerRoutes = (prefix: string) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/clients`, clientRoutes);
  app.use(`${prefix}/sales`, saleRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/plans`, planRoutes);
  app.use(`${prefix}/leads`, leadRoutes);
  app.use(`${prefix}/institutions`, institutionRoutes);
  app.use(`${prefix}/approvals`, approvalRoutes);
  app.use(`${prefix}/members`, memberRoutes);
  app.use(`${prefix}/subscriptions`, subscriptionRoutes);
  app.use(`${prefix}/documents`, documentRoutes);
  app.use(`${prefix}/payments`, paymentRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/commissions`, commissionRoutes);
  app.use(`${prefix}/claims`, claimRoutes);
  app.use(`${prefix}/upload`, uploadRoutes);
};

// Register with /api and without
registerRoutes('/api');
registerRoutes('');

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
