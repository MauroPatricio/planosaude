import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Sale from '../models/Sale.js';
import HealthPlan from '../models/HealthPlan.js';
import Institution from '../models/Institution.js';
import Lead from '../models/Lead.js';
import Tenant from '../models/Tenant.js';
import Invoice from '../models/Invoice.js';

dotenv.config();

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/planosaude';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data for a fresh seed
    await Promise.all([
        User.deleteMany({ role: { $ne: 'superAdmin' } }), // Keep superAdmins to avoid lockout if not recreated
        Client.deleteMany({}),
        Sale.deleteMany({}),
        HealthPlan.deleteMany({}),
        Institution.deleteMany({}),
        Lead.deleteMany({}),
        Invoice.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // 1. Get or Create Tenant
    let tenant = await Tenant.findOne();
    if (!tenant) {
      tenant = await Tenant.create({ name: 'Corretora Premium', code: 'premium-01' });
    }

    // 2. Ensure Admin User Exists
    let admin = await User.findOne({ role: 'superAdmin' });
    if (!admin) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash('admin123', 10);
        admin = await User.create({
            name: 'Administrador Geral',
            email: 'admin@planosaude.com',
            password: hashedPassword,
            role: 'superAdmin',
            tenant: tenant._id
        });
        console.log('Created superAdmin user: admin@planosaude.com / admin123');
    }

    // 3. Create Institutions
    const inst1 = await Institution.create({ 
        name: 'Hospital Central', 
        type: 'hospital', 
        address: 'Maputo', 
        status: 'active', 
        responsible: 'Dr. João Silva',
        phone: '841112233',
        email: 'central@hospital.co.mz',
        tenant: tenant._id 
    });
    const inst2 = await Institution.create({ 
        name: 'Clínica Sommerschield', 
        type: 'clinic', 
        address: 'Maputo', 
        status: 'active', 
        responsible: 'Dra. Ana Maria',
        phone: '824445566',
        email: 'sommer@clinica.co.mz',
        tenant: tenant._id 
    });

    // 4. Create Health Plans
    const plan1 = await HealthPlan.create({ 
        name: 'Plano Diamante', 
        operator: 'Medis',
        type: 'individual',
        category: 'premium',
        priceMonthly: 5000, 
        benefits: ['Internamento', 'Consultas', 'Dubai Care'], 
        commissionRate: 15,
        tenant: tenant._id 
    });
    const plan2 = await HealthPlan.create({ 
        name: 'Plano Ouro Plus', 
        operator: 'Multicare',
        type: 'corporate',
        category: 'plus',
        priceMonthly: 3500, 
        benefits: ['Internamento', 'Consultas'], 
        commissionRate: 10,
        tenant: tenant._id 
    });

    // 5. Create Clients
    const clients = [];
    for (let i = 1; i <= 5; i++) {
        clients.push(await Client.create({
            name: `Cliente Teste ${i}`,
            email: `cliente${i}@exemplo.com`,
            phone: `84000000${i}`,
            nuit: `12345678${i}`,
            documentId: `DOC-000${i}`,
            status: 'active',
            broker: admin._id,
            tenant: tenant._id
        }));
    }

    // 6. Create Sales & Invoices
    for (let i = 0; i < 10; i++) {
        const client = clients[i % 5];
        const plan: any = i % 2 === 0 ? plan1 : plan2;
        const value = plan.priceMonthly * (1 + Math.random());
        
        const sale = await Sale.create({
            client: client._id,
            plan: plan._id,
            broker: admin._id,
            institution: i % 2 === 0 ? inst1._id : inst2._id,
            value: Math.round(value),
            status: 'approved',
            paymentMethod: 'm-pesa',
            contractNumber: `CNT-${Date.now()}-${i}`,
            tenant: tenant._id,
            createdAt: new Date(Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000)) // Random date in last 90 days
        });

        // Create random invoices
        await Invoice.create({
            tenant: tenant._id,
            client: client._id,
            sale: sale._id,
            invoiceNumber: `INV-24-${1000 + i}`,
            amount: sale.value,
            dueDate: new Date(Date.now() + (Math.random() * 30 * 24 * 60 * 60 * 1000)),
            status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'pending' : 'overdue',
            billingMonth: 'Abril 2024'
        });
    }

    // 7. Create Leads
    const statuses = ['new', 'contacted', 'proposal', 'converted', 'lost'];
    for (let i = 0; i < 20; i++) {
        await Lead.create({
            name: `Lead Interessada ${i}`,
            email: `lead${i}@gmail.com`,
            phone: `82123456${i}`,
            status: statuses[i % 5],
            source: i % 2 === 0 ? 'website' : 'referral',
            broker: admin._id,
            tenant: tenant._id
        });
    }

    console.log('Database Seeded Successfully! 🌱');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
