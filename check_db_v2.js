const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function checkDB() {
  await mongoose.connect(MONGO_URI);
  
  const StudentSchema = new mongoose.Schema({ 
    name: String, 
    roll_number: String,
    email: String 
  });
  const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
  
  const students = await Student.find({}, 'name roll_number email');
  console.log('--- Students ---');
  students.forEach(s => {
    console.log(`Name: ${s.name}, Roll: ${s.roll_number}, Email: ${s.email}`);
  });
  
  await mongoose.disconnect();
}

checkDB().catch(console.error);
