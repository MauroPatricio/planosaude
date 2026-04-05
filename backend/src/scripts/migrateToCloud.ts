import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const LOCAL_URI = 'mongodb://127.0.0.1:27017/planosaude';
const CLOUD_URI = process.env.MONGO_URI;

if (!CLOUD_URI) {
  console.error('MONGO_URI not found in .env');
  process.exit(1);
}

async function migrate() {
  let localConn, cloudConn;
  try {
    console.log('Connecting to LOCAL DB...');
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('Connected to Local.');

    console.log('Connecting to CLOUD DB (Atlas)...');
    cloudConn = await mongoose.createConnection(CLOUD_URI, { dbName: 'planosaude' }).asPromise();
    console.log('Connected to Cloud.');

    const collectionNames = [
      'tenants',
      'institutions',
      'plans',
      'users',
      'clients',
      'members',
      'sales',
      'subscriptions'
    ];

    for (const name of collectionNames) {
      console.log(`\nMigrating collection: ${name}...`);
      
      const localColl = localConn.db.collection(name);
      const cloudColl = cloudConn.db.collection(name);

      const docs = await localColl.find({}).toArray();
      console.log(`Found ${docs.length} documents locally.`);

      if (docs.length > 0) {
        let upsertCount = 0;
        for (const doc of docs) {
          // Use upsert to avoid duplicates
          await cloudColl.updateOne(
            { _id: doc._id },
            { $set: doc },
            { upsert: true }
          );
          upsertCount++;
        }
        console.log(`Successfully migrated/upserted ${upsertCount} documents.`);
      }
    }

    console.log('\n--- DATA MIGRATION FINISHED! ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (localConn) await localConn.close();
    if (cloudConn) await cloudConn.close();
  }
}

migrate();
