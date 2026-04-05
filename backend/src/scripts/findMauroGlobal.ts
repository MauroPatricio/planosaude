import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not found.');
  process.exit(1);
}

async function findGlobal() {
  try {
    console.log('Connecting to Atlas...');
    const conn = await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const admin = conn.connection.db.admin();
    const dbsInfo = await admin.listDatabases();
    const dbNames = dbsInfo.databases.map(d => d.name);
    console.log('Databases available:', dbNames);

    for (const dbName of dbNames) {
      if (['admin', 'config', 'local'].includes(dbName)) continue;
      
      console.log(`\nSearching in DB: ${dbName}...`);
      const db = conn.connection.useDb(dbName);
      const collections = await db.db.listCollections().toArray();
      
      for (const col of collections) {
         const count = await db.db.collection(col.name).countDocuments();
         if (count > 0) {
            console.log(`  - ${col.name}: ${count} docs`);
            const found = await db.db.collection(col.name).findOne({ 
                $or: [
                    { name: /Mauro/i },
                    { clientName: /Mauro/i }
                ]
            });
            if (found) {
                console.log(`\n!!! FOUND MAURO !!! in Database: ${dbName}, Collection: ${col.name}`);
                console.log(JSON.stringify(found, null, 2));
            }
         }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Search failed:', error);
    process.exit(1);
  }
}

findGlobal();
