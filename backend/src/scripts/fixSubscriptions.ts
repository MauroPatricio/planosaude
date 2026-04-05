import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sale from '../models/Sale.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/planosaude';

async function fix() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const approvedSales = await Sale.find({ status: 'approved' });
    console.log(`Found ${approvedSales.length} approved sales to check.`);

    let fixedCount = 0;

    for (const sale of approvedSales) {
      const existingSub = await Subscription.findOne({
        beneficiaryId: sale.client,
        plan: sale.plan,
        status: { $in: ['active', 'pending'] }
      });

      if (!existingSub) {
        await Subscription.create({
          beneficiaryType: 'Client',
          beneficiaryId: sale.client,
          plan: sale.plan,
          tenant: sale.tenant,
          priceMonthly: sale.value,
          status: 'active',
          startDate: sale.createdAt || new Date()
        });
        console.log(`FIXED: Created subscription for client ${sale.client} from sale ${sale._id}`);
        fixedCount++;
      } else {
        // Ensure price is matching if subscription exists but maybe 0
        if (existingSub.priceMonthly === 0) {
            existingSub.priceMonthly = sale.value;
            await existingSub.save();
            console.log(`UPDATED: Set price to ${sale.value} for existing sub of client ${sale.client}`);
            fixedCount++;
        }
      }
    }

    console.log(`Done! Created/Updated ${fixedCount} missing subscriptions.`);
    process.exit(0);
  } catch (err) {
    console.error('Error fixing subscriptions:', err);
    process.exit(1);
  }
}

fix();
