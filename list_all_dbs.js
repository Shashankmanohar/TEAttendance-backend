const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function listAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('DATABASES:', JSON.stringify(dbs.databases.map(db => db.name), null, 2));
  
  for (const dbName of dbs.databases.map(db => db.name)) {
    const db = mongoose.connection.useDb(dbName);
    const collections = await db.db.listCollections().toArray();
    console.log(`DB [${dbName}] Collections:`, collections.map(c => c.name));
    
    // Check student count
    const count = await db.collection('students').countDocuments();
    if (count > 0) {
      console.log(`>>> DB [${dbName}] has ${count} students!`);
    }
  }
  process.exit(0);
}

listAll().catch(err => {
  console.error(err);
  process.exit(1);
});
