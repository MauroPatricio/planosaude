import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not found.');
  process.exit(1);
}

async function sync() {
  try {
    console.log('Connecting to Atlas (test DB)...');
    const conn = await mongoose.connect(MONGO_URI!, { dbName: 'test' });
    console.log('Connected!');

    const db = conn.connection.db;
    
    // 1. Get active subscriptions
    const subs = await db.collection('subscriptions').find({ status: 'active' }).toArray();
    console.log(`Found ${subs.length} active subscriptions.`);

    let createdCount = 0;

    for (const sub of subs) {
      // Check if invoice exists
      const existing = await db.collection('invoices').findOne({ 
        client: sub.beneficiaryId,
        subscription: sub._id 
      });

      if (!existing) {
        console.log(`Creating missing invoice for client: ${sub.beneficiaryId}`);
        
        const client = await db.collection('clients').findOne({ _id: sub.beneficiaryId });
        const plan = await db.collection('healthplans').findOne({ _id: sub.plan });
        const sale = await db.collection('sales').findOne({ client: sub.beneficiaryId, plan: sub.plan });

        if (!client || !plan) {
            console.log('Missing client or plan data. Skipping...');
            continue;
        }

        let dueDay = 5;
        if (client.preferredPaymentDate) {
           dueDay = new Date(client.preferredPaymentDate).getUTCDate();
        }

        const now = new Date();
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
        if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

        await db.collection('invoices').insertOne({
          tenant: sub.tenant,
          client: sub.beneficiaryId,
          subscription: sub._id,
          sale: sale?._id,
          amount: plan.priceMonthly,
          dueDate: dueDate,
          status: 'open',
          invoiceNumber: `INV-${sub._id.toString().slice(-4)}-${Date.now().toString().slice(-4)}`,
          notes: 'Fatura gerada automaticamente para sincronização.',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        createdCount++;
      }
    }

    console.log(`Sync complete! Created ${createdCount} invoices in Atlas.`);
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

sync();
