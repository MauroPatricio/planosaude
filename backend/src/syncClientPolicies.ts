import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Client from './models/Client.js';
import Sale from './models/Sale.js';

dotenv.config();

const syncPolicies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB');

    const sales = await Sale.find({ status: 'approved', policyNumber: { $exists: true } });
    console.log(`Found ${sales.length} approved sales with policy numbers.`);

    let updatedCount = 0;
    for (const sale of sales) {
      const client = await Client.findById(sale.client);
      if (client && !client.policyNumber && sale.policyNumber) {
        client.policyNumber = sale.policyNumber;
        await client.save();
        updatedCount++;
        console.log(`Updated client ${client.name} with policy ${sale.policyNumber}`);
      }
    }

    console.log(`Sync complete. Updated ${updatedCount} clients.`);
    process.exit(0);
  } catch (error) {
    console.error('Error syncing policies:', error);
    process.exit(1);
  }
};

syncPolicies();
