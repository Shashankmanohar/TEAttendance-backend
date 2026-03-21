const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const name = await question('Enter Admin Name: ');
    const email = await question('Enter Admin Email: ');
    const password = await question('Enter Admin Password: ');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('Error: User with this email already exists.');
      process.exit(1);
    }

    const admin = new User({
      name,
      email,
      password,
      role: 'admin'
    });

    await admin.save();
    console.log(`Admin user created successfully: ${email}`);
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

createAdmin();
