import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Client from '../models/Client.js';
import HealthPlan from '../models/HealthPlan.js';
import Sale from '../models/Sale.js';
import Commission from '../models/Commission.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not found in environment');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data (optional, maybe just for specific collections)
    await Client.deleteMany({});
    await HealthPlan.deleteMany({});
    await Sale.deleteMany({});
    await Commission.deleteMany({});

    // Find or create the test user
    let user = await User.findOne({ email: 'testbroker@planosaude.pt' });
    if (!user) {
      console.log('Test broker not found. Creating it...');
      user = await User.create({
        name: 'Test Broker',
        email: 'testbroker@planosaude.pt',
        password: 'password123',
        role: 'broker'
      });
    }

    // 1. Create Health Plans
    const plans = await HealthPlan.insertMany([
      { name: 'Plano Base Medis', operator: 'Medis', type: 'individual', category: 'base', priceMonthly: 1500, benefits: ['Consultas', 'Exames'], isActive: true },
      { name: 'Plano Plátino Multicare', operator: 'Multicare', type: 'family', category: 'premium', priceMonthly: 12000, benefits: ['Hospitalização', 'Parto', 'Estomatologia'], isActive: true },
      { name: 'Plano Executivo Fidelidade', operator: 'Fidelidade', type: 'individual', category: 'plus', priceMonthly: 4500, benefits: ['Farmácia', 'Consultas'], isActive: true }
    ]);

    // 2. Create Clients
    const clients = await Client.insertMany([
      { name: 'João Manuel', email: 'joao@email.com', phone: '84000001', documentId: 'BI123456', status: 'active', broker: user._id },
      { name: 'Maria Silva', email: 'maria@email.com', phone: '82000002', documentId: 'BI987654', status: 'lead', broker: user._id },
      { name: 'Empresa XPTO', email: 'contato@xpto.com', phone: '87000003', documentId: 'NUIT6655', status: 'active', broker: user._id }
    ]);

    // 3. Create Sales
    const sales = await Sale.insertMany([
      { client: (clients[0] as any)._id, plan: (plans[0] as any)._id, broker: user._id, value: 1500, status: 'approved', paymentMethod: 'm-pesa', contractNumber: 'C-2024-001' },
      { client: (clients[2] as any)._id, plan: (plans[1] as any)._id, broker: user._id, value: 12000, status: 'approved', paymentMethod: 'bank_transfer', contractNumber: 'C-2024-002' },
      { client: (clients[1] as any)._id, plan: (plans[2] as any)._id, broker: user._id, value: 4500, status: 'pending', paymentMethod: 'cash' }
    ]);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
