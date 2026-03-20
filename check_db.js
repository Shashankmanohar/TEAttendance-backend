const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/attendance";

async function checkDB() {
  await mongoose.connect(MONGO_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  const Student = mongoose.model('Student', new mongoose.Schema({ roll_number: String }));
  const count = await Student.countDocuments();
  console.log('Student count:', count);
  const students = await Student.find().limit(5);
  console.log('Sample Students:', students);
  await mongoose.disconnect();
}

checkDB().catch(console.error);
