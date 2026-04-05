import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Client from '../models/Client.js';
import Subscription from '../models/Subscription.js';
import Sale from '../models/Sale.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/planosaude';

async function check() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { dbName: 'planosaude' });
    console.log('Connected!');

    const mauro = await Client.findOne({ name: /Mauro/i });
    if (mauro) {
      console.log('--- Client Found ---');
      console.log(`ID: ${mauro._id}`);
      console.log(`Name: ${mauro.name}`);
      console.log(`Status: ${mauro.status}`);

      const subs = await Subscription.find({ beneficiaryId: mauro._id });
      console.log(`--- Subscriptions Found: ${subs.length} ---`);
      subs.forEach(s => console.log(`- ID: ${s._id}, Status: ${s.status}, Type: ${s.beneficiaryType}`));

      const sales = await Sale.find({ client: mauro._id });
      console.log(`--- Sales Found: ${sales.length} ---`);
      sales.forEach(sl => console.log(`- ID: ${sl._id}, Status: ${sl.status}, Value: ${sl.value}`));
    } else {
      console.log('Mauro Patricio not found in database.');
      
      const allClients = await Client.find().limit(5);
      console.log('Sample Clients:', allClients.map(c => c.name));
    }

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

check();
