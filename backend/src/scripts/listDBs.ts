import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';

async function list() {
  try {
    console.log('Connecting to:', MONGO_URI);
    const conn = await mongoose.connect(MONGO_URI);
    const admin = conn.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases found:', dbs.databases.map(d => d.name));
    
    // Check collections in 'planosaude'
    const db = conn.connection.useDb('planosaude');
    const cols = await db.db.listCollections().toArray();
    console.log('Collections in planosaude:', cols.map(c => c.name));
    
    process.exit(0);
  } catch (error) {
    console.error('List failed:', error);
    process.exit(1);
  }
}

list();
