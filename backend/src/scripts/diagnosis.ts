import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/planosaude';

async function diagnose() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available Collections:', collections.map(c => c.name));

    const memberColl = collections.find(c => c.name.toLowerCase().includes('member'));
    if (memberColl) {
      const sample = await db.collection(memberColl.name).findOne({});
      if (sample) {
        console.log(`Sample Member from ${memberColl.name}:`, {
          _id: sample._id,
          primaryClient: sample.primaryClient,
          typeOfPrimaryClient: typeof sample.primaryClient,
          isObjectId: sample.primaryClient instanceof mongoose.Types.ObjectId
        });
      } else {
        console.log(`Collection ${memberColl.name} is empty.`);
      }
    } else {
      console.log('Member collection not found!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during diagnosis:', err);
    process.exit(1);
  }
}

diagnose();
