const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  console.log('Admin check for user:', req.user?.email, 'Role:', req.user?.role);
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    console.warn('Access denied: Admin role required. User role was:', req.user?.role);
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Staff Routes
router.post('/clock-in', auth, staffController.clockIn);
router.post('/clock-out', auth, staffController.clockOut);
router.get('/status/today', auth, staffController.getTodayStatus);
router.get('/attendance', auth, staffController.getStaffAttendance);

// Admin Routes for Staff
router.get('/all', auth, adminOnly, staffController.getAllStaff);
router.get('/attendance/:id', auth, adminOnly, staffController.getStaffAttendance);
router.put('/:id', auth, adminOnly, staffController.updateStaff);
router.delete('/:id', auth, adminOnly, staffController.deleteStaff);

module.exports = router;
