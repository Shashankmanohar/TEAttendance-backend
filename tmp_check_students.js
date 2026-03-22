const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function checkStudents() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const students = await db.collection('students').find().toArray();
    
    console.log(`Checking ${students.length} students...`);
    
    students.forEach(s => {
      const missing = [];
      if (!s.name) missing.push('name');
      if (!s.roll_number) missing.push('roll_number');
      if (!s.email) missing.push('email');
      if (!s.password) missing.push('password');
      if (!s.class_id) missing.push('class_id');
      if (!s.course) missing.push('course');
      
      if (missing.length > 0) {
        console.log(`Student ID: ${s._id}, Roll: ${s.roll_number || 'N/A'}, Missing: ${missing.join(', ')}`);
      }
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkStudents();
