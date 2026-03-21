const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Student = require('./models/Student');

async function find() {
  await mongoose.connect(process.env.MONGODB_URI);
  const student = await Student.findOne();
  console.log('STUDENT_DATA:', JSON.stringify(student, null, 2));
  process.exit(0);
}

find().catch(err => {
  console.error(err);
  process.exit(1);
});
