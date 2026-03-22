const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function verifyFix() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Student = require('./models/Student');
    
    // Find a student that was missing a password in the previous check
    // In the previous check, we saw "Udgfoufhfifu" was missing a password.
    const student = await Student.findOne({ name: /Udgfoufhfifu/i });
    
    if (!student) {
      console.log('Student Udgfoufhfifu not found, trying another one.');
      const anyStudent = await Student.findOne();
      if (!anyStudent) {
        console.log('No students found in DB.');
        return;
      }
      await performToggle(anyStudent);
    } else {
      await performToggle(student);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Verification Error:', err);
  }
}

async function performToggle(student) {
  console.log(`Toggling fees for: ${student.name} (ID: ${student._id}, Password Missing: ${!student.password})`);
  const oldStatus = student.fees_paid;
  
  // Directly simulate the controller logic to verify the DB operation
  const updatedStudent = await mongoose.model('Student').findByIdAndUpdate(
    student._id,
    { $set: { fees_paid: !oldStatus } },
    { new: true, runValidators: false }
  );
  
  console.log(`New Status: ${updatedStudent.fees_paid}`);
  if (updatedStudent.fees_paid !== oldStatus) {
    console.log('Fix VERIFIED: Fee status toggled successfully.');
    
    // Toggle back to restore state
    await mongoose.model('Student').findByIdAndUpdate(
      student._id,
      { $set: { fees_paid: oldStatus } },
      { new: true, runValidators: false }
    );
    console.log('Status restored.');
  } else {
    console.log('Fix FAILED: Fee status did not change.');
  }
}

verifyFix();
