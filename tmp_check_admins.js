const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/attendance";

async function checkAdmins() {
  await mongoose.connect(MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String, role: String }));
  const admins = await User.find({ role: 'admin' });
  console.log('Admin accounts found:', admins.map(a => ({ name: a.name, email: a.email })));
  await mongoose.disconnect();
}

checkAdmins().catch(console.error);
