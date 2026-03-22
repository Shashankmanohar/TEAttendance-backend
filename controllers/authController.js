const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    let { name, email, password, role, photo_url, public_id, staff_id } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    
    // Auto-generate staff_id if not provided for staff role
    if (role === 'staff' && !staff_id) {
      const count = await User.countDocuments({ role: 'staff' });
      staff_id = `STF-${(count + 1).toString().padStart(3, '0')}`;
    }

    user = new User({ name, email, password, role, photo_url, public_id, staff_id });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, photo_url: user.photo_url, staff_id: user.staff_id } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check User collection first (Admin, Staff, Teacher)
    let user = await User.findOne({ email });
    let role = user ? user.role : null;
    let isStudent = false;

    if (!user) {
      // Check Student collection
      user = await Student.findOne({ email });
      if (user) {
        role = 'student';
        isStudent = true;
      }
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: role,
      photo_url: user.photo_url
    };

    if (isStudent) {
      userData.roll_number = user.roll_number;
    }

    res.json({ token, user: userData });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
