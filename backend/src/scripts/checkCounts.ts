import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/planosaude';

async function check() {
  try {
    console.log('Connecting to LOCAL DB...');
    const conn = await mongoose.connect(LOCAL_URI);
    console.log('Connected!');

    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('--- Collection Counts ---');
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} docs`);
    }

    const mauro = await db.collection('clients').findOne({ name: /Mauro/i });
    if (mauro) {
        console.log('\nMauro Patricio found in "clients" collection!');
    } else {
        console.log('\nMauro Patricio NOT found in "clients" collection.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

check();
